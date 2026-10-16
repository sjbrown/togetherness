/**
 * tests/unit/soft-lock.test.js
 *
 * Tests for the advisory soft-lock element-request protocol's pure
 * derivation functions (src/soft_lock.js).
 *
 * Schema:
 *   desired: { [elId]: { ts: number, holding: boolean } }
 *   holding:true  = this client's own claim, ts = last (re)claimed
 *   holding:false = this client's own outstanding acquisition bid,
 *                   ts = when the bid started
 *
 * By convention, `desired` is broadcast as a plain object -- `{}` when
 * empty, never null -- though every function here still tolerates a
 * null or missing value from a foreign/older peer.
 */

import { describe, test, expect } from 'vitest'
import {
  REQUEST_WINDOW_MS,
  CYCLE_MS,
  FADE_END,
  LOOP_BUFFER_MS,
  fadeVanish,
  growVanish,
  vanishOffsets,
  cycleMs,
  windowProgress,
  vanishFrames,
  getHolderClientId,
  isElementHeldByOther,
  getOtherHoldersOf,
  getClaimTimestamp,
  getAcquirersOf,
  isElementContested,
  getAllContestedElementIds,
  resolveElementWinner,
  isRequestWindowElapsed,
  computeTickActions,
} from '../../src/soft_lock.js'

// Build a plain Map<clientId, state> — the same shape awareness.getStates()
// returns.
function statesMap(entries) {
  return new Map(entries)
}

// Shorthand for the held (holding:true) portion of a `desired` field. Any
// elId not given an explicit timestamp in claimedAt defaults to 0 (never
// explicitly claimed — e.g. the original passive holder case).
function held(elIds, claimedAt = {}) {
  const out = {}
  for (const elId of elIds) out[elId] = { ts: claimedAt[elId] ?? 0, holding: true }
  return out
}

// Shorthand for a single outstanding bid (holding:false) entry.
function bid(elId, ts) {
  return { [elId]: { ts, holding: false } }
}

// ── 1. Basic ownership queries ──────────────────────────────────────────────

describe('getHolderClientId / isElementHeldByOther', () => {
  test('returns the clientId holding elId', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: held([]) }],
    ])
    expect(getHolderClientId('goblin-1', states)).toBe(1)
  })

  test('returns null when nobody holds elId', () => {
    const states = statesMap([[1, { desired: held([]) }], [2, { desired: held(['other']) }]])
    expect(getHolderClientId('goblin-1', states)).toBeNull()
  })

  test('isElementHeldByOther is true when a different client holds it', () => {
    const states = statesMap([[1, { desired: held(['goblin-1']) }]])
    expect(isElementHeldByOther('goblin-1', states, 2)).toBe(true)
  })

  test('isElementHeldByOther is false when I am the holder', () => {
    const states = statesMap([[1, { desired: held(['goblin-1']) }]])
    expect(isElementHeldByOther('goblin-1', states, 1)).toBe(false)
  })

  test('isElementHeldByOther is false when unheld', () => {
    const states = statesMap([[1, { desired: held([]) }]])
    expect(isElementHeldByOther('goblin-1', states, 2)).toBe(false)
  })

  test('a bidding (holding:false) entry does not count as holding it', () => {
    const states = statesMap([[1, { desired: bid('goblin-1', 1000) }]])
    expect(getHolderClientId('goblin-1', states)).toBeNull()
    expect(isElementHeldByOther('goblin-1', states, 2)).toBe(false)
  })
})

describe('getOtherHoldersOf', () => {
  test('returns clientIds (excluding myClientId) who also hold elId', () => {
    const states = statesMap([
      [1, { desired: held(['g1']) }],
      [2, { desired: held(['g1']) }],
      [3, { desired: held(['other']) }],
    ])
    expect(getOtherHoldersOf('g1', states, 1)).toEqual([2])
  })

  test('returns empty array when nobody else holds it', () => {
    const states = statesMap([[1, { desired: held(['g1']) }]])
    expect(getOtherHoldersOf('g1', states, 1)).toEqual([])
  })

  test('does not require myClientId to hold it at all', () => {
    const states = statesMap([[2, { desired: held(['g1']) }]])
    expect(getOtherHoldersOf('g1', states, 1)).toEqual([2])
  })
})

describe('getClaimTimestamp', () => {
  test('returns the claim timestamp for a held elId', () => {
    const states = statesMap([[1, { desired: held(['g1'], { g1: 5000 }) }]])
    expect(getClaimTimestamp('g1', states, 1)).toBe(5000)
  })

  test('returns 0 when the client does not hold elId', () => {
    const states = statesMap([[1, { desired: held(['other'], { other: 5000 }) }]])
    expect(getClaimTimestamp('g1', states, 1)).toBe(0)
  })

  test('returns 0 for a client merely bidding on elId, not holding it', () => {
    const states = statesMap([[1, { desired: bid('g1', 5000) }]])
    expect(getClaimTimestamp('g1', states, 1)).toBe(0)
  })

  test('returns the actual value (0) for an elId explicitly claimed at time zero', () => {
    // An entry whose ts is 0 is still a real claim, not "no claim" --
    // getClaimTimestamp can't tell them apart by return value alone, but
    // 0 already loses to anything real wherever it's consumed.
    const states = statesMap([[1, { desired: { g1: { ts: 0, holding: true } } }]])
    expect(getClaimTimestamp('g1', states, 1)).toBe(0)
  })

  test('returns 0 for an unknown client', () => {
    const states = statesMap([])
    expect(getClaimTimestamp('g1', states, 99)).toBe(0)
  })
})

// ── 2. Acquirer queries ──────────────────────────────────────────────────────

describe('getAcquirersOf', () => {
  test('finds a bidding entry as an acquirer', () => {
    const states = statesMap([[2, { desired: bid('g1', 1000) }]])
    expect(getAcquirersOf('g1', states)).toEqual([{ clientId: 2, ts: 1000 }])
  })

  test('ignores bidding entries for other elIds', () => {
    const states = statesMap([[2, { desired: bid('g2', 1000) }]])
    expect(getAcquirersOf('g1', states)).toEqual([])
  })

  test('handles null/missing desired gracefully', () => {
    const states = statesMap([[1, { desired: held(['g1']) }], [2, {}]])
    expect(getAcquirersOf('g1', states)).toEqual([])
  })

  test('finds multiple acquirers across clients', () => {
    const states = statesMap([
      [2, { desired: bid('g1', 1000) }],
      [3, { desired: bid('g1', 1200) }],
    ])
    expect(getAcquirersOf('g1', states)).toEqual([{ clientId: 2, ts: 1000 }, { clientId: 3, ts: 1200 }])
  })
})

describe('isElementContested / getAllContestedElementIds', () => {
  test('contested when there is an outstanding acquirer', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 1000) }],
    ])
    expect(isElementContested('goblin-1', states)).toBe(true)
  })

  test('not contested when nobody has requested it', () => {
    const states = statesMap([[1, { desired: held(['goblin-1']) }]])
    expect(isElementContested('goblin-1', states)).toBe(false)
  })

  test('a holder with only a claim timestamp (no bids) is not contested', () => {
    const states = statesMap([[1, { desired: held(['goblin-1'], { 'goblin-1': 2500 }) }]])
    expect(isElementContested('goblin-1', states)).toBe(false)
  })

  test('getAllContestedElementIds sweeps every acquisition across all clients', () => {
    const states = statesMap([
      [1, { desired: held(['g1', 'g2']) }],
      [2, { desired: bid('g1', 1000) }],
      [3, { desired: bid('g2', 1200) }],
    ])
    expect(getAllContestedElementIds(states)).toEqual(new Set(['g1', 'g2']))
  })

  test('getAllContestedElementIds is empty when nobody has any bids', () => {
    const states = statesMap([[1, { desired: held(['g1'], { g1: 500 }) }]])
    expect(getAllContestedElementIds(states)).toEqual(new Set())
  })
})

// ── 3. Winner resolution ─────────────────────────────────────────────────────

describe('resolveElementWinner', () => {
  test('returns null when there are no acquirers', () => {
    const states = statesMap([[1, { desired: held(['goblin-1']) }]])
    expect(resolveElementWinner('goblin-1', states)).toBeNull()
  })

  test('acquirer wins when the holder has no claim timestamp at all', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1']) }], // ts=0 — original passive holder
      [2, { desired: bid('goblin-1', 5000) }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 2, ts: 5000 })
  })

  test('holder claim ts >= acquirer ts rebuts the acquirer', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1'], { 'goblin-1': 3500 }) }],
      [2, { desired: bid('goblin-1', 1000) }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toBeNull()
  })

  test('holder claim ts < acquirer ts does NOT rebut (stale claim)', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1'], { 'goblin-1': 500 }) }],
      [2, { desired: bid('goblin-1', 1000) }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 2, ts: 1000 })
  })

  test('earliest acquirer wins among multiple acquirers', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 2000) }],
      [3, { desired: bid('goblin-1', 1000) }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 3, ts: 1000 })
  })

  test('exact ts tie between acquirers broken by lowest clientId', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1']) }],
      [5, { desired: bid('goblin-1', 1000) }],
      [3, { desired: bid('goblin-1', 1000) }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 3, ts: 1000 })
  })

  test('no holder at all still resolves an acquirer as winner', () => {
    const states = statesMap([[2, { desired: bid('goblin-1', 1000) }]])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 2, ts: 1000 })
  })
})

describe('isRequestWindowElapsed', () => {
  test('false before REQUEST_WINDOW_MS has passed', () => {
    expect(isRequestWindowElapsed({ ts: 1000 }, 1000 + REQUEST_WINDOW_MS - 1)).toBe(false)
  })

  test('true once REQUEST_WINDOW_MS has passed', () => {
    expect(isRequestWindowElapsed({ ts: 1000 }, 1000 + REQUEST_WINDOW_MS)).toBe(true)
  })
})

// ── 4. Scenario walkthroughs — sequenced awareness payloads ─────────────────

describe('Scenario 6a — clean handoff (uncontested)', () => {
  test('Alice holds, Bailey requests, nobody rebuts, Bailey wins at t=8000', () => {
    let states = statesMap([
      [1 /* Alice  */, { desired: held(['goblin-1'], { 'goblin-1': 0 }) }],
      [2 /* Bailey */, { desired: held([]) }],
    ])
    expect(isElementContested('goblin-1', states)).toBe(false)

    states = statesMap([
      [1, { desired: held(['goblin-1'], { 'goblin-1': 0 }) }],
      [2, { desired: bid('goblin-1', 5000) }],
    ])
    expect(isElementContested('goblin-1', states)).toBe(true)
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 2, ts: 5000 })

    const winner = resolveElementWinner('goblin-1', states)
    expect(isRequestWindowElapsed(winner, 8000)).toBe(true)
    expect(winner.clientId).toBe(2)
  })
})

describe('Scenario 6b — aborted handoff (holder rebuts before deadline)', () => {
  test('Alice re-asserts dragon-mini before t=4000, defeating Bailey\'s request', () => {
    let states = statesMap([
      [1, { desired: held(['dragon-mini'], { 'dragon-mini': 0 }) }],
    ])

    states = statesMap([
      [1, { desired: held(['dragon-mini'], { 'dragon-mini': 0 }) }],
      [2, { desired: bid('dragon-mini', 1000) }],
    ])
    expect(isElementContested('dragon-mini', states)).toBe(true)

    // t=2500 — Alice re-clicks her own held element: selecting it again
    // naturally refreshes her claim timestamp (no separate "reassert" call
    // needed in the new design — see soft_lock.js header).
    states = statesMap([
      [1, { desired: held(['dragon-mini'], { 'dragon-mini': 2500 }) }],
      [2, { desired: bid('dragon-mini', 1000) }],
    ])
    expect(isElementContested('dragon-mini', states)).toBe(true) // still shows as requested…
    expect(resolveElementWinner('dragon-mini', states)).toBeNull() // …but Alice's claim rebuts it

    expect(getAcquirersOf('dragon-mini', states)).toEqual([{ clientId: 2, ts: 1000 }])
    expect(resolveElementWinner('dragon-mini', states)).toBeNull()
  })
})

describe('Scenario 6c — partial transfer out of a multi-selection', () => {
  test('Cass requests only goblin-2 out of Alice\'s 3-element group; siblings untouched', () => {
    let states = statesMap([
      [1, { desired: held(['goblin-1', 'goblin-2', 'goblin-3'], { 'goblin-1': 0, 'goblin-2': 0, 'goblin-3': 0 }) }],
    ])

    states = statesMap([
      [1, { desired: held(['goblin-1', 'goblin-2', 'goblin-3'], { 'goblin-1': 0, 'goblin-2': 0, 'goblin-3': 0 }) }],
      [3, { desired: bid('goblin-2', 1000) }],
    ])

    expect(isElementContested('goblin-1', states)).toBe(false)
    expect(isElementContested('goblin-2', states)).toBe(true)
    expect(isElementContested('goblin-3', states)).toBe(false)

    const winner = resolveElementWinner('goblin-2', states)
    expect(winner).toEqual({ clientId: 3, ts: 1000 })
    expect(isRequestWindowElapsed(winner, 4000)).toBe(true)
  })
})

describe('Scenario 6d — two simultaneous requesters on two different elements', () => {
  test('Alice defends g1 but not g2; Bailey loses g1, Cass wins g2', () => {
    let states = statesMap([
      [1, { desired: held(['g1', 'g2', 'g3'], { g1: 0, g2: 0, g3: 0 }) }],
    ])

    states = statesMap([
      [1, { desired: held(['g1', 'g2', 'g3'], { g1: 0, g2: 0, g3: 0 }) }],
      [2 /* Bailey */, { desired: bid('g1', 1000) }],
      [3 /* Cass   */, { desired: bid('g2', 1200) }],
    ])
    expect(isElementContested('g1', states)).toBe(true)
    expect(isElementContested('g2', states)).toBe(true)
    expect(isElementContested('g3', states)).toBe(false)

    // t=3500 — Alice re-clicks g1 only: targeted claim refresh, g2's claim
    // timestamp (0, never explicitly claimed) is untouched.
    states = statesMap([
      [1, { desired: held(['g1', 'g2', 'g3'], { g1: 3500, g2: 0, g3: 0 }) }],
      [2, { desired: bid('g1', 1000) }],
      [3, { desired: bid('g2', 1200) }],
    ])

    expect(resolveElementWinner('g1', states)).toBeNull() // rebutted
    expect(resolveElementWinner('g2', states)).toEqual({ clientId: 3, ts: 1200 }) // undefended, stands

    const cassWinner = resolveElementWinner('g2', states)
    expect(isRequestWindowElapsed(cassWinner, 4200)).toBe(true)
  })
})

// ── 5. computeTickActions ────────────────────────────────────────────────────

describe('computeTickActions', () => {
  test('no-op tick: nothing pending, nothing held, nothing to do', () => {
    const states = statesMap([[1, { desired: null }]])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 0 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('acquirer tick before window elapsed: no action yet', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 5000) }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 6000 })
    expect(result.elIdsToAcquire).toEqual([])
  })

  test('scenario 6a from Bailey\'s tick: promotes at t=8000', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 5000) }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 8000 })
    expect(result).toEqual({ elIdsToAcquire: ['goblin-1'], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('scenario 6a from Alice\'s tick: releases at t=8000, symmetric with Bailey\'s', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 5000) }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 8000 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: ['goblin-1'] })
  })

  test('scenario 6b from Bailey\'s tick: rebutted request is dropped, not acquired', () => {
    const states = statesMap([
      [1, { desired: held(['dragon-mini'], { 'dragon-mini': 2500 }) }],
      [2, { desired: bid('dragon-mini', 1000) }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 4000 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: ['dragon-mini'], elIdsToRelease: [] })
  })

  test('scenario 6b from Alice\'s tick: rebutted successfully, keeps holding, nothing released', () => {
    const states = statesMap([
      [1, { desired: held(['dragon-mini'], { 'dragon-mini': 2500 }) }],
      [2, { desired: bid('dragon-mini', 1000) }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 4000 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('scenario 6c from Cass\'s tick: partial transfer acquires only the requested elId', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1', 'goblin-2', 'goblin-3']) }],
      [3, { desired: bid('goblin-2', 1000) }],
    ])
    const result = computeTickActions({ myClientId: 3, awarenessStates: states, now: 4000 })
    expect(result).toEqual({ elIdsToAcquire: ['goblin-2'], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('scenario 6c from Alice\'s tick: releases only goblin-2, siblings untouched', () => {
    const states = statesMap([
      [1, { desired: held(['goblin-1', 'goblin-2', 'goblin-3']) }],
      [3, { desired: bid('goblin-2', 1000) }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 4000 })
    expect(result.elIdsToRelease).toEqual(['goblin-2'])
  })

  test('scenario 6d from Alice\'s tick: releases g2 (undefended) but keeps g1 (defended)', () => {
    const states = statesMap([
      [1, { desired: held(['g1', 'g2', 'g3'], { g1: 3500, g2: 0, g3: 0 }) }],
      [2, { desired: bid('g1', 1000) }],
      [3, { desired: bid('g2', 1200) }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 4200 })
    expect(result.elIdsToRelease).toEqual(['g2'])
  })

  test('scenario 6d from Bailey\'s tick: g1 request is dropped (rebutted)', () => {
    const states = statesMap([
      [1, { desired: held(['g1', 'g2', 'g3'], { g1: 3500, g2: 0, g3: 0 }) }],
      [2, { desired: bid('g1', 1000) }],
      [3, { desired: bid('g2', 1200) }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 4200 })
    expect(result.elIdsToDropRequest).toEqual(['g1'])
    expect(result.elIdsToAcquire).toEqual([])
  })

  test('scenario 6d from Cass\'s tick: g2 is acquired', () => {
    const states = statesMap([
      [1, { desired: held(['g1', 'g2', 'g3'], { g1: 3500, g2: 0, g3: 0 }) }],
      [2, { desired: bid('g1', 1000) }],
      [3, { desired: bid('g2', 1200) }],
    ])
    const result = computeTickActions({ myClientId: 3, awarenessStates: states, now: 4200 })
    expect(result.elIdsToAcquire).toEqual(['g2'])
  })

  test('missing local state (client never broadcast anything) ticks as a safe no-op', () => {
    const states = statesMap([])
    const result = computeTickActions({ myClientId: 99, awarenessStates: states, now: 0 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: [] })
  })
})

// ── 6. Live-bug regressions, transcribed from real traces ──────────────────

describe('computeTickActions — stale-holder regression (2nd real trace)', () => {
  test('B has already promoted (its bid entry is gone); A must still release via claimedAt fallback', () => {
    const states = statesMap([
      [5 /* A, stale holder, higher id, never claimed explicitly */, { desired: held(['die-1']) }],
      [2 /* B, already promoted, lower id, has a claim timestamp */, { desired: held(['die-1'], { 'die-1': 1783068723151 }) }],
    ])
    expect(resolveElementWinner('die-1', states)).toBeNull() // old logic would find nothing here

    const result = computeTickActions({ myClientId: 5, awarenessStates: states, now: 999999 })
    expect(result.elIdsToRelease).toEqual(['die-1'])
  })

  test('the winning side does not also release — no oscillation', () => {
    const states = statesMap([
      [5, { desired: held(['die-1']) }],
      [2, { desired: held(['die-1'], { 'die-1': 1783068723151 }) }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 999999 })
    expect(result.elIdsToRelease).toEqual([])
  })

  test('no false positive: uniquely-held elements are never released via the fallback', () => {
    const states = statesMap([
      [1, { desired: held(['die-1']) }],
      [2, { desired: held(['die-2']) }], // different element
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 999999 })
    expect(result.elIdsToRelease).toEqual([])
  })
})

describe('computeTickActions — directional fallback regression (3rd real trace)', () => {
  test('acquirer with a HIGHER clientId still correctly keeps it, via its own claim timestamp', () => {
    // B (lower id) originally held it with no explicit claim (plain select,
    // never went through the request flow). A (higher id) requested and
    // won it — A's claim ts now carries its acquisition moment.
    const states = statesMap([
      [3543409708 /* A, acquirer, higher clientId */, { desired: held(['sample-s0d1'], { 'sample-s0d1': 1783068723151 }) }],
      [2689850105 /* B, original passive holder, lower clientId, no claim */, { desired: held(['sample-s0d1']) }],
    ])

    const fromA = computeTickActions({ myClientId: 3543409708, awarenessStates: states, now: 1783068726219 })
    expect(fromA.elIdsToRelease).toEqual([])

    const fromB = computeTickActions({ myClientId: 2689850105, awarenessStates: states, now: 1783068726219 })
    expect(fromB.elIdsToRelease).toEqual(['sample-s0d1'])
  })

  test('true simultaneity (both zero claim timestamps) still falls back to clientId deterministically', () => {
    const states = statesMap([
      [5, { desired: held(['free-for-all']) }],
      [2, { desired: held(['free-for-all']) }],
    ])
    const fromHigher = computeTickActions({ myClientId: 5, awarenessStates: states, now: 0 })
    const fromLower  = computeTickActions({ myClientId: 2, awarenessStates: states, now: 0 })
    expect(fromHigher.elIdsToRelease).toEqual(['free-for-all'])
    expect(fromLower.elIdsToRelease).toEqual([])
  })
})

// ── Request animation ────────────────────────────────────────────────────────

const nums = (s) => s.split(';').map(Number)

describe('vanishOffsets', () => {
  test('v=0 is the full ring: the transparent stops collapse to the start', () => {
    const { a, b } = vanishOffsets(0)
    expect(a).toBe(0)
    expect(b).toBeCloseTo(0.02, 5)
  })

  test('v=1 pushes the colours into the last few percent', () => {
    const { a, b } = vanishOffsets(1)
    expect(a).toBeCloseTo(FADE_END, 5)
    expect(b).toBeGreaterThan(a)
    expect(b).toBeLessThan(1)
  })

  test('stops stay ordered and inside [0, 1] across the whole range', () => {
    for (let i = 0; i <= 100; i++) {
      const { a, b } = vanishOffsets(i / 100)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(b).toBeGreaterThanOrEqual(a)
      expect(b).toBeLessThanOrEqual(1)
    }
  })

  test('a custom end limits how far the colours retreat', () => {
    expect(vanishOffsets(1, 0.5).a).toBeCloseTo(0.5, 5)
  })
})

describe('curves', () => {
  test('fade eases in: slow at first, faster later', () => {
    expect(fadeVanish(0)).toBe(0)
    expect(fadeVanish(0.5)).toBeCloseTo(0.25, 5)
    expect(fadeVanish(1)).toBe(1)
  })

  test('grow runs the other way, linearly: nearly gone at the bid, full at the deadline', () => {
    expect(growVanish(0)).toBe(1)
    expect(growVanish(0.5)).toBeCloseTo(0.5, 5)
    expect(growVanish(1)).toBe(0)
  })
})

describe('cycle timing', () => {
  test('the cycle is the request window plus the buffer', () => {
    expect(CYCLE_MS).toBe(REQUEST_WINDOW_MS + LOOP_BUFFER_MS)
  })

  test('progress rises across the window and holds through the buffer', () => {
    expect(windowProgress(0)).toBe(0)
    expect(windowProgress(REQUEST_WINDOW_MS / 2)).toBeCloseTo(0.5, 5)
    expect(windowProgress(REQUEST_WINDOW_MS)).toBe(1)
    expect(windowProgress(REQUEST_WINDOW_MS + LOOP_BUFFER_MS - 1)).toBe(1)
  })

  test('the cycle repeats instead of ending', () => {
    expect(windowProgress(CYCLE_MS)).toBe(0)
    expect(windowProgress(CYCLE_MS + REQUEST_WINDOW_MS / 2)).toBeCloseTo(0.5, 5)
    expect(cycleMs(3 * CYCLE_MS + 250)).toBe(250)
  })

  test('a request stamped in the future (clock skew) counts as just started', () => {
    expect(cycleMs(-500)).toBe(0)
    expect(windowProgress(-500)).toBe(0)
  })
})

describe('vanishFrames', () => {
  const fade = vanishFrames(fadeVanish)
  const grow = vanishFrames(growVanish)

  test('key times run from 0 to 1, strictly increasing', () => {
    const kt = nums(fade.keyTimes)
    expect(kt[0]).toBe(0)
    expect(kt[kt.length - 1]).toBe(1)
    for (let i = 1; i < kt.length; i++) expect(kt[i]).toBeGreaterThan(kt[i - 1])
  })

  test('every track has one value per key time', () => {
    for (const f of [fade, grow]) {
      const n = nums(f.keyTimes).length
      expect(nums(f.a)).toHaveLength(n)
      expect(nums(f.b)).toHaveLength(n)
    }
  })

  test('the window ends at its share of the cycle, then the last frame is held', () => {
    const kt = nums(fade.keyTimes)
    const a = nums(fade.a)
    expect(kt[kt.length - 2]).toBeCloseTo(REQUEST_WINDOW_MS / CYCLE_MS, 3)
    expect(a[a.length - 1]).toBe(a[a.length - 2])
  })

  test('fade starts as the full ring and ends nearly gone', () => {
    const a = nums(fade.a)
    expect(a[0]).toBe(0)
    expect(a[a.length - 1]).toBeCloseTo(FADE_END, 3)
  })

  test('grow starts nearly gone and ends as the full ring', () => {
    const a = nums(grow.a)
    expect(a[0]).toBeCloseTo(FADE_END, 3)
    expect(a[a.length - 1]).toBe(0)
  })

  test('fade lags a linear sweep midway (ease-in), grow does not', () => {
    const mid = (f) => nums(f.a)[12]
    expect(mid(fade)).toBeCloseTo(FADE_END * 0.25, 3)
    expect(mid(grow)).toBeCloseTo(FADE_END * 0.5, 3)
  })
})

describe('vanishFrames started mid-cycle', () => {
  // Evaluate a frames track at fraction f of the cycle by linear interpolation.
  const at = (frames, track, f) => {
    const kt = nums(frames.keyTimes)
    const vs = nums(frames[track])
    for (let i = 1; i < kt.length; i++) {
      if (f <= kt[i]) return vs[i - 1] + (vs[i] - vs[i - 1]) * ((f - kt[i - 1]) / (kt[i] - kt[i - 1]))
    }
    return vs[vs.length - 1]
  }
  const PHASES = [0, 1, 500, 1234, REQUEST_WINDOW_MS, REQUEST_WINDOW_MS + 400, CYCLE_MS - 20, CYCLE_MS - 5, CYCLE_MS - 1]

  test.each(PHASES)('phase %i: key times start at 0, end at 1, strictly increasing', (phase) => {
    for (const curve of [fadeVanish, growVanish]) {
      const f = vanishFrames(curve, phase)
      const kt = nums(f.keyTimes)
      expect(kt[0]).toBe(0)
      expect(kt[kt.length - 1]).toBe(1)
      for (let i = 1; i < kt.length; i++) expect(kt[i]).toBeGreaterThan(kt[i - 1])
      expect(nums(f.a)).toHaveLength(kt.length)
      expect(nums(f.b)).toHaveLength(kt.length)
    }
  })

  test.each(PHASES)('phase %i: tracks the unrotated cycle shifted by the phase', (phase) => {
    const base = vanishFrames(fadeVanish)
    const rotated = vanishFrames(fadeVanish, phase)
    for (let tau = 0; tau <= CYCLE_MS; tau += 53) {
      const t = (phase + tau) % CYCLE_MS
      // the wrap back to the start is a step; skip the few ms around it
      if (t < 10 || CYCLE_MS - t < 10 || Math.abs(tau - (CYCLE_MS - phase)) < 10) continue
      expect(at(rotated, 'a', tau / CYCLE_MS)).toBeCloseTo(at(base, 'a', t / CYCLE_MS), 2)
    }
  })

  test('the rotated cycle is seamless at its own repeat point', () => {
    const f = vanishFrames(growVanish, 1700)
    const a = nums(f.a)
    expect(a[a.length - 1]).toBe(a[0])
  })

  test('the first frame is where the unrotated cycle is at that phase', () => {
    const base = vanishFrames(fadeVanish)
    const f = vanishFrames(fadeVanish, 1500)
    expect(nums(f.a)[0]).toBeCloseTo(at(base, 'a', 1500 / CYCLE_MS), 3)
  })
})
