/**
 * tests/unit/selection.test.js
 *
 * Tests for the pure local selection/pending-request state transitions in
 * src/selection.js. No DOM, no Yjs, no Awareness, no App — plain state in,
 * plain state out. The App-integration equivalents (real App.select, real
 * DOM, real awareness) live in soft-lock.integration.test.js; this file is
 * where the state-transition *logic itself* should be pinned down, the
 * same split soft-lock.js/soft-lock.test.js already use for the
 * cross-client resolution half of the protocol.
 */

import { describe, test, expect } from 'vitest'
import {
  EMPTY_STATE,
  request,
  abandonPendingRequests,
  reassertClaim,
  unclaim,
  clearClaims,
  select,
  toggle,
  commitMultiSelect,
  applyTickActions,
} from '../../src/selection.js'

const notHeld = () => false
const heldBy = (heldId) => (id) => id === heldId

describe('request()', () => {
  test('adds a fresh pending-request entry', () => {
    const s1 = request(EMPTY_STATE, 'die-1', { now: 100 })
    expect(s1).toEqual({ claims: {}, pendingRequests: { 'die-1': 100 } })
  })

  test('write-once: a second request for the same id is a no-op (timestamp untouched)', () => {
    const s1 = request(EMPTY_STATE, 'die-1', { now: 100 })
    const s2 = request(s1, 'die-1', { now: 999 })
    expect(s2).toBe(s1) // same reference: nothing changed
    expect(s2.pendingRequests['die-1']).toBe(100)
  })

  test('a second request for a different id coexists with the first', () => {
    const s1 = request(EMPTY_STATE, 'die-1', { now: 100 })
    const s2 = request(s1, 'die-2', { now: 200 })
    expect(s2.pendingRequests).toEqual({ 'die-1': 100, 'die-2': 200 })
  })
})

describe('abandonPendingRequests()', () => {
  test('drops every pending request when no id is excepted', () => {
    const s0 = { claims: {}, pendingRequests: { 'die-1': 100, 'die-2': 200 } }
    expect(abandonPendingRequests(s0)).toEqual({ claims: {}, pendingRequests: {} })
  })

  test('keeps only the excepted id', () => {
    const s0 = { claims: {}, pendingRequests: { 'die-1': 100, 'die-2': 200 } }
    expect(abandonPendingRequests(s0, 'die-2')).toEqual({ claims: {}, pendingRequests: { 'die-2': 200 } })
  })

  test('no-ops (same reference) when already empty', () => {
    expect(abandonPendingRequests(EMPTY_STATE)).toBe(EMPTY_STATE)
  })

  test('no-ops (same reference) when the only entry is already the excepted one', () => {
    const s0 = { claims: {}, pendingRequests: { 'die-1': 100 } }
    expect(abandonPendingRequests(s0, 'die-1')).toBe(s0)
  })
})

describe('reassertClaim()', () => {
  test('refreshes an already-held id\'s timestamp', () => {
    const s0 = { claims: { 'die-1': 100 }, pendingRequests: {} }
    const s1 = reassertClaim(s0, 'die-1', { now: 500 })
    expect(s1.claims).toEqual({ 'die-1': 500 })
  })

  test('no-ops (same reference) for an id not currently held', () => {
    const s0 = { claims: { 'die-1': 100 }, pendingRequests: {} }
    expect(reassertClaim(s0, 'die-2', { now: 500 })).toBe(s0)
  })
})

describe('unclaim() / clearClaims()', () => {
  test('unclaim drops a single held id, leaving the rest', () => {
    const s0 = { claims: { 'die-1': 1, 'die-2': 2 }, pendingRequests: {} }
    expect(unclaim(s0, 'die-1').claims).toEqual({ 'die-2': 2 })
  })

  test('unclaim no-ops (same reference) for an id not held', () => {
    const s0 = { claims: { 'die-1': 1 }, pendingRequests: {} }
    expect(unclaim(s0, 'die-2')).toBe(s0)
  })

  test('clearClaims drops every claim, leaves pendingRequests untouched', () => {
    const s0 = { claims: { 'die-1': 1, 'die-2': 2 }, pendingRequests: { 'die-3': 3 } }
    expect(clearClaims(s0)).toEqual({ claims: {}, pendingRequests: { 'die-3': 3 } })
  })

  test('clearClaims no-ops (same reference) when already empty', () => {
    expect(clearClaims(EMPTY_STATE)).toBe(EMPTY_STATE)
  })
})

describe('select()', () => {
  test('selecting a free id replaces the whole selection with just that id', () => {
    const s0 = { claims: { 'die-1': 1 }, pendingRequests: {} }
    const s1 = select(s0, 'die-2', { isHeldByOther: notHeld, now: 100 })
    expect(s1).toEqual({ claims: { 'die-2': 100 }, pendingRequests: {} })
  })

  test('selecting null deselects everything', () => {
    const s0 = { claims: { 'die-1': 1 }, pendingRequests: {} }
    expect(select(s0, null, { isHeldByOther: notHeld })).toEqual(EMPTY_STATE)
  })

  test('selecting a held-by-other id clears the current selection and queues a request instead of claiming', () => {
    const s0 = { claims: { 'die-1': 1 }, pendingRequests: {} }
    const s1 = select(s0, 'die-2', { isHeldByOther: heldBy('die-2'), now: 100 })
    expect(s1).toEqual({ claims: {}, pendingRequests: { 'die-2': 100 } })
  })

  test('reclicking the SAME held-by-other id does not refresh its request timestamp (write-once)', () => {
    const s0 = select(EMPTY_STATE, 'die-1', { isHeldByOther: heldBy('die-1'), now: 100 })
    const s1 = select(s0, 'die-1', { isHeldByOther: heldBy('die-1'), now: 999 })
    expect(s1.pendingRequests).toEqual({ 'die-1': 100 })
  })

  // The reported bug: client requests a held toy, then before that
  // request resolves, clicks a different, unheld toy. The stale request
  // must not survive to be silently promoted by a later tick.
  test('switching to a different unheld id abandons a stale pending request', () => {
    const s0 = select(EMPTY_STATE, 'die-1', { isHeldByOther: heldBy('die-1'), now: 100 })
    expect(s0.pendingRequests).toEqual({ 'die-1': 100 }) // sanity: request is outstanding

    const s1 = select(s0, 'die-2', { isHeldByOther: notHeld, now: 200 })
    expect(s1).toEqual({ claims: { 'die-2': 200 }, pendingRequests: {} })
  })

  // Same regression, different trigger: switching to a DIFFERENT
  // held-by-other id while a request for the first one is still pending.
  test('switching to a different held-by-other id abandons the earlier request', () => {
    const s0 = select(EMPTY_STATE, 'die-1', { isHeldByOther: heldBy('die-1'), now: 100 })
    const s1 = select(s0, 'die-2', { isHeldByOther: heldBy('die-2'), now: 200 })
    expect(s1).toEqual({ claims: {}, pendingRequests: { 'die-2': 200 } })
  })

  test('deselecting (id=null) also abandons any outstanding request', () => {
    const s0 = select(EMPTY_STATE, 'die-1', { isHeldByOther: heldBy('die-1'), now: 100 })
    const s1 = select(s0, null, { isHeldByOther: notHeld })
    expect(s1).toEqual(EMPTY_STATE)
  })
})

describe('toggle()', () => {
  test('adds a free id to the selection, alongside whatever is already held', () => {
    const s0 = { claims: { 'die-1': 1 }, pendingRequests: {} }
    const s1 = toggle(s0, 'die-2', { isHeldByOther: notHeld, now: 100 })
    expect(s1.claims).toEqual({ 'die-1': 1, 'die-2': 100 })
  })

  test('removes an already-held id (plain deselect toggle)', () => {
    const s0 = { claims: { 'die-1': 1, 'die-2': 2 }, pendingRequests: {} }
    const s1 = toggle(s0, 'die-1', { isHeldByOther: notHeld })
    expect(s1.claims).toEqual({ 'die-2': 2 })
  })

  test('shift-clicking a held-by-other id queues a request alongside the existing selection, untouched', () => {
    const s0 = { claims: { 'die-1': 1 }, pendingRequests: {} }
    const s1 = toggle(s0, 'die-2', { isHeldByOther: heldBy('die-2'), now: 100 })
    expect(s1).toEqual({ claims: { 'die-1': 1 }, pendingRequests: { 'die-2': 100 } })
  })

  test('deselecting a held-by-self id is a no-op with respect to pendingRequests', () => {
    const s0 = { claims: { 'die-1': 1 }, pendingRequests: { 'die-2': 2 } }
    const s1 = toggle(s0, 'die-1', { isHeldByOther: notHeld })
    expect(s1.pendingRequests).toEqual({ 'die-2': 2 })
  })
})

describe('commitMultiSelect()', () => {
  test('claims every id fresh when none were previously held', () => {
    const s1 = commitMultiSelect(EMPTY_STATE, ['die-1', 'die-2'], { now: 100 })
    expect(s1.claims).toEqual({ 'die-1': 100, 'die-2': 100 })
  })

  test('preserves existing claim timestamps for already-held ids', () => {
    const s0 = { claims: { 'die-1': 1 }, pendingRequests: {} }
    const s1 = commitMultiSelect(s0, ['die-1', 'die-2'], { now: 100 })
    expect(s1.claims).toEqual({ 'die-1': 1, 'die-2': 100 })
  })

  test('drops ids no longer included (non-additive replace)', () => {
    const s0 = { claims: { 'die-1': 1, 'die-2': 2 }, pendingRequests: {} }
    const s1 = commitMultiSelect(s0, ['die-2', 'die-3'], { now: 100 })
    expect(s1.claims).toEqual({ 'die-2': 2, 'die-3': 100 })
  })
})

describe('applyTickActions()', () => {
  test('promotes an acquired id into claims and clears its pending entry', () => {
    const s0 = { claims: {}, pendingRequests: { 'die-1': 1 } }
    const s1 = applyTickActions(s0, { elIdsToAcquire: ['die-1'], elIdsToDropRequest: [], elIdsToRelease: [] }, { now: 500 })
    expect(s1).toEqual({ claims: { 'die-1': 500 }, pendingRequests: {} })
  })

  test('drops a lost/rebutted request without touching claims', () => {
    const s0 = { claims: { 'die-2': 2 }, pendingRequests: { 'die-1': 1 } }
    const s1 = applyTickActions(s0, { elIdsToAcquire: [], elIdsToDropRequest: ['die-1'], elIdsToRelease: [] }, { now: 500 })
    expect(s1).toEqual({ claims: { 'die-2': 2 }, pendingRequests: {} })
  })

  test('releases a held id (defensively also clearing any pending entry for it)', () => {
    const s0 = { claims: { 'die-1': 1 }, pendingRequests: { 'die-1': 1 } }
    const s1 = applyTickActions(s0, { elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: ['die-1'] }, { now: 500 })
    expect(s1).toEqual({ claims: {}, pendingRequests: {} })
  })
})
