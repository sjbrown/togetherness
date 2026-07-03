/**
 * tests/unit/soft-lock.test.js
 *
 * Tests for the advisory soft-lock element-request protocol's pure
 * derivation functions (src/soft-lock.js).
 *
 * Schema:
 *   selection: { [elId: string]: number } | null   // elId -> claim timestamp
 *   pendingRequests: { [elId]: number } | null      // outstanding acquisition bids ONLY
 */

import { describe, test, expect } from 'vitest'
import {
  REQUEST_WINDOW_MS,
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
} from '../../src/soft-lock.js'

// Build a plain Map<clientId, state> — the same shape awareness.getStates()
// returns.
function statesMap(entries) {
  return new Map(entries)
}

// Shorthand for building a selection field: { [elId]: claimTimestamp }.
// Any elId not given an explicit timestamp in claimedAt defaults to 0
// (never explicitly claimed — e.g. the original passive holder case).
function sel(elIds, claimedAt = {}) {
  const out = {}
  for (const elId of elIds) out[elId] = claimedAt[elId] ?? 0
  return out
}

// ── 1. Basic ownership queries ──────────────────────────────────────────────

describe('getHolderClientId / isElementHeldByOther', () => {
  test('returns the clientId holding elId', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1']) }],
      [2, { selection: sel([]) }],
    ])
    expect(getHolderClientId('goblin-1', states)).toBe(1)
  })

  test('returns null when nobody holds elId', () => {
    const states = statesMap([[1, { selection: sel([]) }], [2, { selection: sel(['other']) }]])
    expect(getHolderClientId('goblin-1', states)).toBeNull()
  })

  test('isElementHeldByOther is true when a different client holds it', () => {
    const states = statesMap([[1, { selection: sel(['goblin-1']) }]])
    expect(isElementHeldByOther('goblin-1', states, 2)).toBe(true)
  })

  test('isElementHeldByOther is false when I am the holder', () => {
    const states = statesMap([[1, { selection: sel(['goblin-1']) }]])
    expect(isElementHeldByOther('goblin-1', states, 1)).toBe(false)
  })

  test('isElementHeldByOther is false when unheld', () => {
    const states = statesMap([[1, { selection: sel([]) }]])
    expect(isElementHeldByOther('goblin-1', states, 2)).toBe(false)
  })
})

describe('getOtherHoldersOf', () => {
  test('returns clientIds (excluding myClientId) who also hold elId', () => {
    const states = statesMap([
      [1, { selection: sel(['g1']) }],
      [2, { selection: sel(['g1']) }],
      [3, { selection: sel(['other']) }],
    ])
    expect(getOtherHoldersOf('g1', states, 1)).toEqual([2])
  })

  test('returns empty array when nobody else holds it', () => {
    const states = statesMap([[1, { selection: sel(['g1']) }]])
    expect(getOtherHoldersOf('g1', states, 1)).toEqual([])
  })

  test('does not require myClientId to hold it at all', () => {
    const states = statesMap([[2, { selection: sel(['g1']) }]])
    expect(getOtherHoldersOf('g1', states, 1)).toEqual([2])
  })
})

describe('getClaimTimestamp', () => {
  test('returns the claim timestamp for a held elId', () => {
    const states = statesMap([[1, { selection: sel(['g1'], { g1: 5000 }) }]])
    expect(getClaimTimestamp('g1', states, 1)).toBe(5000)
  })

  test('returns 0 when the client does not hold elId', () => {
    const states = statesMap([[1, { selection: sel(['other'], { other: 5000 }) }]])
    expect(getClaimTimestamp('g1', states, 1)).toBe(0)
  })

  test('returns the actual value (0) for an elId explicitly claimed at time zero', () => {
    // Under the flat schema, "holding with no claim timestamp" can't occur
    // — holding IS having an entry, whatever its value. This documents the
    // one edge of that: an entry whose value happens to be 0 is still a
    // real claim (at ts=0), not "no claim" — getClaimTimestamp can't
    // distinguish it from "never held" by return value alone, which is
    // fine, since 0 already behaves correctly as "loses to anything real"
    // everywhere it's consumed (resolveElementWinner, computeTickActions).
    const states = statesMap([[1, { selection: { g1: 0 } }]])
    expect(getClaimTimestamp('g1', states, 1)).toBe(0)
  })

  test('returns 0 for an unknown client', () => {
    const states = statesMap([])
    expect(getClaimTimestamp('g1', states, 99)).toBe(0)
  })
})

// ── 2. Acquirer queries ──────────────────────────────────────────────────────

describe('getAcquirersOf', () => {
  test('finds a pendingRequests entry as an acquirer', () => {
    const states = statesMap([[2, { selection: sel([]), pendingRequests: { 'g1': 1000 } }]])
    expect(getAcquirersOf('g1', states)).toEqual([{ clientId: 2, ts: 1000 }])
  })

  test('ignores pendingRequests entries for other elIds', () => {
    const states = statesMap([[2, { pendingRequests: { 'g2': 1000 } }]])
    expect(getAcquirersOf('g1', states)).toEqual([])
  })

  test('handles null/missing pendingRequests gracefully', () => {
    const states = statesMap([[1, { selection: sel(['g1']), pendingRequests: null }], [2, {}]])
    expect(getAcquirersOf('g1', states)).toEqual([])
  })

  test('finds multiple acquirers across clients', () => {
    const states = statesMap([
      [2, { pendingRequests: { g1: 1000 } }],
      [3, { pendingRequests: { g1: 1200 } }],
    ])
    expect(getAcquirersOf('g1', states)).toEqual([{ clientId: 2, ts: 1000 }, { clientId: 3, ts: 1200 }])
  })
})

describe('isElementContested / getAllContestedElementIds', () => {
  test('contested when there is an outstanding acquirer', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1']) }],
      [2, { pendingRequests: { 'goblin-1': 1000 } }],
    ])
    expect(isElementContested('goblin-1', states)).toBe(true)
  })

  test('not contested when nobody has requested it', () => {
    const states = statesMap([[1, { selection: sel(['goblin-1']) }]])
    expect(isElementContested('goblin-1', states)).toBe(false)
  })

  test('a holder with only a claim timestamp (no pendingRequests) is not contested', () => {
    // The old design had a "lone retention entry" case sourced from
    // pendingRequests; that concept no longer exists. Holding + claiming is
    // expressed entirely via selection.claimedAt now, never pendingRequests.
    const states = statesMap([[1, { selection: sel(['goblin-1'], { 'goblin-1': 2500 }) }]])
    expect(isElementContested('goblin-1', states)).toBe(false)
  })

  test('getAllContestedElementIds sweeps every acquisition across all clients', () => {
    const states = statesMap([
      [1, { selection: sel(['g1', 'g2']) }],
      [2, { pendingRequests: { g1: 1000 } }],
      [3, { pendingRequests: { g2: 1200 } }],
    ])
    expect(getAllContestedElementIds(states)).toEqual(new Set(['g1', 'g2']))
  })

  test('getAllContestedElementIds is empty when nobody has any pendingRequests', () => {
    const states = statesMap([[1, { selection: sel(['g1'], { g1: 500 }) }]])
    expect(getAllContestedElementIds(states)).toEqual(new Set())
  })
})

// ── 3. Winner resolution ─────────────────────────────────────────────────────

describe('resolveElementWinner', () => {
  test('returns null when there are no acquirers', () => {
    const states = statesMap([[1, { selection: sel(['goblin-1']) }]])
    expect(resolveElementWinner('goblin-1', states)).toBeNull()
  })

  test('acquirer wins when the holder has no claim timestamp at all', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1']) }], // no claimedAt entry — original passive holder
      [2, { pendingRequests: { 'goblin-1': 5000 } }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 2, ts: 5000 })
  })

  test('holder claim ts >= acquirer ts rebuts the acquirer', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1'], { 'goblin-1': 3500 }) }],
      [2, { pendingRequests: { 'goblin-1': 1000 } }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toBeNull()
  })

  test('holder claim ts < acquirer ts does NOT rebut (stale claim)', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1'], { 'goblin-1': 500 }) }],
      [2, { pendingRequests: { 'goblin-1': 1000 } }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 2, ts: 1000 })
  })

  test('earliest acquirer wins among multiple acquirers', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1']) }],
      [2, { pendingRequests: { 'goblin-1': 2000 } }],
      [3, { pendingRequests: { 'goblin-1': 1000 } }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 3, ts: 1000 })
  })

  test('exact ts tie between acquirers broken by lowest clientId', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1']) }],
      [5, { pendingRequests: { 'goblin-1': 1000 } }],
      [3, { pendingRequests: { 'goblin-1': 1000 } }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 3, ts: 1000 })
  })

  test('no holder at all still resolves an acquirer as winner', () => {
    const states = statesMap([[2, { pendingRequests: { 'goblin-1': 1000 } }]])
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
      [1 /* Alice  */, { selection: sel(['goblin-1'], { 'goblin-1': 0 }) }],
      [2 /* Bailey */, { selection: sel([]) }],
    ])
    expect(isElementContested('goblin-1', states)).toBe(false)

    states = statesMap([
      [1, { selection: sel(['goblin-1'], { 'goblin-1': 0 }) }],
      [2, { selection: sel([]), pendingRequests: { 'goblin-1': 5000 } }],
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
      [1, { selection: sel(['dragon-mini'], { 'dragon-mini': 0 }) }],
    ])

    states = statesMap([
      [1, { selection: sel(['dragon-mini'], { 'dragon-mini': 0 }) }],
      [2, { pendingRequests: { 'dragon-mini': 1000 } }],
    ])
    expect(isElementContested('dragon-mini', states)).toBe(true)

    // t=2500 — Alice re-clicks her own held element: selecting it again
    // naturally refreshes her claim timestamp (no separate "reassert" call
    // needed in the new design — see soft-lock.js header).
    states = statesMap([
      [1, { selection: sel(['dragon-mini'], { 'dragon-mini': 2500 }) }],
      [2, { pendingRequests: { 'dragon-mini': 1000 } }],
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
      [1, { selection: sel(['goblin-1', 'goblin-2', 'goblin-3'], { 'goblin-1': 0, 'goblin-2': 0, 'goblin-3': 0 }) }],
    ])

    states = statesMap([
      [1, { selection: sel(['goblin-1', 'goblin-2', 'goblin-3'], { 'goblin-1': 0, 'goblin-2': 0, 'goblin-3': 0 }) }],
      [3, { pendingRequests: { 'goblin-2': 1000 } }],
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
      [1, { selection: sel(['g1', 'g2', 'g3'], { g1: 0, g2: 0, g3: 0 }) }],
    ])

    states = statesMap([
      [1, { selection: sel(['g1', 'g2', 'g3'], { g1: 0, g2: 0, g3: 0 }) }],
      [2 /* Bailey */, { pendingRequests: { g1: 1000 } }],
      [3 /* Cass   */, { pendingRequests: { g2: 1200 } }],
    ])
    expect(isElementContested('g1', states)).toBe(true)
    expect(isElementContested('g2', states)).toBe(true)
    expect(isElementContested('g3', states)).toBe(false)

    // t=3500 — Alice re-clicks g1 only: targeted claim refresh, g2's claim
    // timestamp (0, never explicitly claimed) is untouched.
    states = statesMap([
      [1, { selection: sel(['g1', 'g2', 'g3'], { g1: 3500, g2: 0, g3: 0 }) }],
      [2, { pendingRequests: { g1: 1000 } }],
      [3, { pendingRequests: { g2: 1200 } }],
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
    const states = statesMap([[1, { selection: null, pendingRequests: null }]])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 0 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('acquirer tick before window elapsed: no action yet', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1']) }],
      [2, { pendingRequests: { 'goblin-1': 5000 } }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 6000 })
    expect(result.elIdsToAcquire).toEqual([])
  })

  test('scenario 6a from Bailey\'s tick: promotes at t=8000', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1']) }],
      [2, { selection: null, pendingRequests: { 'goblin-1': 5000 } }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 8000 })
    expect(result).toEqual({ elIdsToAcquire: ['goblin-1'], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('scenario 6a from Alice\'s tick: releases at t=8000, symmetric with Bailey\'s', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1']) }],
      [2, { selection: null, pendingRequests: { 'goblin-1': 5000 } }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 8000 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: ['goblin-1'] })
  })

  test('scenario 6b from Bailey\'s tick: rebutted request is dropped, not acquired', () => {
    const states = statesMap([
      [1, { selection: sel(['dragon-mini'], { 'dragon-mini': 2500 }) }],
      [2, { pendingRequests: { 'dragon-mini': 1000 } }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 4000 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: ['dragon-mini'], elIdsToRelease: [] })
  })

  test('scenario 6b from Alice\'s tick: rebutted successfully, keeps holding, nothing released', () => {
    const states = statesMap([
      [1, { selection: sel(['dragon-mini'], { 'dragon-mini': 2500 }) }],
      [2, { pendingRequests: { 'dragon-mini': 1000 } }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 4000 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('scenario 6c from Cass\'s tick: partial transfer acquires only the requested elId', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1', 'goblin-2', 'goblin-3']) }],
      [3, { pendingRequests: { 'goblin-2': 1000 } }],
    ])
    const result = computeTickActions({ myClientId: 3, awarenessStates: states, now: 4000 })
    expect(result).toEqual({ elIdsToAcquire: ['goblin-2'], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('scenario 6c from Alice\'s tick: releases only goblin-2, siblings untouched', () => {
    const states = statesMap([
      [1, { selection: sel(['goblin-1', 'goblin-2', 'goblin-3']) }],
      [3, { pendingRequests: { 'goblin-2': 1000 } }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 4000 })
    expect(result.elIdsToRelease).toEqual(['goblin-2'])
  })

  test('scenario 6d from Alice\'s tick: releases g2 (undefended) but keeps g1 (defended)', () => {
    const states = statesMap([
      [1, { selection: sel(['g1', 'g2', 'g3'], { g1: 3500, g2: 0, g3: 0 }) }],
      [2, { pendingRequests: { g1: 1000 } }],
      [3, { pendingRequests: { g2: 1200 } }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 4200 })
    expect(result.elIdsToRelease).toEqual(['g2'])
  })

  test('scenario 6d from Bailey\'s tick: g1 request is dropped (rebutted)', () => {
    const states = statesMap([
      [1, { selection: sel(['g1', 'g2', 'g3'], { g1: 3500, g2: 0, g3: 0 }) }],
      [2, { pendingRequests: { g1: 1000 } }],
      [3, { pendingRequests: { g2: 1200 } }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 4200 })
    expect(result.elIdsToDropRequest).toEqual(['g1'])
    expect(result.elIdsToAcquire).toEqual([])
  })

  test('scenario 6d from Cass\'s tick: g2 is acquired', () => {
    const states = statesMap([
      [1, { selection: sel(['g1', 'g2', 'g3'], { g1: 3500, g2: 0, g3: 0 }) }],
      [2, { pendingRequests: { g1: 1000 } }],
      [3, { pendingRequests: { g2: 1200 } }],
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
  test('B has already promoted (pendingRequests cleared); A must still release via claimedAt fallback', () => {
    const states = statesMap([
      [5 /* A, stale holder, higher id, never claimed explicitly */, { selection: sel(['die-1']) }],
      [2 /* B, already promoted, lower id, has a claim timestamp */, { selection: sel(['die-1'], { 'die-1': 1783068723151 }) }],
    ])
    expect(resolveElementWinner('die-1', states)).toBeNull() // old logic would find nothing here

    const result = computeTickActions({ myClientId: 5, awarenessStates: states, now: 999999 })
    expect(result.elIdsToRelease).toEqual(['die-1'])
  })

  test('the winning side does not also release — no oscillation', () => {
    const states = statesMap([
      [5, { selection: sel(['die-1']) }],
      [2, { selection: sel(['die-1'], { 'die-1': 1783068723151 }) }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 999999 })
    expect(result.elIdsToRelease).toEqual([])
  })

  test('no false positive: uniquely-held elements are never released via the fallback', () => {
    const states = statesMap([
      [1, { selection: sel(['die-1']) }],
      [2, { selection: sel(['die-2']) }], // different element
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 999999 })
    expect(result.elIdsToRelease).toEqual([])
  })
})

describe('computeTickActions — directional fallback regression (3rd real trace)', () => {
  test('acquirer with a HIGHER clientId still correctly keeps it, via its own claim timestamp', () => {
    // B (lower id) originally held it with no explicit claim (plain select,
    // never went through the request flow). A (higher id) requested and
    // won it — A's selection.claimedAt now carries its acquisition moment.
    const states = statesMap([
      [3543409708 /* A, acquirer, higher clientId */, { selection: sel(['sample-s0d1'], { 'sample-s0d1': 1783068723151 }) }],
      [2689850105 /* B, original passive holder, lower clientId, no claim */, { selection: sel(['sample-s0d1']) }],
    ])

    const fromA = computeTickActions({ myClientId: 3543409708, awarenessStates: states, now: 1783068726219 })
    expect(fromA.elIdsToRelease).toEqual([])

    const fromB = computeTickActions({ myClientId: 2689850105, awarenessStates: states, now: 1783068726219 })
    expect(fromB.elIdsToRelease).toEqual(['sample-s0d1'])
  })

  test('true simultaneity (both zero claim timestamps) still falls back to clientId deterministically', () => {
    const states = statesMap([
      [5, { selection: sel(['free-for-all']) }],
      [2, { selection: sel(['free-for-all']) }],
    ])
    const fromHigher = computeTickActions({ myClientId: 5, awarenessStates: states, now: 0 })
    const fromLower  = computeTickActions({ myClientId: 2, awarenessStates: states, now: 0 })
    expect(fromHigher.elIdsToRelease).toEqual(['free-for-all'])
    expect(fromLower.elIdsToRelease).toEqual([])
  })
})
