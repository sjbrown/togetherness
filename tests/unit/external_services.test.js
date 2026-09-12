// @vitest-environment jsdom
// Tests for external_services.js — see that file for why an empty/invalid
// value (and, for a fallback field, one identical to its primary) is a
// no-op rather than a "clear to default". The two-peer connection
// behavior this config feeds is exercised end-to-end instead; see
// tests/e2e/join-dialog.spec.js and tests/e2e/sync.spec.js.

import { beforeEach, describe, test, expect } from 'vitest'
import * as ExternalServices from '../../src/external_services.js'

beforeEach(() => {
  localStorage.clear()
})

describe('isValidSTUN', () => {
  test('accepts a bare stun: host', () => {
    expect(ExternalServices.isValidSTUN('stun:stun.example.com')).toBe(true)
  })

  test('accepts stun: with a port', () => {
    expect(ExternalServices.isValidSTUN('stun:stun.example.com:19302')).toBe(true)
  })

  test('accepts stuns:', () => {
    expect(ExternalServices.isValidSTUN('stuns:stun.example.com:5349')).toBe(true)
  })

  test('tolerates surrounding whitespace', () => {
    expect(ExternalServices.isValidSTUN('  stun:stun.example.com  ')).toBe(true)
  })

  test('rejects the empty string', () => {
    expect(ExternalServices.isValidSTUN('')).toBe(false)
  })

  test('rejects a non-stun scheme', () => {
    expect(ExternalServices.isValidSTUN('https://stun.example.com')).toBe(false)
  })

  test('rejects a scheme with no host', () => {
    expect(ExternalServices.isValidSTUN('stun:')).toBe(false)
  })

  test('rejects non-string input', () => {
    expect(ExternalServices.isValidSTUN(null)).toBe(false)
    expect(ExternalServices.isValidSTUN(undefined)).toBe(false)
  })
})

describe('setSTUN', () => {
  test('persists a valid value', () => {
    ExternalServices.setSTUN('stun:stun.example.com:19302')
    expect(ExternalServices.getSTUN()).toBe('stun:stun.example.com:19302')
  })

  test('trims before storing', () => {
    ExternalServices.setSTUN('  stun:stun.example.com  ')
    expect(ExternalServices.getSTUN()).toBe('stun:stun.example.com')
  })

  test('is a no-op on an empty value, leaving prior storage untouched', () => {
    ExternalServices.setSTUN('stun:stun.example.com')
    ExternalServices.setSTUN('')
    expect(ExternalServices.getSTUN()).toBe('stun:stun.example.com')
  })

  test('is a no-op on an invalid value, leaving prior storage untouched', () => {
    ExternalServices.setSTUN('stun:stun.example.com')
    ExternalServices.setSTUN('not-a-stun-url')
    expect(ExternalServices.getSTUN()).toBe('stun:stun.example.com')
  })

  test('nothing stored yet plus an invalid value stays unset', () => {
    ExternalServices.setSTUN('nope')
    expect(ExternalServices.getSTUN()).toBeNull()
  })
})

describe('setSTUNFallback', () => {
  test('persists independently of the primary', () => {
    ExternalServices.setSTUN('stun:primary.example.com')
    ExternalServices.setSTUNFallback('stun:fallback.example.com')
    expect(ExternalServices.getSTUN()).toBe('stun:primary.example.com')
    expect(ExternalServices.getSTUNFallback()).toBe('stun:fallback.example.com')
  })

  test('is a no-op on an invalid value', () => {
    ExternalServices.setSTUNFallback('stun:fallback.example.com')
    ExternalServices.setSTUNFallback('garbage')
    expect(ExternalServices.getSTUNFallback()).toBe('stun:fallback.example.com')
  })

  test('is a no-op when identical to the stored primary', () => {
    ExternalServices.setSTUN('stun:same.example.com')
    ExternalServices.setSTUNFallback('stun:same.example.com')
    expect(ExternalServices.getSTUNFallback()).toBeNull()
  })

  test('rejecting a duplicate leaves a previously-stored fallback untouched', () => {
    ExternalServices.setSTUN('stun:primary.example.com')
    ExternalServices.setSTUNFallback('stun:fallback.example.com')
    ExternalServices.setSTUNFallback('stun:primary.example.com')
    expect(ExternalServices.getSTUNFallback()).toBe('stun:fallback.example.com')
  })
})

describe('isValidTURN', () => {
  test('accepts a bare turn: host', () => {
    expect(ExternalServices.isValidTURN('turn:turn.example.com')).toBe(true)
  })

  test('accepts turn: with a port', () => {
    expect(ExternalServices.isValidTURN('turn:turn.example.com:3478')).toBe(true)
  })

  test('accepts turns:', () => {
    expect(ExternalServices.isValidTURN('turns:turn.example.com:5349')).toBe(true)
  })

  test('rejects the empty string', () => {
    expect(ExternalServices.isValidTURN('')).toBe(false)
  })

  test('rejects a non-turn scheme', () => {
    expect(ExternalServices.isValidTURN('stun:turn.example.com')).toBe(false)
  })

  test('rejects a scheme with no host', () => {
    expect(ExternalServices.isValidTURN('turn:')).toBe(false)
  })

  test('rejects non-string input', () => {
    expect(ExternalServices.isValidTURN(null)).toBe(false)
    expect(ExternalServices.isValidTURN(undefined)).toBe(false)
  })
})

describe('setTURN', () => {
  test('persists a valid value', () => {
    ExternalServices.setTURN('turn:turn.example.com:3478')
    expect(ExternalServices.getTURN()).toBe('turn:turn.example.com:3478')
  })

  test('trims before storing', () => {
    ExternalServices.setTURN('  turn:turn.example.com  ')
    expect(ExternalServices.getTURN()).toBe('turn:turn.example.com')
  })

  test('is a no-op on an empty or invalid value, leaving prior storage untouched', () => {
    ExternalServices.setTURN('turn:turn.example.com')
    ExternalServices.setTURN('')
    ExternalServices.setTURN('not-a-turn-url')
    expect(ExternalServices.getTURN()).toBe('turn:turn.example.com')
  })
})

describe('setTURNFallback', () => {
  test('persists independently of the primary', () => {
    ExternalServices.setTURN('turn:primary.example.com')
    ExternalServices.setTURNFallback('turn:fallback.example.com')
    expect(ExternalServices.getTURN()).toBe('turn:primary.example.com')
    expect(ExternalServices.getTURNFallback()).toBe('turn:fallback.example.com')
  })

  test('is a no-op on an invalid value', () => {
    ExternalServices.setTURNFallback('turn:fallback.example.com')
    ExternalServices.setTURNFallback('garbage')
    expect(ExternalServices.getTURNFallback()).toBe('turn:fallback.example.com')
  })

  test('is a no-op when identical to the stored primary', () => {
    ExternalServices.setTURN('turn:same.example.com')
    ExternalServices.setTURNFallback('turn:same.example.com')
    expect(ExternalServices.getTURNFallback()).toBeNull()
  })

  test('rejecting a duplicate leaves a previously-stored fallback untouched', () => {
    ExternalServices.setTURN('turn:primary.example.com')
    ExternalServices.setTURNFallback('turn:fallback.example.com')
    ExternalServices.setTURNFallback('turn:primary.example.com')
    expect(ExternalServices.getTURNFallback()).toBe('turn:fallback.example.com')
  })
})

describe('resolveIceServers', () => {
  test('is empty when nothing is stored', () => {
    expect(ExternalServices.resolveIceServers()).toEqual([])
  })

  test('includes only the primary when no fallback is stored', () => {
    ExternalServices.setSTUN('stun:stun.example.com')
    expect(ExternalServices.resolveIceServers()).toEqual([{ urls: 'stun:stun.example.com' }])
  })

  test('includes both STUN entries when both are stored', () => {
    ExternalServices.setSTUN('stun:primary.example.com')
    ExternalServices.setSTUNFallback('stun:fallback.example.com')
    expect(ExternalServices.resolveIceServers()).toEqual([
      { urls: 'stun:primary.example.com' },
      { urls: 'stun:fallback.example.com' },
    ])
  })

  test('includes TURN entries even with no STUN stored', () => {
    ExternalServices.setTURN('turn:turn.example.com')
    expect(ExternalServices.resolveIceServers()).toEqual([{ urls: 'turn:turn.example.com' }])
  })

  test('orders STUN entries before TURN entries', () => {
    ExternalServices.setSTUN('stun:stun.example.com')
    ExternalServices.setSTUNFallback('stun:stun-fallback.example.com')
    ExternalServices.setTURN('turn:turn.example.com')
    ExternalServices.setTURNFallback('turn:turn-fallback.example.com')
    expect(ExternalServices.resolveIceServers()).toEqual([
      { urls: 'stun:stun.example.com' },
      { urls: 'stun:stun-fallback.example.com' },
      { urls: 'turn:turn.example.com' },
      { urls: 'turn:turn-fallback.example.com' },
    ])
  })
})

describe('setSignalling', () => {
  test('persists a value that differs from the built-in default', () => {
    ExternalServices.setSignalling('wss://custom.example.com')
    expect(ExternalServices.getSignalling()).toBe('wss://custom.example.com')
  })

  test('is a no-op (clears) on an empty value', () => {
    ExternalServices.setSignalling('wss://custom.example.com')
    ExternalServices.setSignalling('')
    expect(ExternalServices.getSignalling()).toBeNull()
  })

  test('is a no-op (clears) when identical to the built-in default', () => {
    ExternalServices.setSignalling('wss://custom.example.com')
    ExternalServices.setSignalling(ExternalServices.defaultSignalling())
    expect(ExternalServices.getSignalling()).toBeNull()
  })
})

describe('setSignallingFallback', () => {
  test('persists a value that differs from both the default and the primary', () => {
    ExternalServices.setSignalling('wss://primary.example.com')
    ExternalServices.setSignallingFallback('wss://fallback.example.com')
    expect(ExternalServices.getSignallingFallback()).toBe('wss://fallback.example.com')
  })

  test('is a no-op (clears) when identical to the resolved primary', () => {
    ExternalServices.setSignalling('wss://same.example.com')
    ExternalServices.setSignallingFallback('wss://same.example.com')
    expect(ExternalServices.getSignallingFallback()).toBeNull()
  })

  test('is a no-op when identical to the primary default, with no primary override stored', () => {
    // resolveSignalling() falls back to defaultSignalling() here.
    ExternalServices.setSignallingFallback(ExternalServices.defaultSignalling())
    expect(ExternalServices.getSignallingFallback()).toBeNull()
  })

  test('rejecting a duplicate leaves a previously-stored fallback untouched', () => {
    ExternalServices.setSignalling('wss://primary.example.com')
    ExternalServices.setSignallingFallback('wss://fallback.example.com')
    ExternalServices.setSignallingFallback('wss://primary.example.com')
    expect(ExternalServices.getSignallingFallback()).toBe('wss://fallback.example.com')
  })

  test('is a no-op (clears) when identical to the built-in fallback default', () => {
    ExternalServices.setSignallingFallback('wss://fallback.example.com')
    ExternalServices.setSignallingFallback(ExternalServices.defaultSignallingFallback())
    expect(ExternalServices.getSignallingFallback()).toBeNull()
  })
})

describe('resolveSignallingAll', () => {
  test('is just the primary when no fallback is stored or defaulted', () => {
    // Under jsdom's default localhost origin, defaultSignallingFallback()
    // is '' — no fallback in play at all.
    ExternalServices.setSignalling('wss://only.example.com')
    expect(ExternalServices.resolveSignallingAll()).toEqual(['wss://only.example.com'])
  })

  test('includes both when primary and fallback differ', () => {
    ExternalServices.setSignalling('wss://primary.example.com')
    ExternalServices.setSignallingFallback('wss://fallback.example.com')
    expect(ExternalServices.resolveSignallingAll()).toEqual([
      'wss://primary.example.com',
      'wss://fallback.example.com',
    ])
  })
})
