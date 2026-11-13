import { readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { handleKey } from './decode'
import { queryRows } from './sqlite'

const ROOT = join(homedir(), 'Library', 'Application Support', 'AddressBook')
const TTL_MS = 5 * 60_000
let cache: { at: number; names: Map<string, string> } | null = null

type Row = { first: string | null; last: string | null; org: string | null; value: string | null }

const SQL = `
SELECT r.ZFIRSTNAME AS first, r.ZLASTNAME AS last, r.ZORGANIZATION AS org, p.ZFULLNUMBER AS value
  FROM ZABCDRECORD r JOIN ZABCDPHONENUMBER p ON p.ZOWNER = r.Z_PK
UNION ALL
SELECT r.ZFIRSTNAME, r.ZLASTNAME, r.ZORGANIZATION, e.ZADDRESS
  FROM ZABCDRECORD r JOIN ZABCDEMAILADDRESS e ON e.ZOWNER = r.Z_PK`

async function databases(): Promise<string[]> {
  const found = [join(ROOT, 'AddressBook-v22.abcddb')]

  try {
    for (const source of await readdir(join(ROOT, 'Sources'))) {
      found.push(join(ROOT, 'Sources', source, 'AddressBook-v22.abcddb'))
    }
  } catch {
    // No synced sources; the local book alone is fine.
  }

  return found
}

/**
 * Phone/email → display name from the Mac's Contacts databases. Read locally
 * and cached in memory; nothing leaves the machine. Missing books are skipped.
 */
export async function contactNames(): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.names
  const names = new Map<string, string>()

  for (const db of await databases()) {
    const rows = await queryRows<Row>(db, SQL).catch(() => [] as Row[])

    for (const row of rows) {
      if (!row.value) continue
      const name = [row.first, row.last].filter(Boolean).join(' ').trim() || row.org?.trim()

      if (name) names.set(handleKey(row.value), name)
    }
  }
  cache = { at: Date.now(), names }

  return names
}
