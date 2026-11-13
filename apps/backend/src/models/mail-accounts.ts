import { db } from '@/lib/db'

import type { EncryptedSecret } from '@/lib/byos/secrets/shared'
import type { Collection, ObjectId } from 'mongodb'

export type MailProvider = 'icloud' | 'gmail' | 'outlook' | 'imap'

/**
 * A member's own mailbox, read over IMAP with an app password. Personal: one
 * user's accounts are never listed to anyone else.
 */
export type MailAccount = {
  _id: ObjectId
  userId: string
  provider: MailProvider
  /** The address shown in the app, and the IMAP login unless `username` differs. */
  email: string
  username: string
  host: string
  port: number
  encryptedPassword: EncryptedSecret
  createdAt: Date
  updatedAt: Date
}

export const mailAccounts = (): Collection<MailAccount> =>
  db().collection<MailAccount>('mail_accounts')
