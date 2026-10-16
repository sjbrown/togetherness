/**
 * tests/unit/attention-receiver.test.js
 *
 * The model of other players' attention built from awareness states:
 * intros, clock anchoring, presumed idle-out, dismissal, replacement and
 * departure.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { T, createReceiver, receiverIntroR0 } from '../../src/attention_mode.js'

const ME = 1, BOB = 2
const SKEW = 3_600_000            // Bob's clock runs an hour ahead
let local, bobClock, rx, centre

function make() {
  local = 500
  bobClock = 1_000_000 + SKEW
  centre = [1000, 0]
  rx = createReceiver({ viewCentre: () => centre, now: () => local })
}

function bob(fields) {
  return new Map([
    [ME, { user: { id: 'me' } }],
    [BOB, { user: { id: 'bob', gradient: { c1: 'red', c2: 'blue' } }, ...fields }],
  ])
}

const live = (t0, last = t0) => ({
  attention:  { trail: [], clicks: [], last, scale: 1 },
  attnOrigin: [0, 0, t0, 1],
})

// Something that has just started fading out still has fade 1, so callers
// step the clock by 1ms before reading these.
const origins = () => rx.scene().filter((i) => i.kind === 'origin' && i.fade === 1)
const lives   = () => rx.scene().filter((i) => i.kind === 'live' && i.fade === 1)

beforeEach(make)

describe('a new live origin', () => {
  test('gets an intro sized to reach this view centre', () => {
    rx.sync(bob(live(bobClock)), ME)
    const [o] = origins()
    expect(o.intro.r0Px).toBe(receiverIntroR0([0, 0, bobClock, 1], centre))
    expect(o.intro.r0Px).toBe(1000)
    expect(o.intro.ms).toBe(T.ORIGIN_RX_INTRO_MS)
    expect(o.colors).toEqual({ c1: 'red', c2: 'blue' })
  })

  test('ages by its anchor, regardless of the peer clock', () => {
    rx.sync(bob(live(bobClock)), ME)
    local += 250
    const [o] = origins()
    expect(o.ageOf(bobClock)).toBe(250)
    expect(o.intro.age).toBe(250)
  })

  test('an origin first seen expired has no intro', () => {
    rx.sync(bob({ attention: null, attnOrigin: [0, 0, bobClock, 1, bobClock + 4000] }), ME)
    expect(origins()[0].intro).toBeNull()
  })
})

describe('presumed idle-out', () => {
  test('a peer silent for IDLE_MS is treated as idled out, with a presumed end', () => {
    rx.sync(bob(live(bobClock)), ME)
    local += T.IDLE_MS
    rx.tick()
    expect(lives()).toHaveLength(1)
    local += 1
    rx.tick()
    local += 1
    expect(lives()).toHaveLength(0)
    expect(origins()[0].origin[4]).toBe(bobClock + T.IDLE_MS)
  })

  test('the same stale state re-sent does not revive it; new input does', () => {
    rx.sync(bob(live(bobClock)), ME)
    local += T.IDLE_MS + 1
    rx.tick()
    rx.sync(bob(live(bobClock)), ME)
    local += 1
    expect(lives()).toHaveLength(0)
    expect(origins()[0].origin[4]).toBe(bobClock + T.IDLE_MS)
    rx.sync(bob(live(bobClock, bobClock + 5000)), ME)
    expect(lives()).toHaveLength(1)
  })
})

describe('dismissal and replacement', () => {
  const expired = (t0) => ({ attention: null, attnOrigin: [0, 0, t0, 1, t0 + 100] })

  test('a dismissal in any state hides the origin, fading it out', () => {
    rx.sync(bob(expired(bobClock)), ME)
    const states = bob(expired(bobClock))
    states.get(ME).attnDismiss = [['bob', bobClock]]
    rx.sync(states, ME)
    local += 1
    expect(origins()).toHaveLength(0)
    expect(rx.scene().filter((i) => i.kind === 'origin')).toHaveLength(1)   // fading
    local += T.EXIT_MS
    expect(rx.scene()).toEqual([])
  })

  test('a new origin replaces the old one, which fades', () => {
    rx.sync(bob(expired(bobClock)), ME)
    rx.sync(bob(live(bobClock + 9000)), ME)
    const items = rx.scene().filter((i) => i.kind === 'origin')
    expect(items.map((i) => [i.origin[2], i.fade])).toEqual([[bobClock, 1], [bobClock + 9000, 1]])
    expect(items[1].intro).not.toBeNull()
    local += T.EXIT_MS
    expect(origins().map((i) => i.origin[2])).toEqual([bobClock + 9000])
  })

  test('hitExpired finds only expired origins', () => {
    rx.sync(bob(live(bobClock)), ME)
    expect(rx.hitExpired(0, 0)).toBeNull()
    rx.sync(bob(expired(bobClock)), ME)
    expect(rx.hitExpired(0, 0)).toEqual({ userId: 'bob', t: bobClock })
    expect(rx.hitExpired(T.ORIGIN_R + 1, 0)).toBeNull()
  })
})

describe('departure', () => {
  test("a peer's origin and trail fade out when it leaves, then it is forgotten", () => {
    rx.sync(bob(live(bobClock)), ME)
    rx.sync(new Map([[ME, { user: { id: 'me' } }]]), ME)
    const items = rx.scene()
    expect(items.map((i) => i.kind).sort()).toEqual(['live', 'origin'])
    expect(items.every((i) => i.fade === 1)).toBe(true)
    // the vanished live origin was given an end, so it draws
    expect(Number.isFinite(items.find((i) => i.kind === 'origin').origin[4])).toBe(true)
    local += T.EXIT_MS
    expect(rx.scene()).toEqual([])
  })

  test('its own entry is never drawn as a peer', () => {
    const states = new Map([[ME, { user: { id: 'me' }, ...live(1) }]])
    rx.sync(states, ME)
    expect(rx.scene()).toEqual([])
  })
})
