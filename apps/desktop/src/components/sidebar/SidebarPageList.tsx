import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { useRef } from 'react'

import { t } from '../../i18n'

import { unpinnedChatItems } from './chat-sections'
import { AddProjectButton } from './project-actions'
import { SidebarSectionList } from './sections-list'
import { SidebarArchiveSection } from './SidebarArchiveSection'
import { SidebarBotPins } from './SidebarBotPins'
import { SidebarSectionHeading } from './SidebarSectionHeading'
import { taskPageSections } from './task-page-sections'
import { useTaskReflow } from './useTaskReflow'

import type { Item, Section } from './types'
import type { ComponentProps, ReactNode, UIEventHandler } from 'react'

export function SidebarPageList({
  page,
  sections: allSections,
  listProps,
  onScroll,
  title,
  itemFilter,
  action,
  emptyText,
  after,
}: {
  page: 0 | 1
  /** Overrides the page heading (Channels / Tasks). */
  title?: string
  /** Page 0 only: keeps just these rows (Messages vs Bots). */
  itemFilter?: (item: Item) => boolean
  /** Replaces the heading's own action button. */
  action?: ReactNode
  emptyText?: string
  /** Page 1 only: rendered under the task rows, inside the same scroll. */
  after?: ReactNode
  sections: Section[]
  listProps: Omit<ComponentProps<typeof SidebarSectionList>, 'sections'>
  onScroll: UIEventHandler<HTMLElement>
}) {
  const taskList = useRef<HTMLElement | null>(null)

  useTaskReflow(taskList)
  const sections =
    itemFilter && page === 0
      ? allSections.map((section) =>
          section.title === 'Channels' || section.title === 'Favorites'
            ? { ...section, items: section.items.filter(itemFilter) }
            : section,
        )
      : allSections
  const source = sections.filter((section) =>
    page === 0 ? section.title === 'Channels' : section.title === 'Tasks',
  )
  const shown =
    page === 1
      ? taskPageSections(source.flatMap((section) => section.items))
      : sections.filter((section) => section.title === 'Channels' || section.title === 'Favorites')
  const pinned = (item: Item) => Boolean(listProps.favoriteMatch(item))
  const visible = shown
    .filter((section) => section.title !== 'Tasks' || section.items.length > 0 || section.loading)
    .map((section) => ({
      ...section,
      ...(section.title === 'Tasks' || section.title === 'Channels' ? { title: undefined } : {}),
      ...(section.title === 'Channels' && {
        items: unpinnedChatItems(section.items, pinned),
      }),
    }))
  const empty =
    source.every((section) => !section.loading) &&
    shown.every((section) => section.items.length === 0)
  const props = {
    ...listProps,
    isGroupCollapsed: (section: Pick<Section, 'title' | 'defaultCollapsed'>) =>
      section.title === 'Tasks' || section.title === 'Channels'
        ? false
        : listProps.isGroupCollapsed(section),
  }
  const list = <SidebarSectionList {...props} sections={visible} />

  const heading: Section = {
    title: title ?? (page === 0 ? 'Channels' : 'Tasks'),
    items: [],
    nonCollapsible: true,
  }

  return (
    <div className="sidebar-page-layout flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center px-2.5 pb-1">
        <SidebarSectionHeading section={heading} collapsed={false} toggle={() => {}} />
        {action ??
          (page === 0 ? (
            source[0]?.action
          ) : (
            <div className="ml-auto flex items-center gap-1">
              <AddProjectButton teamId={listProps.scope.teamId} />
              <button
                title={t('New task')}
                aria-label={t('New task')}
                onClick={() => listProps.onSelect('team.agent')}
                className="flex size-7 items-center justify-center rounded-lg text-tertiary hover:bg-state-hover hover:text-main"
              >
                <Plus className="size-4" strokeWidth={1.8} />
              </button>
            </div>
          ))}
      </div>
      <nav
        ref={taskList}
        onScroll={onScroll}
        className={clsx(
          'px-2.5 pb-2',
          'flex flex-col',
          'sidebar-page-list min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-overlay',
        )}
      >
        {page === 0 ? (
          <SidebarBotPins
            bots={source.flatMap((section) => section.items)}
            order={listProps.botPins?.order}
            onPlace={listProps.botPins?.place}
            pinned={pinned}
            toggle={listProps.toggleFavorite}
            onSelect={listProps.onSelect}
            teamId={listProps.scope.teamId}
          >
            {source.every((section) => !section.loading && section.items.length === 0) ? (
              <p className="px-3 py-6 text-center text-[12px] text-tertiary">
                {emptyText ?? t('No Bots yet')}
              </p>
            ) : (
              list
            )}
          </SidebarBotPins>
        ) : (
          <div className="shrink-0">
            {empty ? (
              <p
                className={clsx(
                  'px-3 text-center text-[12px] text-tertiary',
                  after ? 'py-2' : 'py-6',
                )}
              >
                {t('No tasks yet')}
              </p>
            ) : (
              list
            )}
            {after}
          </div>
        )}
      </nav>
      {page === 1 && (
        <div className="shrink-0 px-2.5 pb-1">
          <SidebarArchiveSection listProps={listProps} />
        </div>
      )}
    </div>
  )
}
