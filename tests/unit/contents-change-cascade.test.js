/**
 * tests/unit/contents-change-cascade.test.js
 *
 * Derived contents_change: a local transaction that touches something
 * inside a container's .tt_contents (a die rolling, a toy being reparented
 * in/out) recomputes that container's contents_change_handler.
 *
 * toys.js exports the primitive tested here (findAncestorContainerIds) —
 * chain resolution from a changed Y node up to its enclosing container(s).
 * The actual dispatch + cascade (app.js's onToysChanged calling
 * runContentsChangeCascadeSync) runs synchronously and is exercised as part
 * of the real integration surface in tray.test.js's "the DOM-based cascade
 * itself" tests and in placement-reaction-atomic.test.js; app.js itself has
 * no unit-test coverage of its own (exercised via Playwright e2e, not
 * vitest — see the project's existing convention).
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
  findAncestorContainerIds,
  clearYNodeMap, _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'

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
// sub-tray's own result (it sits inside .tt_contents, which comes
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

describe('findAncestorContainerIds', () => {
  test('a die inside a tray resolves to that tray\u2019s id', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'tray1')
    await place(ydoc, yToys, 'dice_d6', 'die1')
    reparentToy(ydoc, yToys, 'die1', 'tray1')

    const dieY = findToy(yToys, 'die1')
    expect(findAncestorContainerIds(dieY)).toEqual(['tray1'])
  })

  test('a top-level die (not in any tray) resolves to no trays', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'dice_d6', 'die1')

    const dieY = findToy(yToys, 'die1')
    expect(findAncestorContainerIds(dieY)).toEqual([])
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
    expect(findAncestorContainerIds(dieY)).toEqual(['inner', 'outer'])
  })

  test('a tray\u2019s own result_container is a sibling of .tt_contents, not inside it', async () => {
    // Sanity check on the structural self-termination property the
    // cascade guard relies on: recomputing tray1's own display must never
    // itself resolve back to tray1.
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await place(ydoc, yToys, 'tray_sum', 'tray1')
    const { toyEl } = { toyEl: renderLayer(yToys).querySelector('[data-id="tray1"]') }
    await new Promise(r => setTimeout(r, 0))

    const tspanResult = ownResult(toyEl)
    const yTspanText = Toys.yNodeFor(tspanResult.firstChild) ?? Toys.yNodeFor(tspanResult)
    expect(findAncestorContainerIds(yTspanText)).toEqual([])
  })
})
