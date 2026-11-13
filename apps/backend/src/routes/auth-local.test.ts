import { describe, expect, test } from 'bun:test'

import { isLoopbackHost } from './auth-local'

describe('isLoopbackHost', () => {
  test('accepts this machine, with or without a port', () => {
    expect(isLoopbackHost('localhost')).toBe(true)
    expect(isLoopbackHost('localhost:3000')).toBe(true)
    expect(isLoopbackHost('127.0.0.1:3000')).toBe(true)
    expect(isLoopbackHost('[::1]:3000')).toBe(true)
    expect(isLoopbackHost('LOCALHOST:3000')).toBe(true)
  })

  test('refuses any other host and a missing header', () => {
    expect(isLoopbackHost(undefined)).toBe(false)
    expect(isLoopbackHost('')).toBe(false)
    expect(isLoopbackHost('api.example.com')).toBe(false)
    expect(isLoopbackHost('localhost.example.com')).toBe(false)
    expect(isLoopbackHost('10.0.0.5:3000')).toBe(false)
  })
})
