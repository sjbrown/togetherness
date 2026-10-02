import { describe, test, expect } from 'vitest'
import { createSignalingTracker } from '../../src/signaling_status.js'

const two = (a = false, b = false) => createSignalingTracker(
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
    expect(r).toMatchObject({ changed: true, anyConnected: true, lostAll: false })
    expect(r.entry).toMatchObject({ url: 'ws://b', role: 'fallback', connected: true, connects: 1, lastChange: 1234 })
    expect(t.snapshot()[0].connected).toBe(false)
  })

  test('one of two dropping is not lostAll', () => {
    const t = two(true, true)
    const r = t.update('ws://b', false)
    expect(r).toMatchObject({ changed: true, anyConnected: true, lostAll: false })
    expect(t.anyConnected()).toBe(true)
    expect(r.entry.disconnects).toBe(1)
  })

  test('the last connected server dropping is lostAll', () => {
    const t = two(true, true)
    t.update('ws://a', false)
    const r = t.update('ws://b', false)
    expect(r).toMatchObject({ changed: true, anyConnected: false, lostAll: true })
  })

  test('a drop while already fully disconnected is not lostAll again', () => {
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
