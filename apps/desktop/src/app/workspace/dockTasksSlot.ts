import { useSyncExternalStore } from 'react'

/** One element another tree can portal into, held in a module store. */
function createSlot() {
  let target: HTMLElement | null = null
  const listeners = new Set<() => void>()
  const set = (next: HTMLElement | null) => {
    if (next === target) return
    target = next
    for (const listener of listeners) listener()
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener)

    return () => listeners.delete(listener)
  }

  return {
    set,
    /** Clears the target only if `element` still holds it. */
    clear: (element: HTMLElement) => {
      if (target === element) set(null)
    },
    use: () =>
      useSyncExternalStore(
        subscribe,
        () => target,
        () => target,
      ),
  }
}

/**
 * Where the Tasks list renders. The right rail owns the element; the sidebar,
 * which already holds the task rows and their handlers, portals the list into
 * it. With no rail mounted the sidebar keeps Tasks as its own second page.
 */
const tasks = createSlot()

export const setDockTasksTarget = tasks.set
export const clearDockTasksTarget = tasks.clear
export const useDockTasksTarget = tasks.use

/**
 * Where today's mail renders: just under the task rows, inside the same
 * scrolling Today list. The task list owns this element; the rail, which
 * holds the workspace actions mail needs, portals the mail rows into it.
 */
const todayMail = createSlot()

export const setTodayMailTarget = todayMail.set
export const clearTodayMailTarget = todayMail.clear
export const useTodayMailTarget = todayMail.use
