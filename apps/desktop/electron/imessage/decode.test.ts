import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  appleDateToIso,
  handleKey,
  messageText,
  sqlString,
  textFromAttributedBody,
} from './decode.ts'

function body(text: string): string {
  const bytes = Buffer.from(text, 'utf8')
  const length =
    bytes.length < 0x80
      ? Buffer.from([bytes.length])
      : Buffer.concat([Buffer.from([0x81]), Buffer.from([bytes.length & 0xff, bytes.length >> 8])])

  return Buffer.concat([
    Buffer.from(
      'streamtyped\x81\xe8\x03\x84\x01@\x84\x84\x84\x12NSAttributedString\x00\x84\x84\x08NSObject\x00\x85\x92\x84\x84\x84\x08NSString',
      'latin1',
    ),
    Buffer.from([0x01, 0x94, 0x84, 0x01, 0x2b]),
    length,
    bytes,
    Buffer.from([0x86, 0x84]),
  ]).toString('hex')
}

test('chat.db dates convert from nanoseconds since 2001', () => {
  assert.equal(appleDateToIso(0), '2001-01-01T00:00:00.000Z')
  assert.equal(appleDateToIso(784_684_800_000_000_000), '2025-11-13T00:00:00.000Z')
  assert.equal(appleDateToIso(784_684_800), '2025-11-13T00:00:00.000Z')
})

test('text comes from attributedBody when the text column is empty', () => {
  assert.equal(textFromAttributedBody(body('pushed the deck')), 'pushed the deck')
  assert.equal(textFromAttributedBody(body('x'.repeat(300))), 'x'.repeat(300))
  assert.equal(messageText(null, body('hey 👋')), 'hey 👋')
  assert.equal(messageText('plain wins', body('ignored')), 'plain wins')
  assert.equal(textFromAttributedBody(null), '')
})

test('handles match across Contacts formats', () => {
  assert.equal(handleKey('+1 (555) 123-4567'), handleKey('5551234567'))
  assert.equal(handleKey('Me@Example.com'), 'me@example.com')
})

test('sql strings are quoted', () => {
  assert.equal(sqlString("iMessage;-;o'neil@x.com"), "'iMessage;-;o''neil@x.com'")
})
