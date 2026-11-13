import { shell } from 'electron'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { contactNames } from './contacts'
import { appleDateToIso, handleKey, messageText, sqlString } from './decode'
import { sendIMessage } from './send'
import { NoAccessError, queryRows } from './sqlite'

import type { IMessage, IMessageChat, IMessageResult } from '../../src/types/imessage'

const CHAT_DB = join(homedir(), 'Library', 'Messages', 'chat.db')
const FULL_DISK_ACCESS = 'x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles'

type ChatRow = {
  guid: string
  ident: string | null
  name: string | null
  style: number | null
  handles: string | null
  date: number | null
  text: string | null
  body: string | null
  fromMe: number
  unread: number
}

type MessageRow = {
  id: number
  date: number | null
  text: string | null
  body: string | null
  fromMe: number
  handle: string | null
  att: number
}

// Newest message per chat, its participants and unread count. Tapbacks
// (associated_message_type != 0) are not messages.
const chatsSql = (limit: number) => `
WITH last AS (
  SELECT cj.chat_id, MAX(cj.message_date) AS d FROM chat_message_join cj GROUP BY cj.chat_id
)
SELECT c.guid, c.chat_identifier AS ident, c.display_name AS name, c.style,
  (SELECT group_concat(h.id, ',') FROM chat_handle_join ch JOIN handle h ON h.ROWID = ch.handle_id
     WHERE ch.chat_id = c.ROWID) AS handles,
  m.date, m.text, hex(m.attributedBody) AS body, m.is_from_me AS fromMe,
  (SELECT COUNT(*) FROM chat_message_join j2 JOIN message m2 ON m2.ROWID = j2.message_id
     WHERE j2.chat_id = c.ROWID AND m2.is_read = 0 AND m2.is_from_me = 0
       AND m2.associated_message_type = 0) AS unread
FROM last
JOIN chat c ON c.ROWID = last.chat_id
JOIN chat_message_join cj ON cj.chat_id = last.chat_id AND cj.message_date = last.d
JOIN message m ON m.ROWID = cj.message_id
GROUP BY c.ROWID
ORDER BY last.d DESC
LIMIT ${String(limit)}`

const messagesSql = (guid: string, limit: number) => `
SELECT m.ROWID AS id, m.date, m.text, hex(m.attributedBody) AS body, m.is_from_me AS fromMe,
  h.id AS handle, m.cache_has_attachments AS att
FROM message m
JOIN chat_message_join cj ON cj.message_id = m.ROWID
JOIN chat c ON c.ROWID = cj.chat_id
LEFT JOIN handle h ON h.ROWID = m.handle_id
WHERE c.guid = ${sqlString(guid)} AND m.associated_message_type = 0
ORDER BY m.date DESC
LIMIT ${String(limit)}`

async function guarded<T>(read: () => Promise<T>): Promise<IMessageResult<T>> {
  if (process.platform !== 'darwin') return { status: 'unsupported' }
  try {
    return { status: 'ok', data: await read() }
  } catch (err) {
    if (err instanceof NoAccessError) return { status: 'no_access', detail: err.message }
    throw err
  }
}

function nameFor(names: Map<string, string>, handle: string): string {
  return names.get(handleKey(handle)) ?? handle
}

/** The Mac's Messages conversations, newest first. Read in place; nothing is copied. */
export function listIMessageChats(limit = 60): Promise<IMessageResult<IMessageChat[]>> {
  return guarded(async () => {
    const [rows, names] = await Promise.all([
      queryRows<ChatRow>(CHAT_DB, chatsSql(Math.min(Math.max(limit, 1), 300))),
      contactNames(),
    ])

    return rows.map((row) => {
      const handles = (row.handles ?? row.ident ?? '').split(',').filter(Boolean)
      const group = row.style === 43 || handles.length > 1
      const people = handles.map((handle) => nameFor(names, handle))
      const name = row.name?.trim() || (group ? people.join(', ') : (people[0] ?? row.ident ?? ''))

      return {
        guid: row.guid,
        name,
        handles,
        group,
        lastText: messageText(row.text, row.body),
        lastFromMe: row.fromMe === 1,
        lastAt: appleDateToIso(row.date),
        unread: row.unread,
      }
    })
  })
}

/** The newest messages in one conversation, oldest first for reading. */
export function listIMessages(guid: string, limit = 80): Promise<IMessageResult<IMessage[]>> {
  return guarded(async () => {
    const [rows, names] = await Promise.all([
      queryRows<MessageRow>(CHAT_DB, messagesSql(guid, Math.min(Math.max(limit, 1), 500))),
      contactNames(),
    ])

    return rows.toReversed().map((row) => ({
      id: row.id,
      text: messageText(row.text, row.body),
      fromMe: row.fromMe === 1,
      sender: row.fromMe === 1 ? '' : nameFor(names, row.handle ?? ''),
      at: appleDateToIso(row.date),
      hasAttachment: row.att === 1,
    }))
  })
}

export async function sendToIMessageChat(guid: string, text: string, handle?: string) {
  if (process.platform !== 'darwin') throw new Error('Messages is only on macOS')
  const body = text.trim()

  if (body === '') return
  await sendIMessage(guid, body, handle)
}

export function openFullDiskAccessSettings(): Promise<void> {
  return shell.openExternal(FULL_DISK_ACCESS)
}
