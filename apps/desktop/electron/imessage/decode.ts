// Pure helpers for reading Messages' chat.db rows. No I/O, so they test on any OS.

/** chat.db stores times as nanoseconds (or seconds, before macOS 10.13) since 2001-01-01. */
const APPLE_EPOCH_MS = Date.UTC(2001, 0, 1)

export function appleDateToIso(value: number | string | null | undefined): string {
  const raw = Number(value ?? 0)

  if (!Number.isFinite(raw) || raw === 0) return new Date(APPLE_EPOCH_MS).toISOString()
  const seconds = raw > 1e12 ? raw / 1e9 : raw

  return new Date(APPLE_EPOCH_MS + seconds * 1000).toISOString()
}

/**
 * Newer macOS leaves `message.text` empty and keeps the text in
 * `attributedBody`, an NSArchiver typedstream. The string follows the
 * "NSString" class name: five marker bytes, then a length (one byte, or
 * 0x81 + 2 bytes / 0x82 + 3 bytes little-endian), then UTF-8.
 */
export function textFromAttributedBody(hex: string | null | undefined): string {
  if (!hex) return ''
  const buf = Buffer.from(hex, 'hex')
  const marker = buf.indexOf('NSString')

  if (marker < 0) return ''
  let offset = marker + 'NSString'.length + 5

  if (offset >= buf.length) return ''
  let length = buf[offset] ?? 0

  offset += 1
  if (length === 0x81) {
    length = buf.readUInt16LE(offset)
    offset += 2
  } else if (length === 0x82) {
    length = buf.readUIntLE(offset, 3)
    offset += 3
  }

  return buf.subarray(offset, offset + length).toString('utf8')
}

/** The visible text of a row: `text` when set, else what attributedBody holds. */
export function messageText(text: string | null | undefined, bodyHex?: string | null): string {
  const plain = (text ?? '').replace(/￼/g, '').trim()

  return plain === '' ? textFromAttributedBody(bodyHex).replace(/￼/g, '').trim() : plain
}

/** The key Contacts and Messages agree on: an email lowercased, a phone's last 10 digits. */
export function handleKey(handle: string): string {
  const value = handle.trim().toLowerCase()

  if (value.includes('@')) return value
  const digits = value.replace(/\D/g, '')

  return digits.length > 10 ? digits.slice(-10) : digits
}

/** SQL string literal for the sqlite3 CLI, which has no parameter binding. */
export function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}
