/**
 * tests/unit/placement-reaction-atomic.test.js
 *
 * A drop into a tray and the tray's triggered contents_change_handler
 * reaction commit as a SINGLE atomic operation, rather than the reaction
 * landing separately. That is what makes "the loser's divergent state" a
 * well-defined, atomic thing to arbitrate/fork, and removes the "die
 * inserted but its reaction lost → stale slot, uncounted die" intermediate.
 *
 * app.js's commitMove is the production caller (unit-tested via Playwright
 * per the project's convention that app.js integration is e2e, not
 * vitest). placeInTrayAtomic() below is a faithful, literal
 * re-implementation of exactly what commitMove's drop branch does —
 * reparent + move, inside runGesture, whose internal
 * runContentsChangeCascadeInto folds the tray's reaction into the SAME
 * batch before commitGesture appends it as one operation.
 *
 * This test asserts the single-operation PROPERTY the production path has.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  addToy, reparentToyDom, applyMoveDom, getGeom, findToyDom, runGesture,
  activateAllToyScriptsDom, undoToyGesture,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { getOps } from '../../src/op_dag.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const TABLE   = 'test-table'
const AUTHOR  = 'tester'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const TRAY_SUM_SVG  = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS       = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG        = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

function stubToyFetch() {
  return vi.fn(async (url) => {
    if (url === 'toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === 'toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
    if (url === 'toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === 'toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

async function place(ydoc, layerEl, toyType, id) {
  await addToy(ydoc, layerEl, { id, toyType, x: 0, y: 0, color: '#fff' })
}

// A tray's own displayed result — a sibling of .tt_contents, found via the
// real production helper (same boundary-respecting lookup tray.js itself
// uses), not a plain selector that could shadow-match a nested sub-tray's.
function ownResultTspan(trayEl) {
  const container = globalThis.tray._findOwn(trayEl, '.result_container')
  return container && container.querySelector('.tspan_result')
}

// Faithful re-implementation of app.js commitMove's drop-into-tray branch.
function placeInTrayAtomic(ydoc, layerEl, dieId, trayId, dropX = 10, dropY = 10) {
  return runGesture(ydoc, layerEl, () => {
    reparentToyDom(layerEl, dieId, trayId)
    const movedEl  = findToyDom(layerEl, dieId) ?? layerEl.querySelector(`[data-id="${dieId}"]`)
    const trayEl   = layerEl.querySelector(`[data-id="${trayId}"]`)
    const trayGeom = trayEl && getGeom(trayEl)
    if (trayGeom) applyMoveDom(movedEl, dropX - trayGeom.x, dropY - trayGeom.y)
  }, { gesture: 'reparent', authorId: AUTHOR, tableId: TABLE })
}

// Set a die's face directly through a real gesture, so the tray's sum is
// deterministic — mirrors what a real Roll would commit.
function setDieFace(ydoc, layerEl, dieId, value) {
  const dieEl = layerEl.querySelector(`[data-id="${dieId}"]`)
  runGesture(ydoc, layerEl, () => {
    dieEl.querySelector('tspan').textContent = String(value)
  }, { gesture: 'set-face', authorId: AUTHOR, tableId: TABLE })
}

beforeEach(() => {
  _clearSvgTextCache()
  _resetToyScriptState()
  delete globalThis.tray
  delete globalThis.tray_sum
  delete globalThis.dice
  vi.stubGlobal('fetch', stubToyFetch())
})
afterEach(() => { vi.unstubAllGlobals() })

describe('placement + reaction commit as ONE atomic operation', () => {

  test('a drop and its tray recompute append exactly one operation', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS(SVG_NS, 'g')
    await place(ydoc, layerEl, 'tray_sum', 'tray1')
    await place(ydoc, layerEl, 'dice_d6', 'die1')
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0)) // flush script activation
    setDieFace(ydoc, layerEl, 'die1', 5)

    const before = getOps(ydoc).size
    placeInTrayAtomic(ydoc, layerEl, 'die1', 'tray1')

    expect(getOps(ydoc).size - before).toBe(1)
  })

  test('the tray result is a single clean text node holding the correct sum', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS(SVG_NS, 'g')
    await place(ydoc, layerEl, 'tray_sum', 'tray1')
    await place(ydoc, layerEl, 'dice_d6', 'die1')
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))
    setDieFace(ydoc, layerEl, 'die1', 5)

    placeInTrayAtomic(ydoc, layerEl, 'die1', 'tray1')

    const trayEl = findToyDom(layerEl, 'tray1')
    const tspan  = ownResultTspan(trayEl)
    expect(tspan.childNodes.length).toBe(1) // no garble — a single clean text node
    expect(tspan.textContent).toBe('5')
  })

  test('it is a single undo step: undo reverses BOTH the reparent and the sum', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS(SVG_NS, 'g')
    await place(ydoc, layerEl, 'tray_sum', 'tray1')
    await place(ydoc, layerEl, 'dice_d6', 'die1')
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))
    setDieFace(ydoc, layerEl, 'die1', 4)

    const trayBefore = findToyDom(layerEl, 'tray1')
    expect(ownResultTspan(trayBefore).textContent).toBe('0') // empty tray

    placeInTrayAtomic(ydoc, layerEl, 'die1', 'tray1')

    const trayAfter = findToyDom(layerEl, 'tray1')
    expect(trayAfter.querySelector('.tt_contents [data-id="die1"]')).not.toBeNull() // die is in the tray
    expect(ownResultTspan(trayAfter).textContent).toBe('4')                        // sum reflects it

    // ONE undo must take BOTH back: die leaves, sum returns to 0.
    undoToyGesture(ydoc, layerEl, TABLE, AUTHOR)

    const trayUndone = findToyDom(layerEl, 'tray1')
    expect(trayUndone.querySelector('.tt_contents [data-id="die1"]')).toBeNull() // die removed from tray
    expect(ownResultTspan(trayUndone).textContent).toBe('0')                     // sum reverted, in the SAME step
    expect(findToyDom(layerEl, 'die1')).toBeTruthy()                             // die restored to top level
  })

  test('a drop into a NESTED tray recomputes inner then outer, still one operation', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS(SVG_NS, 'g')
    await place(ydoc, layerEl, 'tray_sum', 'outer')
    await place(ydoc, layerEl, 'tray_sum', 'inner')
    await place(ydoc, layerEl, 'dice_d6', 'die1')
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))
    // Nest inner inside outer first (its own operation).
    runGesture(ydoc, layerEl, () => {
      reparentToyDom(layerEl, 'inner', 'outer')
    }, { gesture: 'reparent', authorId: AUTHOR, tableId: TABLE })
    setDieFace(ydoc, layerEl, 'die1', 6)

    const before = getOps(ydoc).size
    // Now drop the die into the (nested) inner tray, atomically.
    placeInTrayAtomic(ydoc, layerEl, 'die1', 'inner')

    expect(getOps(ydoc).size - before).toBe(1) // inner's AND outer's recompute folded into one op

    const innerTspan = ownResultTspan(layerEl.querySelector('[data-id="inner"]'))
    const outerTspan = ownResultTspan(layerEl.querySelector('[data-id="outer"]'))
    expect(innerTspan.childNodes.length).toBe(1)
    expect(innerTspan.textContent).toBe('6')
    // outer's only content is inner, whose displayed value is now 6
    expect(outerTspan.childNodes.length).toBe(1)
    expect(outerTspan.textContent).toBe('6')
  })
})
