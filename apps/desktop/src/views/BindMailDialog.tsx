import { useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api'
import { MAIL_INBOX_KEY } from '../app/workspace/useMailInbox'
import { Modal } from '../components/Modal'
import { t } from '../i18n'

import { AddMailAccountForm } from './mail/AddMailAccountForm'

const MAIL_ACCOUNTS_KEY = ['mail', 'accounts'] as const

/**
 * The Mail connector: add iCloud, Gmail, Outlook or any IMAP mailbox with an
 * app password, or remove one. Its messages show under Today in the right rail.
 */
export function BindMailDialog({
  open,
  onClose,
  onBound,
}: {
  open: boolean
  onClose: () => void
  onBound: () => void
}) {
  const client = useQueryClient()
  const accounts = useQuery({
    queryKey: MAIL_ACCOUNTS_KEY,
    queryFn: () => api.atlasListMailAccounts(),
    enabled: open,
  })
  const changed = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: MAIL_ACCOUNTS_KEY }),
      client.invalidateQueries({ queryKey: MAIL_INBOX_KEY }),
    ])
    onBound()
  }

  if (!open) return null

  return (
    <Modal open title={t('Mail')} appearance="prompt" width={420} onClose={onClose}>
      <div className="titlebar-no-drag px-3 pt-1 pb-4">
        <AddMailAccountForm accounts={accounts.data ?? []} onChanged={changed} onClose={onClose} />
      </div>
    </Modal>
  )
}
