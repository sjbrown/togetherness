// @vitest-environment jsdom
// Tests for external_services.js's optional STUN server overrides — see
// that file for why an empty/invalid value is a no-op rather than a
// "clear to default". (The signaling-server half of that file has no
// localStorage-independent behavior worth unit testing here — it's
// exercised end-to-end instead; see tests/e2e/join-dialog.spec.js.)

import { beforeEach, describe, test, expect } from 'vitest'
import {
  isValidStunUrl,
  getStoredStunServer, setStoredStunServer,
  getStoredStunServerFallback, setStoredStunServerFallback,
  resolveIceServers,
} from '../../src/external_services.js'

beforeEach(() => {
  localStorage.clear()
})

describe('isValidStunUrl', () => {
  test('accepts a bare stun: host', () => {
    expect(isValidStunUrl('stun:stun.example.com')).toBe(true)
  })

  test('accepts stun: with a port', () => {
    expect(isValidStunUrl('stun:stun.example.com:19302')).toBe(true)
  })

  test('accepts stuns:', () => {
    expect(isValidStunUrl('stuns:stun.example.com:5349')).toBe(true)
  })

  test('tolerates surrounding whitespace', () => {
    expect(isValidStunUrl('  stun:stun.example.com  ')).toBe(true)
  })

  test('rejects the empty string', () => {
    expect(isValidStunUrl('')).toBe(false)
  })

  test('rejects a non-stun scheme', () => {
    expect(isValidStunUrl('https://stun.example.com')).toBe(false)
  })

  test('rejects a scheme with no host', () => {
    expect(isValidStunUrl('stun:')).toBe(false)
  })

  test('rejects non-string input', () => {
    expect(isValidStunUrl(null)).toBe(false)
    expect(isValidStunUrl(undefined)).toBe(false)
  })
})

describe('setStoredStunServer', () => {
  test('persists a valid value', () => {
    setStoredStunServer('stun:stun.example.com:19302')
    expect(getStoredStunServer()).toBe('stun:stun.example.com:19302')
  })

  test('trims before storing', () => {
    setStoredStunServer('  stun:stun.example.com  ')
    expect(getStoredStunServer()).toBe('stun:stun.example.com')
  })

  test('is a no-op on an empty value, leaving prior storage untouched', () => {
    setStoredStunServer('stun:stun.example.com')
    setStoredStunServer('')
    expect(getStoredStunServer()).toBe('stun:stun.example.com')
  })

  test('is a no-op on an invalid value, leaving prior storage untouched', () => {
    setStoredStunServer('stun:stun.example.com')
    setStoredStunServer('not-a-stun-url')
    expect(getStoredStunServer()).toBe('stun:stun.example.com')
  })

  test('nothing stored yet plus an invalid value stays unset', () => {
    setStoredStunServer('nope')
    expect(getStoredStunServer()).toBeNull()
  })
})

describe('setStoredStunServerFallback', () => {
  test('persists independently of the primary', () => {
    setStoredStunServer('stun:primary.example.com')
    setStoredStunServerFallback('stun:fallback.example.com')
    expect(getStoredStunServer()).toBe('stun:primary.example.com')
    expect(getStoredStunServerFallback()).toBe('stun:fallback.example.com')
  })

  test('is a no-op on an invalid value', () => {
    setStoredStunServerFallback('stun:fallback.example.com')
    setStoredStunServerFallback('garbage')
    expect(getStoredStunServerFallback()).toBe('stun:fallback.example.com')
  })
})

describe('resolveIceServers', () => {
  test('is empty when nothing is stored', () => {
    expect(resolveIceServers()).toEqual([])
  })

  test('includes only the primary when no fallback is stored', () => {
    setStoredStunServer('stun:stun.example.com')
    expect(resolveIceServers()).toEqual([{ urls: 'stun:stun.example.com' }])
  })

  test('includes both when both are stored', () => {
    setStoredStunServer('stun:primary.example.com')
    setStoredStunServerFallback('stun:fallback.example.com')
    expect(resolveIceServers()).toEqual([
      { urls: 'stun:primary.example.com' },
      { urls: 'stun:fallback.example.com' },
    ])
  })
})
