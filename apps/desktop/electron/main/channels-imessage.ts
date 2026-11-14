import {
  listIMessageChats,
  listIMessages,
  openFullDiskAccessSettings,
  sendToIMessageChat,
} from '../imessage'

export const imessageChannels = {
  'imessage:listChats': (_e: unknown, limit?: number) => listIMessageChats(limit),
  'imessage:listMessages': (_e: unknown, guid: string, limit?: number) =>
    listIMessages(guid, limit),
  'imessage:send': (_e: unknown, guid: string, text: string, handle?: string) =>
    sendToIMessageChat(guid, text, handle),
  'imessage:openAccessSettings': () => openFullDiskAccessSettings(),
} as const
