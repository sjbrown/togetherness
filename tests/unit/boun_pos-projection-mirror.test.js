// @vitest-environment jsdom
/**
 * tests/unit/boun_pos-projection-mirror.test.js
 *
 * The boundaries layer is on the op log: the live DOM is one projection of
 * it, and projectFrom into a fresh scratch layer must produce an identical
 * one. If it doesn't, something wrote to the live layer outside a gesture.
 *
 * Runs add (boundary, square and hex position sets), move, resize, rename,
 * grid-parameter edits, and delete / move as batches through the LayerAPI
 * and batch gestures, then compares serializeNode() of every child between
 * the live layer and a replay.
 */
import * as Y from 'yjs'
import { describe, test, expect, beforeEach } from 'vitest'
import {
  BOUN_POS_LAYER, makeLayerAPI, gridFillExtent, toolParamsToCreateParams,
} from '../../src/boun_pos.js'
import { ensureLayerId } from '../../src/op_layers.js'
import { getOps, getContent } from '../../src/op_dag.js'
import { projectFrom } from '../../src/op_checkpoint.js'
import { getHead } from '../../src/op_head.js'
import * as OpLayer from '../../src/op_layer.js'
import { serializeNode } from '../../src/op_wire_mutation.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const TABLE  = 'boun-pos-projection-mirror-table'
const AUTHOR = 'user-a'

beforeEach(() => { localStorage.clear() })

function freshLayer() {
  const el = document.createElementNS(SVG_NS, 'g')
  el.id = 'boun_pos-layer'
  return ensureLayerId(el, BOUN_POS_LAYER)
}

const serialized = (layerEl) => [...layerEl.children].map(serializeNode)

function replay(ydoc) {
  const scratch = freshLayer()
  projectFrom(scratch, getOps(ydoc, BOUN_POS_LAYER), getContent(ydoc, BOUN_POS_LAYER), getHead(TABLE, BOUN_POS_LAYER))
  return scratch
}

function setup() {
  const ydoc    = new Y.Doc()
  const layerEl = freshLayer()
  const L       = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE, true)
  L.render(layerEl)                       // the creator's genesis checkpoint
  return { ydoc, layerEl, L }
}

function addPosSet(L, toolName, genType, id, x, y, w, h, toolParams) {
  const p = toolParamsToCreateParams(genType, toolParams, { x, y, w, h })
  L.add(toolName, {
    id, name: id, snapRadius: p.snapRadius, genType,
    xSpacing: p.xSpacing, ySpacing: p.ySpacing, x, y, w, h, circles: p.circles,
  })
}

describe('boundaries: live equals replay', () => {
  test('after a full gesture sequence, projectFrom a fresh layer is identical to the live layer', () => {
    const { ydoc, layerEl, L } = setup()

    L.add('boundary', { id: 'b1', name: 'forest', x: 20, y: 30, w: 200, h: 100 })
    addPosSet(L, 'pos-grid-sq',  'square', 'sq', 0, 0, 300, 300, { spacing: 100, snapRadius: 2 })
    addPosSet(L, 'pos-grid-hex', 'hex',    'hx', 400, 0, 300, 300, { xSpacing: 70, ySpacing: 60, snapRadius: 2 })
    L.add('boundary', { id: 'b2', name: 'cave', x: 500, y: 500, w: 100, h: 100 })

    L.applyMoveCommit(L.find('b1'), 40, 50)
    L.applyResize(L.find('sq'), 10, 10, 240, 180)
    L.edit(L.find('b1'), { name: 'meadow' })
    L.edit(L.find('sq'), { xSpacing: 60, ySpacing: 90 })
    L.edit(L.find('hx'), { snapRadius: 4 })
    L.applyTtState({ id: 'hx', bounPosType: 'pos-set', name: 'hexes', x: 420, y: 20 })

    L.moveMany([{ id: 'b1', x: 0, y: 0 }, { id: 'hx', x: 600, y: 10 }])
    L.deleteMany(['b2', 'sq'])

    expect(layerEl.children.length).toBe(2)
    expect(serialized(replay(ydoc))).toEqual(serialized(layerEl))
  })

  test('the op log really holds the sequence (so the comparison is not vacuous)', () => {
    const { ydoc, L } = setup()
    L.add('boundary', { id: 'b1', name: 'forest', x: 0, y: 0, w: 100, h: 100 })
    L.applyMoveCommit(L.find('b1'), 70, 80)
    L.edit(L.find('b1'), { name: 'meadow' })

    const gestures = [...getOps(ydoc, BOUN_POS_LAYER).values()].map(o => o.gesture)
    expect(gestures).toEqual(['checkpoint', 'add', 'move', 'edit'])
    const el = replay(ydoc).querySelector('[data-id="b1"]')
    expect(el.getAttribute('transform')).toBe('translate(70, 80)')
    expect(el.querySelector('text').textContent).toBe('meadow')
  })

  test('undoing and redoing through the op layer keeps live equal to replay', () => {
    const { ydoc, layerEl, L } = setup()
    L.add('boundary', { id: 'b1', name: 'forest', x: 0, y: 0, w: 100, h: 100 })
    L.applyMoveCommit(L.find('b1'), 70, 80)

    OpLayer.undoGesture(ydoc, BOUN_POS_LAYER, layerEl, TABLE, AUTHOR)
    expect(L.find('b1').getAttribute('transform')).toBe('translate(0, 0)')
    expect(serialized(replay(ydoc))).toEqual(serialized(layerEl))

    OpLayer.redoGesture(ydoc, BOUN_POS_LAYER, layerEl, TABLE, AUTHOR)
    expect(L.find('b1').getAttribute('transform')).toBe('translate(70, 80)')
    expect(serialized(replay(ydoc))).toEqual(serialized(layerEl))
  })

  test('undoing a delete restores the whole element, circles included', () => {
    const { ydoc, layerEl, L } = setup()
    addPosSet(L, 'pos-grid-sq', 'square', 'sq', 0, 0, 300, 300, { spacing: 100, snapRadius: 2 })
    const before = serialized(layerEl)
    L.delete('sq')
    expect(layerEl.children.length).toBe(0)

    OpLayer.undoGesture(ydoc, BOUN_POS_LAYER, layerEl, TABLE, AUTHOR)
    expect(serialized(layerEl)).toEqual(before)
  })
})
