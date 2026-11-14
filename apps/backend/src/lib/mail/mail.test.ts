import { describe, expect, test } from 'bun:test'

import { loginFailure, toInboxMessage } from './imap'
import { MAIL_PRESETS, serverFor } from './providers'

describe('serverFor', () => {
  test('uses the preset for a known provider', () => {
    expect(serverFor('icloud', {})).toEqual({ host: MAIL_PRESETS.icloud.host, port: 993 })
    expect(serverFor('gmail', { host: 'ignored.example' })?.host).toBe('imap.gmail.com')
  })

  test('needs a host for a custom IMAP server', () => {
    expect(serverFor('imap', {})).toBeNull()
    expect(serverFor('imap', { host: 'mail.example.com' })).toEqual({
      host: 'mail.example.com',
      port: 993,
    })
  })
})

describe('loginFailure', () => {
  test('tells the person to use an app password when the login is refused', () => {
    const err = loginFailure({ authenticationFailed: true, responseText: 'Invalid credentials' })

    expect(err.code).toBe('mail_auth_failed')
    expect(err.message).toContain('Invalid credentials')
    expect(err.message).toContain('app password')
  })

  test('names an unreachable server', () => {
    expect(loginFailure({ code: 'ENOTFOUND' }).code).toBe('mail_unreachable')
  })
})

describe('toInboxMessage', () => {
  test('falls back to the address and a placeholder subject', () => {
    const msg = toInboxMessage({
      uid: 7,
      envelope: { subject: '  ', from: [{ address: 'a@b.com' }] },
      flags: new Set(['\\Seen']),
      internalDate: '2026-11-13T10:00:00.000Z',
    })

    expect(msg).toEqual({
      uid: 7,
      subject: '(no subject)',
      fromName: 'a@b.com',
      fromAddress: 'a@b.com',
      date: '2026-11-13T10:00:00.000Z',
      unread: false,
    })
  })
})
