// @vitest-environment jsdom
// Tests for external_services.js — see that file for why an empty/invalid
// value (and, for a fallback field, one identical to its primary) is a
// no-op rather than a "clear to default". The two-peer connection
// behavior this config feeds is exercised end-to-end instead; see
// tests/e2e/join-dialog.spec.js and tests/e2e/sync.spec.js.

import { beforeEach, describe, test, expect } from 'vitest'
import {
  isValidStunUrl,
  getStoredStunServer, setStoredStunServer,
  getStoredStunServerFallback, setStoredStunServerFallback,
  resolveIceServers,
  getStoredSignalingServer, setStoredSignalingServer, defaultSignalingServer,
  getStoredFallbackSignalingServer, setStoredFallbackSignalingServer, defaultFallbackSignalingServer,
  resolveSignalingServers,
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

  test('is a no-op when identical to the stored primary', () => {
    setStoredStunServer('stun:same.example.com')
    setStoredStunServerFallback('stun:same.example.com')
    expect(getStoredStunServerFallback()).toBeNull()
  })

  test('rejecting a duplicate leaves a previously-stored fallback untouched', () => {
    setStoredStunServer('stun:primary.example.com')
    setStoredStunServerFallback('stun:fallback.example.com')
    setStoredStunServerFallback('stun:primary.example.com')
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

describe('setStoredSignalingServer', () => {
  test('persists a value that differs from the built-in default', () => {
    setStoredSignalingServer('wss://custom.example.com')
    expect(getStoredSignalingServer()).toBe('wss://custom.example.com')
  })

  test('is a no-op (clears) on an empty value', () => {
    setStoredSignalingServer('wss://custom.example.com')
    setStoredSignalingServer('')
    expect(getStoredSignalingServer()).toBeNull()
  })

  test('is a no-op (clears) when identical to the built-in default', () => {
    setStoredSignalingServer('wss://custom.example.com')
    setStoredSignalingServer(defaultSignalingServer())
    expect(getStoredSignalingServer()).toBeNull()
  })
})

describe('setStoredFallbackSignalingServer', () => {
  test('persists a value that differs from both the default and the primary', () => {
    setStoredSignalingServer('wss://primary.example.com')
    setStoredFallbackSignalingServer('wss://fallback.example.com')
    expect(getStoredFallbackSignalingServer()).toBe('wss://fallback.example.com')
  })

  test('is a no-op (clears) when identical to the resolved primary', () => {
    setStoredSignalingServer('wss://same.example.com')
    setStoredFallbackSignalingServer('wss://same.example.com')
    expect(getStoredFallbackSignalingServer()).toBeNull()
  })

  test('is a no-op when identical to the primary default, with no primary override stored', () => {
    // resolveSignalingServer() falls back to defaultSignalingServer() here.
    setStoredFallbackSignalingServer(defaultSignalingServer())
    expect(getStoredFallbackSignalingServer()).toBeNull()
  })

  test('rejecting a duplicate leaves a previously-stored fallback untouched', () => {
    setStoredSignalingServer('wss://primary.example.com')
    setStoredFallbackSignalingServer('wss://fallback.example.com')
    setStoredFallbackSignalingServer('wss://primary.example.com')
    expect(getStoredFallbackSignalingServer()).toBe('wss://fallback.example.com')
  })

  test('is a no-op (clears) when identical to the built-in fallback default', () => {
    setStoredFallbackSignalingServer('wss://fallback.example.com')
    setStoredFallbackSignalingServer(defaultFallbackSignalingServer())
    expect(getStoredFallbackSignalingServer()).toBeNull()
  })
})

describe('resolveSignalingServers', () => {
  test('is just the primary when no fallback is stored or defaulted', () => {
    // Under jsdom's default localhost origin, defaultFallbackSignalingServer()
    // is '' — no fallback in play at all.
    setStoredSignalingServer('wss://only.example.com')
    expect(resolveSignalingServers()).toEqual(['wss://only.example.com'])
  })

  test('includes both when primary and fallback differ', () => {
    setStoredSignalingServer('wss://primary.example.com')
    setStoredFallbackSignalingServer('wss://fallback.example.com')
    expect(resolveSignalingServers()).toEqual([
      'wss://primary.example.com',
      'wss://fallback.example.com',
    ])
  })
})
