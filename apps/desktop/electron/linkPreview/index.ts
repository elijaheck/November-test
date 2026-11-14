import { isPreviewableUrl, parseLinkPreview } from './parse'

import type { LinkPreview } from './parse'

const MAX_BYTES = 512 * 1024
const TIMEOUT_MS = 6000
const MAX_REDIRECTS = 4
const cache = new Map<string, { at: number; preview: LinkPreview | null }>()
const CACHE_MS = 30 * 60 * 1000

async function readCapped(response: Response): Promise<string> {
  const reader = (response.body as ReadableStream<Uint8Array> | null)?.getReader()

  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let size = 0

  while (size < MAX_BYTES) {
    const { done, value } = await reader.read()

    if (done) break
    chunks.push(value)
    size += value.byteLength
  }
  await reader.cancel().catch(() => {})

  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, MAX_BYTES))
}

/** Redirects are followed by hand so each hop gets the same public-only check. */
async function fetchHtml(start: string): Promise<{ html: string; url: string } | null> {
  let url = start

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isPreviewableUrl(url)) return null
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'Mozilla/5.0 OpenBot' },
    })
    const location = response.headers.get('location')

    if (response.status >= 300 && response.status < 400 && location) {
      url = new URL(location, url).toString()
      continue
    }
    if (!response.ok || !(response.headers.get('content-type') ?? '').includes('html')) return null

    return { html: await readCapped(response), url }
  }

  return null
}

export async function getLinkPreview(url: string): Promise<LinkPreview | null> {
  const hit = cache.get(url)

  if (hit && Date.now() - hit.at < CACHE_MS) return hit.preview
  const page = await fetchHtml(url).catch(() => null)
  const preview = page ? parseLinkPreview(page.html, page.url) : null

  cache.set(url, { at: Date.now(), preview })

  return preview
}
