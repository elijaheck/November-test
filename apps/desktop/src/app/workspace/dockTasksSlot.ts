import { useSyncExternalStore } from 'react'

/**
 * Where the Tasks list renders. The right rail owns the element; the sidebar,
 * which already holds the task rows and their handlers, portals the list into
 * it. With no rail mounted the sidebar keeps Tasks as its own second page.
 */
let target: HTMLElement | null = null
const listeners = new Set<() => void>()

export function setDockTasksTarget(next: HTMLElement | null): void {
  if (next === target) return
  target = next
  for (const listener of listeners) listener()
}

/** Clears the target only if `element` still holds it. */
export function clearDockTasksTarget(element: HTMLElement): void {
  if (target === element) setDockTasksTarget(null)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

export function useDockTasksTarget(): HTMLElement | null {
  return useSyncExternalStore(
    subscribe,
    () => target,
    () => target,
  )
}
