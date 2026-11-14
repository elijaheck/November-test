import type { AgentApprovalDecision, AgentApprovalRequest } from '../types/agentApproval.ts'

export type WindowAgentApprovalApi = {
  agentApprovalAnswer(id: string, decision: AgentApprovalDecision): Promise<void>
  onAgentApprovalRequest(callback: (request: AgentApprovalRequest) => void): () => void
  onAgentApprovalSettled(callback: (id: string) => void): () => void
}
