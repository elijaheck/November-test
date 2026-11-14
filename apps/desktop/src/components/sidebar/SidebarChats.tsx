import { Download, Loader2, SquarePen } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { api } from '../../api'
import {
  clearTodayMailTarget,
  setTodayMailTarget,
  useDockTasksTarget,
} from '../../app/workspace/dockTasksSlot'
import { selectIMessageChat, useSelectedIMessageChat } from '../../app/workspace/imessageSelection'
import { useIMessageChats } from '../../app/workspace/useIMessageChats'
import { t } from '../../i18n'
import { BotImportDialog } from '../channels/BotImportDialog'
import { toast } from '../ui/toast'

import { imessageItems, mergeByActivity } from './imessageItems'
import { SidebarPageList } from './SidebarPageList'
import { SidebarTeamPages } from './SidebarTeamPages'

import type { SidebarSectionList } from './sections-list'
import type { SidebarPage } from './swipe-gesture'
import type { Section } from './types'
import type { ComponentProps, UIEventHandler } from 'react'

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
      className="flex size-7 items-center justify-center rounded-lg text-tertiary hover:bg-state-hover hover:text-main disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
      ) : (
        <SquarePen className="size-4" strokeWidth={1.8} />
      )}
    </button>
  )
}

/** Bring Bots in from a Grok Bot export (.zip): roles, skills, memories, files. */
function ImportBotsButton({
  teamId,
  onSelect,
}: {
  teamId: string
  onSelect: (key: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        title={t('Import Bots')}
        aria-label={t('Import Bots')}
        onClick={() => setOpen(true)}
        className="flex size-7 items-center justify-center rounded-lg text-tertiary hover:bg-state-hover hover:text-main"
      >
        <Download className="size-4" strokeWidth={1.8} />
      </button>
      {open && (
        <BotImportDialog
          teamId={teamId}
          onClose={() => setOpen(false)}
          onOpen={(sessionId) => onSelect(`agent-session:${sessionId}`)}
        />
      )}
    </>
  )
}

/** The element today's mail portals into, under the task rows. */
function TodayMailSlot() {
  const held = useRef<HTMLDivElement | null>(null)
  const ref = useCallback((element: HTMLDivElement | null) => {
    if (element) {
      held.current = element
      setTodayMailTarget(element)
    } else if (held.current) {
      clearTodayMailTarget(held.current)
      held.current = null
    }
  }, [])

  return <div ref={ref} />
}

/**
 * The team sidebar: one list of conversations, people and Bots together,
 * newest first. Tasks move to the right rail when one is mounted; without it,
 * this falls back to the Bots/Tasks pages.
 */
export function SidebarChats({
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
  const imessages = useIMessageChats()
  const openIMessage = useSelectedIMessageChat()

  if (!tasksTarget) {
    return <SidebarTeamPages {...{ page, onPage, sections, listProps, onScroll }} />
  }
  // Picking any bot, task or page leaves the iMessage conversation.
  const select = (key: string) => {
    selectIMessageChat(null)
    listProps.onSelect(key)
  }
  const people = imessageItems(imessages.data, openIMessage, selectIMessageChat, () => {
    void api.imessageOpenAccessSettings()
  })
  const withPeople = sections.map((section) =>
    section.title === 'Channels'
      ? {
          ...section,
          items: mergeByActivity(
            openIMessage
              ? section.items.map((item) => ({ ...item, active: false }))
              : section.items,
            people,
          ),
        }
      : section,
  )
  const list = { sections, listProps: { ...listProps, onSelect: select }, onScroll }
  // The section's own action is New Bot; New message sits beside it.
  const newBot = sections.find((section) => section.title === 'Channels')?.action

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SidebarPageList
        {...list}
        sections={withPeople}
        page={0}
        title={t('Chats')}
        action={
          <div className="ml-auto flex items-center gap-1">
            <NewMessageButton teamId={listProps.scope.teamId} onSelect={select} />
            <ImportBotsButton teamId={listProps.scope.teamId} onSelect={select} />
            {newBot}
          </div>
        }
        emptyText={t('No chats yet. Message a teammate or make a Bot.')}
      />
      {createPortal(
        <SidebarPageList page={1} title={t('Today')} after={<TodayMailSlot />} {...list} />,
        tasksTarget,
      )}
    </div>
  )
}
