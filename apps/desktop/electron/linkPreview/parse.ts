export type LinkPreview = {
  url: string
  site: string
  title: string
  summary: string
  image?: string
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
    }
    if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)))

    return ENTITIES[code.toLowerCase()] ?? whole
  })
}

function stripTags(text: string): string {
  return text
    .split('<')
    .map((part, index) => (index === 0 ? part : part.slice(part.indexOf('>') + 1)))
    .join(' ')
}

function clean(text: string | undefined, max: number): string {
  if (!text) return ''
  const flat = decodeEntities(stripTags(text)).replace(/\s+/g, ' ').trim()

  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}

function metaContent(html: string, names: string[]): string | undefined {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase()

    if (!key || !names.includes(key)) continue
    const content = /\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i.exec(tag)
    const value = content?.[1] ?? content?.[2]

    if (value?.trim()) return value
  }

  return undefined
}

/** The first paragraph long enough to say something, for pages with no description. */
function firstParagraph(html: string): string | undefined {
  const body = html.replace(/<(script|style|nav|header|footer)\b[\s\S]*?<\/\1>/gi, ' ')

  for (const match of body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = clean(match[1], 400)

    if (text.length >= 60) return text
  }

  return undefined
}

function absolute(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined
  try {
    const url = new URL(decodeEntities(href), base)

    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export function parseLinkPreview(html: string, url: string): LinkPreview {
  const host = new URL(url).hostname.replace(/^www\./, '')
  const title =
    metaContent(html, ['og:title', 'twitter:title']) ??
    /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]
  const summary =
    metaContent(html, ['og:description', 'twitter:description', 'description']) ??
    firstParagraph(html)
  const site = metaContent(html, ['og:site_name']) ?? host
  const image = absolute(metaContent(html, ['og:image', 'twitter:image']), url)

  return {
    url,
    site: clean(site, 60),
    title: clean(title, 140) || host,
    summary: clean(summary, 280),
    ...(image ? { image } : {}),
  }
}

const PRIVATE_NAME = /^(?:localhost|0\.0\.0\.0)$|\.(?:local|internal|localhost)$/i

/** Loopback, private, link-local and IPv6-literal hosts: the machine and its LAN. */
function isPrivateHost(host: string): boolean {
  if (host.startsWith('[') || PRIVATE_NAME.test(host)) return true
  const parts = host.split('.').map(Number)

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false
  const [a, b] = parts as [number, number, number, number]

  return (
    a === 127 ||
    a === 10 ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31)
  )
}

/** Only public http(s) pages are fetched, never the machine or its network. */
export function isPreviewableUrl(raw: string): boolean {
  try {
    const url = new URL(raw)

    return (url.protocol === 'https:' || url.protocol === 'http:') && !isPrivateHost(url.hostname)
  } catch {
    return false
  }
}
