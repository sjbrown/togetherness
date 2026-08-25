// join_intent.js's watchTableProbe is the actual race-condition logic
// behind the "is this table's creator already here?" dialog — this test
// exercises it deterministically with fake timers and a minimal fake
// WebrtcProvider, the same way tables-authority.test.js covers the
// ensureJoined race without relying on real network timing.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { watchTableProbe } from '../../src/join_intent.js'

// A minimal stand-in for y-webrtc's SignalingConn: an event emitter with
// a `connected` flag, supporting exactly what watchTableProbe uses.
function fakeConn(connected = false) {
  const listeners = new Map()
  return {
    connected,
    on(name, fn)  { (listeners.get(name) ?? listeners.set(name, new Set()).get(name)).add(fn) },
    off(name, fn) { listeners.get(name)?.delete(fn) },
    emit(name, ...args) { for (const fn of listeners.get(name) ?? []) fn(...args) },
    listenerCount(name) { return listeners.get(name)?.size ?? 0 },
  }
}

// A minimal stand-in for WebrtcProvider: just the 'synced' emitter plus
// whatever signalingConns array the test wants.
function fakeProvider(signalingConns) {
  const listeners = new Map()
  return {
    signalingConns,
    on(name, fn)  { (listeners.get(name) ?? listeners.set(name, new Set()).get(name)).add(fn) },
    off(name, fn) { listeners.get(name)?.delete(fn) },
    emit(name, ...args) { for (const fn of listeners.get(name) ?? []) fn(...args) },
  }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('watchTableProbe', () => {
  test('empty signalingConns is immediately unreachable', () => {
    const provider = fakeProvider([])
    const onPhase = vi.fn()
    watchTableProbe(provider, { onPhase, signalingTimeoutMs: 1000, peerTimeoutMs: 1000 })
    expect(onPhase).toHaveBeenCalledWith('unreachable')
  })

  test('no signaling connection within signalingTimeoutMs is unreachable', () => {
    const conn = fakeConn(false)
    const provider = fakeProvider([conn])
    const onPhase = vi.fn()
    watchTableProbe(provider, { onPhase, signalingTimeoutMs: 1000, peerTimeoutMs: 1000 })

    vi.advanceTimersByTime(999)
    expect(onPhase).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onPhase).toHaveBeenCalledWith('unreachable')
  })

  test('already-connected signaling skips straight to the peer-wait phase', () => {
    const conn = fakeConn(true)
    const provider = fakeProvider([conn])
    const onPhase = vi.fn()
    watchTableProbe(provider, { onPhase, signalingTimeoutMs: 1000, peerTimeoutMs: 500 })

    // Never reaches the signaling timeout — it's already past that phase.
    vi.advanceTimersByTime(1000)
    expect(onPhase).toHaveBeenCalledWith('not-found')
  })

  test('a peer syncing in before peerTimeoutMs is found', () => {
    const conn = fakeConn(true)
    const provider = fakeProvider([conn])
    const onPhase = vi.fn()
    watchTableProbe(provider, { onPhase, signalingTimeoutMs: 1000, peerTimeoutMs: 1000 })

    vi.advanceTimersByTime(400)
    provider.emit('synced', { synced: true })
    expect(onPhase).toHaveBeenCalledWith('found')

    // No further phase after the first.
    vi.advanceTimersByTime(1000)
    expect(onPhase).toHaveBeenCalledTimes(1)
  })

  test('no peer syncing in within peerTimeoutMs is not-found', () => {
    const conn = fakeConn(true)
    const provider = fakeProvider([conn])
    const onPhase = vi.fn()
    watchTableProbe(provider, { onPhase, signalingTimeoutMs: 1000, peerTimeoutMs: 500 })

    vi.advanceTimersByTime(499)
    expect(onPhase).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onPhase).toHaveBeenCalledWith('not-found')
  })

  test('a synced:false event does not count as found', () => {
    const conn = fakeConn(true)
    const provider = fakeProvider([conn])
    const onPhase = vi.fn()
    watchTableProbe(provider, { onPhase, signalingTimeoutMs: 1000, peerTimeoutMs: 500 })

    provider.emit('synced', { synced: false })
    expect(onPhase).not.toHaveBeenCalled()
    vi.advanceTimersByTime(500)
    expect(onPhase).toHaveBeenCalledWith('not-found')
  })

  test('signaling connecting late starts the peer-wait clock from that point, not from t=0', () => {
    const conn = fakeConn(false)
    const provider = fakeProvider([conn])
    const onPhase = vi.fn()
    watchTableProbe(provider, { onPhase, signalingTimeoutMs: 1000, peerTimeoutMs: 500 })

    vi.advanceTimersByTime(900) // right before the signaling timeout
    conn.emit('connect')
    vi.advanceTimersByTime(499)
    expect(onPhase).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onPhase).toHaveBeenCalledWith('not-found')
  })

  test('two signaling conns: either connecting triggers the transition, and the other listener is torn down', () => {
    const connA = fakeConn(false)
    const connB = fakeConn(false)
    const provider = fakeProvider([connA, connB])
    const onPhase = vi.fn()
    watchTableProbe(provider, { onPhase, signalingTimeoutMs: 1000, peerTimeoutMs: 500 })

    connB.emit('connect')
    expect(connA.listenerCount('connect')).toBe(0)

    // A late connect from A must not double-fire anything.
    connA.emit('connect')
    vi.advanceTimersByTime(500)
    expect(onPhase).toHaveBeenCalledTimes(1)
    expect(onPhase).toHaveBeenCalledWith('not-found')
  })
})
