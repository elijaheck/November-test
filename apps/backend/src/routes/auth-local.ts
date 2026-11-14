import { Hono } from 'hono'

import { config } from '@/config'
import { AppError } from '@/lib/errors'
import { createTeamForUser, getMyTeams, signInWithVerifiedEmail, updateTeam } from '@/lib/identity'
import { issueSession } from '@/lib/identity/start-session'

/** The one user a local stack signs in as when OPENBOT_LOCAL_SIGN_IN is on. */
export const LOCAL_USER_EMAIL = 'you@openbot.local'
/** The Spaces a local user starts with; each is a team with its own bots, chats and tabs. */
export const LOCAL_SPACES = ['Personal', 'TTG', 'Peptracked'] as const
/** The single team earlier local stacks created; it becomes Personal so its bots stay put. */
const LEGACY_LOCAL_TEAM = 'Local'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** True when the Host header names this machine, so a request did not arrive through a public name. */
export function isLoopbackHost(host: string | undefined): boolean {
  if (!host) return false
  const name = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':', 1)[0]

  return LOOPBACK_HOSTS.has((name ?? '').toLowerCase())
}

/** The Space names `existing` still lacks, after a legacy "Local" team counts as Personal. */
export function missingSpaces(existing: string[]): string[] {
  const have = new Set(existing.map((name) => (name === LEGACY_LOCAL_TEAM ? 'Personal' : name)))

  return LOCAL_SPACES.filter((name) => !have.has(name))
}

async function ensureLocalSpaces(userId: string): Promise<void> {
  const teams = await getMyTeams(userId)
  const legacy = teams.find((team) => team.name === LEGACY_LOCAL_TEAM)

  if (legacy && !teams.some((team) => team.name === 'Personal')) {
    await updateTeam(legacy.id, userId, { name: 'Personal' })
  }
  for (const name of missingSpaces(teams.map((team) => team.name))) {
    await createTeamForUser(userId, name)
  }
}

/**
 * Sign-in without an account, for a backend that runs on the user's own
 * machine. Off unless OPENBOT_LOCAL_SIGN_IN is set (never in production), and
 * only answered on a loopback Host. It creates the local user and its team on
 * first use, with its Spaces (Personal, TTG, Peptracked), then issues an
 * ordinary session for it.
 */
export const localAuth = new Hono()

localAuth.post('/sign-in', async (c) => {
  if (!config.auth.localSignIn || !isLoopbackHost(c.req.header('host'))) {
    throw new AppError(404, 'not_found', 'Not found')
  }
  const user = await signInWithVerifiedEmail(LOCAL_USER_EMAIL)

  await ensureLocalSpaces(user.id)

  return c.json(await issueSession(c, user))
})
