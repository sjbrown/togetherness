/**
 * tests/unit/placement-reaction-atomic.test.js
 *
 * TODO #11 step 2 (concurrency_branching.md, "Preliminary: placement +
 * reaction in ONE transaction"): a drop into a tray and the tray's triggered
 * contents_change_handler reaction commit as a SINGLE atomic Yjs transaction,
 * rather than the reaction landing a microtask later in its own. That is what
 * makes "the loser's divergent state" a well-defined, atomic thing to
 * arbitrate/fork, and removes the "die inserted but its reaction lost →
 * stale slot, uncounted die" intermediate.
 *
 * app.js's commitMove is the production caller (unit-tested via Playwright per
 * the project's convention that app.js integration is e2e, not vitest).
 * placeInTrayAtomic() below is a faithful, literal re-implementation of
 * exactly what commitMove's drop branch now does — reparent + move +
 * affectedTrayIdsInnerFirst([...tr.changed.keys()]) + runContentsChangeCascadeSync,
 * all inside one ydoc.transact — built from the same exported toys.js
 * primitives, mirroring contents-change-cascade.test.js's wireCascade approach.
 *
 * Contrast with concurrent-derived-write.test.js, which documents the
 * two-transaction substrate bug this step is a foundation for fixing: here we
 * assert the single-transaction PROPERTY the production path now has.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  addToy, reparentToy, applyMoveCommit, getGeom, findToy, render,
  affectedTrayIdsInnerFirst, runContentsChangeCascadeSync,
  clearYNodeMap, _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { runToyHandler, ENVELOPE_ORIGIN } from '../../src/envelope.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const TRAY_SUM_SVG  = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS       = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG        = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

function stubToyFetch() {
  return vi.fn(async (url) => {
    if (url === '/toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === '/toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
    if (url === '/toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === '/toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

const getToysLayer = (ydoc) => ({ yToys: ydoc.getXmlFragment('toys') })

function renderLayer(yToys) {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  render(yToys, layerEl)
  return layerEl
}

async function place(ydoc, yToys, toyType, id) {
  await addToy(ydoc, yToys, { id, toyType, x: 0, y: 0, color: '#fff' })
}

// Read a tray's own displayed result straight from Yjs — the canonical state
// that syncs to peers. Mirrors concurrent-derived-write.test.js's readers so
// a garbled (multi-sibling-text-node) result is visible as length > 1.
function tspanResultOf(yTray) {
  const svg = yTray.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
  // .result_container's tspan — the tray's OWN, a sibling of contents_group.
  // Walk for the <text class="result_container"> then its <tspan>.
  const stack = [...svg.toArray()]
  while (stack.length) {
    const n = stack.shift()
    if (!(n instanceof Y.XmlElement)) continue
    const cls = (n.getAttribute('class') || '')
    if (n.nodeName === 'tspan' && cls.split(/\s+/).includes('tspan_result')) return n
    // don't descend into nested toys' own subtrees
    if (cls.split(/\s+/).includes('contents_group')) continue
    stack.unshift(...n.toArray())
  }
  return null
}
const readTspan = (yTspan) => yTspan.toArray().map(c => c.toString()).join('')

// Faithful re-implementation of app.js commitMove's drop-into-tray branch.
// Returns the number of Yjs `update` events the whole thing emitted — 1 iff
// the placement and its reaction were one atomic transaction.
function placeInTrayAtomic(ydoc, yToys, layerEl, dieId, trayId, dropX = 10, dropY = 10) {
  let updates = 0
  const onUpdate = () => { updates++ }
  ydoc.on('update', onUpdate)
  try {
    ydoc.transact((tr) => {
      const movedEl  = reparentToy(ydoc, yToys, dieId, trayId)
      const trayEl   = layerEl.querySelector(`[data-id="${trayId}"]`)
      const trayGeom = trayEl && getGeom(trayEl)
      if (trayGeom) applyMoveCommit(ydoc, movedEl, dropX - trayGeom.x, dropY - trayGeom.y)
      const trayIds = affectedTrayIdsInnerFirst([...tr.changed.keys()])
      runContentsChangeCascadeSync(ydoc, yToys, layerEl, trayIds)
    })
  } finally {
    ydoc.off('update', onUpdate)
  }
  return updates
}

// Set a die's face to a known value through the real envelope, so the tray's
// sum is deterministic. Mirrors the "drop whole tray" cascade test's approach.
async function setDieFace(ydoc, yToys, layerEl, dieId, value) {
  const dieEl = layerEl.querySelector(`[data-id="${dieId}"]`)
  await runToyHandler(ydoc, yToys, layerEl, dieEl, () => {
    dieEl.querySelector('tspan').textContent = String(value)
  }, { origin: ENVELOPE_ORIGIN })
}

beforeEach(() => {
  _clearSvgTextCache()
  clearYNodeMap()
  _resetToyScriptState()
  delete globalThis.tray
  delete globalThis.tray_sum
  delete globalThis.dice
  vi.stubGlobal('fetch', stubToyFetch())
})
afterEach(() => { vi.unstubAllGlobals() })

describe('placement + reaction commit as ONE atomic transaction', () => {

  test('a drop and its tray recompute emit exactly one Yjs update', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'tray1')
    await place(ydoc, yToys, 'dice_d6', 'die1')
    const layerEl = renderLayer(yToys)
    await new Promise(r => setTimeout(r, 0)) // flush script activation
    await setDieFace(ydoc, yToys, layerEl, 'die1', 5)

    const updates = placeInTrayAtomic(ydoc, yToys, layerEl, 'die1', 'tray1')

    expect(updates).toBe(1)
  })

  test('the tray result is a single clean text node holding the correct sum', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'tray1')
    await place(ydoc, yToys, 'dice_d6', 'die1')
    const layerEl = renderLayer(yToys)
    await new Promise(r => setTimeout(r, 0))
    await setDieFace(ydoc, yToys, layerEl, 'die1', 5)

    placeInTrayAtomic(ydoc, yToys, layerEl, 'die1', 'tray1')

    const yTspan = tspanResultOf(findToy(yToys, 'tray1'))
    expect(yTspan.length).toBe(1)          // no garble (cf. concurrent-derived-write)
    expect(readTspan(yTspan)).toBe('5')
  })

  test('it is a single undo step: undo reverses BOTH the reparent and the sum', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'tray1')
    await place(ydoc, yToys, 'dice_d6', 'die1')
    const layerEl = renderLayer(yToys)
    await new Promise(r => setTimeout(r, 0))
    await setDieFace(ydoc, yToys, layerEl, 'die1', 4)

    // Track only the placement's origin (null), exactly like undo_redo.js.
    const um = new Y.UndoManager(yToys, { trackedOrigins: new Set([null]), captureTimeout: 0 })

    const trayBefore = findToy(yToys, 'tray1')
    expect(readTspan(tspanResultOf(trayBefore))).toBe('0') // empty tray

    placeInTrayAtomic(ydoc, yToys, layerEl, 'die1', 'tray1')

    const trayAfter = findToy(yToys, 'tray1')
    const contentsAfter = trayAfter.toArray()
      .find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
      .toArray().find(c => (c.getAttribute?.('class') || '').split(/\s+/).includes('contents_group'))
    expect(contentsAfter.length).toBe(1)                    // die is in the tray
    expect(readTspan(tspanResultOf(trayAfter))).toBe('4')   // sum reflects it

    // ONE undo must take BOTH back: die leaves, sum returns to 0.
    expect(um.undoStack.length).toBe(1)
    um.undo()

    const trayUndone = findToy(yToys, 'tray1')
    const contentsUndone = trayUndone.toArray()
      .find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
      .toArray().find(c => (c.getAttribute?.('class') || '').split(/\s+/).includes('contents_group'))
    expect(contentsUndone.length).toBe(0)                   // die removed from tray
    expect(readTspan(tspanResultOf(trayUndone))).toBe('0')  // sum reverted, in the SAME step
    expect(findToy(yToys, 'die1')).toBeTruthy()             // die restored to top level
  })

  test('a drop into a NESTED tray recomputes inner then outer, still one transaction', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'outer')
    await place(ydoc, yToys, 'tray_sum', 'inner')
    await place(ydoc, yToys, 'dice_d6', 'die1')
    // Nest inner inside outer first (its own transaction).
    reparentToy(ydoc, yToys, 'inner', 'outer')
    const layerEl = renderLayer(yToys)
    await new Promise(r => setTimeout(r, 0))
    await setDieFace(ydoc, yToys, layerEl, 'die1', 6)

    // Now drop the die into the (nested) inner tray, atomically.
    const updates = placeInTrayAtomic(ydoc, yToys, layerEl, 'die1', 'inner')

    expect(updates).toBe(1) // inner's AND outer's recompute folded into one txn

    const innerTspan = tspanResultOf(findToy(yToys, 'inner'))
    const outerTspan = tspanResultOf(findToy(yToys, 'outer'))
    expect(innerTspan.length).toBe(1)
    expect(readTspan(innerTspan)).toBe('6')
    // outer's only content is inner, whose displayed value is now 6
    expect(outerTspan.length).toBe(1)
    expect(readTspan(outerTspan)).toBe('6')
  })
})
