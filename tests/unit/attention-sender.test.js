/**
 * tests/unit/attention-sender.test.js
 *
 * The local player's attention state machine: what it writes to awareness
 * on entry, moves, clicks, idle-out and dismissal, and the throttle.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { T, createSender, anchoredAge, makeAnchor, clickLifeMs } from '../../src/attention_mode.js'

let clock, writes, sender

function make(userId = 'me') {
  clock = 1_000_000
  writes = []
  sender = createSender({ userId, write: (f) => writes.push(f), now: () => clock })
}

const lastField = (k) => [...writes].reverse().find((w) => k in w)?.[k]
const states = (entries) => new Map(entries)

beforeEach(() => make())

describe('anchoredAge', () => {
  test('ignores clock skew between peers', () => {
    // Sender clock is an hour ahead; its newest timestamp arrived at local 500.
    const skew = 3_600_000
    const age = anchoredAge(makeAnchor(10_000 + skew, 500), 800)
    expect(age(10_000 + skew)).toBe(300)
    expect(age(9_000 + skew)).toBe(1300)
  })
})

describe('entering', () => {
  test('writes a live attention and an origin with no end', () => {
    sender.enter(100.4, 200.6, 10, 20, 1.23456)
    expect(sender.active()).toBe(true)
    expect(writes).toEqual([{
      attention:  { trail: [], clicks: [], last: clock, scale: 1.235 },
      attnOrigin: [100, 201, clock, 1.235],
    }])
  })

  test('replaces the previous origin', () => {
    sender.enter(0, 0, 0, 0, 1)
    sender.exit()
    clock += 5000
    sender.enter(50, 50, 0, 0, 1)
    expect(sender.origin()).toEqual([50, 50, clock, 1])
  })
})

describe('moving', () => {
  test('appends sampled points and throttles writes', () => {
    sender.enter(0, 0, 0, 0, 1)
    writes = []
    clock += 10
    sender.move(10, 0, 10, 0, 1)          // inside BROADCAST_MS of the entry write
    expect(writes).toEqual([])
    clock += T.BROADCAST_MS
    sender.tick()                          // trailing write
    expect(lastField('attention').trail).toEqual([[10, 0, clock - T.BROADCAST_MS]])
  })

  test('skips samples that barely moved', () => {
    sender.enter(0, 0, 0, 0, 1)
    clock += 1
    sender.move(1, 0, 1, 0, 1)
    clock += T.BROADCAST_MS
    sender.tick()
    expect(writes).toHaveLength(1)        // nothing pending
  })

  test('does nothing outside attention mode', () => {
    sender.move(10, 10, 10, 10, 1)
    sender.press(10, 10)
    expect(writes).toEqual([])
  })
})

describe('clicks', () => {
  test('bypass the throttle', () => {
    sender.enter(0, 0, 0, 0, 1)
    clock += 5
    sender.press(30, 40)
    expect(writes).toHaveLength(2)
    expect(lastField('attention').clicks).toEqual([[30, 40, clock]])
  })

  test('are trimmed once their animation is over', () => {
    sender.enter(0, 0, 0, 0, 1)
    sender.press(1, 1)
    clock += clickLifeMs() + 1
    sender.press(2, 2)
    expect(lastField('attention').clicks).toEqual([[2, 2, clock]])
  })
})

describe('leaving', () => {
  test('idles out after IDLE_MS, stamping the origin end', () => {
    sender.enter(0, 0, 0, 0, 1)
    const t0 = clock
    clock += T.IDLE_MS
    sender.tick()
    expect(sender.active()).toBe(true)
    clock += 1
    sender.tick()
    expect(sender.active()).toBe(false)
    expect(writes.at(-1)).toEqual({ attention: null, attnOrigin: [0, 0, t0, 1, clock] })
  })

  test('activity postpones the idle-out', () => {
    sender.enter(0, 0, 0, 0, 1)
    clock += T.IDLE_MS - 10
    sender.press(5, 5)
    clock += T.IDLE_MS - 10
    sender.tick()
    expect(sender.active()).toBe(true)
  })
})

describe('dismissal', () => {
  test('a live origin cannot be dismissed by its owner', () => {
    sender.enter(0, 0, 0, 0, 1)
    expect(sender.dismissOwn()).toBe(false)
    sender.exit()
    expect(sender.dismissOwn()).toBe(true)
    expect(writes.at(-1)).toEqual({ attnOrigin: null })
  })

  test("a peer's dismissal of the expired origin clears it", () => {
    sender.enter(0, 0, 0, 0, 1)
    const t0 = clock
    sender.observe(states([[2, { user: { id: 'bob' }, attnDismiss: [['me', t0]] }]]), 1)
    expect(sender.origin()).not.toBeNull()          // still live: ignored
    sender.exit()
    sender.observe(states([[2, { user: { id: 'bob' }, attnDismiss: [['me', t0]] }]]), 1)
    expect(sender.origin()).toBeNull()
    expect(writes.at(-1)).toEqual({ attnOrigin: null })
  })

  test('dismissing a peer origin is announced, then forgotten once the owner drops it', () => {
    sender.dismiss('bob', 42)
    expect(writes.at(-1)).toEqual({ attnDismiss: [['bob', 42]] })
    sender.observe(states([[2, { user: { id: 'bob' }, attnOrigin: [0, 0, 42, 1, 50] }]]), 1)
    expect(sender.dismissals()).toEqual([['bob', 42]])
    sender.observe(states([[2, { user: { id: 'bob' }, attnOrigin: null }]]), 1)
    expect(sender.dismissals()).toEqual([])
    expect(writes.at(-1)).toEqual({ attnDismiss: [] })
  })

  test('keeps at most MAX_DISMISS dismissals', () => {
    for (let i = 0; i < T.MAX_DISMISS + 3; i++) sender.dismiss('bob', i)
    expect(sender.dismissals()).toHaveLength(T.MAX_DISMISS)
    expect(sender.dismissals()[0]).toEqual(['bob', 3])
  })
})

describe('scene', () => {
  test('draws the origin with its intro and the live trail at the current zoom', () => {
    sender.enter(0, 0, 0, 0, 1)
    const items = sender.scene(2)
    expect(items.map((i) => i.kind)).toEqual(['origin', 'live'])
    expect(items[0].intro.r0Px).toBe(T.ORIGIN_R * T.ORIGIN_INTRO_SCALE)
    expect(items[1].att.scale).toBe(2)
  })

  test('fades the trail after exit and a dismissed origin, then drops them', () => {
    sender.enter(0, 0, 0, 0, 1)
    sender.exit()
    sender.dismissOwn()
    expect(sender.scene(1).map((i) => [i.kind, i.fade])).toEqual([['origin', 1], ['live', 1]])
    clock += T.EXIT_MS
    expect(sender.scene(1)).toEqual([])
  })
})
