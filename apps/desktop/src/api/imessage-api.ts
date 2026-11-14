export const imessageApi = {
  imessageListChats: (limit?: number) => window.api.imessageListChats(limit),
  imessageListMessages: (guid: string, limit?: number) =>
    window.api.imessageListMessages(guid, limit),
  imessageSend: (guid: string, text: string, handle?: string) =>
    window.api.imessageSend(guid, text, handle),
  imessageOpenAccessSettings: () => window.api.imessageOpenAccessSettings(),
}
