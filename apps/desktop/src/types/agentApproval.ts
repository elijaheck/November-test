export type AgentApprovalDecision = 'once' | 'site' | 'deny'

export type AgentApprovalRequest = {
  id: string
  team: string
  session: string
  host: string
  action: 'submit' | 'send' | 'click' | 'type'
  script: string
}
