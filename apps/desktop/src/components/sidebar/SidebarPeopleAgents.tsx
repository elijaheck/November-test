import clsx from 'clsx'
import { useState } from 'react'
import { createPortal } from 'react-dom'

import { useDockTasksTarget } from '../../app/workspace/dockTasksSlot'
import { t } from '../../i18n'
import { memberDisplayName, useTeamMembers } from '../../lib/bindingAccess'
import { Avatar } from '../Avatar'

import { SidebarPageList } from './SidebarPageList'
import { SidebarTeamPages } from './SidebarTeamPages'

import type { SidebarSectionList } from './sections-list'
import type { SidebarPage } from './swipe-gesture'
import type { Section } from './types'
import type { ComponentProps, UIEventHandler } from 'react'

type Filter = 'all' | 'people' | 'agents'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: t('All') },
  { id: 'people', label: t('People') },
  { id: 'agents', label: t('Agents') },
]

/**
 * The team sidebar with people and agents side by side. Tasks move to the right
 * rail when one is mounted; without it, this falls back to the Bots/Tasks pages.
 */
export function SidebarPeopleAgents({
  page,
  onPage,
  sections,
  listProps,
  onScroll,
}: {
  page: SidebarPage
  onPage: (page: SidebarPage) => void
  sections: Section[]
  listProps: Omit<ComponentProps<typeof SidebarSectionList>, 'sections'>
  onScroll: UIEventHandler<HTMLElement>
}) {
  const tasksTarget = useDockTasksTarget()
  const [filter, setFilter] = useState<Filter>('all')
  const teamId = listProps.scope.teamId
  const members = useTeamMembers(teamId).filter((member) => !member.removedAt)

  if (!tasksTarget) {
    return <SidebarTeamPages {...{ page, onPage, sections, listProps, onScroll }} />
  }
  const showPeople = filter !== 'agents'
  const showAgents = filter !== 'people'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label={t('Show')} className="flex gap-1 px-2.5 pb-2 pt-1">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className={clsx(
              'h-7 flex-1 rounded-lg text-[12px] font-medium transition-colors',
              filter === id
                ? 'bg-state-selected text-main'
                : 'text-tertiary hover:bg-state-hover hover:text-main',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {showPeople && (
        <section
          aria-label={t('People')}
          className={clsx('px-2.5', showAgents ? 'max-h-[40%] shrink-0' : 'min-h-0 flex-1')}
        >
          <h2 className="px-1.5 pb-1 text-[12px] font-semibold text-tertiary">{t('People')}</h2>
          <ul className="max-h-full overflow-y-auto pb-2 scrollbar-thin scrollbar-overlay">
            {members.length === 0 && (
              <li className="px-3 py-3 text-center text-[12px] text-tertiary">
                {t('Invite teammates to work with your agents.')}
              </li>
            )}
            {members.map((member) => {
              const name = memberDisplayName(member)

              return (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => listProps.onSelect('team.members')}
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[13px] text-secondary hover:bg-state-hover hover:text-main"
                  >
                    <Avatar src={member.avatarURL} name={name} size={22} className="rounded-full" />
                    <span className="min-w-0 flex-1 truncate">{name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      {showAgents && (
        <div className="flex min-h-0 flex-1 flex-col">
          <SidebarPageList
            page={0}
            title={t('Agents')}
            sections={sections}
            listProps={listProps}
            onScroll={onScroll}
          />
        </div>
      )}
      {createPortal(
        <SidebarPageList page={1} sections={sections} listProps={listProps} onScroll={onScroll} />,
        tasksTarget,
      )}
    </div>
  )
}
