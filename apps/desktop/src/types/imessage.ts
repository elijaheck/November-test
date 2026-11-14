/** A conversation in the Mac's Messages app (iMessage or SMS). */
export type IMessageChat = {
  guid: string
  /** Contact name, group name, or the number/address when neither is known. */
  name: string
  /** Phone numbers or addresses of the other people. */
  handles: string[]
  group: boolean
  lastText: string
  lastFromMe: boolean
  /** ISO time of the newest message. */
  lastAt: string
  unread: number
}

export type IMessage = {
  id: number
  text: string
  fromMe: boolean
  /** Who sent it (name when Contacts knows them), for group chats. */
  sender: string
  at: string
  hasAttachment: boolean
}

/**
 * Why Messages can't be read: not a Mac, or macOS hasn't given this app Full
 * Disk Access to ~/Library/Messages.
 */
export type IMessageResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'unsupported' }
  | { status: 'no_access'; detail: string }
