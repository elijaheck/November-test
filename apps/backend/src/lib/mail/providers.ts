import type { MailProvider } from '@/models'

export type ImapServer = { host: string; port: number }

/** IMAP servers for the mailboxes the app offers by name; `imap` takes any host. */
export const MAIL_PRESETS: Record<Exclude<MailProvider, 'imap'>, ImapServer & { name: string }> = {
  icloud: { name: 'iCloud Mail', host: 'imap.mail.me.com', port: 993 },
  gmail: { name: 'Gmail', host: 'imap.gmail.com', port: 993 },
  outlook: { name: 'Outlook', host: 'outlook.office365.com', port: 993 },
}

/** Where a message from this mailbox opens in a browser tab. */
export const WEBMAIL_URLS: Record<MailProvider, string | null> = {
  icloud: 'https://www.icloud.com/mail',
  gmail: 'https://mail.google.com/mail/u/0/#inbox',
  outlook: 'https://outlook.live.com/mail/0/inbox',
  imap: null,
}

/**
 * iCloud logs in with the address's name part only when the address is an
 * @icloud.com / @me.com / @mac.com one; the full address works for every
 * provider here, so it is the default login.
 */
export function serverFor(
  provider: MailProvider,
  custom?: { host?: string; port?: number },
): ImapServer | null {
  if (provider !== 'imap')
    return { host: MAIL_PRESETS[provider].host, port: MAIL_PRESETS[provider].port }
  const host = custom?.host?.trim()

  if (!host) return null

  return { host, port: custom?.port ?? 993 }
}
