import { Mail, Plug } from 'lucide-react'
import { useEffect, useState } from 'react'

import { api } from '../../api'
import { t } from '../../i18n'
import {
  PERSONAL_CREDENTIALS_CHANGED,
  PERSONAL_CREDENTIALS_SECTION,
  credentialFor,
} from '../../views/settings/personalCredentials'

import type { WorkspaceController } from './useWorkspaceController'
import type { PersonalCredential } from '../../types'

const INBOX_URL = 'https://mail.google.com/mail/u/0/#inbox'

function usePersonalCredentialList(): PersonalCredential[] | null {
  const [list, setList] = useState<PersonalCredential[] | null>(null)

  useEffect(() => {
    let alive = true
    const refresh = () => {
      api
        .atlasListPersonalCredentials()
        .then((next) => {
          if (alive) setList(next)
        })
        .catch((err: unknown) => console.warn('[rail] failed to load personal credentials', err))
    }

    refresh()
    window.addEventListener(PERSONAL_CREDENTIALS_CHANGED, refresh)

    return () => {
      alive = false
      window.removeEventListener(PERSONAL_CREDENTIALS_CHANGED, refresh)
    }
  }, [])

  return list
}

/**
 * Emails in the right rail. Gmail is a personal credential the member's Bots
 * read and draft through; the inbox itself opens live in a browser tab.
 */
export function RailEmails({ ws, teamId }: { ws: WorkspaceController; teamId: string }) {
  const credentials = usePersonalCredentialList()
  const gmail = credentialFor(credentials, 'gmail', teamId)

  return (
    <section
      aria-label={t('Emails')}
      className="shrink-0 border-t border-line-control/60 px-3.5 pb-3 pt-2.5"
    >
      <h2 className="pb-1.5 text-[12px] font-semibold uppercase tracking-wide text-tertiary">
        {t('Emails')}
      </h2>
      {credentials === null ? null : gmail ? (
        <>
          <button
            type="button"
            onClick={() => ws.chatLinkMenuActions.openInApp(INBOX_URL)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-secondary hover:bg-state-hover hover:text-main"
          >
            <Mail className="size-4 flex-shrink-0" strokeWidth={1.8} />
            <span className="min-w-0 flex-1 truncate">{t('Open inbox')}</span>
          </button>
          <p className="px-2 pt-1 text-[12px] text-tertiary">
            {t('Your Bots can read, draft and send from Gmail. Ask one to triage your inbox.')}
          </p>
        </>
      ) : (
        <button
          type="button"
          onClick={() => ws.openSettingsSection(PERSONAL_CREDENTIALS_SECTION)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-secondary hover:bg-state-hover hover:text-main"
        >
          <Plug className="size-4 flex-shrink-0" strokeWidth={1.8} />
          <span className="min-w-0 flex-1 truncate">{t('Connect Gmail')}</span>
        </button>
      )}
    </section>
  )
}
