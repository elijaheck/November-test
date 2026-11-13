import { useQuery } from '@tanstack/react-query'

import { api } from '../../api'

export const IMESSAGE_CHATS_KEY = ['imessage', 'chats'] as const

/**
 * The Mac's Messages conversations, read locally every 10 seconds. Never sent
 * to the backend. `unsupported` off macOS; `no_access` until Full Disk Access.
 */
export function useIMessageChats() {
  return useQuery({
    queryKey: IMESSAGE_CHATS_KEY,
    queryFn: () => api.imessageListChats(60),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  })
}

export function useIMessages(guid: string) {
  return useQuery({
    queryKey: ['imessage', 'messages', guid],
    queryFn: () => api.imessageListMessages(guid, 120),
    refetchInterval: 4_000,
    refetchIntervalInBackground: false,
  })
}
