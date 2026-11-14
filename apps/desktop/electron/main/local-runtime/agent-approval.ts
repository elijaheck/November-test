import { randomUUID } from 'node:crypto'

import { BrowserWindow } from 'electron'

import { approvalKey, pageActionOf } from './approval-rules.ts'

import type { ApprovalDecision, PageAction } from './approval-rules.ts'
import type { BrowserCall } from './browser-stream.ts'
import type { WebContents } from 'electron'

export type AgentApprovalRequest = {
  id: string
  team: string
  session: string
  host: string
  action: PageAction
  script: string
}

/** Unanswered cards deny themselves, so a bot never waits forever or acts unseen. */
const ANSWER_TIMEOUT_MS = 2 * 60 * 1000
const allowed = new Set<string>()
const pending = new Map<string, (decision: ApprovalDecision) => void>()

function hostOf(contents: WebContents): string {
  try {
    return new URL(contents.getURL()).host || 'this page'
  } catch {
    return 'this page'
  }
}

export function answerAgentApproval(id: string, decision: ApprovalDecision): void {
  pending.get(id)?.(decision)
}

/**
 * Asks the user before a bot's script clicks, types, submits or sends on a
 * page signed in as them. Read-only scripts pass straight through.
 */
export async function approveTabAction(call: BrowserCall, contents: WebContents): Promise<boolean> {
  const action = pageActionOf(call.script ?? '')

  if (!action) return true
  const host = hostOf(contents)
  const key = approvalKey(call.session, host)

  if (allowed.has(key)) return true
  const windows = BrowserWindow.getAllWindows().filter((win) => !win.isDestroyed())

  if (windows.length === 0) return false
  const request: AgentApprovalRequest = {
    id: randomUUID(),
    team: call.team,
    session: call.session,
    host,
    action,
    script: (call.script ?? '').slice(0, 600),
  }
  const decision = await new Promise<ApprovalDecision>((resolve) => {
    const timer = setTimeout(() => finish('deny'), ANSWER_TIMEOUT_MS)
    const finish = (answer: ApprovalDecision) => {
      clearTimeout(timer)
      pending.delete(request.id)
      for (const win of windows) {
        if (!win.isDestroyed()) win.webContents.send('agentApproval:settled', request.id)
      }
      resolve(answer)
    }

    pending.set(request.id, finish)
    for (const win of windows) win.webContents.send('agentApproval:request', request)
  })

  if (decision === 'site') allowed.add(key)

  return decision !== 'deny'
}
