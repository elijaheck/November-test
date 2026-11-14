import type { AddMailAccountInput } from '../types/mail.ts'

export const mailApi = {
  atlasListMailAccounts: () => window.api.atlasListMailAccounts(),
  atlasAddMailAccount: (input: AddMailAccountInput) => window.api.atlasAddMailAccount(input),
  atlasRemoveMailAccount: (accountId: string) => window.api.atlasRemoveMailAccount(accountId),
  atlasGetMailInbox: (fresh = false) => window.api.atlasGetMailInbox(fresh),
}
