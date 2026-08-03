// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { getOps, appendOp } from '../../src/op_dag.js'
import { checkpointOp, projectFrom } from '../../src/op_checkpoint.js'
import { getHead, setHead } from '../../src/op_head.js'
import * as Toys from '../../src/toys.js'
import { addToy, activateAllToyScriptsDom, _clearSvgTextCache,
         _resetToyScriptState, getMenuActions, invokeMenuActionSync,
         getNamespacesForType } from '../../src/toys.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

// Exercise the real, production toy files — not fixtures — so this file is
// the actual port verification the plan asks for, not just a shape test.
const D6_SVG        = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  return layerEl
}

function stubToyFetch() {
  return vi.fn(async (url) => {
    if (url === '/toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === '/toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

async function placeAndActivate(ydoc, layerEl, id) {
  await addToy(ydoc, layerEl, { id, toyType: 'dice_d6', x: 0, y: 0, color: '#fff' })
  activateAllToyScriptsDom(ydoc, layerEl)
  await new Promise(r => setTimeout(r, 0)) // flush the fire-and-forget script activation
  return { layerEl, toyEl: layerEl.querySelector(`[data-id="${id}"]`) }
}

beforeEach(() => {
  _clearSvgTextCache()
  _resetToyScriptState()
  delete globalThis.dice
  delete globalThis.d6
  vi.stubGlobal('fetch', stubToyFetch())
})
afterEach(() => { vi.unstubAllGlobals() })

describe('dice_utils.js + d6 — script activation', () => {
  test('placing a d6 defines window.dice and window.d6', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await placeAndActivate(ydoc, layerEl, 't1')

    expect(typeof globalThis.dice.roll_handler).toBe('function')
    expect(typeof globalThis.dice.turn_handler).toBe('function')
    expect(typeof globalThis.d6.menu).toBe('object')
    expect(getNamespacesForType('dice_d6')).toEqual(['dice', 'd6'])
  })
})

describe('dice_utils.js — roll_handler / turn_handler', () => {
  // A minimal real element (not a mock) so elem.querySelector('tspan')
  // exercises the actual fallback path dice_utils.js uses when no explicit
  // valueTspan is passed — this is the archive2025-compatible default.
  function makeElemWithTspan(initial) {
    const elem  = document.createElementNS(SVG_NS, 'g')
    const tspan = document.createElementNS(SVG_NS, 'tspan')
    tspan.textContent = initial
    elem.appendChild(tspan)
    return { elem, tspan }
  }

  test('turn_handler falls back to the first <tspan> in elem and advances 1..6, wrapping', () => {
    const { elem, tspan } = makeElemWithTspan('6')
    ;(0, eval)(DICE_UTILS_JS)
    expect(dice.turn_handler(elem, 6)).toBe(1)
    expect(tspan.textContent).toBe('1')
    expect(dice.turn_handler(elem, 6)).toBe(2)
  })

  test('roll_handler produces a value in [1, numSides]', () => {
    const { elem, tspan } = makeElemWithTspan('6')
    ;(0, eval)(DICE_UTILS_JS)

    for (let i = 0; i < 50; i++) {
      const value = dice.roll_handler(elem, 6)
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(6)
      expect(tspan.textContent).toBe(String(value))
    }
  })

  test('an explicit valueTspan is used instead of the elem.querySelector fallback', () => {
    const elem = document.createElementNS(SVG_NS, 'g')
    const decoy = document.createElementNS(SVG_NS, 'tspan') // first in doc order
    decoy.textContent = '9'
    const real = document.createElementNS(SVG_NS, 'tspan')
    real.textContent = '6'
    elem.append(decoy, real)
    ;(0, eval)(DICE_UTILS_JS)

    dice.turn_handler(elem, 6, real)
    expect(real.textContent).toBe('1')
    expect(decoy.textContent).toBe('9') // untouched
  })
})

describe('dice_utils.js — multiface_roll_handler / multiface_turn_handler', () => {
  function makeMultifaceElem(faceCount, visibleIndex = 0) {
    const elem = document.createElementNS(SVG_NS, 'g')
    const faces = []
    for (let i = 0; i < faceCount; i++) {
      const g = document.createElementNS(SVG_NS, 'g')
      g.classList.add('face')
      if (i !== visibleIndex) g.setAttribute('display', 'none')
      elem.appendChild(g)
      faces.push(g)
    }
    return { elem, faces }
  }

  test('multiface_roll_handler shows exactly one face, in [1, faceCount]', () => {
    const { elem, faces } = makeMultifaceElem(4)
    ;(0, eval)(DICE_UTILS_JS)

    for (let i = 0; i < 20; i++) {
      const shown = dice.multiface_roll_handler(elem)
      expect(shown).toBeGreaterThanOrEqual(1)
      expect(shown).toBeLessThanOrEqual(4)
      const visible = faces.filter(g => g.getAttribute('display') !== 'none')
      expect(visible).toEqual([faces[shown - 1]])
    }
  })

  test('multiface_turn_handler advances to the next face and wraps', () => {
    const { elem, faces } = makeMultifaceElem(3, 0)
    ;(0, eval)(DICE_UTILS_JS)

    expect(dice.multiface_turn_handler(elem)).toBe(2)
    expect(faces[1].getAttribute('display')).not.toBe('none')
    expect(faces[0].getAttribute('display')).toBe('none')

    expect(dice.multiface_turn_handler(elem)).toBe(3)
    expect(dice.multiface_turn_handler(elem)).toBe(1) // wraps
  })

  test('multiface_turn_handler returns null when no face is currently visible', () => {
    const { elem, faces } = makeMultifaceElem(2, 0)
    faces[0].setAttribute('display', 'none') // now none are visible
    ;(0, eval)(DICE_UTILS_JS)
    expect(dice.multiface_turn_handler(elem)).toBeNull()
  })
})

describe('dice_utils.js — getValue', () => {
  test('sums numeric tspans within an svg-wrapped die', () => {
    const wrapper = document.createElementNS(SVG_NS, 'g')
    const svg = document.createElementNS(SVG_NS, 'svg')
    const t1 = document.createElementNS(SVG_NS, 'tspan'); t1.textContent = '4'
    const t2 = document.createElementNS(SVG_NS, 'tspan'); t2.textContent = '2'
    svg.append(t1, t2)
    wrapper.appendChild(svg)
    ;(0, eval)(DICE_UTILS_JS)
    expect(dice.getValue(wrapper)).toBe(6)
  })

  test('FATE faces (+/-) add and subtract 1', () => {
    const wrapper = document.createElementNS(SVG_NS, 'g')
    const svg = document.createElementNS(SVG_NS, 'svg')
    const plus  = document.createElementNS(SVG_NS, 'tspan'); plus.textContent  = '+'
    const minus = document.createElementNS(SVG_NS, 'tspan'); minus.textContent = '-'
    const blank = document.createElementNS(SVG_NS, 'tspan'); blank.textContent = ' '
    svg.append(plus, minus, blank)
    wrapper.appendChild(svg)
    ;(0, eval)(DICE_UTILS_JS)
    expect(dice.getValue(wrapper)).toBe(0) // +1, -1, blank ignored
  })

  test('skips tspans that belong to a nested die\u2019s own <svg> (no double-counting)', () => {
    const wrapper   = document.createElementNS(SVG_NS, 'g')
    const ownSvg    = document.createElementNS(SVG_NS, 'svg')
    const ownTspan  = document.createElementNS(SVG_NS, 'tspan'); ownTspan.textContent = '5'
    const nestedSvg = document.createElementNS(SVG_NS, 'svg') // a die-within-a-tray
    const nestedTspan = document.createElementNS(SVG_NS, 'tspan'); nestedTspan.textContent = '3'
    nestedSvg.appendChild(nestedTspan)
    ownSvg.append(ownTspan, nestedSvg)
    wrapper.appendChild(ownSvg)
    ;(0, eval)(DICE_UTILS_JS)
    expect(dice.getValue(wrapper)).toBe(5) // nestedTspan excluded
  })
})

describe('d6 menu', () => {
  test('menu exposes Roll and Turn Up, both applicable', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    const actions = getMenuActions(toyEl)
    expect(actions.map(a => a.key).sort()).toEqual(['Roll', 'Turn Up'])
  })

  test("Turn Up's uiLabel previews the exact face it will land on", async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    const turnUp = getMenuActions(toyEl).find(a => a.key === 'Turn Up')
    expect(turnUp.label).toBe('Turn to 1') // starts at 6 in the SVG source -> wraps to 1
  })
})

describe('full vertical slice — roll via menu \u2192 tspan changes \u2192 envelope', () => {
  test('invoking Turn Up mutates the DOM', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuActionSync(ydoc, layerEl, toyEl, 'd6', 'Turn Up')

    expect(layerEl.querySelector('#t1__tspan_die_value').textContent).toBe('1')
  })

  test('invoking Roll commits a valid face', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuActionSync(ydoc, layerEl, toyEl, 'd6', 'Roll')

    const domValue = layerEl.querySelector('#t1__tspan_die_value').textContent
    expect(Number(domValue)).toBeGreaterThanOrEqual(1)
    expect(Number(domValue)).toBeLessThanOrEqual(6)
  })
})

describe('invokeMenuActionSync records an operation when given a tableId', () => {
  beforeEach(() => localStorage.clear())

  test('a menu action with no tableId records no operation', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuActionSync(ydoc, layerEl, toyEl, 'd6', 'Turn Up', undefined, 'alice')

    expect([...getOps(ydoc).values()].length).toBe(0)
  })

  test('a menu action with a tableId appends an operation', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    invokeMenuActionSync(ydoc, layerEl, toyEl, 'd6', 'Turn Up', undefined, 'alice', 'race-table')

    const ops = [...getOps(ydoc).values()]
    expect(ops.length).toBe(1)
    expect(ops[0].gesture).toBe('menu:d6.Turn Up')
    expect(ops[0].authorId).toBe('alice')
    expect(getHead('race-table')).toBe(ops[0].id)
  })

  test('the recorded operation replays a die roll onto a peer', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    const genesis = checkpointOp(layerEl, { authorId: 'alice', parents: [] })
    appendOp(ydoc, genesis)
    setHead('race-table', genesis.id)

    invokeMenuActionSync(ydoc, layerEl, toyEl, 'd6', 'Turn Up', undefined, 'alice', 'race-table')

    const rollOp = [...getOps(ydoc).values()].find(o => o.gesture.startsWith('menu:'))
    expect(rollOp.parents).toEqual([genesis.id])

    const peerLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    projectFrom(peerLayer, getOps(ydoc), rollOp.id)
    expect(peerLayer.querySelector('#t1__tspan_die_value').textContent).toBe('1')
  })
})

describe('script activation for a peer who only receives, never places', () => {
  const TABLE = 'receive-only-table'
  beforeEach(() => localStorage.clear())

  test('getMenuActions is empty before activation, populated after receiveToyOp', async () => {
    // Peer A: places for real, activating d6 on ITS OWN globalThis. We then
    // simulate a completely separate peer B by clearing the namespace and
    // the activation cache, so B has to earn its own activation.
    const ydocA  = new Y.Doc()
    const layerA = freshLayer()
    await placeAndActivate(ydocA, layerA, 't1')
    const genesis = checkpointOp(layerA, { authorId: 'alice', parents: [] })
    appendOp(ydocA, genesis)

    // Peer B: same ops (synced), fresh DOM, fresh namespace state.
    delete globalThis.d6
    Toys._resetToyScriptState()
    const ydocB = new Y.Doc()
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydocA))
    const layerB = document.createElementNS('http://www.w3.org/2000/svg', 'g')

    // Before B has ever projected/received anything: no menu, obviously.
    expect(Toys.getMenuActions(layerA.querySelector('#t1__die') ?? layerA)).toBeDefined()

    projectFrom(layerB, getOps(ydocB), genesis.id)
    const toyElBeforeActivation = layerB.querySelector('[data-toy-id="t1"]')
    expect(Toys.getMenuActions(toyElBeforeActivation)).toEqual([])

    // The fix: receiveToyOp (or projectLayer's non-empty branch) activates
    // scripts for whatever toy types the DOM now contains.
    Toys.activateAllToyScriptsDom(ydocB, layerB)
    await new Promise(r => setTimeout(r, 0))

    const toyElAfterActivation = layerB.querySelector('[data-toy-id="t1"]')
    const actions = Toys.getMenuActions(toyElAfterActivation)
    expect(actions.length).toBeGreaterThan(0)
    expect(actions.some(a => a.namespace === 'd6')).toBe(true)
  })

  test('projectLayer itself activates scripts on a non-creator DOM rebuild', async () => {
    const ydocA  = new Y.Doc()
    const layerA = freshLayer()
    await placeAndActivate(ydocA, layerA, 't1')
    const genesis = checkpointOp(layerA, { authorId: 'alice', parents: [] })
    appendOp(ydocA, genesis)
    setHead(TABLE, genesis.id) // pretend this session already caught up to genesis

    delete globalThis.d6
    Toys._resetToyScriptState()
    const ydocB = new Y.Doc()
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydocA))
    const layerB = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    layerB.id = 'toys-layer'

    Toys.projectLayer(ydocB, layerB, { tableId: TABLE, authorId: 'bob', isCreator: false })
    await new Promise(r => setTimeout(r, 0))

    const toyEl = layerB.querySelector('[data-toy-id="t1"]')
    expect(Toys.getMenuActions(toyEl).length).toBeGreaterThan(0)
  })
})
