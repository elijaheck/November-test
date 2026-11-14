import type { AgentApprovalDecision, AgentApprovalRequest } from '../types/agentApproval.ts'

export const agentApprovalApi = {
  agentApprovalAnswer: (id: string, decision: AgentApprovalDecision) =>
    window.api.agentApprovalAnswer(id, decision),
  onAgentApprovalRequest: (callback: (request: AgentApprovalRequest) => void) =>
    window.api.onAgentApprovalRequest(callback),
  onAgentApprovalSettled: (callback: (id: string) => void) =>
    window.api.onAgentApprovalSettled(callback),
}
