/**
 * tests/unit/soft-lock.test.js
 *
 * Tests for the advisory soft-lock / element-request protocol's pure
 * derivation functions (src/soft-lock.js).
 *
 * Awareness schema addition under test:
 *   pendingRequests: null | { [elId: string]: number }   // elId -> ts (ms)
 *
 * Sections:
 *   1. getHolderClientId / isElementHeldByOther — basic ownership queries
 *   2. collectRequestsForElement — retention vs acquisition classification
 *   3. isElementContested / getAllContestedElementIds
 *   4. resolveElementWinner — tie-break rule
 *   5. isRequestWindowElapsed
 *   6. Scenario walkthroughs — sequenced awareness payloads, mirroring the
 *      scenarios discussed and agreed on for the feature:
 *        6a. Clean handoff (uncontested, holder never returns)
 *        6b. Aborted handoff (holder rebuts via re-click before deadline)
 *        6c. Partial transfer out of a multi-selection
 *        6d. Two simultaneous requesters on two different elements of one
 *            holder's group (the reason pendingRequests is a collection)
 *
 * These tests exercise only soft-lock.js's pure functions against
 * hand-built or real y-protocols Awareness state snapshots — no timers, no
 * App/UI, no network. They do not test cross-client propagation (that's
 * sync.integration.test.js) or the imperative tick/promotion loop that
 * writes awareness state in response to these functions (a later commit).
 */

import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import { describe, test, expect } from 'vitest'
import {
  REQUEST_WINDOW_MS,
  getHolderClientId,
  isElementHeldByOther,
  collectRequestsForElement,
  isElementContested,
  getAllContestedElementIds,
  resolveElementWinner,
  isRequestWindowElapsed,
  computeTickActions,
} from '../../src/soft-lock.js'

// Build a plain Map<clientId, state> — the same shape awareness.getStates()
// returns — without needing a live y-protocols Awareness instance for tests
// that don't care about real CRDT wiring.
function statesMap(entries) {
  return new Map(entries)
}

// ── 1. Basic ownership queries ──────────────────────────────────────────────

describe('getHolderClientId / isElementHeldByOther', () => {
  test('returns the clientId holding elId', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] } }],
      [2, { selection: { elIds: [] } }],
    ])
    expect(getHolderClientId('goblin-1', states)).toBe(1)
  })

  test('returns null when nobody holds elId', () => {
    const states = statesMap([[1, { selection: { elIds: [] } }], [2, { selection: { elIds: ['other'] } }]])
    expect(getHolderClientId('goblin-1', states)).toBeNull()
  })

  test('isElementHeldByOther is true when a different client holds it', () => {
    const states = statesMap([[1, { selection: { elIds: ['goblin-1'] } }]])
    expect(isElementHeldByOther('goblin-1', states, 2)).toBe(true)
  })

  test('isElementHeldByOther is false when I am the holder', () => {
    const states = statesMap([[1, { selection: { elIds: ['goblin-1'] } }]])
    expect(isElementHeldByOther('goblin-1', states, 1)).toBe(false)
  })

  test('isElementHeldByOther is false when unheld', () => {
    const states = statesMap([[1, { selection: { elIds: [] } }]])
    expect(isElementHeldByOther('goblin-1', states, 2)).toBe(false)
  })
})

// ── 2. Retention vs acquisition classification ──────────────────────────────

describe('collectRequestsForElement', () => {
  test('classifies a holder pendingRequests entry as a retainer', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] }, pendingRequests: { 'goblin-1': 2500 } }],
    ])
    const { retainers, acquirers } = collectRequestsForElement('goblin-1', states)
    expect(retainers).toEqual([{ clientId: 1, ts: 2500 }])
    expect(acquirers).toEqual([])
  })

  test('classifies a non-holder pendingRequests entry as an acquirer', () => {
    const states = statesMap([
      [2, { selection: { elIds: [] }, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    const { retainers, acquirers } = collectRequestsForElement('goblin-1', states)
    expect(acquirers).toEqual([{ clientId: 2, ts: 1000 }])
    expect(retainers).toEqual([])
  })

  test('ignores pendingRequests entries for other elIds', () => {
    const states = statesMap([
      [2, { selection: { elIds: [] }, pendingRequests: { 'goblin-2': 1000 } }],
    ])
    const { retainers, acquirers } = collectRequestsForElement('goblin-1', states)
    expect(retainers).toEqual([])
    expect(acquirers).toEqual([])
  })

  test('handles null pendingRequests and missing selection gracefully', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] }, pendingRequests: null }],
      [2, {}],
    ])
    const { retainers, acquirers } = collectRequestsForElement('goblin-1', states)
    expect(retainers).toEqual([])
    expect(acquirers).toEqual([])
  })
})

// ── 3. Contested queries ─────────────────────────────────────────────────────

describe('isElementContested / getAllContestedElementIds', () => {
  test('contested when there is an outstanding acquirer', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] } }],
      [2, { selection: { elIds: [] }, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    expect(isElementContested('goblin-1', states)).toBe(true)
  })

  test('not contested when only a retainer exists with no acquirer', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] }, pendingRequests: { 'goblin-1': 2500 } }],
    ])
    expect(isElementContested('goblin-1', states)).toBe(false)
  })

  test('not contested when nobody has requested it', () => {
    const states = statesMap([[1, { selection: { elIds: ['goblin-1'] } }]])
    expect(isElementContested('goblin-1', states)).toBe(false)
  })

  test('getAllContestedElementIds sweeps every acquisition across all clients', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['g1', 'g2'] } }],
      [2, { selection: { elIds: [] }, pendingRequests: { g1: 1000 } }],
      [3, { selection: { elIds: [] }, pendingRequests: { g2: 1200 } }],
    ])
    expect(getAllContestedElementIds(states)).toEqual(new Set(['g1', 'g2']))
  })

  test('getAllContestedElementIds excludes retention-only entries', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['g1'] }, pendingRequests: { g1: 500 } }],
    ])
    expect(getAllContestedElementIds(states)).toEqual(new Set())
  })
})

// ── 4. Tie-break rule ────────────────────────────────────────────────────────

describe('resolveElementWinner', () => {
  test('returns null when there are no acquirers', () => {
    const states = statesMap([[1, { selection: { elIds: ['goblin-1'] } }]])
    expect(resolveElementWinner('goblin-1', states)).toBeNull()
  })

  test('acquirer wins when uncontested by any retention', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] } }],
      [2, { selection: { elIds: [] }, pendingRequests: { 'goblin-1': 5000 } }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 2, ts: 5000 })
  })

  test('retention with ts >= acquirer ts rebuts the acquirer', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] }, pendingRequests: { 'goblin-1': 3500 } }],
      [2, { selection: { elIds: [] }, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toBeNull()
  })

  test('retention with ts < acquirer ts does NOT rebut (stale retention)', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] }, pendingRequests: { 'goblin-1': 500 } }],
      [2, { selection: { elIds: [] }, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 2, ts: 1000 })
  })

  test('earliest acquirer wins among multiple acquirers', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] } }],
      [2, { selection: { elIds: [] }, pendingRequests: { 'goblin-1': 2000 } }],
      [3, { selection: { elIds: [] }, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 3, ts: 1000 })
  })

  test('exact ts tie between acquirers broken by lowest clientId', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] } }],
      [5, { selection: { elIds: [] }, pendingRequests: { 'goblin-1': 1000 } }],
      [3, { selection: { elIds: [] }, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 3, ts: 1000 })
  })
})

// ── 5. Window elapsed ────────────────────────────────────────────────────────

describe('isRequestWindowElapsed', () => {
  test('false before REQUEST_WINDOW_MS has passed', () => {
    expect(isRequestWindowElapsed({ ts: 1000 }, 1000 + REQUEST_WINDOW_MS - 1)).toBe(false)
  })

  test('true once REQUEST_WINDOW_MS has passed', () => {
    expect(isRequestWindowElapsed({ ts: 1000 }, 1000 + REQUEST_WINDOW_MS)).toBe(true)
  })
})

// ── 6. Scenario walkthroughs — sequenced awareness payloads ─────────────────
//
// Each scenario is expressed as a series of named snapshots (Alice/Bailey/
// Cass's awareness state at a given point in time), verified with the pure
// functions under test. These mirror the exact payload sequences discussed
// and agreed on for the feature, so a reader can trace protocol behavior
// step by step without running the full app.

describe('Scenario 6a — clean handoff (uncontested)', () => {
  test('Alice holds, Bailey requests, nobody rebuts, Bailey wins at t=8000', () => {
    // t=0 — Alice holds goblin-1, nothing contested yet.
    let states = statesMap([
      [1 /* Alice  */, { selection: { elIds: ['goblin-1'] }, pendingRequests: null }],
      [2 /* Bailey */, { selection: { elIds: [] }, pendingRequests: null }],
    ])
    expect(isElementContested('goblin-1', states)).toBe(false)

    // t=5000 — Bailey shift-clicks goblin-1; it becomes an acquisition.
    states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] }, pendingRequests: null }],
      [2, { selection: { elIds: [] }, pendingRequests: { 'goblin-1': 5000 } }],
    ])
    expect(isElementContested('goblin-1', states)).toBe(true)
    expect(resolveElementWinner('goblin-1', states)).toEqual({ clientId: 2, ts: 5000 })

    // t=5000–8000 — Alice does nothing; no retention entry ever appears.
    // (state unchanged; re-asserting the same facts at the deadline)

    // t=8000 — deadline: window elapsed, Bailey wins, nothing rebutted it.
    const winner = resolveElementWinner('goblin-1', states)
    expect(isRequestWindowElapsed(winner, 8000)).toBe(true)
    expect(winner.clientId).toBe(2)
  })
})

describe('Scenario 6b — aborted handoff (holder rebuts before deadline)', () => {
  test('Alice re-asserts dragon-mini before t=4000, defeating Bailey\'s request', () => {
    // t=0 — Alice holds dragon-mini.
    let states = statesMap([
      [1, { selection: { elIds: ['dragon-mini'] }, pendingRequests: null }],
    ])

    // t=1000 — Bailey shift-clicks it.
    states = statesMap([
      [1, { selection: { elIds: ['dragon-mini'] }, pendingRequests: null }],
      [2, { selection: { elIds: [] }, pendingRequests: { 'dragon-mini': 1000 } }],
    ])
    expect(isElementContested('dragon-mini', states)).toBe(true)

    // t=2500 — Alice re-clicks her own held element: targeted retention,
    // not a blanket "any activity" signal — only dragon-mini is defended.
    states = statesMap([
      [1, { selection: { elIds: ['dragon-mini'] }, pendingRequests: { 'dragon-mini': 2500 } }],
      [2, { selection: { elIds: [] }, pendingRequests: { 'dragon-mini': 1000 } }],
    ])
    expect(isElementContested('dragon-mini', states)).toBe(true) // still shows as requested…

    // …but resolution favors the holder, since her retention ts (2500)
    // postdates Bailey's request ts (1000).
    expect(resolveElementWinner('dragon-mini', states)).toBeNull()

    // t=4000 (Bailey's original deadline) — nothing to promote; Alice keeps it.
    const { acquirers } = collectRequestsForElement('dragon-mini', states)
    expect(acquirers).toEqual([{ clientId: 2, ts: 1000 }])
    expect(resolveElementWinner('dragon-mini', states)).toBeNull()
  })
})

describe('Scenario 6c — partial transfer out of a multi-selection', () => {
  test('Cass requests only goblin-2 out of Alice\'s 3-element group; siblings untouched', () => {
    // t=0 — Alice holds a 3-element group.
    let states = statesMap([
      [1, { selection: { elIds: ['goblin-1', 'goblin-2', 'goblin-3'] }, pendingRequests: null }],
    ])

    // t=1000 — Cass shift-clicks only goblin-2.
    states = statesMap([
      [1, { selection: { elIds: ['goblin-1', 'goblin-2', 'goblin-3'] }, pendingRequests: null }],
      [3, { selection: { elIds: [] }, pendingRequests: { 'goblin-2': 1000 } }],
    ])

    // Only goblin-2 is contested; siblings are structurally untouched.
    expect(isElementContested('goblin-1', states)).toBe(false)
    expect(isElementContested('goblin-2', states)).toBe(true)
    expect(isElementContested('goblin-3', states)).toBe(false)

    // t=4000 — deadline, uncontested: Cass wins goblin-2 only.
    const winner = resolveElementWinner('goblin-2', states)
    expect(winner).toEqual({ clientId: 3, ts: 1000 })
    expect(isRequestWindowElapsed(winner, 4000)).toBe(true)

    // The actual elIds array mutation (Alice loses goblin-2, Cass gains it)
    // is the imperative promotion step's job, not soft-lock.js's — the
    // meaningful assertion at this pure-function layer is that goblin-1 and
    // goblin-3 were never contested above, i.e. structurally untouched.
  })
})

describe('Scenario 6d — two simultaneous requesters on two different elements', () => {
  test('Alice defends g1 but not g2; Bailey loses g1, Cass wins g2', () => {
    // t=0 — Alice holds three goblins.
    let states = statesMap([
      [1, { selection: { elIds: ['g1', 'g2', 'g3'] }, pendingRequests: null }],
    ])

    // t=1000 — Bailey requests g1.
    // t=1200 — Cass requests g2.
    states = statesMap([
      [1, { selection: { elIds: ['g1', 'g2', 'g3'] }, pendingRequests: null }],
      [2 /* Bailey */, { selection: { elIds: [] }, pendingRequests: { g1: 1000 } }],
      [3 /* Cass   */, { selection: { elIds: [] }, pendingRequests: { g2: 1200 } }],
    ])
    expect(isElementContested('g1', states)).toBe(true)
    expect(isElementContested('g2', states)).toBe(true)
    expect(isElementContested('g3', states)).toBe(false)

    // t=3500 — Alice notices and re-clicks g1 only (targeted retention;
    // this is the reason pendingRequests must be a keyed collection, not a
    // single value — she needs to be able to defend one contested element
    // while a second, independent request against a different element is
    // still in flight).
    states = statesMap([
      [1, { selection: { elIds: ['g1', 'g2', 'g3'] }, pendingRequests: { g1: 3500 } }],
      [2, { selection: { elIds: [] }, pendingRequests: { g1: 1000 } }],
      [3, { selection: { elIds: [] }, pendingRequests: { g2: 1200 } }],
    ])

    // g1: Alice's retention (3500) postdates Bailey's request (1000) → rebutted.
    expect(resolveElementWinner('g1', states)).toBeNull()
    // g2: Alice has no entry for it at all → Cass's request stands.
    expect(resolveElementWinner('g2', states)).toEqual({ clientId: 3, ts: 1200 })

    // t=4000 — Bailey's deadline passes with no promotion (rebutted).
    // t=4200 — Cass's deadline passes, promotion occurs.
    const cassWinner = resolveElementWinner('g2', states)
    expect(isRequestWindowElapsed(cassWinner, 4200)).toBe(true)
  })
})

// ── 7. computeTickActions — the imperative tick's decision function ─────────
//
// Re-verifies the same four scenarios end-to-end through the actual state
// machine app.js's tick loop calls, plus a few edge cases specific to the
// tick itself (idempotence, retention entries being left alone, no-op ticks).

describe('computeTickActions', () => {
  test('no-op tick: nothing pending, nothing held, nothing to do', () => {
    const states = statesMap([[1, { selection: null, pendingRequests: null }]])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 0 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('acquirer tick before window elapsed: no action yet', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] } }],
      [2, { selection: null, pendingRequests: { 'goblin-1': 5000 } }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 6000 })
    expect(result.elIdsToAcquire).toEqual([])
  })

  test('scenario 6a from Bailey\'s tick: promotes at t=8000', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] } }],
      [2, { selection: null, pendingRequests: { 'goblin-1': 5000 } }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 8000 })
    expect(result).toEqual({ elIdsToAcquire: ['goblin-1'], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('scenario 6a from Alice\'s tick: releases at t=8000, symmetric with Bailey\'s', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] } }],
      [2, { selection: null, pendingRequests: { 'goblin-1': 5000 } }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 8000 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: ['goblin-1'] })
  })

  test('scenario 6b from Bailey\'s tick: rebutted request is dropped, not acquired', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['dragon-mini'] }, pendingRequests: { 'dragon-mini': 2500 } }],
      [2, { selection: null, pendingRequests: { 'dragon-mini': 1000 } }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 4000 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: ['dragon-mini'], elIdsToRelease: [] })
  })

  test('scenario 6b from Alice\'s tick: rebutted successfully, keeps holding, nothing released', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['dragon-mini'] }, pendingRequests: { 'dragon-mini': 2500 } }],
      [2, { selection: null, pendingRequests: { 'dragon-mini': 1000 } }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 4000 })
    expect(result).toEqual({ elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('a client\'s own retention entry (elId in its own selection) is never treated as an acquisition', () => {
    // Alice holds goblin-1 and has a pendingRequests entry for it (retention).
    // Her own tick must not try to "acquire" what she already holds.
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1'] }, pendingRequests: { 'goblin-1': 100 } }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 999999 })
    expect(result.elIdsToAcquire).toEqual([])
    expect(result.elIdsToRelease).toEqual([]) // no acquirer at all, so nothing to release either
  })

  test('scenario 6c from Cass\'s tick: partial transfer acquires only the requested elId', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1', 'goblin-2', 'goblin-3'] } }],
      [3, { selection: null, pendingRequests: { 'goblin-2': 1000 } }],
    ])
    const result = computeTickActions({ myClientId: 3, awarenessStates: states, now: 4000 })
    expect(result).toEqual({ elIdsToAcquire: ['goblin-2'], elIdsToDropRequest: [], elIdsToRelease: [] })
  })

  test('scenario 6c from Alice\'s tick: releases only goblin-2, siblings untouched', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['goblin-1', 'goblin-2', 'goblin-3'] } }],
      [3, { selection: null, pendingRequests: { 'goblin-2': 1000 } }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 4000 })
    expect(result.elIdsToRelease).toEqual(['goblin-2'])
  })

  test('scenario 6d from Alice\'s tick: releases g2 (undefended) but keeps g1 (defended)', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['g1', 'g2', 'g3'] }, pendingRequests: { g1: 3500 } }],
      [2, { selection: null, pendingRequests: { g1: 1000 } }],
      [3, { selection: null, pendingRequests: { g2: 1200 } }],
    ])
    const result = computeTickActions({ myClientId: 1, awarenessStates: states, now: 4200 })
    expect(result.elIdsToRelease).toEqual(['g2'])
  })

  test('scenario 6d from Bailey\'s tick: g1 request is dropped (rebutted)', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['g1', 'g2', 'g3'] }, pendingRequests: { g1: 3500 } }],
      [2, { selection: null, pendingRequests: { g1: 1000 } }],
      [3, { selection: null, pendingRequests: { g2: 1200 } }],
    ])
    const result = computeTickActions({ myClientId: 2, awarenessStates: states, now: 4200 })
    expect(result.elIdsToDropRequest).toEqual(['g1'])
    expect(result.elIdsToAcquire).toEqual([])
  })

  test('scenario 6d from Cass\'s tick: g2 is acquired', () => {
    const states = statesMap([
      [1, { selection: { elIds: ['g1', 'g2', 'g3'] }, pendingRequests: { g1: 3500 } }],
      [2, { selection: null, pendingRequests: { g1: 1000 } }],
      [3, { selection: null, pendingRequests: { g2: 1200 } }],
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
