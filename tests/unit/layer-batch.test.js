// @vitest-environment jsdom
/**
 * tests/unit/layer-batch.test.js
 *
 * A multi-select action is one gesture, one op, one undo step, on every op
 * layer: deleteMany, moveMany and importMany come from OpLayer's shared
 * LayerAPI. A move brings each element to the front, in order, so the last
 * one moved ends up on top.
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  TOYS_LAYER, makeLayerAPI as makeToysAPI, _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { DRAWING_LAYER, makeLayerAPI as makeDrawingAPI } from '../../src/drawing.js'
import { BOUN_POS_LAYER, makeLayerAPI as makeBounPosAPI } from '../../src/boun_pos.js'
import { ensureLayerId } from '../../src/op_layers.js'
import { undoGesture } from '../../src/op_layer.js'
import { getOps } from '../../src/op_dag.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const TABLE   = 'batch-table'
const AUTHOR  = 'user-a'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const D6_SVG  = fs.readFileSync(path.resolve(__dir, '../../src/toy/dice_d6.svg'), 'utf8')
const DICE_JS = fs.readFileSync(path.resolve(__dir, '../../src/toy/js/dice_utils.js'), 'utf8')

beforeEach(() => {
  _clearSvgTextCache(); _resetToyScriptState()
  delete globalThis.dice; delete globalThis.d6
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === 'toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === 'toy/js/dice_utils.js') return { ok: true, text: async () => DICE_JS }
    throw new Error(`unexpected fetch: ${url}`)
  }))
})
afterEach(() => { vi.unstubAllGlobals() })

// Each layer: add(L, id, x, y) puts one element on the layer; foreign(id)
// builds an element as storage.js's import hands it over.
const LAYERS = [
  {
    name: 'toys', layer: TOYS_LAYER, makeLayerAPI: makeToysAPI,
    add: (L, id, x, y) => L.add({ id, toyType: 'dice_d6', x, y, color: '#fff' }),
    foreign: (id) => {
      const g = document.createElementNS(SVG_NS, 'g')
      g.setAttribute('class', 'toy')
      g.setAttribute('data-id', id)
      g.innerHTML = '<svg x="0" y="0" width="64" height="64"><circle r="5"/></svg>'
      return g
    },
    reIdsOnCollision: false,
  },
  {
    name: 'drawing', layer: DRAWING_LAYER, makeLayerAPI: makeDrawingAPI,
    add: (L, id, x, y) => L.add({ id, type: 'rect', x, y, width: 50, height: 50 }),
    foreign: (id) => {
      const el = document.createElementNS(SVG_NS, 'rect')
      el.setAttribute('id', id); el.setAttribute('data-id', id)
      return el
    },
    reIdsOnCollision: true,
  },
  {
    name: 'boun_pos', layer: BOUN_POS_LAYER, makeLayerAPI: makeBounPosAPI,
    add: (L, id, x, y) => L.add('boundary', { id, name: id, x, y, w: 100, h: 80 }),
    foreign: (id) => {
      const g = document.createElementNS(SVG_NS, 'g')
      g.setAttribute('id', id); g.setAttribute('data-id', id)
      g.setAttribute('data-module', 'boun_pos'); g.setAttribute('data-bounpos-type', 'boundary')
      return g
    },
    reIdsOnCollision: true,
  },
]

describe.each(LAYERS)('$name: batches are one op', (spec) => {
  async function seeded(...ids) {
    const ydoc    = new Y.Doc()
    const layerEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), spec.layer)
    const L       = spec.makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE, true)
    L.render(layerEl)
    for (const [i, id] of ids.entries()) await spec.add(L, id, 100 * i, 100 * i)
    const opCount = () => getOps(ydoc, spec.layer).size
    const idsOf   = () => [...layerEl.children].map(el => el.getAttribute('data-id'))
    return { ydoc, layerEl, L, opCount, idsOf }
  }

  test('deleteMany deletes several elements and appends exactly one op', async () => {
    const { L, opCount, idsOf } = await seeded('a', 'b', 'c')
    const before = opCount()

    const op = L.deleteMany(['a', 'b', 'gone'])

    expect(op.gesture).toBe('delete-batch')
    expect(opCount()).toBe(before + 1)
    expect(idsOf()).toEqual(['c'])
  })

  test('deleteMany is null, and commits nothing, when every id is already gone', async () => {
    const { L, opCount } = await seeded('a')
    const before = opCount()
    expect(L.deleteMany(['nope', 'also-nope'])).toBeNull()
    expect(opCount()).toBe(before)
  })

  test('moveMany moves several elements in one op', async () => {
    const { L, opCount } = await seeded('a', 'b')
    const before = opCount()

    const op = L.moveMany([{ id: 'a', x: 400, y: 400 }, { id: 'b', x: 450, y: 450 }])

    expect(op.gesture).toBe('move-batch')
    expect(opCount()).toBe(before + 1)
    expect(L.getAnchor(L.find('a'))).toEqual({ x: 400, y: 400 })
    expect(L.getAnchor(L.find('b'))).toEqual({ x: 450, y: 450 })
  })

  test('moved elements come to the front, in order: the last one moved is on top', async () => {
    const { L, idsOf } = await seeded('a', 'b', 'c')
    L.moveMany([{ id: 'b', x: 400, y: 400 }, { id: 'a', x: 450, y: 450 }])
    expect(idsOf()).toEqual(['c', 'b', 'a'])
  })

  test('a single undo reverses a whole batch', async () => {
    const { ydoc, layerEl, L, idsOf } = await seeded('a', 'b')
    const start = ['a', 'b'].map(id => L.getAnchor(L.find(id)))

    L.moveMany([{ id: 'a', x: 400, y: 400 }, { id: 'b', x: 450, y: 450 }])
    undoGesture(ydoc, spec.layer, layerEl, TABLE, AUTHOR)
    expect(['a', 'b'].map(id => L.getAnchor(L.find(id)))).toEqual(start)

    L.deleteMany(['a', 'b'])
    undoGesture(ydoc, spec.layer, layerEl, TABLE, AUTHOR)
    expect(idsOf()).toEqual(['a', 'b'])
  })

  test('importMany appends the elements in one import op', async () => {
    const { L, opCount, idsOf } = await seeded('a')
    const before = opCount()

    const op = L.importMany([spec.foreign('imp1'), spec.foreign('imp2')])

    expect(op.gesture).toBe('import')
    expect(opCount()).toBe(before + 1)
    expect(idsOf()).toEqual(['a', 'imp1', 'imp2'])
    expect(L.importMany([])).toBeNull()
  })

  test.runIf(spec.reIdsOnCollision)('importMany re-ids an element whose id is already taken', async () => {
    const { L, idsOf } = await seeded('a')
    const el = spec.foreign('a')
    L.importMany([el])
    expect(new Set(idsOf()).size).toBe(2)
    expect(el.getAttribute('id')).toBe(el.getAttribute('data-id'))
  })
})
