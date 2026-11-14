import { AppError } from '@/lib/errors'

import { listMailAccounts, mailSealer, viewOf } from './accounts'
import { fetchRecent } from './imap'

import type { MailAccountView } from './accounts'
import type { InboxMessage } from './imap'
import type { MailAccount } from '@/models'

export type UnifiedMessage = InboxMessage & {
  accountId: string
  account: string
  webmailUrl: string | null
}

export type UnifiedInbox = {
  accounts: MailAccountView[]
  messages: UnifiedMessage[]
  /** Accounts that could not be read this time, with why. */
  errors: { accountId: string; email: string; message: string }[]
}

const PER_ACCOUNT = 25
const CACHE_MS = 60_000
const cache = new Map<string, { at: number; messages: InboxMessage[] }>()

async function recentFor(account: MailAccount, fresh: boolean): Promise<InboxMessage[]> {
  const key = `${account._id.toHexString()}:${String(account.updatedAt.getTime())}`
  const hit = cache.get(key)

  if (!fresh && hit && Date.now() - hit.at < CACHE_MS) return hit.messages
  const messages = await fetchRecent(
    {
      host: account.host,
      port: account.port,
      username: account.username,
      password: mailSealer.open(account.encryptedPassword),
    },
    PER_ACCOUNT,
  )

  cache.set(key, { at: Date.now(), messages })

  return messages
}

/** Every mailbox's newest messages in one list, newest first. One failing mailbox never hides the others. */
export async function unifiedInbox(
  userId: string,
  opts: { fresh?: boolean; limit?: number } = {},
): Promise<UnifiedInbox> {
  const accounts = await listMailAccounts(userId)
  const results = await Promise.allSettled(
    accounts.map((account) => recentFor(account, opts.fresh ?? false)),
  )
  const messages: UnifiedMessage[] = []
  const errors: UnifiedInbox['errors'] = []

  results.forEach((result, i) => {
    const account = accounts[i]

    if (!account) return
    if (result.status === 'fulfilled') {
      const view = viewOf(account)

      for (const msg of result.value) {
        messages.push({
          ...msg,
          accountId: view.id,
          account: view.email,
          webmailUrl: view.webmailUrl,
        })
      }
    } else {
      const reason: unknown = result.reason

      errors.push({
        accountId: account._id.toHexString(),
        email: account.email,
        message:
          reason instanceof AppError || reason instanceof Error
            ? reason.message
            : 'Couldn’t read this mailbox.',
      })
    }
  })
  messages.sort((a, b) => b.date.localeCompare(a.date))

  return { accounts: accounts.map(viewOf), messages: messages.slice(0, opts.limit ?? 50), errors }
}
