import { ipcRenderer } from 'electron'

export const mailApi = {
  atlasListMailAccounts: () => ipcRenderer.invoke('atlas:listMailAccounts'),
  atlasAddMailAccount: (input: unknown) => ipcRenderer.invoke('atlas:addMailAccount', input),
  atlasRemoveMailAccount: (accountId: string) =>
    ipcRenderer.invoke('atlas:removeMailAccount', accountId),
  atlasGetMailInbox: (fresh: boolean) => ipcRenderer.invoke('atlas:getMailInbox', fresh),
}
