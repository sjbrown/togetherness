/**
 * tests/unit/contents-change-cascade.test.js
 *
 * Phase 5.4 — derived contents_change: a local transaction that touches
 * something inside a tray's .contents_group (a die rolling, a toy being
 * reparented in/out) recomputes that tray's contents_change_handler.
 *
 * toys.js exports the primitives (findAncestorTrayIds, runContentsChangeHandler);
 * the actual dispatch + cascade guard live in app.js's onToysChanged, which
 * has no unit-test coverage of its own (app.js is exercised via Playwright
 * e2e, not vitest — see the project's existing convention). wireCascade()
 * below is a small, deliberately literal re-implementation of that
 * dispatch logic, built from the same exported primitives, so these tests
 * exercise the real integration surface rather than only the pieces in
 * isolation.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Toys from '../../src/toys.js'
import {
  addToy, reparentToy, findToy, render,
  findAncestorTrayIds, runContentsChangeHandler,
  clearYNodeMap, _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { runToyHandler } from '../../src/envelope.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

// Exercise the real, production toy files — same convention as tray.test.js.
const TRAY_SUM_SVG  = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS       = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG        = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

const getToysLayer = (ydoc) => ({ yToys: ydoc.getXmlFragment('toys') })

function renderLayer(yToys) {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  render(yToys, layerEl)
  return layerEl
}

// A plain `.querySelector('.tspan_result')` can shadow-match a *nested*
// sub-tray's own result (it sits inside .contents_group, which comes
// before .result_container in the markup — same reason tray.js's own
// getValue() needs the boundary-respecting tray._findOwn lookup, not a
// plain selector). Assertions in this file read a tray's own displayed
// sum via that same real helper, so a bug in production can't accidentally
// be masked by an equally-unsafe test assertion reading the wrong (but
// coincidentally similar-looking) element.
function ownResult(trayEl) {
  const container = globalThis.tray._findOwn(trayEl, '.result_container')
  return container && container.querySelector('.tspan_result')
}

function stubToyFetch() {
  return vi.fn(async (url) => {
    if (url === '/toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === '/toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
    if (url === '/toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === '/toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

async function place(ydoc, yToys, toyType, id) {
  await addToy(ydoc, yToys, { id, toyType, x: 0, y: 0, color: '#fff' })
}

// A minimal, literal re-implementation of app.js's onToysChanged dispatch
// (see the module doc above) — built from the same exported toys.js
// primitives the real integration uses, including the reentrancy guard.
function wireCascade(ydoc, yToys, layerEl, { onDispatch } = {}) {
  let dispatching = false

  yToys.observeDeep((events, transaction) => {
    if (!transaction.local || dispatching) return
    render(yToys, layerEl) // must happen before dispatch — see app.js's onToysChanged
    const depthById = new Map()
    for (const event of events) {
      const chain = findAncestorTrayIds(event.target)
      chain.forEach((trayId, i) => {
        const depth = chain.length - i
        if (depth > (depthById.get(trayId) ?? -1)) depthById.set(trayId, depth)
      })
    }
    if (!depthById.size) return
    const trayIds = [...depthById.keys()].sort((a, b) => depthById.get(b) - depthById.get(a))

    dispatching = true
    ;(async () => {
      for (const trayId of trayIds) {
        // data-toy-id, not data-yid — see app.js's dispatchContentsChangeCascade
        // for why: a nested tray never gets data-yid stamped.
        const trayEl = layerEl.querySelector(`[data-toy-id="${trayId}"]`)
        const yTray  = findToy(yToys, trayId)
        if (!trayEl || !yTray) continue
        onDispatch?.(trayId)
        await runContentsChangeHandler(ydoc, yToys, layerEl, trayEl, yTray.getAttribute('data-toy-type'))
      }
    })().finally(() => { dispatching = false })
  })
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

describe('findAncestorTrayIds', () => {
  test('a die inside a tray resolves to that tray\u2019s id', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'tray1')
    await place(ydoc, yToys, 'dice_d6', 'die1')
    reparentToy(ydoc, yToys, 'die1', 'tray1')

    const dieY = findToy(yToys, 'die1')
    expect(findAncestorTrayIds(dieY)).toEqual(['tray1'])
  })

  test('a top-level die (not in any tray) resolves to no trays', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'dice_d6', 'die1')

    const dieY = findToy(yToys, 'die1')
    expect(findAncestorTrayIds(dieY)).toEqual([])
  })

  test('a die in a doubly-nested tray resolves both, innermost first', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'outer')
    await place(ydoc, yToys, 'tray_sum', 'inner')
    await place(ydoc, yToys, 'dice_d6', 'die1')
    reparentToy(ydoc, yToys, 'inner', 'outer')
    reparentToy(ydoc, yToys, 'die1', 'inner')

    const dieY = findToy(yToys, 'die1')
    expect(findAncestorTrayIds(dieY)).toEqual(['inner', 'outer'])
  })

  test('a tray\u2019s own result_container is a sibling of .contents_group, not inside it', async () => {
    // Sanity check on the structural self-termination property the
    // cascade guard relies on: recomputing tray1's own display must never
    // itself resolve back to tray1.
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'tray1')
    const { toyEl } = { toyEl: renderLayer(yToys).querySelector('[data-yid="tray1"]') }
    await new Promise(r => setTimeout(r, 0))

    const tspanResult = ownResult(toyEl)
    const yTspanText = Toys.yNodeFor(tspanResult.firstChild) ?? Toys.yNodeFor(tspanResult)
    expect(findAncestorTrayIds(yTspanText)).toEqual([])
  })
})

describe('the full cascade — die-in-tray roll updates the sum exactly once', () => {
  test('rolling a die inside a tray updates the tray\u2019s sum tspan to match', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'tray1')
    await place(ydoc, yToys, 'dice_d6', 'die1')
    reparentToy(ydoc, yToys, 'die1', 'tray1')

    const layerEl = renderLayer(yToys)
    await new Promise(r => setTimeout(r, 0)) // flush script activation

    const dispatchLog = []
    wireCascade(ydoc, yToys, layerEl, { onDispatch: (id) => dispatchLog.push(id) })

    const dieEl = layerEl.querySelector('[data-toy-id="die1"]')
    let rolledValue
    await runToyHandler(ydoc, yToys, layerEl, dieEl, () => {
      rolledValue = globalThis.dice.roll_handler(dieEl, 6)
    })
    await new Promise(r => setTimeout(r, 0)) // flush the cascade's async dispatch

    const trayEl = layerEl.querySelector('[data-yid="tray1"]')
    expect(ownResult(trayEl).textContent).toBe(String(rolledValue))
    expect(dispatchLog).toEqual(['tray1']) // exactly once
  })

  test('rolling a die that is NOT in any tray triggers no dispatch at all', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'dice_d6', 'die1')
    const layerEl = renderLayer(yToys)
    await new Promise(r => setTimeout(r, 0))

    const dispatchLog = []
    wireCascade(ydoc, yToys, layerEl, { onDispatch: (id) => dispatchLog.push(id) })

    const dieEl = layerEl.querySelector('[data-toy-id="die1"]')
    await runToyHandler(ydoc, yToys, layerEl, dieEl, () => {
      globalThis.dice.roll_handler(dieEl, 6)
    })
    await new Promise(r => setTimeout(r, 0))

    expect(dispatchLog).toEqual([])
  })

  test('an empty tray recomputes to 0 when its one die is removed (reparented back out)', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'tray1')
    await place(ydoc, yToys, 'dice_d6', 'die1')
    reparentToy(ydoc, yToys, 'die1', 'tray1')

    const layerEl = renderLayer(yToys)
    await new Promise(r => setTimeout(r, 0))
    wireCascade(ydoc, yToys, layerEl)

    // seed a nonzero sum first, so 0 afterward is a meaningful assertion
    const dieEl = layerEl.querySelector('[data-toy-id="die1"]')
    await runToyHandler(ydoc, yToys, layerEl, dieEl, () => {
      globalThis.dice.roll_handler(dieEl, 6)
    })
    await new Promise(r => setTimeout(r, 0))
    const trayEl1 = layerEl.querySelector('[data-yid="tray1"]')
    expect(ownResult(trayEl1).textContent).not.toBe('0')

    reparentToy(ydoc, yToys, 'die1', null) // pull it back out to the top level
    await new Promise(r => setTimeout(r, 0))

    const trayEl2 = layerEl.querySelector('[data-yid="tray1"]')
    expect(ownResult(trayEl2).textContent).toBe('0')
  })

  test('a die inside a doubly-nested tray updates both trays, inner before outer, each exactly once', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'outer')
    await place(ydoc, yToys, 'tray_sum', 'inner')
    await place(ydoc, yToys, 'dice_d6', 'die1')
    reparentToy(ydoc, yToys, 'inner', 'outer')
    reparentToy(ydoc, yToys, 'die1', 'inner')

    const layerEl = renderLayer(yToys)
    await new Promise(r => setTimeout(r, 0))

    const dispatchLog = []
    wireCascade(ydoc, yToys, layerEl, { onDispatch: (id) => dispatchLog.push(id) })

    const dieEl = layerEl.querySelector('[data-toy-id="die1"]')
    let rolledValue
    await runToyHandler(ydoc, yToys, layerEl, dieEl, () => {
      rolledValue = globalThis.dice.roll_handler(dieEl, 6)
    })
    await new Promise(r => setTimeout(r, 0))
    await new Promise(r => setTimeout(r, 0)) // second tick: inner's commit re-fires the observer for outer

    expect(dispatchLog).toEqual(['inner', 'outer']) // innermost first, each exactly once

    const outerEl = layerEl.querySelector('[data-yid="outer"]') // top-level, data-yid is fine
    const innerEl = layerEl.querySelector('[data-toy-id="inner"]') // nested — see above
    expect(ownResult(innerEl).textContent).toBe(String(rolledValue))
    // outer's own sum = the inner tray's displayed value (its only content)
    expect(ownResult(outerEl).textContent).toBe(String(rolledValue))
  })

  test('dropping a whole tray (already summing to 5) into a tray already summing to 3 updates the target to 8', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'trayA')
    await place(ydoc, yToys, 'dice_d6',  'dieA')
    await place(ydoc, yToys, 'tray_sum', 'trayB')
    await place(ydoc, yToys, 'dice_d6',  'dieB')

    const layerEl = renderLayer(yToys)
    await new Promise(r => setTimeout(r, 0))
    wireCascade(ydoc, yToys, layerEl)

    // Set up trayA = 3, trayB = 5, each from its own single die — each tray
    // is a separate, independent top-level tray at this point.
    reparentToy(ydoc, yToys, 'dieA', 'trayA')
    await new Promise(r => setTimeout(r, 0))
    const dieAEl = layerEl.querySelector('[data-toy-id="dieA"]')
    await runToyHandler(ydoc, yToys, layerEl, dieAEl, () => {
      dieAEl.querySelector('tspan').textContent = '3'
    })
    await new Promise(r => setTimeout(r, 0))

    reparentToy(ydoc, yToys, 'dieB', 'trayB')
    await new Promise(r => setTimeout(r, 0))
    const dieBEl = layerEl.querySelector('[data-toy-id="dieB"]')
    await runToyHandler(ydoc, yToys, layerEl, dieBEl, () => {
      dieBEl.querySelector('tspan').textContent = '5'
    })
    await new Promise(r => setTimeout(r, 0))

    expect(ownResult(layerEl.querySelector('[data-yid="trayA"]')).textContent).toBe('3')
    expect(ownResult(layerEl.querySelector('[data-yid="trayB"]')).textContent).toBe('5')

    // Now drop trayB (as a whole, with its die and its own displayed sum)
    // into trayA — this is a single reparentToy call, exactly what
    // app.js's commitMove issues when a tray is dragged onto another tray.
    reparentToy(ydoc, yToys, 'trayB', 'trayA')
    await new Promise(r => setTimeout(r, 0))
    await new Promise(r => setTimeout(r, 0))
    await new Promise(r => setTimeout(r, 0))

    expect(ownResult(layerEl.querySelector('[data-yid="trayA"]')).textContent).toBe('8')
  })
})
