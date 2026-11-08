/**
 * tests/unit/overlay-layers.test.js
 *
 * Which <g> each overlay decoration lands in, and which ones an awareness
 * tick redraws. #selection_local is drawn from this client's own state only,
 * so syncFromAwareness must leave its nodes alone.
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'
import {
  SelectionMode,
  localSelectionChanged,
  syncFromAwareness,
  render,
  init as overlayInit,
} from '../../src/overlay.js'

const BBOX = { x: 10, y: 10, width: 50, height: 50 }
const PEER = { id: 'bailey', name: 'Bailey', color: '#ee4a82', gradient: { c1: '#ee4a82', c2: '#9a45f2', angle: 45 } }

const shared = () => document.getElementById('overlay-layer')
const local  = () => document.getElementById('selection_local')

beforeEach(() => {
  document.body.innerHTML = `
    <svg id="canvas">
      <defs></defs>
      <g id="overlay-layer"></g>
      <g id="selection_local"></g>
    </svg>
  `
  SelectionMode.clear()
  overlayInit({
    user:         { id: 'me', name: 'Me', color: '#5a7ea8', gradient: { c1: '#5a7ea8', c2: '#3a5e88', angle: 45 } },
    getViewScale: () => 1,
    getBBox:      (id) => (id.startsWith('die-') ? BBOX : null),
  }, document.getElementById('canvas'), { id: 'me' })
  syncFromAwareness(new Map(), 1)
})

describe('overlay layers', () => {
  test('my rings go to #selection_local, a peer\'s to #overlay-layer', () => {
    localSelectionChanged(new Set(['die-1']))
    syncFromAwareness(new Map([
      [1, { desired: { 'die-1': { ts: 0, holding: true } } }],
      [2, { user: PEER, desired: { 'die-2': { ts: 0, holding: true } } }],
    ]), 1)

    expect(local().querySelectorAll('.selRing')).toHaveLength(1)
    expect(local().querySelectorAll('.remote-sel')).toHaveLength(0)
    expect(shared().querySelectorAll('.remote-sel')).toHaveLength(1)
    expect(shared().querySelectorAll('.selRing')).toHaveLength(0)
  })

  test('an awareness tick redraws #overlay-layer and leaves #selection_local\'s nodes in place', () => {
    localSelectionChanged(new Set(['die-1']))
    const ring = local().querySelector('.selRing')
    const peerTick = (x) => syncFromAwareness(new Map([
      [1, { desired: { 'die-1': { ts: 0, holding: true } } }],
      [2, { user: PEER, desired: { 'die-2': { ts: 0, holding: true } }, cursor: { x, y: 0, tool: null } }],
    ]), 1)

    peerTick(0)
    const peerRing = shared().querySelector('.remote-sel')
    peerTick(5)

    expect(local().querySelector('.selRing')).toBe(ring)
    expect(shared().querySelector('.remote-sel')).not.toBe(peerRing)
  })

  test('a full render redraws both layers', () => {
    localSelectionChanged(new Set(['die-1']))
    const ring = local().querySelector('.selRing')
    render()
    expect(local().querySelector('.selRing')).not.toBe(ring)
    expect(local().querySelectorAll('.selRing')).toHaveLength(1)
  })
})
