import { Hono } from 'hono'
import { z } from 'zod'

import { addMailAccount, listMailAccounts, removeMailAccount, viewOf } from '@/lib/mail/accounts'
import { unifiedInbox } from '@/lib/mail/inbox'
import { zv } from '@/lib/validate'
import { requireAuth } from '@/middleware/auth'

import type { AuthVariables } from '@/middleware/auth'

// A member's own mailboxes and their merged inbox. Personal: every query is
// scoped to the signed-in user, and conversation tokens never reach here.
export const mailRoutes = new Hono<{ Variables: AuthVariables }>()

mailRoutes.use('*', requireAuth)

const addSchema = z.object({
  provider: z.enum(['icloud', 'gmail', 'outlook', 'imap']),
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(512),
  username: z.string().trim().max(320).optional(),
  host: z.string().trim().max(255).optional(),
  port: z.number().int().min(1).max(65535).optional(),
})

mailRoutes.get('/accounts', async (c) =>
  c.json({ accounts: (await listMailAccounts(c.get('userId'))).map(viewOf) }),
)

mailRoutes.post('/accounts', zv('json', addSchema), async (c) =>
  c.json({ account: viewOf(await addMailAccount(c.get('userId'), c.req.valid('json'))) }, 201),
)

mailRoutes.delete('/accounts/:id', async (c) => {
  await removeMailAccount(c.get('userId'), c.req.param('id'))

  return c.json({ ok: true })
})

mailRoutes.get('/inbox', async (c) =>
  c.json(await unifiedInbox(c.get('userId'), { fresh: c.req.query('fresh') === '1' })),
)
