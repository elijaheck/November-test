import { clsx } from 'clsx'
import { Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { t } from '../../i18n'

import { AddMailAccountForm } from './AddMailAccountForm'
import { shortMailTime, useMailInbox } from './useMailInbox'

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
 * Emails in the right rail: one inbox merged from every mailbox the member
 * added (iCloud, Gmail, Outlook or any IMAP server). A message opens its
 * webmail in a tab beside the chat.
 */
export function RailEmails({ ws }: { ws: WorkspaceController }) {
  const { inbox, loading, refreshing, refresh, reload } = useMailInbox()
  const [adding, setAdding] = useState(false)
  const accounts = inbox?.accounts ?? []
  const messages = inbox?.messages ?? []
  const errors = inbox?.errors ?? []
  const showForm = adding || (!loading && accounts.length === 0 && inbox !== undefined)

  return (
    <section
      aria-label={t('Emails')}
      className="flex min-h-0 flex-1 flex-col border-t border-line-control/60 pt-2.5"
    >
      <header className="flex items-center px-3.5 pb-1.5">
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-tertiary">
          {t('Emails')}
        </h2>
        {accounts.length > 0 && (
          <button
            type="button"
            onClick={refresh}
            title={t('Refresh')}
            aria-label={t('Refresh')}
            className="ml-auto flex size-7 items-center justify-center rounded-lg text-tertiary hover:bg-state-hover hover:text-main"
          >
            <RefreshCw
              className={clsx('size-3.5', refreshing && 'animate-spin')}
              strokeWidth={1.8}
            />
          </button>
        )}
        <button
          type="button"
          onClick={() => setAdding((open) => !open)}
          title={t('Add mailbox')}
          aria-label={t('Add mailbox')}
          aria-expanded={showForm}
          className={clsx(
            'flex size-7 items-center justify-center rounded-lg text-tertiary hover:bg-state-hover hover:text-main',
            accounts.length === 0 && 'ml-auto',
          )}
        >
          <Plus className="size-4" strokeWidth={1.8} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pb-2 scrollbar-thin scrollbar-overlay">
        {showForm && (
          <>
            {accounts.length === 0 && (
              <p className="px-3.5 pb-2 text-[12px] text-tertiary">
                {t('Add iCloud, Gmail or Outlook to see your inbox here.')}
              </p>
            )}
            <AddMailAccountForm
              accounts={accounts}
              onChanged={reload}
              onClose={() => setAdding(false)}
            />
          </>
        )}
        {errors.map((error) => (
          <p key={error.accountId} className="px-3.5 pb-1.5 text-[12px] text-error">
            {error.email}: {error.message}
          </p>
        ))}
        {loading && <p className="px-3.5 py-2 text-[12px] text-tertiary">{t('Loading…')}</p>}
        {!showForm && !loading && accounts.length > 0 && messages.length === 0 && (
          <p className="px-3.5 py-2 text-[12px] text-tertiary">{t('Your inbox is empty.')}</p>
        )}
        <ul className="px-2">
          {messages.map((message) => (
            <MessageRow
              key={`${message.accountId}:${String(message.uid)}`}
              message={message}
              onOpen={() => {
                if (message.webmailUrl) ws.chatLinkMenuActions.openInApp(message.webmailUrl)
              }}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
