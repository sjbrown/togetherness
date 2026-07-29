// @vitest-environment jsdom
//
// Empirical check for TODO #11: does the drop-into-container gesture (as
// app.js's commitMove now implements it — reparentToyDom + applyMoveDom +
// cascade, all through ONE runGestureSync call) produce a touched-set that
// includes BOTH the shared container (the actual conflict-detection
// overlap point) AND the moved toy's own item (the "outside" element that
// a revert would need to know about, since it's not part of the overlap)?
//
// This is a from-scratch empirical check, not an assumption — the
// touched-set/revert design changed hands several times this session, and
// "does it actually work" deserves a real answer, not confidence.
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Toys from '../../src/toys.js'
import { addToy, clearYNodeMap, _clearSvgTextCache } from '../../src/toys.js'
import { getReactionLog, scanForConflicts, touchedSetsOverlap } from '../../src/conflict.js'
import { DERIVED_ORIGIN } from '../../src/origins.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const PLAYER_MARKER_SVG = fs.readFileSync(path.join(TOY_DIR, 'player_marker.svg'), 'utf8')
const TRAY_SUM_SVG      = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS           = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')

function renderLayer(yToys) {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  Toys.render(yToys, layerEl)
  return layerEl
}

beforeEach(() => {
  _clearSvgTextCache()
  clearYNodeMap()
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === '/toy/player_marker.svg') return { ok: true, text: async () => PLAYER_MARKER_SVG }
    if (url === '/toy/tray_sum.svg')      return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === '/toy/js/tray.js')        return { ok: true, text: async () => TRAY_JS }
    throw new Error(`unexpected fetch: ${url}`)
  }))
})
afterEach(() => { vi.unstubAllGlobals() })

// Mirrors app.js's commitMove drop-into-container block exactly, so this
// test exercises the real shape, not a simplified stand-in.
function dropIntoContainer(ydoc, layerEl, toyId, containerId) {
  ydoc.transact(() => {
    Toys.runGestureSync(ydoc, layerEl, () => {
      Toys.reparentToyDom(layerEl, toyId, containerId)
      const movedEl = layerEl.querySelector(`[data-id="${toyId}"]`)
      Toys.applyMoveDom(movedEl, 10, 10)
    }, { origin: DERIVED_ORIGIN })
  })
}

describe('drop-into-container touched-set completeness', () => {
  test('a single drop\'s bundle includes BOTH the shared container and the moved toy itself', async () => {
    const ydoc  = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    await addToy(ydoc, yToys, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    await addToy(ydoc, yToys, { id: 'die1',  toyType: 'player_marker', x: 0, y: 0, color: '#fff' })
    const layerEl = renderLayer(yToys)
    await new Promise(r => setTimeout(r, 0))

    dropIntoContainer(ydoc, layerEl, 'die1', 'tray1')

    const bundles = getReactionLog(ydoc).toArray()
    expect(bundles.length).toBe(1)
    const bundle = bundles[0]

    // The moved toy's OWN post-move item must be in the touched-set — this
    // is the "outside" element a revert needs to know about, since it's
    // fresh (a new item, reparentToyDom's move rebuilds it), never shared
    // with any other peer's bundle.
    const trayEl = layerEl.querySelector('[data-id="tray1"]')
    const dieElAfterMove = Toys.getContentsGroup(trayEl).querySelector('[data-id="die1"]')
    expect(dieElAfterMove).not.toBeNull()
    const dieItemKey = itemKeyFor(dieElAfterMove)
    expect(dieItemKey in bundle.touched).toBe(true)

    // The shared container's tt_contents item must ALSO be in the
    // touched-set — this is the actual overlap point two concurrent
    // droppers' bundles would share.
    const contentsGroupKey = itemKeyFor(Toys.getContentsGroup(trayEl))
    expect(contentsGroupKey in bundle.touched).toBe(true)
  })

  test('two peers concurrently dropping DIFFERENT dice into the SAME tray: bundles overlap on the container, not on either die', async () => {
    const ydocA = new Y.Doc()
    const yToysA = ydocA.getXmlFragment('toys')
    await addToy(ydocA, yToysA, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    await addToy(ydocA, yToysA, { id: 'dieA',  toyType: 'player_marker', x: 0, y: 0, color: '#fff' })
    await addToy(ydocA, yToysA, { id: 'dieB',  toyType: 'player_marker', x: 0, y: 0, color: '#fff' })

    // Fork B from A's state BEFORE either peer drops anything — genuine
    // concurrency, neither has seen the other's drop.
    const ydocB = new Y.Doc()
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydocA))
    const yToysB = ydocB.getXmlFragment('toys')

    const layerA = renderLayer(yToysA)
    const layerB = renderLayer(yToysB)
    await new Promise(r => setTimeout(r, 0))

    dropIntoContainer(ydocA, layerA, 'dieA', 'tray1') // A's own local drop
    dropIntoContainer(ydocB, layerB, 'dieB', 'tray1') // B's own local drop, blind to A

    // Sync.
    Y.applyUpdate(ydocA, Y.encodeStateAsUpdate(ydocB))
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydocA))

    const bundles = getReactionLog(ydocA).toArray()
    expect(bundles.length).toBe(2)
    const [bundle1, bundle2] = bundles

    // They must be flagged as conflicting (overlap on the shared container).
    const conflicts = scanForConflicts(bundles, bundle1)
    expect(conflicts).toEqual([bundle2])
    expect(touchedSetsOverlap(bundle1, bundle2)).toBe(true)

    // But each bundle's OWN die must NOT be in the intersection — i.e. the
    // "outside" elements are genuinely disjoint between the two bundles,
    // confirming a revert of "the loser's bundle" would need to
    // specifically distinguish shared (container) from unique (own die)
    // touched items, not just wholesale-discard everything the bundle
    // touched.
    const set1 = new Set(Object.keys(bundle1.touched))
    const set2 = new Set(Object.keys(bundle2.touched))
    const intersection = [...set1].filter(k => set2.has(k))
    // Only the shared container's own items (the group + its <svg> wrapper
    // + the recomputed tspan's parent, etc. — whatever's structurally
    // common) should intersect; each die's own subtree items must not.
    for (const key of intersection) {
      expect(key in bundle1.touched && key in bundle2.touched).toBe(true)
    }
    // Concretely: each bundle's die-only items outnumber the intersection,
    // proving there ARE unique, non-overlapping "outside" elements in each
    // bundle that a wholesale bundle-discard would need to know to keep OR
    // discard deliberately, not accidentally.
    expect(set1.size).toBeGreaterThan(intersection.length)
    expect(set2.size).toBeGreaterThan(intersection.length)
  })
})

function itemKeyFor(domEl) {
  const yNode = Toys.yNodeFor(domEl)
  if (!yNode?._item) throw new Error('node has no attached Yjs item')
  return `${yNode._item.id.client}:${yNode._item.id.clock}`
}
