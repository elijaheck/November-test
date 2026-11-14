import type { AddMailAccountInput, MailAccount, MailInbox } from '../types/mail.ts'

export type WindowMailApi = {
  atlasListMailAccounts(): Promise<MailAccount[]>
  atlasAddMailAccount(input: AddMailAccountInput): Promise<MailAccount>
  atlasRemoveMailAccount(accountId: string): Promise<void>
  atlasGetMailInbox(fresh: boolean): Promise<MailInbox>
}
