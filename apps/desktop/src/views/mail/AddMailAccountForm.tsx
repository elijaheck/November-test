import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { useState } from 'react'

import { api } from '../../api'
import { toast } from '../../components/ui/toast'
import { t } from '../../i18n'

import type { MailAccount, MailProvider } from '../../types/mail'
import type { SyntheticEvent } from 'react'

const PROVIDERS: { id: MailProvider; label: string }[] = [
  { id: 'icloud', label: 'iCloud' },
  { id: 'gmail', label: 'Gmail' },
  { id: 'outlook', label: 'Outlook' },
  { id: 'imap', label: 'IMAP' },
]

function passwordHint(provider: MailProvider): string {
  switch (provider) {
    case 'icloud':
      return t('Make an app-specific password at account.apple.com, under Sign-In and Security.')
    case 'gmail':
      return t(
        'Turn on 2-Step Verification, then make an app password at myaccount.google.com/apppasswords.',
      )
    case 'outlook':
      return t(
        'Use an app password from account.microsoft.com, under Security. Some accounts only allow Microsoft sign-in.',
      )
    case 'imap':
      return t('Use the IMAP password or app password your mail provider gives you.')
  }
}

const FIELD =
  'h-8 w-full rounded-md border border-line-control bg-surface px-2.5 text-[13px] text-main placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-line-control'

/** Connected mailboxes with a remove button, then a form to add another one. */
export function AddMailAccountForm({
  accounts,
  onChanged,
  onClose,
}: {
  accounts: MailAccount[]
  onChanged: () => Promise<void>
  onClose: () => void
}) {
  const [provider, setProvider] = useState<MailProvider>('icloud')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [host, setHost] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: SyntheticEvent) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await api.atlasAddMailAccount({
        provider,
        email: email.trim(),
        password,
        ...(provider === 'imap' ? { host: host.trim() } : {}),
      })
      setEmail('')
      setPassword('')
      setHost('')
      await onChanged()
      onClose()
    } catch (err) {
      toast.apiError(t('Couldn’t add that mailbox'), err, {
        fallback: t('Check the address and app password, then try again.'),
      })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (account: MailAccount) => {
    try {
      await api.atlasRemoveMailAccount(account.id)
      await onChanged()
    } catch (err) {
      toast.apiError(t('Couldn’t remove that mailbox'), err)
    }
  }

  return (
    <div className="flex flex-col gap-2 px-2 pb-2">
      {accounts.length > 0 && (
        <ul className="flex flex-col">
          {accounts.map((account) => (
            <li key={account.id} className="flex items-center gap-2 px-1 py-1 text-[12px]">
              <span className="min-w-0 flex-1 truncate text-secondary">{account.email}</span>
              <button
                type="button"
                onClick={() => void remove(account)}
                title={t('Remove')}
                aria-label={t('Remove')}
                className="flex size-6 items-center justify-center rounded-md text-tertiary hover:bg-state-hover hover:text-main"
              >
                <X className="size-3.5" strokeWidth={1.8} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-2">
        <div role="radiogroup" aria-label={t('Mail provider')} className="flex gap-1">
          {PROVIDERS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={provider === option.id}
              onClick={() => setProvider(option.id)}
              className={clsx(
                'flex-1 rounded-md px-1.5 py-1 text-[12px]',
                provider === option.id
                  ? 'bg-state-selected text-main'
                  : 'text-secondary hover:bg-state-hover',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input
          type="email"
          required
          autoComplete="off"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t('Email address')}
          className={FIELD}
        />
        {provider === 'imap' && (
          <input
            required
            value={host}
            onChange={(event) => setHost(event.target.value)}
            placeholder={t('IMAP server, e.g. imap.example.com')}
            className={FIELD}
          />
        )}
        <input
          type="password"
          required
          autoComplete="off"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t('App password')}
          className={FIELD}
        />
        <p className="text-[11px] leading-snug text-tertiary">{passwordHint(provider)}</p>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="h-8 flex-1 rounded-md bg-main px-3 text-[13px] font-medium text-inverse disabled:opacity-60"
          >
            {saving ? t('Connecting…') : t('Add mailbox')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md px-3 text-[13px] text-secondary hover:bg-state-hover"
          >
            {t('Cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
