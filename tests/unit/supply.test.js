/**
 * tests/unit/supply.test.js
 *
 * supply.svg's 'Take' action: dispatches 'warn' when nothing is beneath
 * it, otherwise dispatches 'toy:clone' naming the toy directly below it
 * and leaves canvas-space placement entirely to the harness (via its own
 * .tt_target marker, or the harness's default of supply's own centre).
 *
 * The harness side (app.js's bindToyRequestBus) isn't imported directly —
 * same convention as tests/unit/toy-position-snap.test.js and
 * reparent-position.test.js: a faithful reimplementation of its 'toy:clone'
 * listener, exercising the real Toys.cloneToy/initializeToy machinery
 * without needing a full boot() (providers, awareness, etc.).
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
import {
  addToyDom, activateAllToyScriptsDom, reparentToyDom, makeLayerAPI,
  getContentsGroup, findToyDom, getSnapPoints, getAnchor, getInnerAnchor,
  cloneToy, initializeToy, newToyId,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'

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

// tray_sum and dice_d6 are TOY_TYPES-registered, so scriptsForType()
// always re-fetches their own .svg for activation regardless of how
// they were placed (only an unregistered type, like supply, falls back
// to reading its already-hoisted scripts). chip is registered too.
// Placement itself never needs fetch either way: every toy below is
// placed via addToyDom directly (real svg text, no network), matching
// tests/unit/toys-dom-ops.test.js's convention — this stub exists only
// for what *activation* needs.
function stubToyFetch() {
  return vi.fn(async (url) => {
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
 * Faithful reimplementation of app.js's bindToyRequestBus 'toy:clone'
 * listener (see this file's header). Returns an unbind function.
 */
function bindToyCloneHarness(ydoc, layerEl) {
  const listener = (e) => {
    const { id: sourceId, sourceEl } = e.detail
    const subjectEl = findToyDom(layerEl, sourceId)
    if (!subjectEl) { e.detail.error = `toy not found: ${sourceId}`; return }

    const target = sourceEl?.querySelector?.('.tt_target')
    const { x, y } = target ? getInnerAnchor(sourceEl, target) : getAnchor(sourceEl)

    const newId = newToyId()
    let result
    try {
      result = cloneToy(ydoc, layerEl, sourceId, newId, x, y, { authorId: AUTHOR, tableId: TABLE })
    } catch (err) {
      e.detail.error = err.message
      return
    }
    e.detail.retval = { id: newId }
    for (const { toyType, el } of result.cloned) {
      initializeToy(ydoc, layerEl, el, toyType, AUTHOR, TABLE)
    }
  }
  document.addEventListener('toy:clone', listener)
  return () => document.removeEventListener('toy:clone', listener)
}

// Every id ever seen on data-toy-id/data-id/id attributes anywhere in
// the layer, for asserting "nothing collides" without hardcoding which
// ids are expected to exist.
function allToyBoundaryIds(layerEl) {
  return [...layerEl.querySelectorAll('[data-toy-id]')].map(el => ({
    id:      el.getAttribute('id'),
    dataId:  el.getAttribute('data-id'),
    toyId:   el.getAttribute('data-toy-id'),
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
    const api = makeLayerAPI(ydoc, () => layerEl, AUTHOR, TABLE)
    const supplyPoint = getSnapPoints(layerEl).find(p => p.ownerId === 'supply1')
    api.applyMoveCommit(api.find('chipA'), supplyPoint.cx, supplyPoint.cy)
    expect(supplyEl.getAttribute('data-below')).toBe('chipA')

    let seenDetail = null
    const listener = (e) => { seenDetail = e.detail }
    document.addEventListener('toy:clone', listener)
    globalThis.supply._take(supplyEl)
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
    const die1El = layerEl.querySelector('[data-toy-id="die1"]')
    die1El.querySelector('tspan').textContent = '4'

    // Stack the whole tray onto supply's own position slot, via the real
    // production move/cascade path — same technique
    // toy-position-snap.test.js uses for chip-on-chip — so supply's own
    // data-below ends up set the same way it would in the app.
    const api = makeLayerAPI(ydoc, () => layerEl, AUTHOR, TABLE)
    const supplyPoint = getSnapPoints(layerEl).find(p => p.ownerId === 'supply1')
    api.applyMoveCommit(api.find('tray1'), supplyPoint.cx, supplyPoint.cy)

    const supplyEl = findToyDom(layerEl, 'supply1')
    expect(supplyEl.getAttribute('data-below')).toBe('tray1')

    const unbind = bindToyCloneHarness(ydoc, layerEl)
    return { ydoc, layerEl, supplyEl, unbind }
  }

  test('produces a new tray with its own new id, containing a new die with its own new id — no collisions', async () => {
    const { layerEl, supplyEl, unbind } = await setUp()

    const before = allToyBoundaryIds(layerEl)
    globalThis.supply._take(supplyEl)
    unbind()

    const after = allToyBoundaryIds(layerEl)
    expect(after.length).toBe(before.length + 2) // new tray + new nested die

    const allIds = after.map(x => x.toyId)
    expect(new Set(allIds).size).toBe(allIds.length) // every data-toy-id is unique

    const newTray = after.find(x => x.toyId !== 'tray1' && x.toyId !== 'supply1' && x.toyId !== 'die1'
      && layerEl.querySelector(`[data-toy-id="${x.toyId}"]`).getAttribute('data-toy-type') === 'tray_sum')
    expect(newTray).toBeTruthy()
    expect(newTray.id).toBe(newTray.dataId)     // id === data-id
    expect(newTray.id).toBe(newTray.toyId)      // id === data-toy-id — the invariant the bug broke

    const newTrayEl = layerEl.querySelector(`[data-toy-id="${newTray.toyId}"]`)
    const contents  = getContentsGroup(newTrayEl)
    const nestedDie = contents.querySelector('[data-toy-id]')
    expect(nestedDie).toBeTruthy()
    expect(nestedDie.getAttribute('data-toy-type')).toBe('dice_d6')
    expect(nestedDie.getAttribute('id')).toBe(nestedDie.getAttribute('data-id'))
    expect(nestedDie.getAttribute('id')).toBe(nestedDie.getAttribute('data-toy-id'))
    expect(nestedDie.getAttribute('data-toy-id')).not.toBe('die1')
    expect(nestedDie.getAttribute('data-toy-id')).not.toBe(newTray.toyId)
  })

  test('preserves the nested die\u2019s live state (its rolled value) and the tray\u2019s color, rather than a blank instance', async () => {
    const { layerEl, supplyEl, unbind } = await setUp()
    globalThis.supply._take(supplyEl)
    unbind()

    const newTrayEl = [...layerEl.querySelectorAll('[data-toy-type="tray_sum"]')]
      .find(el => el.getAttribute('data-toy-id') !== 'tray1')
    expect(newTrayEl.getAttribute('data-color')).toBe('#3355ff')

    const nestedDie = getContentsGroup(newTrayEl).querySelector('[data-toy-id]')
    expect(nestedDie.querySelector('tspan').textContent).toBe('4') // carried over, not reset to the template's 6
  })

  test('leaves the original tray and die completely untouched', async () => {
    const { layerEl, supplyEl, unbind } = await setUp()
    globalThis.supply._take(supplyEl)
    unbind()

    const origTray = findToyDom(layerEl, 'tray1')
    const origDie  = getContentsGroup(origTray).querySelector('[data-toy-id]')
    expect(origDie.getAttribute('data-toy-id')).toBe('die1')
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

    const api = makeLayerAPI(ydoc, () => layerEl, AUTHOR, TABLE)
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

    const unbind = bindToyCloneHarness(ydoc, layerEl)
    return { ydoc, layerEl, supplyEl, unbind }
  }

  test('clones only chip5 — chip6 is a sibling, not nested, and is left alone', async () => {
    const { layerEl, supplyEl, unbind } = await setUp()

    const chipsBefore = layerEl.querySelectorAll('[data-toy-type="chip"]').length
    globalThis.supply._take(supplyEl)
    unbind()

    const chipsAfter = layerEl.querySelectorAll('[data-toy-type="chip"]').length
    expect(chipsAfter).toBe(chipsBefore + 1) // exactly one new chip, not two

    expect(findToyDom(layerEl, 'chip6')).toBeTruthy() // still exactly the original chip6
    expect(layerEl.querySelectorAll('[data-toy-id="chip6"]').length).toBe(1)
  })

  test('the clone carries chip5\u2019s value ("5") but starts with NO stacking relationship — initialize() clears data-below/data-above', async () => {
    const { layerEl, supplyEl, unbind } = await setUp()
    globalThis.supply._take(supplyEl)
    unbind()

    const newChip = [...layerEl.querySelectorAll('[data-toy-type="chip"]')]
      .find(el => !['chip5', 'chip6'].includes(el.getAttribute('data-toy-id')))
    expect(newChip).toBeTruthy()
    expect(newChip.querySelector('tspan').textContent).toBe('5') // chip5's value, not chip6's "6"
    expect(newChip.getAttribute('data-below')).toBe('')
    expect(newChip.getAttribute('data-above')).toBe('')
    expect(newChip.getAttribute('data-toy-id')).toBe(newChip.getAttribute('id'))
    expect(newChip.getAttribute('data-toy-id')).toBe(newChip.getAttribute('data-id'))
  })

  test('does not disturb the original stack — chip5/chip6\u2019s data-above/data-below are unchanged after cloning', async () => {
    const { layerEl, supplyEl, unbind } = await setUp()
    globalThis.supply._take(supplyEl)
    unbind()

    expect(findToyDom(layerEl, 'chip5').getAttribute('data-below')).toBe('chip6')
    expect(findToyDom(layerEl, 'chip6').getAttribute('data-above')).toBe('chip5')
  })

  test('places the clone using supply\u2019s .tt_target marker, not supply\u2019s raw centre', async () => {
    const { layerEl, supplyEl, unbind } = await setUp()

    const target   = supplyEl.querySelector('.tt_target')
    const expected = getInnerAnchor(supplyEl, target)
    const rawCentre = getAnchor(supplyEl)
    // Sanity check on the fixture itself: if these ever coincided, the
    // test below couldn't tell a correctly-targeted placement from an
    // accidental fallback to supply's own centre.
    expect(Math.abs(expected.x - rawCentre.x) + Math.abs(expected.y - rawCentre.y)).toBeGreaterThan(1)

    globalThis.supply._take(supplyEl)
    unbind()

    const newChip = [...layerEl.querySelectorAll('[data-toy-type="chip"]')]
      .find(el => !['chip5', 'chip6'].includes(el.getAttribute('data-toy-id')))
    const placed = getAnchor(newChip)
    expect(placed.x).toBeCloseTo(expected.x, 1)
    expect(placed.y).toBeCloseTo(expected.y, 1)
  })
})
