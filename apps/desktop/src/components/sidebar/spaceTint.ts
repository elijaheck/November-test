/**
 * Each Space (team) washes the glass panels in its own color, like a browser
 * profile. Known names get fixed colors; anything else gets a stable pick.
 * Values are RGB triples for the --glass-tint CSS variable.
 */
const NAMED: Record<string, string> = {
  personal: '64 120 255',
  ttg: '34 170 110',
  'trusted tech guy': '34 170 110',
  peptracked: '150 90 245',
  pep: '150 90 245',
}

const PALETTE = ['64 120 255', '34 170 110', '150 90 245', '235 120 50', '220 70 110', '40 160 190']

export function spaceTint(name: string): string {
  const key = name.trim().toLowerCase()
  const named = NAMED[key]

  if (named) return named
  let hash = 0

  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0

  return PALETTE[hash % PALETTE.length] ?? '64 120 255'
}
