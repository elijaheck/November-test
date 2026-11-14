import { answerAgentApproval } from './local-runtime/agent-approval.ts'

import type { ApprovalDecision } from './local-runtime/approval-rules.ts'

const DECISIONS = new Set<ApprovalDecision>(['once', 'site', 'deny'])

export const agentApprovalChannels = {
  'agentApproval:answer': (_e: unknown, id: string, decision: ApprovalDecision) => {
    answerAgentApproval(id, DECISIONS.has(decision) ? decision : 'deny')
  },
} as const
