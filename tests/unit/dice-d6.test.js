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
         _resetToyScriptState, getMenuActions, invokeMenuAction,
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

  test('skips tspans that belong to a nested dies own <svg> (no double-counting)', () => {
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
  test("Turn Up's uiLabel previews the exact face it will land on", async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    const turnUp = getMenuActions(toyEl).find(a => a.key === 'Turn Up')
    expect(turnUp.label).toBe('Turn to 1') // starts at 6 in the SVG source -> wraps to 1
  })
})

