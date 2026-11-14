import { Avatar } from '../Avatar'
import { t } from '../../i18n'

import { chatTime } from './chat-preview'

import type { Item } from './types'
import type { IMessageChat, IMessageResult } from '../../types/imessage'

export const IMESSAGE_KEY_PREFIX = 'imessage:'

/**
 * iMessage conversations as rows in the one Chats list, beside bots and
 * people. Clicking opens the conversation in the center via `onOpen`.
 */
export function imessageItems(
  result: IMessageResult<IMessageChat[]> | undefined,
  selected: string | null,
  onOpen: (guid: string) => void,
  onSetup: () => void,
): Item[] {
  if (!result || result.status === 'unsupported') return []
  if (result.status === 'no_access') {
    return [
      {
        key: `${IMESSAGE_KEY_PREFIX}setup`,
        label: t('Show your iMessages'),
        preview: t('Give OpenBot Full Disk Access in System Settings'),
        enabled: true,
        lastActiveAt: new Date().toISOString(),
        onActivate: onSetup,
      },
    ]
  }

  return result.data.map((chat) => ({
    key: `${IMESSAGE_KEY_PREFIX}${chat.guid}`,
    label: chat.name,
    iconNode: <Avatar name={chat.name} size={20} className="rounded-full" />,
    preview: chat.lastFromMe ? `${t('You:')} ${chat.lastText}` : chat.lastText,
    time: chatTime(chat.lastAt),
    lastActiveAt: chat.lastAt,
    unread: chat.unread > 0,
    badge: chat.unread > 0 ? chat.unread : undefined,
    enabled: true,
    active: selected === chat.guid,
    onActivate: () => onOpen(chat.guid),
  }))
}

/** Bots, people and iMessage chats in one list, newest first. */
export function mergeByActivity(rows: Item[], extra: Item[]): Item[] {
  if (extra.length === 0) return rows
  const at = (item: Item) => Date.parse(item.lastActiveAt ?? '') || 0

  return [...rows, ...extra].sort((a, b) => at(b) - at(a))
}
