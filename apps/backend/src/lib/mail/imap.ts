import { ImapFlow } from 'imapflow'

import { AppError } from '@/lib/errors'

import type { ImapServer } from './providers'

export type ImapLogin = ImapServer & { username: string; password: string }

export type InboxMessage = {
  uid: number
  subject: string
  fromName: string
  fromAddress: string
  date: string
  unread: boolean
}

const TIMEOUT_MS = 20_000

function client(login: ImapLogin): ImapFlow {
  return new ImapFlow({
    host: login.host,
    port: login.port,
    secure: true,
    auth: { user: login.username, pass: login.password },
    logger: false,
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS * 3,
  })
}

/** A message a person can act on, from what the server said. */
export function loginFailure(err: unknown): AppError {
  const e = err as {
    authenticationFailed?: boolean
    responseText?: string
    code?: string
    message?: string
  }

  if (e.authenticationFailed) {
    const detail = e.responseText ? ` (${e.responseText})` : ''

    return new AppError(
      400,
      'mail_auth_failed',
      `The server refused that login${detail}. Use an app password, not your normal password.`,
    )
  }
  if (e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT') {
    return new AppError(502, 'mail_unreachable', `Couldn’t reach the mail server (${e.code}).`)
  }

  return new AppError(502, 'mail_error', e.message ?? 'The mail server returned an error.')
}

export async function verifyLogin(login: ImapLogin): Promise<void> {
  const imap = client(login)

  try {
    await imap.connect()
  } catch (err) {
    throw loginFailure(err)
  }
  await imap.logout().catch(() => null)
}

type FetchedMessage = {
  uid: number
  envelope?: {
    subject?: string
    date?: Date
    from?: { name?: string; address?: string }[]
  }
  flags?: Set<string>
  internalDate?: Date | string
}

/** One fetched message as the rail shows it. Blank fields fall back to something readable. */
export function toInboxMessage(msg: FetchedMessage): InboxMessage {
  const sender = msg.envelope?.from?.[0]
  const date = msg.envelope?.date ?? msg.internalDate
  const address = sender?.address ?? ''
  const subject = msg.envelope?.subject?.trim() ?? ''
  const name = sender?.name?.trim() ?? ''

  return {
    uid: msg.uid,
    subject: subject === '' ? '(no subject)' : subject,
    fromName: name === '' ? address : name,
    fromAddress: address,
    date: new Date(date ?? 0).toISOString(),
    unread: !msg.flags?.has('\\Seen'),
  }
}

/** The newest `limit` messages in INBOX, newest first: headers only, no bodies. */
export async function fetchRecent(login: ImapLogin, limit: number): Promise<InboxMessage[]> {
  const imap = client(login)

  try {
    await imap.connect()
  } catch (err) {
    throw loginFailure(err)
  }
  try {
    const box = await imap.mailboxOpen('INBOX', { readOnly: true })
    const total = box.exists

    if (total === 0) return []
    const from = Math.max(1, total - limit + 1)
    const messages: InboxMessage[] = []

    for await (const msg of imap.fetch(`${String(from)}:*`, {
      uid: true,
      envelope: true,
      flags: true,
      internalDate: true,
    })) {
      messages.push(toInboxMessage(msg))
    }

    return messages.sort((a, b) => b.date.localeCompare(a.date))
  } finally {
    await imap.logout().catch(() => null)
  }
}
