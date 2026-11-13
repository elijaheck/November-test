import { useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { ArrowUp, Paperclip, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { api } from '../../api'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/ui/button'
import { InputGroup, inputGroupControlClass } from '../../components/ui/input-group'
import { toast } from '../../components/ui/toast'
import { t } from '../../i18n'

import { selectIMessageChat } from './imessageSelection'
import { IMESSAGE_CHATS_KEY, useIMessageChats, useIMessages } from './useIMessageChats'

import type { IMessage } from '../../types/imessage'
import type { KeyboardEvent } from 'react'

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function Bubble({ message, showSender }: { message: IMessage; showSender: boolean }) {
  return (
    <div className={clsx('flex flex-col', message.fromMe ? 'items-end' : 'items-start')}>
      {showSender && (
        <span className="px-3 pb-0.5 text-[11px] text-tertiary">{message.sender}</span>
      )}
      <div
        title={clock(message.at)}
        className={clsx(
          'max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] leading-snug',
          message.fromMe ? 'bg-action-primary text-inverse' : 'bg-surface-sunken text-main',
        )}
      >
        {message.text ||
          (message.hasAttachment ? (
            <span className="inline-flex items-center gap-1.5 opacity-80">
              <Paperclip className="size-3.5" strokeWidth={1.8} />
              {t('Attachment')}
            </span>
          ) : (
            '…'
          ))}
      </div>
    </div>
  )
}

/**
 * One Messages conversation from the Mac, in place of the bot chat. It reads
 * chat.db every few seconds and sends through Messages.app as the user.
 */
export function IMessageConversation({ guid }: { guid: string }) {
  const chats = useIMessageChats()
  const messages = useIMessages(guid)
  const client = useQueryClient()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const end = useRef<HTMLDivElement | null>(null)
  const chat =
    chats.data?.status === 'ok' ? chats.data.data.find((c) => c.guid === guid) : undefined
  const rows = messages.data?.status === 'ok' ? messages.data.data : []
  const newest = rows.at(-1)?.id

  // Block body on purpose: newer Chromium returns a Promise from scrollIntoView,
  // and an effect that returns a non-function crashes React on unmount.
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [newest])

  const send = async () => {
    const text = draft.trim()

    if (!text || sending) return
    setSending(true)
    try {
      await api.imessageSend(guid, text, chat && !chat.group ? chat.handles[0] : undefined)
      setDraft('')
      await Promise.all([
        messages.refetch(),
        client.invalidateQueries({ queryKey: IMESSAGE_CHATS_KEY }),
      ])
    } catch (err) {
      toast.apiError(t('Couldn’t send that iMessage'), err, {
        fallback: t('Allow OpenBot to control Messages in System Settings, then try again.'),
      })
    } finally {
      setSending(false)
    }
  }
  const onKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <section
      aria-label={chat?.name ?? t('Messages')}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-line-control/60 px-4">
        <Avatar name={chat?.name ?? '?'} size={26} className="rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium text-main">{chat?.name ?? ''}</div>
          <div className="truncate text-[11.5px] text-tertiary">
            {chat?.group ? chat.handles.join(', ') : (chat?.handles[0] ?? '')} · iMessage
          </div>
        </div>
        <button
          type="button"
          onClick={() => selectIMessageChat(null)}
          title={t('Close')}
          aria-label={t('Close')}
          className="flex size-7 items-center justify-center rounded-lg text-tertiary hover:bg-state-hover hover:text-main"
        >
          <X className="size-4" strokeWidth={1.8} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        {messages.data?.status === 'no_access' && (
          <div className="mx-auto max-w-sm py-10 text-center text-[13px] text-secondary">
            <p className="pb-3">
              {t('macOS needs to let OpenBot read Messages. Turn it on under Full Disk Access.')}
            </p>
            <Button variant="secondary" onClick={() => void api.imessageOpenAccessSettings()}>
              {t('Open System Settings')}
            </Button>
          </div>
        )}
        <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
          {rows.map((message, index) => {
            const previous = rows[index - 1]
            const newDay = !previous || dayLabel(previous.at) !== dayLabel(message.at)
            const showSender =
              Boolean(chat?.group) &&
              !message.fromMe &&
              (newDay || previous?.fromMe || previous?.sender !== message.sender)

            return (
              <div key={message.id} className="flex flex-col gap-1.5">
                {newDay && (
                  <div className="py-2 text-center text-[11px] text-tertiary">
                    {dayLabel(message.at)} {clock(message.at)}
                  </div>
                )}
                <Bubble message={message} showSender={showSender} />
              </div>
            )
          })}
          <div ref={end} />
        </div>
      </div>
      <div className="shrink-0 px-4 pb-4">
        <InputGroup className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-line-control bg-surface py-1.5 pl-3.5 pr-1.5">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder={t('iMessage')}
            aria-label={t('Message')}
            className={clsx(
              inputGroupControlClass,
              'max-h-36 min-h-[22px] flex-1 resize-none py-1 text-[14px] text-main placeholder:text-tertiary',
            )}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || draft.trim() === ''}
            aria-label={t('Send')}
            className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-action-primary text-inverse disabled:opacity-40"
          >
            <ArrowUp className="size-4" strokeWidth={2} />
          </button>
        </InputGroup>
      </div>
    </section>
  )
}
