import clsx from 'clsx'
import { Loader2, SquarePen } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

import { api } from '../../api'
import { useDockTasksTarget } from '../../app/workspace/dockTasksSlot'
import { t } from '../../i18n'
import { toast } from '../ui/toast'

import { SidebarPageList } from './SidebarPageList'
import { SidebarTeamPages } from './SidebarTeamPages'

import type { SidebarSectionList } from './sections-list'
import type { SidebarPage } from './swipe-gesture'
import type { Item, Section } from './types'
import type { ComponentProps, UIEventHandler } from 'react'

type Filter = 'all' | 'messages' | 'bots'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: t('All') },
  { id: 'messages', label: t('Messages') },
  { id: 'bots', label: t('Bots') },
]

/** A conversation people share (a channel), as opposed to a one-on-one chat with a Bot. */
const isMessage = (item: Item) => Boolean(item.channel) && !item.bot
const isBot = (item: Item) => !isMessage(item)

function NewMessageButton({
  teamId,
  onSelect,
}: {
  teamId: string
  onSelect: (key: string) => void
}) {
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      title={t('New message')}
      aria-label={t('New message')}
      disabled={busy}
      onClick={() => {
        setBusy(true)
        api
          .agentCreateChannel(teamId)
          .then(({ sessionId }) => onSelect(`agent-session:${sessionId}`))
          .catch((err: unknown) => toast.apiError(t('Couldn’t start a conversation'), err))
          .finally(() => setBusy(false))
      }}
      className="ml-auto flex size-7 items-center justify-center rounded-lg text-tertiary hover:bg-state-hover hover:text-main disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
      ) : (
        <SquarePen className="size-4" strokeWidth={1.8} />
      )}
    </button>
  )
}

/**
 * The team sidebar: Messages (conversations with people) above Bots. Tasks move
 * to the right rail when one is mounted; without it, this falls back to the
 * Bots/Tasks pages.
 */
export function SidebarMessagesBots({
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

  if (!tasksTarget) {
    return <SidebarTeamPages {...{ page, onPage, sections, listProps, onScroll }} />
  }
  const showMessages = filter !== 'bots'
  const showBots = filter !== 'messages'
  const list = { sections, listProps, onScroll }

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
      {showMessages && (
        <div className={clsx('flex min-h-0 flex-col', showBots ? 'max-h-[45%]' : 'flex-1')}>
          <SidebarPageList
            page={0}
            title={t('Messages')}
            itemFilter={isMessage}
            action={
              <NewMessageButton teamId={listProps.scope.teamId} onSelect={listProps.onSelect} />
            }
            emptyText={t('No messages yet. Start one and invite a teammate.')}
            {...list}
          />
        </div>
      )}
      {showBots && (
        <div className="flex min-h-0 flex-1 flex-col">
          <SidebarPageList page={0} title={t('Bots')} itemFilter={isBot} {...list} />
        </div>
      )}
      {createPortal(<SidebarPageList page={1} {...list} />, tasksTarget)}
    </div>
  )
}
