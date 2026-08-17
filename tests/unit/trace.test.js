/**
 * tests/unit/trace.test.js
 *
 * trace.js is the recorder behind the Debug panel. What matters here is not
 * that it stores strings, but the four properties every call site depends on:
 * a muted channel costs nothing, a warning is never muted, the ring evicts
 * rather than grows, and seq stays monotonic so a gap is visible evidence of
 * eviction rather than a silent hole.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import * as Trace from '../../src/trace.js'

beforeEach(() => {
  Trace._reset()
})

describe('channel registry', () => {
  test('every channel constant appears in CHANNELS', () => {
    const ids = Trace.CHANNELS.map(c => c.id)
    for (const id of [Trace.BOOT, Trace.NET, Trace.OP, Trace.ENVELOPE, Trace.WIRE, Trace.APP]) {
      expect(ids).toContain(id)
    }
  })

  test('isChannel rejects anything not registered', () => {
    expect(Trace.isChannel(Trace.OP)).toBe(true)
    expect(Trace.isChannel('nonsense')).toBe(false)
  })

  test('wire starts muted — it is the verbose one', () => {
    expect(Trace.channelEnabled(Trace.WIRE)).toBe(false)
    expect(Trace.channelEnabled(Trace.OP)).toBe(true)
  })
})

describe('recording', () => {
  test('an event carries channel, message and detail', () => {
    Trace.op('append', 'placed a token', { id: 'tt-op-1' })
    const [e] = Trace.events()
    expect(e.ch).toBe(Trace.OP)
    expect(e.evt).toBe('append')
    expect(e.msg).toBe('placed a token')
    expect(e.detail).toEqual({ id: 'tt-op-1' })
    expect(e.level).toBe('info')
  })

  test('msg defaults to the event name', () => {
    Trace.op('append')
    expect(Trace.events()[0].msg).toBe('append')
  })

  test('a muted channel records nothing and returns null', () => {
    expect(Trace.wire('serialize', 'x')).toBeNull()
    expect(Trace.events()).toHaveLength(0)
  })

  test('unmuting a channel starts it recording', () => {
    Trace.setChannelEnabled(Trace.WIRE, true)
    Trace.wire('serialize', 'x')
    expect(Trace.events()).toHaveLength(1)
  })

  test('disabling recording silences every channel', () => {
    Trace.setEnabled(false)
    Trace.op('append', 'x')
    Trace.op('boom', 'x', null, 'error')
    expect(Trace.events()).toHaveLength(0)
  })

  test('a warning on a muted channel is still recorded', () => {
    // Muting is about volume, not about hiding evidence — the wire channel
    // is off by default and its drop warnings still have to land.
    expect(Trace.channelEnabled(Trace.WIRE)).toBe(false)
    Trace.wire('serialize-dropped', 'dropped 2', { unaddressable: 2 }, 'warn')
    Trace.wire('apply-unresolvable', 'no target', {}, 'error')
    Trace.wire('serialize', 'routine', {})
    const levels = Trace.events().map(e => e.level)
    expect(levels).toEqual(['warn', 'error'])
  })

  test('a function detail is only invoked when it will be recorded', () => {
    let calls = 0
    const build = () => { calls++; return { expensive: true } }

    Trace.wire('serialize', 'muted', build)
    expect(calls).toBe(0)

    Trace.setChannelEnabled(Trace.WIRE, true)
    Trace.wire('serialize', 'audible', build)
    expect(calls).toBe(1)
    expect(Trace.events()[0].detail).toEqual({ expensive: true })
  })

  test('a detail builder that throws is reported, not propagated', () => {
    expect(() => Trace.op('x', 'x', () => { throw new Error('nope') })).not.toThrow()
    expect(Trace.events()[0].detail.traceDetailError).toContain('nope')
  })
})

describe('the ring', () => {
  test('evicts oldest first once capacity is passed', () => {
    Trace.setCapacity(50) // the floor
    for (let i = 0; i < 60; i++) Trace.op('n', String(i))
    const evs = Trace.events()
    expect(evs).toHaveLength(50)
    expect(evs[0].msg).toBe('10')
    expect(evs[49].msg).toBe('59')
  })

  test('seq is monotonic across eviction, so the gap is visible', () => {
    Trace.setCapacity(50)
    for (let i = 0; i < 60; i++) Trace.op('n', String(i))
    const evs = Trace.events()
    expect(evs[0].seq).toBe(11)
    expect(Trace.counts().dropped).toBe(10)
  })

  test('lowering capacity trims immediately', () => {
    for (let i = 0; i < 80; i++) Trace.op('n', String(i))
    Trace.setCapacity(60)
    expect(Trace.events()).toHaveLength(60)
  })

  test('capacity is clamped to a sane range', () => {
    expect(Trace.setCapacity(1)).toBe(50)
    expect(Trace.setCapacity(999999)).toBe(5000)
  })

  test('clear empties the ring but does not restart seq', () => {
    Trace.op('a', 'one')
    Trace.op('b', 'two')
    Trace.clear()
    expect(Trace.events()).toHaveLength(0)
    Trace.op('c', 'three')
    expect(Trace.events()[0].seq).toBe(3)
  })
})

describe('reading', () => {
  test('events() hands back a copy the caller cannot use to edit the log', () => {
    Trace.op('a', 'one')
    const copy = Trace.events()
    copy.push({ seq: 99 })
    expect(Trace.events()).toHaveLength(1)
  })

  test('recent() is newest first and honours the limit', () => {
    for (let i = 0; i < 10; i++) Trace.op('n', String(i))
    const r = Trace.recent(3)
    expect(r.map(e => e.msg)).toEqual(['9', '8', '7'])
  })

  test('recent() filters to the channels asked for', () => {
    Trace.op('a', 'an op')
    Trace.net('b', 'a handshake')
    Trace.boot('c', 'a boot step')
    const r = Trace.recent(10, [Trace.NET, Trace.BOOT])
    expect(r.map(e => e.ch)).toEqual([Trace.BOOT, Trace.NET])
  })

  test('counts() reports per channel plus totals', () => {
    Trace.op('a', 'x')
    Trace.op('b', 'y')
    Trace.net('c', 'z')
    const c = Trace.counts()
    expect(c[Trace.OP]).toBe(2)
    expect(c[Trace.NET]).toBe(1)
    expect(c[Trace.ENVELOPE]).toBe(0)
    expect(c.total).toBe(3)
  })
})

describe('span', () => {
  test('records once, on close, with an elapsed ms in the detail', () => {
    const close = Trace.span(Trace.ENVELOPE, 'capture', 'captured')
    expect(Trace.events()).toHaveLength(0)
    close({ records: 4 })
    const [e] = Trace.events()
    expect(e.evt).toBe('capture')
    expect(e.detail.records).toBe(4)
    expect(typeof e.detail.ms).toBe('number')
  })

  test('closing twice records once', () => {
    const close = Trace.span(Trace.ENVELOPE, 'capture', 'captured')
    close()
    close()
    expect(Trace.events()).toHaveLength(1)
  })

  test('a span on a muted channel is a no-op that is still safe to close', () => {
    const close = Trace.span(Trace.WIRE, 'x', 'x')
    expect(close()).toBeNull()
    expect(Trace.events()).toHaveLength(0)
  })
})

describe('subscribers', () => {
  test('are called with each new event', () => {
    const seen = []
    Trace.subscribe(e => seen.push(e))
    Trace.op('a', 'one')
    expect(seen).toHaveLength(1)
    expect(seen[0].msg).toBe('one')
  })

  test('are called with null on clear', () => {
    const seen = []
    Trace.subscribe(e => seen.push(e))
    Trace.clear()
    expect(seen).toEqual([null])
  })

  test('unsubscribing stops delivery', () => {
    const seen = []
    const off = Trace.subscribe(e => seen.push(e))
    Trace.op('a', 'one')
    off()
    Trace.op('b', 'two')
    expect(seen).toHaveLength(1)
  })

  test('a throwing subscriber does not stop the recording or the others', () => {
    const seen = []
    Trace.subscribe(() => { throw new Error('bad subscriber') })
    Trace.subscribe(e => seen.push(e))
    expect(() => Trace.op('a', 'one')).not.toThrow()
    expect(seen).toHaveLength(1)
    expect(Trace.events()).toHaveLength(1)
  })
})

describe('snapshot', () => {
  test('is self-describing and carries the events', () => {
    Trace.op('a', 'one')
    const snap = Trace.snapshot()
    expect(snap.format).toBe('togetherness-trace')
    expect(snap.version).toBe(1)
    expect(snap.events).toHaveLength(1)
    expect(snap.counts.total).toBe(1)
    expect(typeof snap.generatedAt).toBe('string')
  })

  test('merges caller-supplied extras', () => {
    const snap = Trace.snapshot({ state: { table: { tableId: 'demo' } } })
    expect(snap.state.table.tableId).toBe('demo')
  })

  test('serializes to JSON without throwing', () => {
    Trace.op('a', 'one', { nested: { deep: [1, 2, 3] } })
    expect(() => JSON.stringify(Trace.snapshot())).not.toThrow()
  })
})
