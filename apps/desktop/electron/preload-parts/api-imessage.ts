import { ipcRenderer } from 'electron'

export const imessageApi = {
  imessageListChats: (limit?: number) => ipcRenderer.invoke('imessage:listChats', limit),
  imessageListMessages: (guid: string, limit?: number) =>
    ipcRenderer.invoke('imessage:listMessages', guid, limit),
  imessageSend: (guid: string, text: string, handle?: string) =>
    ipcRenderer.invoke('imessage:send', guid, text, handle),
  imessageOpenAccessSettings: () => ipcRenderer.invoke('imessage:openAccessSettings'),
}
