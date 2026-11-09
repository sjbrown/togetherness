/**
 * tests/unit/selection_shared.test.js
 *
 * selection_shared.js derives peers' held elements and every open request
 * from awareness states.
 */

import { describe, test, expect } from 'vitest'
import { derive } from '../../src/selection_shared.js'

const ME = 1
const ALICE = { id: 'alice', name: 'Alice', color: '#2f80f0', gradient: { c1: '#2f80f0', c2: '#12b5c4', angle: 45 } }
const BAILEY = { id: 'bailey', name: 'Bailey', color: '#ee4a82', gradient: { c1: '#ee4a82' } }

const held = (...ids) => Object.fromEntries(ids.map((id) => [id, { ts: 0, holding: true }]))
const bid = (id, ts) => ({ [id]: { ts, holding: false } })

describe('derive — holders', () => {
  test('one entry per element a peer holds, styled from the peer\'s user record', () => {
    const { holders } = derive(new Map([
      [2, { user: ALICE, desired: held('a', 'b') }],
    ]), ME)
    expect([...holders.keys()]).toEqual(['a', 'b'])
    expect(holders.get('a')).toEqual({ mode: 'remote', peerName: 'Alice', color: '#2f80f0', gradId: 'grad-alice' })
  })

  test('my own claims and every peer\'s bids are not holders', () => {
    const { holders } = derive(new Map([
      [ME, { user: { id: 'me' }, desired: held('mine') }],
      [2,  { user: ALICE, desired: bid('wanted', 5) }],
    ]), ME)
    expect(holders.size).toBe(0)
  })

  test('a peer with no user record or gradient falls back to its clientId, grey, and no gradient', () => {
    const { holders } = derive(new Map([[7, { desired: held('a') }]]), ME)
    expect(holders.get('a')).toEqual({ mode: 'remote', peerName: '7', color: '#888', gradId: null })
  })

  test('missing or malformed desired fields are skipped', () => {
    const { holders } = derive(new Map([
      [2, { user: ALICE }],
      [3, { user: BAILEY, desired: null }],
      [4, null],
    ]), ME)
    expect(holders.size).toBe(0)
  })
})

describe('derive — requests', () => {
  test('a contested element gets one request, carrying the earliest bid\'s timestamp and that requester\'s gradient id', () => {
    const { requests } = derive(new Map([
      [2, { user: ALICE,  desired: held('a') }],
      [3, { user: BAILEY, desired: bid('a', 200) }],
      [4, { user: { id: 'cass', gradient: { c1: '#00aa00' } }, desired: bid('a', 100) }],
    ]), ME)
    expect(requests.get('a')).toEqual({ ts: 100, requesterGradId: 'grad-cass' })
  })

  test('a tie on timestamp goes to the lower clientId', () => {
    const { requests } = derive(new Map([
      [2, { user: ALICE,  desired: held('a') }],
      [5, { user: { id: 'late', gradient: { c1: '#555555' } }, desired: bid('a', 100) }],
      [3, { user: BAILEY, desired: bid('a', 100) }],
    ]), ME)
    expect(requests.get('a').requesterGradId).toBe('grad-bailey')
  })

  test('my own request names my gradient too; a requester without one has none', () => {
    const { requests } = derive(new Map([
      [2,  { user: ALICE, desired: held('a', 'b') }],
      [ME, { user: { id: 'me', gradient: { c1: '#111111' } }, desired: bid('a', 10) }],
      [4,  { user: { id: 'nograd' }, desired: bid('b', 1) }],
    ]), ME)
    expect(requests.get('a').requesterGradId).toBe('grad-me')
    expect(requests.get('b').requesterGradId).toBeNull()
  })

  test('an uncontested element has no request', () => {
    const { requests } = derive(new Map([[2, { user: ALICE, desired: held('a') }]]), ME)
    expect(requests.size).toBe(0)
  })
})
