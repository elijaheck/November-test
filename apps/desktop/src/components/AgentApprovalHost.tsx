import { ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

import { api } from '../api'
import { t } from '../i18n'

import { Button } from './ui/button'

import type { AgentApprovalDecision, AgentApprovalRequest } from '../types/agentApproval'

function headline(request: AgentApprovalRequest): string {
  const host = request.host

  switch (request.action) {
    case 'submit':
      return t('A bot wants to submit a form on {host}', { host })
    case 'send':
      return t('A bot wants to send a request from {host}', { host })
    case 'type':
      return t('A bot wants to type into {host}', { host })
    case 'click':
      return t('A bot wants to click on {host}', { host })
  }
}

/**
 * Agents ask before acting: a bot's script that would click, type, submit or
 * send in a tab signed in as the user waits here for Allow or Deny. Unanswered
 * cards deny themselves after two minutes.
 */
export function AgentApprovalHost() {
  const [requests, setRequests] = useState<AgentApprovalRequest[]>([])

  useEffect(() => {
    const offRequest = api.onAgentApprovalRequest((request) =>
      setRequests((list) => [...list, request]),
    )
    const offSettled = api.onAgentApprovalSettled((id) =>
      setRequests((list) => list.filter((request) => request.id !== id)),
    )

    return () => {
      offRequest()
      offSettled()
    }
  }, [])

  const answer = (id: string, decision: AgentApprovalDecision) => {
    setRequests((list) => list.filter((request) => request.id !== id))
    api.agentApprovalAnswer(id, decision).catch((err: unknown) => {
      console.warn('[approval] answer failed', err)
    })
  }

  if (requests.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="titlebar-no-drag fixed bottom-4 right-4 z-[900] flex w-[340px] flex-col gap-2"
    >
      {requests.map((request) => (
        <div
          key={request.id}
          role="alertdialog"
          aria-label={headline(request)}
          className="flex flex-col gap-2.5 rounded-2xl border border-line-control/70 bg-elevated p-3.5 text-[13px] shadow-lg"
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 size-4 flex-shrink-0 text-secondary" strokeWidth={1.8} />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-main">{headline(request)}</div>
              <div className="text-[12px] text-tertiary">
                {t('It runs signed in as you. Nothing happens until you allow it.')}
              </div>
            </div>
          </div>
          <details className="text-[12px] text-tertiary">
            <summary className="cursor-pointer select-none">{t('Show what it runs')}</summary>
            <pre className="mt-1.5 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-surface-sunken p-2 font-mono text-[11px] text-secondary scrollbar-thin">
              {request.script}
            </pre>
          </details>
          <div className="flex justify-end gap-1.5">
            <Button variant="secondary" onClick={() => answer(request.id, 'deny')}>
              {t('Deny')}
            </Button>
            <Button variant="secondary" onClick={() => answer(request.id, 'site')}>
              {t('Always here')}
            </Button>
            <Button onClick={() => answer(request.id, 'once')}>{t('Allow')}</Button>
          </div>
        </div>
      ))}
    </div>
  )
}
