/** Sites pinned as tiles above the tab list, Arc-style. */
export const RAIL_PINS: { label: string; domain: string; url: string }[] = [
  { label: 'YouTube', domain: 'youtube.com', url: 'https://www.youtube.com/' },
  { label: 'Grok', domain: 'grok.com', url: 'https://grok.com/' },
  { label: 'X', domain: 'x.com', url: 'https://x.com/home' },
]

const HOST_LIKE = /^[\w-]+(\.[\w-]+)+(:\d+)?([/?#]\S*)?$/
const LOCALHOST = /^(localhost|127\.0\.0\.1)(:\d+)?([/?#]\S*)?$/i

/**
 * What the address bar opens for what was typed: a URL as-is, a bare host
 * with https, localhost with http, and anything else as a web search.
 */
export function addressToUrl(input: string): string | null {
  const text = input.trim()

  if (text === '') return null
  if (/^https?:\/\//i.test(text)) return text
  if (LOCALHOST.test(text)) return `http://${text}`
  if (HOST_LIKE.test(text)) return `https://${text}`

  return `https://www.google.com/search?q=${encodeURIComponent(text)}`
}

/** "grok.com/" for https://grok.com/ — the scheme and a leading www. dropped. */
export function displayAddress(url: string | undefined): string {
  if (!url) return ''

  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
}

export function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
}
