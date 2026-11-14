import { ipcRenderer } from 'electron'

export const linkPreviewApi = {
  linkPreview: (url: string) => ipcRenderer.invoke('linkPreview:get', url),
}
