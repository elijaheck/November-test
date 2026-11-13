import { clsx } from 'clsx'
import { Globe, Plus } from 'lucide-react'
import { useCallback, useRef } from 'react'

import { t } from '../../i18n'
import { workspaceTabDisplayMeta } from '../tabDisplayMeta'

import { clearDockTasksTarget, setDockTasksTarget } from './dockTasksSlot'

import type { WorkspaceController } from './useWorkspaceController'

/**
 * The right rail: the open browser and app tabs on top, the Tasks list below.
 * Picking a tab opens it in the dock beside the chat, where the live page runs.
 */
export function WorkspaceRightRail({ ws }: { ws: WorkspaceController }) {
  const {
    tabs,
    activeTabId,
    dockOpen,
    accounts,
    databaseConnectionsByTeam,
    workspaceActions,
    newTab,
    scope,
  } = ws
  const teamId = scope?.teamId
  // Split panes each mount a rail; a rail unmounting clears the target only if it held it.
  const held = useRef<HTMLDivElement | null>(null)
  const tasksRef = useCallback((element: HTMLDivElement | null) => {
    if (element) {
      held.current = element
      setDockTasksTarget(element)
    } else if (held.current) {
      clearDockTasksTarget(held.current)
      held.current = null
    }
  }, [])

  if (!teamId) return null
  const connections = databaseConnectionsByTeam[teamId] ?? []

  return (
    <aside
      aria-label={t('Tabs and tasks')}
      className="workspace-right-rail flex w-[280px] flex-shrink-0 flex-col border-l border-line-control/60 sidebar-surface"
    >
      <section className="flex max-h-[45%] min-h-0 flex-col pt-3">
        <header className="flex items-center px-3.5 pb-1.5">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-tertiary">
            {t('Tabs')}
          </h2>
          <button
            type="button"
            onClick={() => newTab()}
            title={t('New tab')}
            aria-label={t('New tab')}
            className="ml-auto flex size-7 items-center justify-center rounded-lg text-tertiary hover:bg-state-hover hover:text-main"
          >
            <Plus className="size-4" strokeWidth={1.8} />
          </button>
        </header>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-overlay">
          {tabs.length === 0 && (
            <li className="px-3 py-4 text-center text-[12px] text-tertiary">
              {t('No open tabs. Agents open pages here as they work.')}
            </li>
          )}
          {tabs.map((tab) => {
            const meta = workspaceTabDisplayMeta(tab, accounts, connections)
            const selected = dockOpen && tab.id === activeTabId

            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => {
                    workspaceActions.activateTab(tab.id)
                    workspaceActions.setDockOpen(true)
                  }}
                  aria-current={selected ? 'page' : undefined}
                  className={clsx(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px]',
                    selected
                      ? 'bg-state-selected text-main'
                      : 'text-secondary hover:bg-state-hover',
                  )}
                >
                  <span className="flex size-4 flex-shrink-0 items-center justify-center">
                    {meta.icon ?? <Globe className="size-3.5" strokeWidth={1.8} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{meta.title}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
      <section className="flex min-h-0 flex-1 flex-col border-t border-line-control/60">
        <div ref={tasksRef} className="flex min-h-0 flex-1 flex-col pt-2" />
      </section>
    </aside>
  )
}
