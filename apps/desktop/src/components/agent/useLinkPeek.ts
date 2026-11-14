import { useEffect, useRef, useState } from 'react'

import type { MouseEvent } from 'react'

const HOVER_MS = 550
const HOLD_MS = 420

/**
 * Hover a web link to see its preview card; press and hold to peek the page in
 * the dock. A hold swallows the click that follows, so it never also opens.
 */
export function useLinkPeek(link: string | undefined, peek: ((href: string) => void) | undefined) {
  const enabled = Boolean(link && /^https?:\/\//i.test(link))
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const hover = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const held = useRef(false)

  useEffect(
    () => () => {
      clearTimeout(hover.current)
      clearTimeout(hold.current)
    },
    [],
  )

  const leave = () => {
    clearTimeout(hover.current)
    clearTimeout(hold.current)
    setAnchor(null)
  }

  return {
    anchor: enabled ? anchor : null,
    handlers: enabled
      ? {
          onMouseEnter: (event: MouseEvent<HTMLAnchorElement>) => {
            const target = event.currentTarget

            hover.current = setTimeout(() => setAnchor(target.getBoundingClientRect()), HOVER_MS)
          },
          onMouseLeave: leave,
          onMouseDown: (event: MouseEvent<HTMLAnchorElement>) => {
            held.current = false
            if (event.button !== 0 || !peek || !link) return
            hold.current = setTimeout(() => {
              held.current = true
              setAnchor(null)
              peek(link)
            }, HOLD_MS)
          },
          onMouseUp: () => clearTimeout(hold.current),
          // The click that ends a hold already peeked, so it stops here.
          onClickCapture: (event: MouseEvent<HTMLAnchorElement>) => {
            if (!held.current) return
            held.current = false
            event.preventDefault()
            event.stopPropagation()
          },
        }
      : {},
  }
}
