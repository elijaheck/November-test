import { clsx } from 'clsx'
import { ArrowDown, Globe, Link2, Plus, X } from 'lucide-react'
import { useState } from 'react'

import { InputGroup, InputGroupInput } from '../../components/ui/input-group'
import { toast } from '../../components/ui/toast'
import { t } from '../../i18n'
import { workspaceTabDisplayMeta } from '../tabDisplayMeta'

import { RAIL_PINS, addressToUrl, displayAddress, faviconUrl } from './railAddress'

import type { WorkspaceController } from './useWorkspaceController'
import type { SyntheticEvent } from 'react'

function PinTile({ pin, onOpen }: { pin: (typeof RAIL_PINS)[number]; onOpen: () => void }) {
  const [broken, setBroken] = useState(false)

  return (
    <button
      type="button"
      onClick={onOpen}
      title={pin.label}
      aria-label={pin.label}
      className="flex h-11 flex-1 items-center justify-center rounded-xl border border-line-control/70 bg-surface hover:bg-state-hover"
    >
      {broken ? (
        <span className="text-[14px] font-semibold text-secondary">{pin.label[0]}</span>
      ) : (
        <img
          src={faviconUrl(pin.domain)}
          alt=""
          className="size-5 rounded"
          onError={() => setBroken(true)}
        />
      )}
    </button>
  )
}

/**
 * The browser half of the right rail, Arc-style: an address bar for the
 * current page, pinned sites, then the open tabs with Clear and New Tab.
 * Every page opens in the dock beside the chat.
 */
export function RailBrowser({ ws, teamId }: { ws: WorkspaceController; teamId: string }) {
  const { tabs, activeTabId, dockOpen, accounts, databaseConnectionsByTeam, workspaceActions } = ws
  const connections = databaseConnectionsByTeam[teamId] ?? []
  const active = tabs.find((tab) => tab.id === activeTabId)
  const activeUrl = active?.active === 'team.browser' ? active.browserUrl : undefined
  const [draft, setDraft] = useState(displayAddress(activeUrl))
  const webTabs = tabs.filter((tab) => tab.active === 'team.browser')

  // The bar follows the page: a different active URL replaces whatever was typed.
  const [shownUrl, setShownUrl] = useState(activeUrl)

  if (shownUrl !== activeUrl) {
    setShownUrl(activeUrl)
    setDraft(displayAddress(activeUrl))
  }

  const open = (url: string) => ws.chatLinkMenuActions.openInApp(url)
  const submit = (event: SyntheticEvent) => {
    event.preventDefault()
    const url = addressToUrl(draft)

    if (url) open(url)
  }
  const copy = () => {
    if (!activeUrl) return
    navigator.clipboard
      .writeText(activeUrl)
      .then(() => toast.success(t('Link copied')))
      .catch((err: unknown) => console.warn('[rail] copy failed', err))
  }

  return (
    <section className="flex max-h-[50%] min-h-0 flex-col gap-2.5 px-2.5 pt-3">
      <form onSubmit={submit} className="shrink-0">
        <InputGroup className="flex h-10 items-center gap-1 rounded-xl border border-line-control/70 bg-surface pl-3 pr-1">
          <InputGroupInput
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onFocus={(event) => event.target.select()}
            placeholder={t('Search or enter address')}
            aria-label={t('Search or enter address')}
            spellCheck={false}
            className="text-[13px] text-main placeholder:text-tertiary"
          />
          {activeUrl && (
            <button
              type="button"
              onClick={copy}
              title={t('Copy link')}
              aria-label={t('Copy link')}
              className="flex size-7 items-center justify-center rounded-lg text-tertiary hover:bg-state-hover hover:text-main"
            >
              <Link2 className="size-4" strokeWidth={1.8} />
            </button>
          )}
        </InputGroup>
      </form>
      <div className="flex shrink-0 gap-2">
        {RAIL_PINS.map((pin) => (
          <PinTile key={pin.domain} pin={pin} onOpen={() => open(pin.url)} />
        ))}
      </div>
      <header className="flex shrink-0 items-center px-1 pt-1">
        <h2 className="text-[13px] font-medium text-tertiary">{t('Tabs')}</h2>
        {webTabs.length > 0 && (
          <button
            type="button"
            onClick={() => webTabs.forEach((tab) => ws.closeTab(tab.id))}
            title={t('Close web tabs')}
            className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-tertiary hover:bg-state-hover hover:text-main"
          >
            <ArrowDown className="size-3.5" strokeWidth={1.8} />
            {t('Clear')}
          </button>
        )}
      </header>
      <ul className="min-h-0 flex-1 overflow-y-auto pb-2 scrollbar-thin scrollbar-overlay">
        {tabs.map((tab) => {
          const meta = workspaceTabDisplayMeta(tab, accounts, connections)
          const selected = dockOpen && tab.id === activeTabId

          return (
            <li key={tab.id} className="group relative">
              <button
                type="button"
                onClick={() => {
                  workspaceActions.activateTab(tab.id)
                  workspaceActions.setDockOpen(true)
                }}
                aria-current={selected ? 'page' : undefined}
                className={clsx(
                  'flex w-full items-center gap-2 rounded-lg py-1.5 pl-2 pr-8 text-left text-[13px]',
                  selected ? 'bg-state-selected text-main' : 'text-secondary hover:bg-state-hover',
                )}
              >
                <span className="flex size-4 flex-shrink-0 items-center justify-center">
                  {meta.icon ?? <Globe className="size-3.5" strokeWidth={1.8} />}
                </span>
                <span className="min-w-0 flex-1 truncate">{meta.title}</span>
              </button>
              <button
                type="button"
                onClick={() => ws.closeTab(tab.id)}
                title={t('Close tab')}
                aria-label={t('Close tab')}
                className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-tertiary opacity-0 hover:bg-state-hover hover:text-main focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X className="size-3.5" strokeWidth={1.8} />
              </button>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={() => ws.newTab()}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-tertiary hover:bg-state-hover hover:text-main"
          >
            <Plus className="size-4" strokeWidth={1.8} />
            {t('New Tab')}
          </button>
        </li>
      </ul>
    </section>
  )
}
