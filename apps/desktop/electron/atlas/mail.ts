import { call } from './client'

import type { AddMailAccountInput, MailAccount, MailInbox } from '../../src/types/mail'

const MAIL_TIMEOUT_MS = 60_000

// The signed-in member's own mailboxes (IMAP + app password) and their merged inbox.
export async function listMailAccounts(): Promise<MailAccount[]> {
  const res = await call<{ accounts: MailAccount[] }>('GET', '/mail/accounts')

  return res.accounts
}

export async function addMailAccount(input: AddMailAccountInput): Promise<MailAccount> {
  // The backend logs in to the mail server before saving, which can take a while.
  const res = await call<{ account: MailAccount }>('POST', '/mail/accounts', input, {
    retry: false,
    timeoutMs: MAIL_TIMEOUT_MS,
  })

  return res.account
}

export async function removeMailAccount(accountId: string): Promise<void> {
  await call('DELETE', `/mail/accounts/${encodeURIComponent(accountId)}`)
}

export function getMailInbox(fresh: boolean): Promise<MailInbox> {
  return call<MailInbox>('GET', fresh ? '/mail/inbox?fresh=1' : '/mail/inbox', undefined, {
    timeoutMs: MAIL_TIMEOUT_MS,
  })
}
