// @vitest-environment jsdom
/**
 * tests/unit/op-layer-independence.test.js
 *
 * One DAG per layer: a gesture on the drawing layer changes nothing in the
 * toys layer's ops map, content map or tips, and the reverse.
 */
import * as Y from 'yjs'
import { describe, test, expect, beforeEach } from 'vitest'
import { TOYS_LAYER, runGesture as runToyGesture } from '../../src/toys.js'
import { DRAWING_LAYER, makeLayerAPI as makeDrawingAPI } from '../../src/drawing.js'
import { ensureLayerId } from '../../src/op_layers.js'
import { getOps, getContent } from '../../src/op_dag.js'
import { getHead, getMergeTips } from '../../src/op_head.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const TABLE  = 'independence-table'
const ME     = 'me'

beforeEach(() => { localStorage.clear() })

function setup() {
  const ydoc = new Y.Doc()
  const toysEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), TOYS_LAYER)
  const drawEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), DRAWING_LAYER)
  const draw = makeDrawingAPI(ydoc, () => drawEl, { id: ME }, TABLE, true)
  draw.render(drawEl)   // the drawing genesis
  const placeToy = (id) => runToyGesture(ydoc, toysEl, () => {
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('data-id', id)
    toysEl.appendChild(g)
  }, { gesture: 'place', authorId: ME, tableId: TABLE })
  return { ydoc, toysEl, drawEl, draw, placeToy }
}

// Everything that makes up one layer's replicated + local state.
const snapshot = (ydoc, layer) => JSON.stringify({
  ops:        [...getOps(ydoc, layer).entries()],
  content:    [...getContent(ydoc, layer).entries()],
  head:       getHead(TABLE, layer),
  mergeTips:  getMergeTips(TABLE, layer),
})

describe('op layers are independent', () => {
  test('a drawing gesture changes nothing in the toys layer', () => {
    const { ydoc, draw, placeToy } = setup()
    placeToy('toy1')
    const before = snapshot(ydoc, TOYS_LAYER)

    draw.add({ id: 'r1', type: 'rect', x: 0, y: 0, width: 10, height: 10 })
    draw.applyMoveCommit(draw.find('r1'), 5, 5)
    draw.delete('r1')

    expect(snapshot(ydoc, TOYS_LAYER)).toBe(before)
    expect(getOps(ydoc, DRAWING_LAYER).size).toBe(4)   // genesis + 3 gestures
  })

  test('a toys gesture changes nothing in the drawing layer', () => {
    const { ydoc, draw, placeToy } = setup()
    draw.add({ id: 'r1', type: 'rect', x: 0, y: 0, width: 10, height: 10 })
    const before = snapshot(ydoc, DRAWING_LAYER)

    placeToy('toy1')
    placeToy('toy2')

    expect(snapshot(ydoc, DRAWING_LAYER)).toBe(before)
    expect(getOps(ydoc, TOYS_LAYER).size).toBe(2)
  })

  test('the layers keep separate ops maps, and no op id appears in both', () => {
    const { ydoc, draw, placeToy } = setup()
    placeToy('toy1')
    draw.add({ id: 'r1', type: 'rect', x: 0, y: 0, width: 10, height: 10 })

    const toyIds  = new Set(getOps(ydoc, TOYS_LAYER).keys())
    const drawIds = [...getOps(ydoc, DRAWING_LAYER).keys()]
    expect(drawIds.some(id => toyIds.has(id))).toBe(false)
    expect(ydoc.getMap('ops:drawing')).toBe(getOps(ydoc, DRAWING_LAYER))
  })

  test('a parent pointer never crosses layers', () => {
    const { ydoc, draw, placeToy } = setup()
    placeToy('toy1')
    draw.add({ id: 'r1', type: 'rect', x: 0, y: 0, width: 10, height: 10 })
    placeToy('toy2')
    draw.applyMoveCommit(draw.find('r1'), 1, 1)

    for (const [layer, other] of [[TOYS_LAYER, DRAWING_LAYER], [DRAWING_LAYER, TOYS_LAYER]]) {
      const otherIds = new Set(getOps(ydoc, other).keys())
      for (const op of getOps(ydoc, layer).values()) {
        expect(op.parents.some(p => otherIds.has(p))).toBe(false)
      }
    }
  })
})
