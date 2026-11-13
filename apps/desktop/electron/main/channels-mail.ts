import * as atlas from '../atlas'

import type { AddMailAccountInput } from '../../src/types/mail'

export const mailChannels = {
  'atlas:listMailAccounts': () => atlas.listMailAccounts(),
  'atlas:addMailAccount': (_e: unknown, input: AddMailAccountInput) => atlas.addMailAccount(input),
  'atlas:removeMailAccount': (_e: unknown, accountId: string) => atlas.removeMailAccount(accountId),
  'atlas:getMailInbox': (_e: unknown, fresh: boolean) => atlas.getMailInbox(fresh),
} as const
