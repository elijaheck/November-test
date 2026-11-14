import { useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

import { t } from '../../i18n'

import { clearDockTasksTarget, setDockTasksTarget, useTodayMailTarget } from './dockTasksSlot'
import { RailBrowser } from './RailBrowser'
import { TodayMail } from './TodayMail'

import type { WorkspaceController } from './useWorkspaceController'

/**
 * The right rail: open browser and app tabs on top, then one Today list where
 * tasks and today's mail sit together. Picking a tab opens it in the dock
 * beside the chat, where the live page runs.
 */
export function WorkspaceRightRail({ ws }: { ws: WorkspaceController }) {
  const teamId = ws.scope?.teamId
  const mailTarget = useTodayMailTarget()
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

  return (
    <aside
      aria-label={t('Tabs and tasks')}
      className="workspace-right-rail flex w-[300px] flex-shrink-0 flex-col border-l border-line-control/60 sidebar-surface"
    >
      <RailBrowser ws={ws} teamId={teamId} />
      <section className="flex min-h-0 flex-1 flex-col border-t border-line-control/60">
        <div ref={tasksRef} className="flex min-h-0 flex-1 flex-col pt-2" />
      </section>
      {mailTarget && createPortal(<TodayMail ws={ws} />, mailTarget)}
    </aside>
  )
}
