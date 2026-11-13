import { Hono } from 'hono'

import { config } from '@/config'
import { AppError } from '@/lib/errors'
import { createTeamForUser, getMyTeams, signInWithVerifiedEmail } from '@/lib/identity'
import { issueSession } from '@/lib/identity/start-session'

/** The one user a local stack signs in as when OPENBOT_LOCAL_SIGN_IN is on. */
export const LOCAL_USER_EMAIL = 'you@openbot.local'
export const LOCAL_TEAM_NAME = 'Local'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** True when the Host header names this machine, so a request did not arrive through a public name. */
export function isLoopbackHost(host: string | undefined): boolean {
  if (!host) return false
  const name = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':', 1)[0]

  return LOOPBACK_HOSTS.has((name ?? '').toLowerCase())
}

/**
 * Sign-in without an account, for a backend that runs on the user's own
 * machine. Off unless OPENBOT_LOCAL_SIGN_IN is set (never in production), and
 * only answered on a loopback Host. It creates the local user and its team on
 * first use, then issues an ordinary session for it.
 */
export const localAuth = new Hono()

localAuth.post('/sign-in', async (c) => {
  if (!config.auth.localSignIn || !isLoopbackHost(c.req.header('host'))) {
    throw new AppError(404, 'not_found', 'Not found')
  }
  const user = await signInWithVerifiedEmail(LOCAL_USER_EMAIL)
  const teams = await getMyTeams(user.id)

  if (teams.length === 0) await createTeamForUser(user.id, LOCAL_TEAM_NAME)

  return c.json(await issueSession(c, user))
})
