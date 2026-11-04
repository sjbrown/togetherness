// @vitest-environment jsdom
/**
 * tests/unit/place-undo-redo.test.js
 *
 * A placed toy is a `place` op followed by an `initialize` op (the history
 * list hides the second). Undoing the placement and redoing it must bring
 * the toy back as it was after initialize, not as it was when placed.
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { ensureLayerId } from '../../src/op_layers.js'
import * as Toys from '../../src/toys.js'
import * as OpLayer from '../../src/op_layer.js'

const { TOYS_LAYER, placeToy, activateToyScripts, initializeToy, _clearSvgTextCache, _resetToyScriptState } = Toys
const SVG_NS = 'http://www.w3.org/2000/svg'
const TABLE  = 'place-table'
const ME     = 'tester'
const TOY_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/toy')

beforeEach(() => {
  localStorage.clear()
  _clearSvgTextCache()
  _resetToyScriptState()
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url !== 'toy/chip.svg') throw new Error(`unexpected fetch: ${url}`)
    return { ok: true, text: async () => fs.readFileSync(path.join(TOY_DIR, 'chip.svg'), 'utf8') }
  }))
})
afterEach(() => { vi.unstubAllGlobals() })

async function placeChip(value) {
  const ydoc = new Y.Doc()
  const layerEl = document.createElementNS(SVG_NS, 'g')
  ensureLayerId(layerEl, TOYS_LAYER)
  await placeToy(ydoc, layerEl, { id: 'chip1', toyType: 'chip', x: 100, y: 100, color: '#dd2222' }, { authorId: ME, tableId: TABLE })
  await activateToyScripts(ydoc, 'chip')
  initializeToy(ydoc, layerEl, layerEl.querySelector('[data-id="chip1"]'), 'chip', ME, TABLE, { value })
  const face = () => layerEl.querySelector('[data-id="chip1"] tspan')?.textContent
  return { ydoc, layerEl, face }
}

describe('undo then redo of a placed toy', () => {
  test('the toy comes back initialized', async () => {
    const t = await placeChip(7)
    expect(t.face()).toBe('7')

    OpLayer.undoGesture(t.ydoc, TOYS_LAYER, t.layerEl, TABLE, ME)
    expect(t.layerEl.querySelector('[data-id="chip1"]')).toBeNull()

    OpLayer.redoGesture(t.ydoc, TOYS_LAYER, t.layerEl, TABLE, ME)
    expect(t.face()).toBe('7')
  })
})
