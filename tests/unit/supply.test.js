/**
 * tests/unit/supply.test.js
 *
 * supply.svg's 'Take' action: dispatches 'warn' when nothing is beneath
 * it, otherwise dispatches 'toy:clone' naming the toy directly below it
 * and leaves canvas-space placement entirely to the harness (via its own
 * .tt_target marker, or the harness's default of supply's own centre).
 *
 * The harness side calls the real events.js module directly (see
 * bindSupplyHarness below) rather than reimplementing its listeners —
 * events.js takes its dependencies as plain parameters now, so a small
 * stub App/UI is enough to run the actual production code here.
 *
 * Two scenarios, matching a real correctness gap found in chat: cloning a
 * toy with something NESTED inside it (a tray_sum containing a dice_d6)
 * versus a toy with something merely STACKED on top of it (a chip with
 * another chip resting on its position slot) — nested toys must be
 * recursively cloned under their own fresh ids; stacked toys must NOT be
 * touched at all, since they're siblings, not descendants.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Toys from '../../src/toys.js'
import * as Events from '../../src/events.js'
import {
  addToyDom, activateAllToyScriptsDom, reparentToyDom, makeLayerAPI,
  getContentsGroup, findToyDom, getSnapPoints, getAnchor, getInnerAnchor,
  initializeToy, newToyId,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { getOps, heads } from '../../src/op_dag.js'
import { projectFrom } from '../../src/op_checkpoint.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const TABLE   = 'test-table'
const AUTHOR  = 'tester'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

// Exercise the real, production toy files — not fixtures — same
// convention as tests/unit/dice-d6.test.js and tests/unit/tray.test.js.
const SUPPLY_SVG    = fs.readFileSync(path.join(TOY_DIR, 'supply.svg'), 'utf8')
const CHIP_SVG       = fs.readFileSync(path.join(TOY_DIR, 'chip.svg'), 'utf8')
const TRAY_SUM_SVG   = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS        = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG         = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS  = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  return layerEl
}

// tray_sum, dice_d6, chip, and (now that it's a real TOOLS entry) supply
// are all TOY_TYPES-registered, so scriptsForType() always re-fetches
// each one's own .svg for activation regardless of how it was placed —
// an unregistered type would fall back to reading its already-hoisted
// scripts instead, but none of the four toys here are unregistered.
// Placement itself never needs fetch either way: every toy below is
// placed via addToyDom directly (real svg text, no network), matching
// tests/unit/toys-dom-ops.test.js's convention — this stub exists only
// for what *activation* needs.
function stubToyFetch() {
  return vi.fn(async (url) => {
    if (url === 'toy/supply.svg')       return { ok: true, text: async () => SUPPLY_SVG }
    if (url === 'toy/chip.svg')         return { ok: true, text: async () => CHIP_SVG }
    if (url === 'toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === 'toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
    if (url === 'toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === 'toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

async function activateAll(ydoc, layerEl) {
  activateAllToyScriptsDom(ydoc, layerEl)
  await new Promise(r => setTimeout(r, 0)) // flush the fire-and-forget script activation
}

/**
 * Wires the real production event bus (events.js's init) rather than a
 * hand-reimplementation — now that events.js takes its dependencies as
 * plain parameters (App, svgEl, Toys, UI) instead of closing over
 * app.js's module state, it's directly usable here: a small stub App/UI
 * satisfying just what events.js actually calls, and a stub svgEl whose
 * only job is routing '#toys-layer' lookups to the real layerEl. This
 * means these tests exercise the exact same code app.js runs, not a
 * parallel reimplementation that could quietly drift out of sync with
 * it — which is exactly the gap that let the nested-envelope
 * duplicate-clone bug through undetected earlier in this file's history.
 * Returns an unbind function (events.js's init returns one for this).
 */
function bindSupplyHarness(ydoc, layerEl) {
  const svgEl = { querySelector: (sel) => sel === '#toys-layer' ? layerEl : layerEl.querySelector(sel) }
  const fakeApp = {
    getYdoc: () => ydoc,
    user: { id: AUTHOR, name: AUTHOR, color: '#888', gradient: null },
    getTableId: () => TABLE,
    setLastActionScope: () => {},
    addHistory: () => {},
    addLog: () => {},
  }
  const fakeUI = { toast: () => {}, refreshFromDoc: () => {} }
  return Events.init(fakeApp, svgEl, Toys, fakeUI)
}

/**
 * Click supply's 'Take' menu action via the real production path
 * (Toys.invokeMenuAction), not by calling globalThis.supply._take(elem)
 * directly. This matters: invokeMenuAction wraps the whole handler call
 * in its own runInEnvelope, and _take's synchronous 'toy:clone' dispatch
 * runs inside that — calling _take directly, bypassing invokeMenuAction,
 * never exercises that outer envelope at all, which is exactly the gap
 * that let the duplicate-clone-on-reload bug through undetected here.
 */
function clickTake(ydoc, layerEl, supplyEl) {
  Toys.invokeMenuAction(ydoc, layerEl, supplyEl, 'supply', 'Take', {}, AUTHOR, TABLE)
}

/**
 * Replay ydoc's op log onto a brand-new empty layer, the same way a
 * fresh page load rebuilds the toys layer from IndexedDB-hydrated ops
 * (Toys.projectLayer's own logic, minus its early-return/short-circuit
 * bookkeeping — those don't matter to this comparison).
 */
function reloadedIds(ydoc) {
  const ops = getOps(ydoc)
  const head = heads(ops)[0] ?? null
  const layer = freshLayer()
  projectFrom(layer, ops, head)
  return [...layer.querySelectorAll('[data-toy-type]')].map(el => el.getAttribute('data-id')).sort()
}

function liveIds(layerEl) {
  return [...layerEl.querySelectorAll('[data-toy-type]')].map(el => el.getAttribute('data-id')).sort()
}

// Every id ever seen on data-id/id attributes anywhere in the layer, for
// asserting "nothing collides" without hardcoding which ids are expected
// to exist.
function allToyBoundaryIds(layerEl) {
  return [...layerEl.querySelectorAll('[data-toy-type]')].map(el => ({
    id:      el.getAttribute('id'),
    dataId:  el.getAttribute('data-id'),
  }))
}

beforeEach(() => {
  _clearSvgTextCache()
  _resetToyScriptState()
  delete globalThis.supply
  delete globalThis.chip
  delete globalThis.tray
  delete globalThis.tray_sum
  delete globalThis.dice
  delete globalThis.d6
  vi.stubGlobal('fetch', stubToyFetch())
})
afterEach(() => { vi.unstubAllGlobals() })

describe('supply - no prototype beneath it', () => {
  test('fires "warn" and never touches document with "toy:clone"', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    addToyDom(ydoc, layerEl, { id: 'supply1', toyType: 'supply', x: 100, y: 100, color: '#fff' }, SUPPLY_SVG)
    await activateAll(ydoc, layerEl)

    const warnSpy  = vi.fn()
    const cloneSpy = vi.fn()
    document.addEventListener('warn', warnSpy)
    document.addEventListener('toy:clone', cloneSpy)

    const supplyEl = findToyDom(layerEl, 'supply1')
    expect(supplyEl.getAttribute('data-below')).toBeFalsy()
    // Direct call, not clickTake/invokeMenuAction: supply.svg's own
    // 'applicable' check already gates 'Take' out of the menu whenever
    // nothing is below it, so the real click path can never reach this
    // case — this is exercising _take's own defensive fallback instead.
    globalThis.supply._take(supplyEl)

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(cloneSpy).not.toHaveBeenCalled()

    document.removeEventListener('warn', warnSpy)
    document.removeEventListener('toy:clone', cloneSpy)
  })
})

describe('supply — dispatch contract', () => {
  test('"toy:clone" detail names the toy below it and passes its own element as sourceEl (no canvas-space math of its own)', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    addToyDom(ydoc, layerEl, { id: 'supply1', toyType: 'supply', x: 100, y: 100, color: '#fff' }, SUPPLY_SVG)
    addToyDom(ydoc, layerEl, { id: 'chipA',   toyType: 'chip',   x: 100, y: 250, color: '#fff' }, CHIP_SVG)
    await activateAll(ydoc, layerEl)

    const supplyEl = findToyDom(layerEl, 'supply1')
    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    const supplyPoint = getSnapPoints(layerEl).find(p => p.ownerId === 'supply1')
    api.applyMoveCommit(api.find('chipA'), supplyPoint.cx, supplyPoint.cy)
    expect(supplyEl.getAttribute('data-below')).toBe('chipA')

    let seenDetail = null
    const listener = (e) => { seenDetail = e.detail }
    document.addEventListener('toy:clone', listener)
    clickTake(ydoc, layerEl, supplyEl)
    document.removeEventListener('toy:clone', listener)

    expect(seenDetail.id).toBe('chipA')
    expect(seenDetail.sourceEl).toBe(supplyEl) // supply hands over itself, not a computed x/y
    expect(seenDetail.x).toBeUndefined()
    expect(seenDetail.y).toBeUndefined()
  })
})

describe('supply — clone scenario: tray_sum with a nested dice_d6', () => {
  async function setUp() {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    addToyDom(ydoc, layerEl, { id: 'supply1', toyType: 'supply',   x: 100, y: 100, color: '#fff' }, SUPPLY_SVG)
    addToyDom(ydoc, layerEl, { id: 'tray1',   toyType: 'tray_sum', x: 100, y: 300, color: '#3355ff' }, TRAY_SUM_SVG)
    addToyDom(ydoc, layerEl, { id: 'die1',    toyType: 'dice_d6',  x: 100, y: 300, color: '#ffcc00' }, D6_SVG)
    reparentToyDom(layerEl, 'die1', 'tray1')

    await activateAll(ydoc, layerEl)

    // Give the nested die a value that isn't the SVG's baked-in default
    // (6), so "the clone shows the same value" actually proves state was
    // carried over rather than just matching the template's starting
    // point by coincidence.
    // die1 is nested inside tray1 by now, so it's not a top-level
    // layerEl child any more — findToyDom's :scope-restricted lookup
    // won't see it; a plain querySelector will.
    const die1El = layerEl.querySelector('[data-id="die1"]')
    die1El.querySelector('tspan').textContent = '4'

    // Stack the whole tray onto supply's own position slot, via the real
    // production move/cascade path — same technique
    // toy-position-snap.test.js uses for chip-on-chip — so supply's own
    // data-below ends up set the same way it would in the app.
    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    const supplyPoint = getSnapPoints(layerEl).find(p => p.ownerId === 'supply1')
    api.applyMoveCommit(api.find('tray1'), supplyPoint.cx, supplyPoint.cy)

    const supplyEl = findToyDom(layerEl, 'supply1')
    expect(supplyEl.getAttribute('data-below')).toBe('tray1')

    const unbind = bindSupplyHarness(ydoc, layerEl)
    return { ydoc, layerEl, supplyEl, unbind }
  }

  test('produces a new tray with its own new id, containing a new die with its own new id — no collisions', async () => {
    const { ydoc, layerEl, supplyEl, unbind } = await setUp()

    const before = allToyBoundaryIds(layerEl)
    clickTake(ydoc, layerEl, supplyEl)
    unbind()

    const after = allToyBoundaryIds(layerEl)
    expect(after.length).toBe(before.length + 2) // new tray + new nested die

    const allIds = after.map(x => x.dataId)
    expect(new Set(allIds).size).toBe(allIds.length) // every data-id is unique

    const newTray = after.find(x => x.dataId !== 'tray1' && x.dataId !== 'supply1' && x.dataId !== 'die1'
      && layerEl.querySelector(`[data-id="${x.dataId}"]`).getAttribute('data-toy-type') === 'tray_sum')
    expect(newTray).toBeTruthy()
    expect(newTray.id).toBe(newTray.dataId)     // id === data-id — the invariant the bug broke

    const newTrayEl = layerEl.querySelector(`[data-id="${newTray.dataId}"]`)
    const contents  = getContentsGroup(newTrayEl)
    const nestedDie = contents.querySelector('[data-toy-type]')
    expect(nestedDie).toBeTruthy()
    expect(nestedDie.getAttribute('data-toy-type')).toBe('dice_d6')
    expect(nestedDie.getAttribute('id')).toBe(nestedDie.getAttribute('data-id'))
    expect(nestedDie.getAttribute('data-id')).not.toBe('die1')
    expect(nestedDie.getAttribute('data-id')).not.toBe(newTray.dataId)
  })

  test('preserves the nested die\u2019s live state (its rolled value) and the tray\u2019s color, rather than a blank instance', async () => {
    const { ydoc, layerEl, supplyEl, unbind } = await setUp()
    clickTake(ydoc, layerEl, supplyEl)
    unbind()

    const newTrayEl = [...layerEl.querySelectorAll('[data-toy-type="tray_sum"]')]
      .find(el => el.getAttribute('data-id') !== 'tray1')
    expect(newTrayEl.getAttribute('data-color')).toBe('#3355ff')

    const nestedDie = getContentsGroup(newTrayEl).querySelector('[data-toy-type]')
    expect(nestedDie.querySelector('tspan').textContent).toBe('4') // carried over, not reset to the template's 6
  })

  test('leaves the original tray and die completely untouched', async () => {
    const { ydoc, layerEl, supplyEl, unbind } = await setUp()
    clickTake(ydoc, layerEl, supplyEl)
    unbind()

    const origTray = findToyDom(layerEl, 'tray1')
    const origDie  = getContentsGroup(origTray).querySelector('[data-toy-type]')
    expect(origDie.getAttribute('data-id')).toBe('die1')
    expect(origDie.querySelector('tspan').textContent).toBe('4')
  })
})

describe('supply — clone scenario: chip "5" with chip "6" stacked on top', () => {
  async function setUp() {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    addToyDom(ydoc, layerEl, { id: 'supply1', toyType: 'supply', x: 100, y: 100, color: '#fff' }, SUPPLY_SVG)
    addToyDom(ydoc, layerEl, { id: 'chip5',   toyType: 'chip',   x: 100, y: 300, color: '#dd2222' }, CHIP_SVG)
    addToyDom(ydoc, layerEl, { id: 'chip6',   toyType: 'chip',   x: 500, y: 500, color: '#22dd22' }, CHIP_SVG)
    await activateAll(ydoc, layerEl)

    // chip.svg's template default is "5" (matches the scenario as named);
    // give chip6 a distinct value so it's unmistakable if it were ever
    // wrongly duplicated instead of left alone.
    findToyDom(layerEl, 'chip6').querySelector('tspan').textContent = '6'

    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    // chip6 lands on chip5's own snap point — real stacking, same
    // technique as tests/unit/toy-position-snap.test.js.
    const chip5Point = getSnapPoints(layerEl).find(p => p.ownerId === 'chip5')
    api.applyMoveCommit(api.find('chip6'), chip5Point.cx, chip5Point.cy)
    // then chip5 (carrying chip6) lands on supply's own snap point.
    const supplyPoint = getSnapPoints(layerEl).find(p => p.ownerId === 'supply1')
    api.applyMoveCommit(api.find('chip5'), supplyPoint.cx, supplyPoint.cy)

    const supplyEl = findToyDom(layerEl, 'supply1')
    const chip5El  = findToyDom(layerEl, 'chip5')
    const chip6El  = findToyDom(layerEl, 'chip6')
    expect(supplyEl.getAttribute('data-below')).toBe('chip5')
    expect(chip5El.getAttribute('data-below')).toBe('chip6')
    expect(chip6El.getAttribute('data-above')).toBe('chip5')

    const unbind = bindSupplyHarness(ydoc, layerEl)
    return { ydoc, layerEl, supplyEl, unbind }
  }

  test('clones only chip5 — chip6 is a sibling, not nested, and is left alone', async () => {
    const { ydoc, layerEl, supplyEl, unbind } = await setUp()

    const chipsBefore = layerEl.querySelectorAll('[data-toy-type="chip"]').length
    clickTake(ydoc, layerEl, supplyEl)
    unbind()

    const chipsAfter = layerEl.querySelectorAll('[data-toy-type="chip"]').length
    expect(chipsAfter).toBe(chipsBefore + 1) // exactly one new chip, not two

    expect(findToyDom(layerEl, 'chip6')).toBeTruthy() // still exactly the original chip6
    expect(layerEl.querySelectorAll('[data-id="chip6"]').length).toBe(1)
  })

  test('the clone carries chip5\u2019s value ("5") but starts with NO stacking relationship — initialize() clears data-below/data-above', async () => {
    const { ydoc, layerEl, supplyEl, unbind } = await setUp()
    clickTake(ydoc, layerEl, supplyEl)
    unbind()

    const newChip = [...layerEl.querySelectorAll('[data-toy-type="chip"]')]
      .find(el => !['chip5', 'chip6'].includes(el.getAttribute('data-id')))
    expect(newChip).toBeTruthy()
    expect(newChip.querySelector('tspan').textContent).toBe('5') // chip5's value, not chip6's "6"
    expect(newChip.getAttribute('data-below')).toBe('')
    expect(newChip.getAttribute('data-above')).toBe('')
    expect(newChip.getAttribute('data-id')).toBe(newChip.getAttribute('id'))
  })

  test('does not disturb the original stack — chip5/chip6\u2019s data-above/data-below are unchanged after cloning', async () => {
    const { ydoc, layerEl, supplyEl, unbind } = await setUp()
    clickTake(ydoc, layerEl, supplyEl)
    unbind()

    expect(findToyDom(layerEl, 'chip5').getAttribute('data-below')).toBe('chip6')
    expect(findToyDom(layerEl, 'chip6').getAttribute('data-above')).toBe('chip5')
  })

  test('places the clone using supply\u2019s .tt_target marker, not supply\u2019s raw centre', async () => {
    const { ydoc, layerEl, supplyEl, unbind } = await setUp()

    const target   = supplyEl.querySelector('.tt_target')
    const expected = getInnerAnchor(supplyEl, target)
    const rawCentre = getAnchor(supplyEl)
    // Sanity check on the fixture itself: if these ever coincided, the
    // test below couldn't tell a correctly-targeted placement from an
    // accidental fallback to supply's own centre.
    expect(Math.abs(expected.x - rawCentre.x) + Math.abs(expected.y - rawCentre.y)).toBeGreaterThan(1)

    clickTake(ydoc, layerEl, supplyEl)
    unbind()

    const newChip = [...layerEl.querySelectorAll('[data-toy-type="chip"]')]
      .find(el => !['chip5', 'chip6'].includes(el.getAttribute('data-id')))
    const placed = getAnchor(newChip)
    expect(placed.x).toBeCloseTo(expected.x, 1)
    expect(placed.y).toBeCloseTo(expected.y, 1)
  })
})

describe('supply — borrows a landed toy\u2019s color, then gives it back', () => {
  async function setUp() {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    addToyDom(ydoc, layerEl, { id: 'supply1', toyType: 'supply', x: 100, y: 100, color: '#123456' }, SUPPLY_SVG)
    addToyDom(ydoc, layerEl, { id: 'chipA',   toyType: 'chip',   x: 500, y: 500, color: '#dd2222' }, CHIP_SVG)
    await activateAll(ydoc, layerEl)

    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    const unbind = bindSupplyHarness(ydoc, layerEl)
    const supplyPoint = getSnapPoints(layerEl).find(p => p.ownerId === 'supply1')
    return { ydoc, layerEl, api, unbind, supplyPoint }
  }

  test('landing a colored chip on supply recolors supply and stashes its original color', async () => {
    const { ydoc, layerEl, api, unbind, supplyPoint } = await setUp()
    const supplyEl = findToyDom(layerEl, 'supply1')
    expect(supplyEl.getAttribute('data-color')).toBe('#123456')

    api.applyMoveCommit(api.find('chipA'), supplyPoint.cx, supplyPoint.cy)
    unbind()

    expect(supplyEl.getAttribute('data-color')).toBe('#dd2222')
    expect(supplyEl.getAttribute('data-orig-color')).toBe('#123456')
    // editDom's real effect, not just the bookkeeping attribute — the
    // filter matrix actually changed too.
    const values = supplyEl.querySelector('.supply1__tt_color_filter feColorMatrix').getAttribute('values')
    const chipValues = findToyDom(layerEl, 'chipA').querySelector('.chipA__tt_color_filter feColorMatrix').getAttribute('values')
    expect(values).toBe(chipValues)
  })

  test('picking the chip back up restores supply\u2019s original color and clears the stash', async () => {
    const { ydoc, layerEl, api, unbind, supplyPoint } = await setUp()
    const supplyEl = findToyDom(layerEl, 'supply1')
    api.applyMoveCommit(api.find('chipA'), supplyPoint.cx, supplyPoint.cy)
    expect(supplyEl.getAttribute('data-color')).toBe('#dd2222') // sanity: borrow happened

    api.applyMoveCommit(findToyDom(layerEl, 'chipA'), 500, 500) // pick it back up, move away
    unbind()

    expect(supplyEl.getAttribute('data-color')).toBe('#123456')
    expect(supplyEl.getAttribute('data-orig-color')).toBeFalsy()
  })

  test('a second, different-colored chip landing after the first departs stashes the TRUE original, not the borrowed one', async () => {
    const { ydoc, layerEl, api, unbind, supplyPoint } = await setUp()
    addToyDom(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 700, y: 700, color: '#22aa22' }, CHIP_SVG)
    activateAllToyScriptsDom(ydoc, layerEl)
    const supplyEl = findToyDom(layerEl, 'supply1')

    api.applyMoveCommit(api.find('chipA'), supplyPoint.cx, supplyPoint.cy)
    api.applyMoveCommit(findToyDom(layerEl, 'chipA'), 500, 500) // depart, restoring original
    api.applyMoveCommit(api.find('chipB'), supplyPoint.cx, supplyPoint.cy) // second, different borrow
    unbind()

    expect(supplyEl.getAttribute('data-color')).toBe('#22aa22')
    expect(supplyEl.getAttribute('data-orig-color')).toBe('#123456') // not '#dd2222'
  })

  test('initialize() resets a stuck borrow (e.g. a clone made while mid-borrow) back to the true original', async () => {
    const { ydoc, layerEl, unbind } = await setUp()
    const supplyEl = findToyDom(layerEl, 'supply1')
    // Simulate "cloned while something else's color was borrowed",
    // without needing an actual clone-of-a-clone scenario to set it up.
    supplyEl.setAttribute('data-color', '#dd2222')
    supplyEl.setAttribute('data-orig-color', '#123456')

    initializeToy(ydoc, layerEl, supplyEl, 'supply', AUTHOR, TABLE)
    unbind()

    expect(supplyEl.getAttribute('data-color')).toBe('#123456')
    expect(supplyEl.getAttribute('data-orig-color')).toBeFalsy()
  })
})

describe('supply — reload parity (regression: nested-envelope duplicate clone)', () => {
  // invokeMenuAction wraps the whole 'Take' handler call in its own
  // envelope; _take's synchronous 'toy:clone' dispatch runs inside that.
  // If the request-bus handler ALSO opened its own separately-committing
  // envelope (Toys.cloneToy/initializeToy called unconditionally, the
  // original bug), both envelopes independently observe and commit the
  // SAME DOM mutation — two ops that each insert the clone, which
  // replays as a genuine duplicate node. These assert the fix directly:
  // one click, one op, and a replay-from-log matches the live DOM.

  test('clicking Take (via the real menu-action path) produces exactly one new op', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    addToyDom(ydoc, layerEl, { id: 'supply1', toyType: 'supply', x: 100, y: 100, color: '#fff' }, SUPPLY_SVG)
    addToyDom(ydoc, layerEl, { id: 'chip5',   toyType: 'chip',   x: 500, y: 500, color: '#dd2222' }, CHIP_SVG)
    await activateAll(ydoc, layerEl)

    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    const supplyPoint = getSnapPoints(layerEl).find(p => p.ownerId === 'supply1')
    api.applyMoveCommit(api.find('chip5'), supplyPoint.cx, supplyPoint.cy)
    const supplyEl = findToyDom(layerEl, 'supply1')

    const unbind = bindSupplyHarness(ydoc, layerEl)
    const opsBefore = getOps(ydoc).size
    clickTake(ydoc, layerEl, supplyEl)
    unbind()

    expect(getOps(ydoc).size).toBe(opsBefore + 1)
  })

  test('chip scenario: replaying the op log from scratch matches the live layer exactly', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    // Real, op-committing placement (Toys.placeToy) — not addToyDom
    // directly — because reloadedIds() replays purely from the op log,
    // and the initial placements need to be *in* that log for the
    // comparison to mean anything. (Every other describe block in this
    // file uses addToyDom deliberately, to avoid needing the fetch
    // stub at all; this one specifically needs the opposite.)
    await Toys.placeToy(ydoc, layerEl, { id: 'supply1', toyType: 'supply', x: 100, y: 100, color: '#fff' }, { authorId: AUTHOR, tableId: TABLE })
    await Toys.placeToy(ydoc, layerEl, { id: 'chip5',   toyType: 'chip',   x: 500, y: 500, color: '#dd2222' }, { authorId: AUTHOR, tableId: TABLE })
    await activateAll(ydoc, layerEl)

    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    const supplyPoint = getSnapPoints(layerEl).find(p => p.ownerId === 'supply1')
    api.applyMoveCommit(api.find('chip5'), supplyPoint.cx, supplyPoint.cy)
    const supplyEl = findToyDom(layerEl, 'supply1')

    const unbind = bindSupplyHarness(ydoc, layerEl)
    clickTake(ydoc, layerEl, supplyEl)
    unbind()

    expect(reloadedIds(ydoc)).toEqual(liveIds(layerEl))
  })

  test('tray scenario: replaying the op log from scratch matches the live layer exactly, nested die included', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await Toys.placeToy(ydoc, layerEl, { id: 'supply1', toyType: 'supply',   x: 100, y: 100, color: '#fff' }, { authorId: AUTHOR, tableId: TABLE })
    await Toys.placeToy(ydoc, layerEl, { id: 'tray1',   toyType: 'tray_sum', x: 100, y: 300, color: '#3355ff' }, { authorId: AUTHOR, tableId: TABLE })
    await Toys.placeToy(ydoc, layerEl, { id: 'die1',    toyType: 'dice_d6',  x: 100, y: 300, color: '#ffcc00' }, { authorId: AUTHOR, tableId: TABLE })
    // reparentToyDom is a plain DOM op — wrap it in its own gesture so
    // the nesting itself is a real, replayable op too (same reasoning
    // as placeToy above: reloadedIds() only sees what's in the log).
    Toys.runGesture(ydoc, layerEl, () => {
      reparentToyDom(layerEl, 'die1', 'tray1')
    }, { gesture: 'reparent', authorId: AUTHOR, tableId: TABLE })
    await activateAll(ydoc, layerEl)

    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    const supplyPoint = getSnapPoints(layerEl).find(p => p.ownerId === 'supply1')
    api.applyMoveCommit(api.find('tray1'), supplyPoint.cx, supplyPoint.cy)
    const supplyEl = findToyDom(layerEl, 'supply1')

    const unbind = bindSupplyHarness(ydoc, layerEl)
    clickTake(ydoc, layerEl, supplyEl)
    unbind()

    expect(reloadedIds(ydoc)).toEqual(liveIds(layerEl))
  })
})

describe('supply — clone inner elements get their own data-id (regression: moved clone swaps places with its prototype on reload)', () => {
  // A real bug report: drag a chip onto a supply, Take a clone of it, move
  // the clone away to wherever it's actually going to be played, then
  // refresh the browser — and the chip that's still sitting on the supply
  // jumps down into the supply's own deposit spot, while the clone snaps
  // back to right where it was taken.
  //
  // Root cause: cloneToyBoundary deep-clones the prototype's whole <svg>
  // subtree, remapping every element's plain `id` (and href/url(#...)
  // references to it) onto the new instance's own prefix — but
  // parseForeignNode's data-id derivation preferred whatever data-id the
  // SOURCE element already had, and every source element already has one
  // (stamped at its own original placement). The clone ended up with
  // every inner element sharing its data-id with the corresponding
  // element in the still-live prototype. That's invisible locally — live
  // handlers hold direct element references, never look anything up by
  // id — but the op log addresses every mutation target by data-id
  // (op_wire_mutation.js's nodeRef/resolveRef), and a duplicate data-id
  // resolves to whichever of the two elements comes first in document
  // order. Moving the clone serializes an attribute change against that
  // shared id; replaying it (a reload, or a peer who never saw the
  // moment live) applies it to the FIRST match instead — the original
  // prototype, still sitting on the supply — while the clone's own
  // snapshot (baked into the earlier 'Take' op) keeps showing it at its
  // original, pre-move spot.
  async function setUp() {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await Toys.placeToy(ydoc, layerEl, { id: 'supply1', toyType: 'supply', x: 100, y: 100, color: '#fff' }, { authorId: AUTHOR, tableId: TABLE })
    await Toys.placeToy(ydoc, layerEl, { id: 'chip5',   toyType: 'chip',   x: 500, y: 500, color: '#dd2222' }, { authorId: AUTHOR, tableId: TABLE })
    await activateAll(ydoc, layerEl)

    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    const supplyPoint = getSnapPoints(layerEl).find(p => p.ownerId === 'supply1')
    api.applyMoveCommit(api.find('chip5'), supplyPoint.cx, supplyPoint.cy)
    const supplyEl = findToyDom(layerEl, 'supply1')
    expect(supplyEl.getAttribute('data-below')).toBe('chip5')

    const unbind = bindSupplyHarness(ydoc, layerEl)
    clickTake(ydoc, layerEl, supplyEl)
    unbind()

    const cloneEl = [...layerEl.querySelectorAll('[data-toy-type="chip"]')]
      .find(el => el.getAttribute('data-id') !== 'chip5')
    return { ydoc, layerEl, api, supplyEl, cloneId: cloneEl.getAttribute('data-id') }
  }

  test('none of the clone’s inner data-ids collide with the prototype’s', async () => {
    const { layerEl, cloneId } = await setUp()
    const originalEl = findToyDom(layerEl, 'chip5')
    const cloneEl    = findToyDom(layerEl, cloneId)

    const originalIds = [originalEl, ...originalEl.querySelectorAll('[data-id]')].map(el => el.getAttribute('data-id'))
    const cloneIds    = [cloneEl,    ...cloneEl.querySelectorAll('[data-id]')].map(el => el.getAttribute('data-id'))

    expect(cloneIds.length).toBeGreaterThan(1) // sanity: the chip template has inner elements to check
    expect(cloneIds.filter(id => originalIds.includes(id))).toEqual([])
  })

  test('moving the clone after Take, then replaying the op log from scratch, leaves both the prototype and the clone at their real positions', async () => {
    const { ydoc, layerEl, api, cloneId } = await setUp()

    // Move the clone away from the supply's deposit spot — the natural
    // next thing a player does with what they just took.
    api.applyMoveCommit(api.find(cloneId), 800, 800)

    const liveProtoAnchor = getAnchor(findToyDom(layerEl, 'chip5'))
    const liveCloneAnchor = getAnchor(findToyDom(layerEl, cloneId))
    expect(liveCloneAnchor).toEqual({ x: 800, y: 800 })

    const ops = getOps(ydoc)
    const reloadedLayer = freshLayer()
    projectFrom(reloadedLayer, ops, heads(ops)[0] ?? null)

    const reloadedProto = reloadedLayer.querySelector('[data-id="chip5"]')
    const reloadedClone = reloadedLayer.querySelector(`[data-id="${cloneId}"]`)
    expect(reloadedProto).toBeTruthy()
    expect(reloadedClone).toBeTruthy()

    // The prototype must still be sitting on the supply, right where it
    // always was — NOT wherever the clone got dragged to.
    expect(getAnchor(reloadedProto)).toEqual(liveProtoAnchor)
    // The clone must be at the spot it was actually moved to — NOT back
    // at its original deposit-area placement.
    expect(getAnchor(reloadedClone)).toEqual(liveCloneAnchor)

    expect(reloadedLayer.querySelector('[data-id="supply1"]').getAttribute('data-below')).toBe('chip5')
  })
})
