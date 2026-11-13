import { ObjectId } from 'mongodb'

import { createSealer } from '@/lib/byos/secrets/shared'
import { AppError } from '@/lib/errors'
import { mailAccounts } from '@/models'

import { verifyLogin } from './imap'
import { serverFor, WEBMAIL_URLS } from './providers'

import type { MailAccount, MailProvider } from '@/models'

export const mailSealer = createSealer({
  subject: 'mail app passwords',
  keyEnvs: ['MAIL_CREDENTIAL_ENCRYPTION_KEY'],
  keyId: () => 'mail-v1',
  recovery: 'Remove the mail account and add it again.',
})

export type MailAccountView = {
  id: string
  provider: MailProvider
  email: string
  host: string
  webmailUrl: string | null
  createdAt: string
}

export function viewOf(account: MailAccount): MailAccountView {
  return {
    id: account._id.toHexString(),
    provider: account.provider,
    email: account.email,
    host: account.host,
    webmailUrl: WEBMAIL_URLS[account.provider],
    createdAt: account.createdAt.toISOString(),
  }
}

export async function listMailAccounts(userId: string): Promise<MailAccount[]> {
  return mailAccounts().find({ userId }).sort({ createdAt: 1 }).toArray()
}

export type AddMailAccount = {
  provider: MailProvider
  email: string
  password: string
  username?: string
  host?: string
  port?: number
}

/** Checks the login against the server, then stores the account with its password sealed. */
export async function addMailAccount(userId: string, input: AddMailAccount): Promise<MailAccount> {
  const server = serverFor(input.provider, input)

  if (!server)
    throw new AppError(400, 'mail_host_required', 'Enter the IMAP server for this account.')
  const email = input.email.trim().toLowerCase()
  const typed = input.username?.trim() ?? ''
  const username = typed === '' ? email : typed
  // App passwords are often shown with spaces (Gmail, iCloud); the servers take them without.
  const password = input.password.replace(/\s+/g, '')

  await verifyLogin({ ...server, username, password })
  const now = new Date()
  const encryptedPassword = mailSealer.seal(password)
  const existing = await mailAccounts().findOneAndUpdate(
    { userId, email, host: server.host },
    {
      $set: {
        provider: input.provider,
        username,
        port: server.port,
        encryptedPassword,
        updatedAt: now,
      },
    },
    { returnDocument: 'after' },
  )

  if (existing) return existing
  const account: MailAccount = {
    _id: new ObjectId(),
    userId,
    provider: input.provider,
    email,
    username,
    host: server.host,
    port: server.port,
    encryptedPassword,
    createdAt: now,
    updatedAt: now,
  }

  await mailAccounts().insertOne(account)

  return account
}

export async function removeMailAccount(userId: string, id: string): Promise<void> {
  if (!ObjectId.isValid(id)) throw new AppError(404, 'not_found', 'Mail account not found')
  const res = await mailAccounts().deleteOne({ _id: new ObjectId(id), userId })

  if (res.deletedCount === 0) throw new AppError(404, 'not_found', 'Mail account not found')
}
