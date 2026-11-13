import { useSyncExternalStore } from 'react'

/**
 * The iMessage conversation open in the center, if any. It lives outside the
 * tab model on purpose: picking a person swaps the chat surface without a
 * route, and picking any bot, task or page clears it.
 */
let selected: string | null = null
const listeners = new Set<() => void>()

export function selectIMessageChat(guid: string | null): void {
  if (guid === selected) return
  selected = guid
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

export function useSelectedIMessageChat(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => selected,
    () => selected,
  )
}
