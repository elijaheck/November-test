import { useQuery } from '@tanstack/react-query'
import { Globe } from 'lucide-react'
import { createPortal } from 'react-dom'

import { api } from '../../api'
import { t } from '../../i18n'

const CARD_WIDTH = 320

/** The hover card for a web link: the page's own title, summary and image. */
export function LinkPreviewCard({ url, anchor }: { url: string; anchor: DOMRect }) {
  const preview = useQuery({
    queryKey: ['link-preview', url],
    queryFn: () => api.linkPreview(url),
    staleTime: 30 * 60 * 1000,
  })
  const below = anchor.bottom + 8 + 220 < window.innerHeight
  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - CARD_WIDTH - 8))
  const data = preview.data

  if (preview.isSuccess && !data) return null

  return createPortal(
    <div
      role="tooltip"
      style={{
        left,
        width: CARD_WIDTH,
        ...(below ? { top: anchor.bottom + 8 } : { bottom: window.innerHeight - anchor.top + 8 }),
      }}
      className="pointer-events-none fixed z-50 overflow-hidden rounded-xl border border-line-control/70 bg-elevated text-[12.5px] shadow-lg"
    >
      {data?.image && (
        <img
          src={data.image}
          alt=""
          className="h-28 w-full object-cover"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="flex flex-col gap-1 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-tertiary">
          <Globe className="size-3" strokeWidth={1.8} />
          <span className="truncate">{data?.site ?? new URL(url).hostname}</span>
        </div>
        {data ? (
          <>
            <div className="line-clamp-2 font-medium text-main">{data.title}</div>
            {data.summary && <p className="line-clamp-4 text-secondary">{data.summary}</p>}
          </>
        ) : (
          <div className="text-tertiary">{t('Loading preview…')}</div>
        )}
        <div className="pt-1 text-[11px] text-tertiary">{t('Hold to peek')}</div>
      </div>
    </div>,
    document.body,
  )
}
