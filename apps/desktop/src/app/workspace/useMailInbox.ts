import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'

import { api } from '../../api'

import type { MailInbox } from '../../types/mail'

export const MAIL_INBOX_KEY = ['mail', 'inbox'] as const
const REFRESH_MS = 2 * 60_000

/**
 * The member's merged inbox across every mailbox they added. Refetches every
 * two minutes; `refresh()` skips the backend's short cache.
 */
export function useMailInbox(): {
  inbox: MailInbox | undefined
  loading: boolean
  refreshing: boolean
  refresh: () => void
} {
  const fresh = useRef(false)
  const query = useQuery({
    queryKey: MAIL_INBOX_KEY,
    queryFn: () => {
      const skipCache = fresh.current

      fresh.current = false

      return api.atlasGetMailInbox(skipCache)
    },
    refetchInterval: REFRESH_MS,
    staleTime: 30_000,
  })
  const refresh = useCallback(() => {
    fresh.current = true
    void query.refetch()
  }, [query])

  return {
    inbox: query.data,
    loading: query.isPending,
    refreshing: query.isFetching && !query.isPending,
    refresh,
  }
}

/** True when `iso` falls on the local calendar day of `now`. */
export function isToday(iso: string, now = new Date()): boolean {
  return new Date(iso).toDateString() === now.toDateString()
}

/** "3:42 PM" for today, "Nov 9" otherwise, in the user's locale. */
export function shortMailTime(iso: string, now = new Date()): string {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return ''
  if (isToday(iso, now)) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
