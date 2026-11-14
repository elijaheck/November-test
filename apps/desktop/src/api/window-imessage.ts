import type { IMessage, IMessageChat, IMessageResult } from '../types/imessage.ts'

export type WindowIMessageApi = {
  imessageListChats(limit?: number): Promise<IMessageResult<IMessageChat[]>>
  imessageListMessages(guid: string, limit?: number): Promise<IMessageResult<IMessage[]>>
  imessageSend(guid: string, text: string, handle?: string): Promise<void>
  imessageOpenAccessSettings(): Promise<void>
}
