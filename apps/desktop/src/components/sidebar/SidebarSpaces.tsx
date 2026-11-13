import { clsx } from 'clsx'
import { useEffect } from 'react'

import { t } from '../../i18n'

import { spaceTint } from './spaceTint'

import type { BreadcrumbOption } from '../toolbar-types'
import type { CSSProperties } from 'react'

/**
 * Spaces: each team is a Space with its own bots, chats, tabs and tasks.
 * Pills switch between them, ⌃1–⌃9 jumps straight to one, and the selected
 * Space tints the glass panels.
 */
export function SidebarSpaces({ options }: { options: BreadcrumbOption[] }) {
  const selected = options.find((option) => option.selected)

  useEffect(() => {
    if (!selected) return
    document.documentElement.style.setProperty('--glass-tint', spaceTint(selected.label))
  }, [selected])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
      const index = Number(event.key) - 1

      if (!Number.isInteger(index) || index < 0) return
      const target = options[index]

      if (!target) return
      event.preventDefault()
      if (!target.selected) target.onPick()
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [options])

  if (options.length < 2) return null

  return (
    <div
      role="tablist"
      aria-label={t('Spaces')}
      className="titlebar-no-drag flex gap-1 px-2.5 pb-2"
    >
      {options.map((option, index) => (
        <button
          key={option.key}
          type="button"
          role="tab"
          aria-selected={Boolean(option.selected)}
          title={`${option.label} · ⌃${String(index + 1)}`}
          onClick={() => {
            if (!option.selected) option.onPick()
          }}
          style={{ '--space': spaceTint(option.label) } as CSSProperties}
          className={clsx(
            'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[12px] transition-colors',
            option.selected
              ? 'bg-[rgba(var(--space),0.18)] font-medium text-main'
              : 'text-tertiary hover:bg-state-hover hover:text-secondary',
          )}
        >
          <span
            aria-hidden
            className="size-1.5 flex-shrink-0 rounded-full bg-[rgb(var(--space))]"
          />
          <span className="truncate">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
