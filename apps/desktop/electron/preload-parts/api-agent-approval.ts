import { ipcRenderer } from 'electron'

import type { IpcRendererEvent } from 'electron'

export const agentApprovalApi = {
  agentApprovalAnswer: (id: string, decision: 'once' | 'site' | 'deny') =>
    ipcRenderer.invoke('agentApproval:answer', id, decision),
  onAgentApprovalRequest: (callback: (request: unknown) => void) => {
    const handler = (_event: IpcRendererEvent, request: unknown) => callback(request)

    ipcRenderer.on('agentApproval:request', handler)

    return () => ipcRenderer.off('agentApproval:request', handler)
  },
  onAgentApprovalSettled: (callback: (id: string) => void) => {
    const handler = (_event: IpcRendererEvent, id: string) => callback(id)

    ipcRenderer.on('agentApproval:settled', handler)

    return () => ipcRenderer.off('agentApproval:settled', handler)
  },
}
