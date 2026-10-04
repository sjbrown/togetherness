// @vitest-environment jsdom
// Tests for external_services.js — see that file for why an empty/invalid
// value (and, for a fallback field, one identical to its primary) is a
// no-op rather than a "clear to default". The two-peer connection
// behavior this config feeds is exercised end-to-end instead; see
// tests/e2e/join-dialog.spec.js and tests/e2e/sync.spec.js.

import { beforeEach, describe, test, expect } from 'vitest'
import * as ExternalServices from '../../src/external_services.js'
import * as Trace from '../../src/trace.js'

beforeEach(() => {
  localStorage.clear()
  Trace._reset()
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

describe('describeIceServers', () => {
  const containsDeep = (value, needle) => JSON.stringify(value).includes(needle)

  test('masks the default credential', () => {
    // The default username and credential are the same string, so look
    // at the credential fields rather than searching the whole object.
    const d = ExternalServices.describeIceServers()
    const turn = d.iceServers.filter(e => e.urls.startsWith('turn:'))
    expect(turn.length).toBeGreaterThan(0)
    for (const e of turn) expect(e.credential).toBe('•••')
  })

  test('masks an overridden credential', () => {
    ExternalServices.setTURNCredential('hunter2-secret')
    expect(containsDeep(ExternalServices.describeIceServers(), 'hunter2-secret')).toBe(false)
  })

  test('keeps urls and username as resolved', () => {
    ExternalServices.setTURNUsername('alice')
    const d = ExternalServices.describeIceServers()
    const live = ExternalServices.resolveIceServers()
    expect(d.iceServers.map(e => e.urls)).toEqual(live.map(e => e.urls))
    expect(d.iceServers.filter(e => e.urls.startsWith('turn:')).every(e => e.username === 'alice')).toBe(true)
  })

  test('does not mutate what resolveIceServers returns', () => {
    ExternalServices.describeIceServers()
    const turn = ExternalServices.resolveIceServers().filter(e => e.urls.startsWith('turn:'))
    expect(turn[0].credential).toBe(ExternalServices.defaultTURNCredential())
  })

  test('flags are all default with nothing stored', () => {
    expect(ExternalServices.describeIceServers()).toMatchObject({
      stunOverridden: false,
      turnOverridden: false,
      turnIsPublicTestRelay: true,
    })
  })

  test('stunOverridden follows a stored STUN url', () => {
    ExternalServices.setSTUN('stun:stun.example.com')
    expect(ExternalServices.describeIceServers().stunOverridden).toBe(true)
  })

  test('turnOverridden follows stored credentials alone', () => {
    ExternalServices.setTURNUsername('alice')
    expect(ExternalServices.describeIceServers().turnOverridden).toBe(true)
  })

  test('turnIsPublicTestRelay clears once both relays are overridden', () => {
    ExternalServices.setTURN('turn:relay.example.com:3478')
    expect(ExternalServices.describeIceServers().turnIsPublicTestRelay).toBe(true)
    ExternalServices.setTURNFallback('turns:relay.example.com:5349')
    expect(ExternalServices.describeIceServers()).toMatchObject({
      turnOverridden: true,
      turnIsPublicTestRelay: false,
    })
  })
})

const two = (a = false, b = false) => ExternalServices.createSignalingTracker(
  [{ url: 'ws://a', connected: a }, { url: 'ws://b', connected: b }],
  () => 1234,
)

describe('createSignalingTracker', () => {
  test('first server is the primary, the rest are fallbacks', () => {
    expect(two().snapshot().map(e => e.role)).toEqual(['primary', 'fallback'])
  })

  test('starts from the connected state it is given, with zeroed counts', () => {
    const t = two(true, false)
    expect(t.anyConnected()).toBe(true)
    expect(t.snapshot()[0]).toMatchObject({ connected: true, connects: 0, disconnects: 0, lastChange: null })
  })

  test('reports no servers connected when none are', () => {
    expect(two().anyConnected()).toBe(false)
  })

  test('a connect updates that server and counts it', () => {
    const t = two()
    const r = t.update('ws://b', true)
    expect(r).toMatchObject({ changed: true, anyConnected: true })
    expect(r.entry).toMatchObject({ url: 'ws://b', role: 'fallback', connected: true, connects: 1, lastChange: 1234 })
    expect(t.snapshot()[0].connected).toBe(false)
  })

  test('one of two dropping leaves anyConnected true', () => {
    const t = two(true, true)
    const r = t.update('ws://b', false)
    expect(r).toMatchObject({ changed: true, anyConnected: true })
    expect(t.anyConnected()).toBe(true)
    expect(r.entry.disconnects).toBe(1)
  })

  test('the last connected server dropping clears anyConnected', () => {
    const t = two(true, true)
    t.update('ws://a', false)
    const r = t.update('ws://b', false)
    expect(r).toMatchObject({ changed: true, anyConnected: false })
  })

  test('a drop for a server already down changes nothing', () => {
    const t = two(false, false)
    expect(t.update('ws://a', false).changed).toBe(false)
  })

  test('a repeat of the held state changes nothing', () => {
    const t = two(true, false)
    const r = t.update('ws://a', true)
    expect(r.changed).toBe(false)
    expect(t.snapshot()[0].connects).toBe(0)
  })

  test('an unknown url changes nothing', () => {
    const t = two(true, true)
    expect(t.update('ws://nope', false)).toMatchObject({ changed: false, entry: null, anyConnected: true })
  })

  test('counts accumulate across flaps', () => {
    const t = two(true, false)
    t.update('ws://a', false)
    t.update('ws://a', true)
    t.update('ws://a', false)
    expect(t.snapshot()[0]).toMatchObject({ connects: 1, disconnects: 2 })
  })

  test('a snapshot cannot be used to edit the tracker', () => {
    const t = two(true, true)
    t.snapshot()[0].connected = false
    expect(t.anyConnected()).toBe(true)
  })
})

describe('traceIcePeer', () => {
  class FakePc extends EventTarget {
    iceConnectionState = 'new'
    connectionState = 'new'
    iceGatheringState = 'new'
    stats = []
    getStats() { return Promise.resolve(new Map(this.stats.map(s => [s.id, s]))) }
    emit(name, props = {}) { this.dispatchEvent(Object.assign(new Event(name), props)) }
    candidate(type, address = '203.0.113.9') {
      this.emit('icecandidate', { candidate: { type, address, candidate: `candidate:1 1 udp 1 ${address} 5000 typ ${type}` } })
    }
    gatherDone() { this.iceGatheringState = 'complete'; this.emit('icegatheringstatechange') }
    iceState(state) { this.iceConnectionState = state; this.emit('iceconnectionstatechange') }
  }
  const rows = (evt) => Trace.events().filter(e => e.ch === 'ice' && e.evt === evt)
  const flush = () => new Promise(r => setTimeout(r, 0))

  test('records ice and connection state changes, escalating failures', () => {
    const pc = new FakePc()
    ExternalServices.traceIcePeer('peer-a', pc)
    pc.iceState('checking')
    pc.iceState('disconnected')
    pc.iceState('failed')
    pc.connectionState = 'connected'; pc.emit('connectionstatechange')
    expect(rows('ice-state').map(e => [e.detail.kind, e.detail.state, e.level])).toEqual([
      ['ice', 'checking', 'info'],
      ['ice', 'disconnected', 'warn'],
      ['ice', 'failed', 'error'],
      ['connection', 'connected', 'info'],
    ])
    expect(rows('ice-state')[0].detail.peer).toBe('peer-a')
  })

  test('one summary row counts candidates by type and is quiet when all kinds arrived', () => {
    const pc = new FakePc()
    ExternalServices.traceIcePeer('p', pc)
    pc.candidate('host'); pc.candidate('host'); pc.candidate('srflx'); pc.candidate('relay')
    pc.gatherDone()
    const [row, ...rest] = rows('ice-candidates')
    expect(rest).toHaveLength(0)
    expect(row.detail).toEqual({ peer: 'p', host: 2, srflx: 1, relay: 1 })
    expect(row.level).toBe('info')
  })

  test('warns, naming what is missing, when STUN or TURN produced nothing', () => {
    const pc = new FakePc()
    ExternalServices.traceIcePeer('p', pc)
    pc.candidate('host')
    pc.gatherDone()
    const row = rows('ice-candidates')[0]
    expect(row.level).toBe('warn')
    expect(row.msg).toContain('no STUN reflexive candidate')
    expect(row.msg).toContain('no TURN relay candidate')
  })

  test('a gathering state other than complete records nothing', () => {
    const pc = new FakePc()
    ExternalServices.traceIcePeer('p', pc)
    pc.iceGatheringState = 'gathering'; pc.emit('icegatheringstatechange')
    expect(rows('ice-candidates')).toHaveLength(0)
  })

  test('falls back to the candidate string when the type property is absent', () => {
    const pc = new FakePc()
    ExternalServices.traceIcePeer('p', pc)
    pc.emit('icecandidate', { candidate: { candidate: 'candidate:1 1 udp 1 10.0.0.1 5000 typ relay' } })
    pc.gatherDone()
    expect(rows('ice-candidates')[0].detail.relay).toBe(1)
  })

  test('an end-of-candidates event is ignored', () => {
    const pc = new FakePc()
    ExternalServices.traceIcePeer('p', pc)
    pc.emit('icecandidate', { candidate: null })
    pc.gatherDone()
    expect(rows('ice-candidates')[0].detail).toMatchObject({ host: 0, srflx: 0, relay: 0 })
  })

  test('candidate errors are warnings carrying server url and code', () => {
    const pc = new FakePc()
    ExternalServices.traceIcePeer('p', pc)
    pc.emit('icecandidateerror', { url: 'turn:relay.example.com:3478', errorCode: 401, errorText: 'Unauthorized', address: '198.51.100.7', port: 1234 })
    const [row] = rows('ice-error')
    expect(row.level).toBe('warn')
    expect(row.detail).toEqual({ peer: 'p', url: 'turn:relay.example.com:3478', errorCode: 401, errorText: 'Unauthorized' })
  })

  test('no row contains an address or candidate string', () => {
    const pc = new FakePc()
    ExternalServices.traceIcePeer('p', pc)
    pc.candidate('host', '192.0.2.44'); pc.candidate('srflx', '203.0.113.9')
    pc.emit('icecandidateerror', { url: 'stun:s.example.com', errorCode: 701, address: '198.51.100.7' })
    pc.gatherDone()
    const text = JSON.stringify(Trace.events())
    expect(text).not.toMatch(/\d+\.\d+\.\d+\.\d+/)
    expect(text).not.toContain('candidate:')
  })

  test('records the selected route once, from the selected pair', async () => {
    const pc = new FakePc()
    pc.stats = [
      { id: 't', type: 'transport', selectedCandidatePairId: 'cp' },
      { id: 'cp', type: 'candidate-pair', localCandidateId: 'l', remoteCandidateId: 'r' },
      { id: 'l', type: 'local-candidate', candidateType: 'host' },
      { id: 'r', type: 'remote-candidate', candidateType: 'relay' },
    ]
    ExternalServices.traceIcePeer('p', pc)
    pc.iceState('connected')
    pc.iceState('completed')
    await flush()
    const sel = rows('ice-selected')
    expect(sel).toHaveLength(1)
    expect(sel[0].detail).toMatchObject({ peer: 'p', route: 'relay', local: 'host', remote: 'relay' })
    expect(Number.isFinite(sel[0].detail.ms)).toBe(true)
  })

  test('classifies host-to-host as host and server-reflexive as srflx', async () => {
    const make = (a, b) => {
      const pc = new FakePc()
      pc.stats = [
        { id: 't', type: 'transport', selectedCandidatePairId: 'cp' },
        { id: 'cp', type: 'candidate-pair', localCandidateId: 'l', remoteCandidateId: 'r' },
        { id: 'l', candidateType: a }, { id: 'r', candidateType: b },
      ]
      ExternalServices.traceIcePeer(`${a}-${b}`, pc)
      pc.iceState('connected')
    }
    make('host', 'host'); make('srflx', 'host')
    await flush()
    expect(rows('ice-selected').map(e => e.detail.route)).toEqual(['host', 'srflx'])
  })

  test('uses the nominated succeeded pair when there is no transport entry', async () => {
    const pc = new FakePc()
    pc.stats = [
      { id: 'cp', type: 'candidate-pair', nominated: true, state: 'succeeded', localCandidateId: 'l', remoteCandidateId: 'r' },
      { id: 'l', candidateType: 'relay' }, { id: 'r', candidateType: 'host' },
    ]
    ExternalServices.traceIcePeer('p', pc)
    pc.iceState('connected')
    await flush()
    expect(rows('ice-selected')[0].detail.route).toBe('relay')
  })

  test('keeps trying on later connection events until a pair is selected', async () => {
    const pc = new FakePc()
    ExternalServices.traceIcePeer('p', pc)
    pc.iceState('connected')
    await flush()
    expect(rows('ice-selected')).toHaveLength(0)

    pc.stats = [
      { id: 't', type: 'transport', selectedCandidatePairId: 'cp' },
      { id: 'cp', type: 'candidate-pair', localCandidateId: 'l', remoteCandidateId: 'r' },
      { id: 'l', candidateType: 'host' }, { id: 'r', candidateType: 'host' },
    ]
    pc.connectionState = 'connected'; pc.emit('connectionstatechange')
    await flush()
    pc.iceState('completed')
    await flush()
    expect(rows('ice-selected')).toHaveLength(1)
  })

  test('a stats failure is swallowed', async () => {
    const pc = new FakePc()
    pc.getStats = () => Promise.reject(new Error('nope'))
    ExternalServices.traceIcePeer('p', pc)
    pc.iceState('connected')
    await flush()
    expect(rows('ice-selected')).toHaveLength(0)
    expect(rows('ice-state')).toHaveLength(1)
  })

  test('the returned function stops all recording', () => {
    const pc = new FakePc()
    const stop = ExternalServices.traceIcePeer('p', pc)
    stop()
    pc.candidate('host'); pc.gatherDone(); pc.iceState('failed')
    pc.emit('icecandidateerror', { url: 'x' })
    pc.connectionState = 'failed'; pc.emit('connectionstatechange')
    expect(Trace.events().filter(e => e.ch === 'ice')).toHaveLength(0)
  })
})

describe('traceIceProvider', () => {
  const makeProvider = () => {
    const handlers = []
    const conns = new Map()
    return {
      conns,
      on: (name, fn) => { if (name === 'peers') handlers.push(fn) },
      room: { webrtcConns: conns },
      emit: (detail) => handlers.forEach(fn => fn(detail)),
    }
  }
  const addPeer = (provider, id) => {
    const pc = new EventTarget()
    Object.assign(pc, { iceConnectionState: 'new', connectionState: 'new', iceGatheringState: 'new' })
    provider.conns.set(id, { peer: { _pc: pc } })
    provider.emit({ added: [id], removed: [] })
    return pc
  }
  const iceStates = () => Trace.events().filter(e => e.ch === 'ice' && e.evt === 'ice-state')
  const fireIce = (pc, state) => {
    pc.iceConnectionState = state
    pc.dispatchEvent(new Event('iceconnectionstatechange'))
  }

  test('traces a peer once it is added', () => {
    const provider = makeProvider()
    ExternalServices.traceIceProvider(provider)
    const pc = addPeer(provider, 'peer-a')
    fireIce(pc, 'checking')
    expect(iceStates().map(e => e.detail.peer)).toEqual(['peer-a'])
  })

  test('stops tracing a peer once it is removed', () => {
    const provider = makeProvider()
    ExternalServices.traceIceProvider(provider)
    const pc = addPeer(provider, 'peer-a')
    provider.emit({ added: [], removed: ['peer-a'] })
    fireIce(pc, 'failed')
    expect(iceStates()).toHaveLength(0)
  })

  test('re-adding a peer does not double-record', () => {
    const provider = makeProvider()
    ExternalServices.traceIceProvider(provider)
    addPeer(provider, 'peer-a')
    const pc = addPeer(provider, 'peer-a')
    fireIce(pc, 'checking')
    expect(iceStates()).toHaveLength(1)
  })

  test('ignores an added id with no webrtc connection (a broadcastchannel peer)', () => {
    const provider = makeProvider()
    ExternalServices.traceIceProvider(provider)
    expect(() => provider.emit({ added: ['bc-peer'], removed: [] })).not.toThrow()
  })

  test('tolerates a provider without a room', () => {
    const provider = makeProvider()
    provider.room = undefined
    ExternalServices.traceIceProvider(provider)
    expect(() => provider.emit({ added: ['x'], removed: [] })).not.toThrow()
  })
})
