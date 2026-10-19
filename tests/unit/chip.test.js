// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { ensureLayerId } from '../../src/op_layers.js'
import {
  TOYS_LAYER, addToyDom, activateAllToyScriptsDom, makeLayerAPI, findEl, getSnapPoints,
  getMenuActions, _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const TABLE   = 'test-table'
const AUTHOR  = 'tester'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const CHIP_SVG = fs.readFileSync(path.resolve(__dir, '../../src/toy/chip.svg'), 'utf8')

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  ensureLayerId(layerEl, TOYS_LAYER)
  return layerEl
}

beforeEach(() => {
  _clearSvgTextCache()
  _resetToyScriptState()
  delete globalThis.chip
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
    throw new Error(`unexpected fetch: ${url}`)
  }))
})
afterEach(() => { vi.unstubAllGlobals() })

async function twoChips() {
  const ydoc = new Y.Doc()
  const layerEl = freshLayer()
  addToyDom(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 100, y: 100, color: '#fff' }, CHIP_SVG)
  addToyDom(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 400, y: 400, color: '#fff' }, CHIP_SVG)
  activateAllToyScriptsDom(ydoc, layerEl)
  await new Promise(r => setTimeout(r, 0))
  return { ydoc, layerEl }
}

describe('chip menu', () => {
  test('a lone chip offers no actions', async () => {
    const { layerEl } = await twoChips()
    expect(getMenuActions(findEl(layerEl, 'chipA'))).toEqual([])
  })

  test('Stack is the only action, and the default, once chips are piled', async () => {
    const { ydoc, layerEl } = await twoChips()
    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    const point = getSnapPoints(layerEl).find(p => p.ownerId === 'chipA')
    api.applyMoveCommit(api.find('chipB'), point.cx, point.cy)

    for (const id of ['chipA', 'chipB']) {
      expect(getMenuActions(findEl(layerEl, id)).map(a => a.key)).toEqual(['Stack'])
    }
  })
})
