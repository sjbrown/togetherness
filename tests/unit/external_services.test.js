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
  test('persists a valid value that differs from the built-in default', () => {
    ExternalServices.setTURN('turn:turn.example.com:3478')
    expect(ExternalServices.getTURN()).toBe('turn:turn.example.com:3478')
  })

  test('trims before storing', () => {
    ExternalServices.setTURN('  turn:turn.example.com  ')
    expect(ExternalServices.getTURN()).toBe('turn:turn.example.com')
  })

  test('is a no-op (clears) on an empty value', () => {
    ExternalServices.setTURN('turn:turn.example.com')
    ExternalServices.setTURN('')
    expect(ExternalServices.getTURN()).toBeNull()
  })

  test('is a no-op (clears) when identical to the built-in default', () => {
    ExternalServices.setTURN('turn:turn.example.com')
    ExternalServices.setTURN(ExternalServices.defaultTURN())
    expect(ExternalServices.getTURN()).toBeNull()
  })

  test('is a no-op on an invalid value, leaving prior storage untouched', () => {
    ExternalServices.setTURN('turn:turn.example.com')
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

  test('is a no-op (clears) when identical to the built-in fallback default', () => {
    ExternalServices.setTURNFallback('turn:fallback.example.com')
    ExternalServices.setTURNFallback(ExternalServices.defaultTURNFallback())
    expect(ExternalServices.getTURNFallback()).toBeNull()
  })

  test('is a no-op when identical to the stored primary', () => {
    ExternalServices.setTURN('turn:same.example.com')
    ExternalServices.setTURNFallback('turn:same.example.com')
    expect(ExternalServices.getTURNFallback()).toBeNull()
  })

  test('is a no-op when identical to the primary default, with no primary override stored', () => {
    // resolveTURN() falls back to defaultTURN() here.
    ExternalServices.setTURNFallback(ExternalServices.defaultTURN())
    expect(ExternalServices.getTURNFallback()).toBeNull()
  })

  test('rejecting a duplicate leaves a previously-stored fallback untouched', () => {
    ExternalServices.setTURN('turn:primary.example.com')
    ExternalServices.setTURNFallback('turn:fallback.example.com')
    ExternalServices.setTURNFallback('turn:primary.example.com')
    expect(ExternalServices.getTURNFallback()).toBe('turn:fallback.example.com')
  })
})

describe('setTURNUsername / setTURNCredential', () => {
  test('persist values that differ from the built-in defaults', () => {
    ExternalServices.setTURNUsername('me')
    ExternalServices.setTURNCredential('s3cret')
    expect(ExternalServices.getTURNUsername()).toBe('me')
    expect(ExternalServices.getTURNCredential()).toBe('s3cret')
  })

  test('trim before storing', () => {
    ExternalServices.setTURNUsername('  me  ')
    ExternalServices.setTURNCredential('  s3cret  ')
    expect(ExternalServices.getTURNUsername()).toBe('me')
    expect(ExternalServices.getTURNCredential()).toBe('s3cret')
  })

  test('are no-ops (clear) on an empty value', () => {
    ExternalServices.setTURNUsername('me')
    ExternalServices.setTURNCredential('s3cret')
    ExternalServices.setTURNUsername('')
    ExternalServices.setTURNCredential('')
    expect(ExternalServices.getTURNUsername()).toBeNull()
    expect(ExternalServices.getTURNCredential()).toBeNull()
  })

  test('are no-ops (clear) when identical to the built-in defaults', () => {
    ExternalServices.setTURNUsername('me')
    ExternalServices.setTURNCredential('s3cret')
    ExternalServices.setTURNUsername(ExternalServices.defaultTURNUsername())
    ExternalServices.setTURNCredential(ExternalServices.defaultTURNCredential())
    expect(ExternalServices.getTURNUsername()).toBeNull()
    expect(ExternalServices.getTURNCredential()).toBeNull()
  })
})

describe('resolveTURN', () => {
  test('falls back to the built-in defaults when nothing is stored', () => {
    expect(ExternalServices.resolveTURN()).toBe(ExternalServices.defaultTURN())
    expect(ExternalServices.resolveTURNFallback()).toBe(ExternalServices.defaultTURNFallback())
    expect(ExternalServices.resolveTURNUsername()).toBe(ExternalServices.defaultTURNUsername())
    expect(ExternalServices.resolveTURNCredential()).toBe(ExternalServices.defaultTURNCredential())
  })

  test('prefers stored overrides', () => {
    ExternalServices.setTURN('turn:primary.example.com')
    ExternalServices.setTURNFallback('turn:fallback.example.com')
    ExternalServices.setTURNUsername('me')
    ExternalServices.setTURNCredential('s3cret')
    expect(ExternalServices.resolveTURN()).toBe('turn:primary.example.com')
    expect(ExternalServices.resolveTURNFallback()).toBe('turn:fallback.example.com')
    expect(ExternalServices.resolveTURNUsername()).toBe('me')
    expect(ExternalServices.resolveTURNCredential()).toBe('s3cret')
  })
})

describe('resolveIceServers', () => {
  const defaultTurnEntries = () => [
    {
      urls:       ExternalServices.defaultTURN(),
      username:   ExternalServices.defaultTURNUsername(),
      credential: ExternalServices.defaultTURNCredential(),
    },
    {
      urls:       ExternalServices.defaultTURNFallback(),
      username:   ExternalServices.defaultTURNUsername(),
      credential: ExternalServices.defaultTURNCredential(),
    },
  ]

  test('with nothing stored, falls back to simple-peer STUN plus the default relay', () => {
    expect(ExternalServices.resolveIceServers()).toEqual([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      ...defaultTurnEntries(),
    ])
  })

  test('a stored STUN primary displaces the built-in STUN entries entirely', () => {
    ExternalServices.setSTUN('stun:stun.example.com')
    expect(ExternalServices.resolveIceServers()).toEqual([
      { urls: 'stun:stun.example.com' },
      ...defaultTurnEntries(),
    ])
  })

  test('includes both STUN entries when both are stored', () => {
    ExternalServices.setSTUN('stun:primary.example.com')
    ExternalServices.setSTUNFallback('stun:fallback.example.com')
    expect(ExternalServices.resolveIceServers()).toEqual([
      { urls: 'stun:primary.example.com' },
      { urls: 'stun:fallback.example.com' },
      ...defaultTurnEntries(),
    ])
  })

  test('orders STUN entries before TURN entries, each relay carrying the credentials', () => {
    ExternalServices.setSTUN('stun:stun.example.com')
    ExternalServices.setSTUNFallback('stun:stun-fallback.example.com')
    ExternalServices.setTURN('turn:turn.example.com')
    ExternalServices.setTURNFallback('turn:turn-fallback.example.com')
    ExternalServices.setTURNUsername('me')
    ExternalServices.setTURNCredential('s3cret')
    expect(ExternalServices.resolveIceServers()).toEqual([
      { urls: 'stun:stun.example.com' },
      { urls: 'stun:stun-fallback.example.com' },
      { urls: 'turn:turn.example.com',          username: 'me', credential: 's3cret' },
      { urls: 'turn:turn-fallback.example.com', username: 'me', credential: 's3cret' },
    ])
  })

  test('collapses a fallback relay identical to the primary', () => {
    // setTURNFallback rejects a duplicate, but a stored fallback that
    // later matches a changed primary would still get here.
    localStorage.setItem(ExternalServices.TURN_KEY, 'turn:same.example.com')
    localStorage.setItem(ExternalServices.TURN_FALLBACK_KEY, 'turn:same.example.com')
    const turn = ExternalServices.resolveIceServers().filter(e => e.urls.startsWith('turn:'))
    expect(turn).toEqual([
      {
        urls:       'turn:same.example.com',
        username:   ExternalServices.defaultTURNUsername(),
        credential: ExternalServices.defaultTURNCredential(),
      },
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
