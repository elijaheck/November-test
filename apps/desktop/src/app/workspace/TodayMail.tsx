import { clsx } from 'clsx'
import { Mail, RefreshCw } from 'lucide-react'

import { t } from '../../i18n'

import { isToday, shortMailTime, useMailInbox } from './useMailInbox'

import type { WorkspaceController } from './useWorkspaceController'
import type { MailMessage } from '../../types/mail'

function MessageRow({ message, onOpen }: { message: MailMessage; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        title={`${message.fromAddress}\n${message.subject}\n${message.account}`}
        className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-state-hover"
      >
        <span
          aria-hidden
          className={clsx(
            'mt-[7px] size-1.5 flex-shrink-0 rounded-full',
            message.unread ? 'bg-action-primary' : 'bg-transparent',
          )}
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline gap-2">
            <span
              className={clsx(
                'min-w-0 flex-1 truncate text-[13px]',
                message.unread ? 'font-semibold text-main' : 'text-secondary',
              )}
            >
              {message.fromName || message.fromAddress}
            </span>
            <span className="flex-shrink-0 text-[11px] text-tertiary">
              {shortMailTime(message.date)}
            </span>
          </span>
          <span
            className={clsx(
              'truncate text-[12px]',
              message.unread ? 'text-secondary' : 'text-tertiary',
            )}
          >
            {message.subject}
          </span>
        </span>
      </button>
    </li>
  )
}

/**
 * Today's mail, under the task rows in the right rail's Today list: one inbox
 * merged from every mailbox added under Connectors (iCloud, Gmail, Outlook or
 * any IMAP server). A message opens its webmail in a tab beside the chat.
 */
export function TodayMail({ ws }: { ws: WorkspaceController }) {
  const { inbox, loading, refreshing, refresh } = useMailInbox()
  const accounts = inbox?.accounts ?? []
  const today = (inbox?.messages ?? []).filter((message) => isToday(message.date))
  const errors = inbox?.errors ?? []
  const connected = accounts.length > 0

  return (
    <section aria-label={t('Mail')} className="pt-2">
      <div className="flex items-center gap-2 px-1 pb-1 text-[12px] font-medium text-tertiary">
        <span>{t('Mail')}</span>
        <span aria-hidden className="h-px flex-1 bg-line-control/60" />
        {connected && (
          <button
            type="button"
            onClick={refresh}
            title={t('Refresh')}
            aria-label={t('Refresh')}
            className="flex size-6 items-center justify-center rounded-md hover:bg-state-hover hover:text-main"
          >
            <RefreshCw
              className={clsx('size-3.5', refreshing && 'animate-spin')}
              strokeWidth={1.8}
            />
          </button>
        )}
      </div>
      {!loading && !connected && (
        <button
          type="button"
          onClick={() => ws.onSidebarSelect('team.integrations')}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-secondary hover:bg-state-hover hover:text-main"
        >
          <Mail className="size-4 flex-shrink-0" strokeWidth={1.8} />
          <span className="min-w-0 flex-1 truncate">{t('Connect mail in Connectors')}</span>
        </button>
      )}
      {errors.map((error) => (
        <p key={error.accountId} className="px-2 pb-1.5 text-[12px] text-error">
          {error.email}: {error.message}
        </p>
      ))}
      {loading && <p className="px-2 py-1.5 text-[12px] text-tertiary">{t('Loading…')}</p>}
      {connected && !loading && today.length === 0 && (
        <p className="px-2 py-1.5 text-[12px] text-tertiary">{t('No new mail today.')}</p>
      )}
      <ul>
        {today.map((message) => (
          <MessageRow
            key={`${message.accountId}:${String(message.uid)}`}
            message={message}
            onOpen={() => {
              if (message.webmailUrl) ws.chatLinkMenuActions.openInApp(message.webmailUrl)
            }}
          />
        ))}
      </ul>
    </section>
  )
}
