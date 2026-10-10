// @vitest-environment jsdom
/**
 * tests/unit/drawing-projection-mirror.test.js
 *
 * The drawing layer is on the op log: the live DOM is one projection of it,
 * and projectFrom into a fresh scratch layer must produce an identical one.
 * If it doesn't, something wrote to the live layer outside a gesture.
 *
 * Runs draw, move, resize, rotate, pivot, edit, duplicate (batch) and
 * delete (batch) through the LayerAPI / batch gestures, then compares
 * serializeNode() of every child between the live layer and a replay.
 */
import * as Y from 'yjs'
import { describe, test, expect, beforeEach } from 'vitest'
import {
  DRAWING_LAYER, makeLayerAPI, duplicateDrawingsBatch, deleteDrawingsBatch,
} from '../../src/drawing.js'
import { ensureLayerId } from '../../src/op_layers.js'
import { getOps, getContent } from '../../src/op_dag.js'
import { projectFrom } from '../../src/op_checkpoint.js'
import { getHead } from '../../src/op_head.js'
import { serializeNode } from '../../src/op_wire_mutation.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const TABLE  = 'drawing-projection-mirror-table'
const AUTHOR = 'user-a'

beforeEach(() => { localStorage.clear() })

function freshLayer() {
  const el = document.createElementNS(SVG_NS, 'g')
  el.id = 'drawing-layer'
  return ensureLayerId(el, DRAWING_LAYER)
}

const serialized = (layerEl) => [...layerEl.children].map(serializeNode)

function replay(ydoc) {
  const scratch = freshLayer()
  projectFrom(scratch, getOps(ydoc, DRAWING_LAYER), getContent(ydoc, DRAWING_LAYER), getHead(TABLE, DRAWING_LAYER))
  return scratch
}

describe('drawing: live equals replay', () => {
  test('after a full gesture sequence, projectFrom a fresh layer is identical to the live layer', () => {
    const ydoc    = new Y.Doc()
    const layerEl = freshLayer()
    const L       = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE, true)
    L.render(layerEl)                       // the creator's genesis checkpoint

    L.add({ id: 'r1', type: 'rect', x: 0, y: 0, width: 100, height: 60, fill: '#112233' })
    L.add({ id: 'r2', type: 'rect', x: 200, y: 0, width: 80, height: 80 })
    L.add({ id: 'c1', type: 'circle', cx: 50, cy: 200, r: 30 })

    L.applyMoveCommit(L.find('r1'), 40, 50)
    L.applyResize(L.find('r1'), 40, 50, 160, 90)
    L.applyRotate(L.find('r1'), 45)
    L.applyPivot(L.find('r1'), 0, 1, 52, 60)
    L.edit(L.find('r2'), { fill: '#ff0000', 'corner-r': 14 })
    L.applyResize(L.find('c1'), 20, 170, 100, 100)

    let n = 0
    const opts = { authorId: AUTHOR, tableId: TABLE }
    duplicateDrawingsBatch(ydoc, layerEl, ['r1', 'c1'], { ...opts, newId: () => `dup${n++}` })
    deleteDrawingsBatch(ydoc, layerEl, ['r2', 'dup1'], opts)

    expect(layerEl.children.length).toBe(3)
    expect(serialized(replay(ydoc))).toEqual(serialized(layerEl))
  })

  test('the op log really holds the sequence (so the comparison is not vacuous)', () => {
    const ydoc    = new Y.Doc()
    const layerEl = freshLayer()
    const L       = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE, true)
    L.render(layerEl)
    L.add({ id: 'r1', type: 'rect', x: 0, y: 0, width: 100, height: 60 })
    L.applyRotate(L.find('r1'), 45)

    const gestures = [...getOps(ydoc, DRAWING_LAYER).values()].map(o => o.gesture)
    expect(gestures).toEqual(['checkpoint', 'draw', 'rotate'])
    expect(replay(ydoc).querySelector('[data-id="r1"]').getAttribute('transform')).toBe('rotate(45 50 30)')
  })

  test('undoing and redoing through the op layer keeps live equal to replay', async () => {
    const OpLayer = await import('../../src/op_layer.js')
    const ydoc    = new Y.Doc()
    const layerEl = freshLayer()
    const L       = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE, true)
    L.render(layerEl)
    L.add({ id: 'r1', type: 'rect', x: 0, y: 0, width: 100, height: 60 })
    L.applyMoveCommit(L.find('r1'), 70, 80)

    OpLayer.undoGesture(ydoc, DRAWING_LAYER, layerEl, TABLE, AUTHOR)
    expect(L.find('r1').getAttribute('x')).toBe('0')
    expect(serialized(replay(ydoc))).toEqual(serialized(layerEl))

    OpLayer.redoGesture(ydoc, DRAWING_LAYER, layerEl, TABLE, AUTHOR)
    expect(L.find('r1').getAttribute('x')).toBe('70')
    expect(serialized(replay(ydoc))).toEqual(serialized(layerEl))
  })
})
