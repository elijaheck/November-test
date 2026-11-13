/** A mailbox the member reads over IMAP with an app password. */
export type MailProvider = 'icloud' | 'gmail' | 'outlook' | 'imap'

export type MailAccount = {
  id: string
  provider: MailProvider
  email: string
  host: string
  webmailUrl: string | null
  createdAt: string
}

export type MailMessage = {
  uid: number
  subject: string
  fromName: string
  fromAddress: string
  date: string
  unread: boolean
  accountId: string
  account: string
  webmailUrl: string | null
}

export type MailInbox = {
  accounts: MailAccount[]
  messages: MailMessage[]
  errors: { accountId: string; email: string; message: string }[]
}

export type AddMailAccountInput = {
  provider: MailProvider
  email: string
  password: string
  username?: string
  host?: string
  port?: number
}
