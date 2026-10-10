// @vitest-environment jsdom
/**
 * tests/unit/projection-mirror.test.js
 *
 * Every op layer's live DOM is one projection of its op log, and projectFrom
 * into a fresh scratch layer must produce an identical one. If it doesn't,
 * something wrote to the live layer outside a gesture.
 *
 * Each layer runs its own full gesture script through the LayerAPI, then
 * serializeNode() of every child is compared between the live layer and a
 * replay. Undo and redo are checked the same way, against each layer's
 * add/move fixtures.
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  TOYS_LAYER, makeLayerAPI as makeToysAPI, activateAllToyScriptsDom, runGesture,
  reparentToyDom, applyMove, getMenuActions, invokeMenuAction,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { DRAWING_LAYER, makeLayerAPI as makeDrawingAPI } from '../../src/drawing.js'
import {
  BOUN_POS_LAYER, makeLayerAPI as makeBounPosAPI, toolParamsToCreateParams,
} from '../../src/boun_pos.js'
import { ensureLayerId } from '../../src/op_layers.js'
import * as OpLayer from '../../src/op_layer.js'
import { getOps, getContent } from '../../src/op_dag.js'
import { projectFrom } from '../../src/op_checkpoint.js'
import { getHead } from '../../src/op_head.js'
import { serializeNode } from '../../src/op_wire_mutation.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const TABLE   = 'projection-mirror-table'
const AUTHOR  = 'user-a'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const TOY_FILES = {
  'toy/tray_sum.svg':     'tray_sum.svg',
  'toy/js/tray.js':       'js/tray.js',
  'toy/dice_d6.svg':      'dice_d6.svg',
  'toy/js/dice_utils.js': 'js/dice_utils.js',
}

beforeEach(() => {
  _clearSvgTextCache(); _resetToyScriptState()
  delete globalThis.tray; delete globalThis.tray_sum; delete globalThis.dice; delete globalThis.d6
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (!TOY_FILES[url]) throw new Error(`unexpected fetch: ${url}`)
    const text = fs.readFileSync(path.join(TOY_DIR, TOY_FILES[url]), 'utf8')
    return { ok: true, text: async () => text }
  }))
})
afterEach(() => { vi.unstubAllGlobals() })

function addPosSet(L, toolName, genType, id, x, y, w, h, toolParams) {
  const p = toolParamsToCreateParams(genType, toolParams, { x, y, w, h })
  L.add(toolName, {
    id, name: id, snapRadius: p.snapRadius, genType,
    xSpacing: p.xSpacing, ySpacing: p.ySpacing, x, y, w, h, circles: p.circles,
  })
}

const placeDie = (L, id, x, y) => L.add({ id, toyType: 'dice_d6', x, y, color: '#fff' })

const LAYERS = [
  {
    name: 'toys',
    layer: TOYS_LAYER,
    makeLayerAPI: makeToysAPI,
    addOne: (L, id) => placeDie(L, id, 0, 0),
    // place, move, resize, rotate, edit, delete, reparent, menu action
    async script({ ydoc, layerEl, L }) {
      await placeDie(L, 'die1', 0, 0)
      await placeDie(L, 'die2', 40, 40)
      await L.add({ id: 'tray1', toyType: 'tray_sum', x: 100, y: 100, color: '#fff' })
      activateAllToyScriptsDom(ydoc, layerEl)
      await new Promise(r => setTimeout(r, 0))

      L.applyMoveCommit(L.find('die1'), 60, 60)
      L.applyResize(L.find('tray1'), 100, 100, 260, 180)
      L.applyRotate(L.find('die1'), 45)
      L.edit(L.find('die1'), { color: '#123456' })
      L.delete('die2')

      // Reparent into a container: one gesture, the same shape as
      // commitMove's drop into a tray.
      runGesture(ydoc, layerEl, () => {
        reparentToyDom(layerEl, 'die1', 'tray1')
        applyMove(layerEl.querySelector('[data-id="die1"]'), 10, 10)
      }, { gesture: 'reparent', authorId: AUTHOR, tableId: TABLE })

      const dieEl = layerEl.querySelector('[data-id="die1"]')
      const roll  = getMenuActions(dieEl).find(a => a.eventName === 'die_roll')
      invokeMenuAction(ydoc, layerEl, dieEl, roll.namespace, roll.key, undefined, AUTHOR, TABLE)
    },
    gestures: ['place', 'place', 'place', 'move', 'resize', 'rotate', 'edit', 'delete', 'reparent', 'menu:d6.Roll'],
    topLevel: 1,
  },
  {
    name: 'drawing',
    layer: DRAWING_LAYER,
    makeLayerAPI: makeDrawingAPI,
    addOne: (L, id) => L.add({ id, type: 'rect', x: 0, y: 0, width: 100, height: 60 }),
    // add, move, resize, rotate, pivot, edit, duplicate, delete as a batch
    script({ L }) {
      L.add({ id: 'r1', type: 'rect', x: 0, y: 0, width: 100, height: 60, fill: '#112233' })
      L.add({ id: 'r2', type: 'rect', x: 200, y: 0, width: 80, height: 80 })
      L.add({ id: 'c1', type: 'circle', cx: 50, cy: 200, r: 30 })

      L.applyMoveCommit(L.find('r1'), 40, 50)
      L.applyResize(L.find('r1'), 40, 50, 160, 90)
      L.applyRotate(L.find('r1'), 45)
      L.applyPivot(L.find('r1'), 0, 1, 52, 60)
      L.edit(L.find('r2'), { fill: '#ff0000', 'corner-r': 14 })
      L.applyResize(L.find('c1'), 20, 170, 100, 100)

      L.duplicate(L.find('r1'), 'dup0')
      L.duplicate(L.find('c1'), 'dup1')
      L.deleteMany(['r2', 'dup1'])
    },
    gestures: ['add', 'add', 'add', 'move', 'resize', 'rotate', 'pivot', 'edit', 'resize',
               'duplicate', 'duplicate', 'delete-batch'],
    topLevel: 3,
  },
  {
    name: 'boun_pos',
    layer: BOUN_POS_LAYER,
    makeLayerAPI: makeBounPosAPI,
    addOne: (L, id) => addPosSet(L, 'pos-grid-sq', 'square', id, 0, 0, 300, 300, { spacing: 100, snapRadius: 2 }),
    // add (boundary, square and hex position sets), move, resize, rename,
    // grid-parameter edits, applyTtState, then move and delete as batches
    script({ L }) {
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
    },
    gestures: ['add', 'add', 'add', 'add', 'move', 'resize', 'edit', 'edit', 'edit', 'edit',
               'move-batch', 'delete-batch'],
    topLevel: 2,
  },
]

describe.each(LAYERS)('$name: live equals replay', (spec) => {
  function setup() {
    const ydoc    = new Y.Doc()
    const layerEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), spec.layer)
    layerEl.id = spec.layer.selector.slice(1)
    const L       = spec.makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE, true)
    L.render(layerEl)                       // the creator's genesis checkpoint
    return { ydoc, layerEl, L }
  }

  const serialized = (layerEl) => [...layerEl.children].map(serializeNode)

  function replay(ydoc) {
    const scratch = ensureLayerId(document.createElementNS(SVG_NS, 'g'), spec.layer)
    projectFrom(scratch, getOps(ydoc, spec.layer), getContent(ydoc, spec.layer), getHead(TABLE, spec.layer))
    return scratch
  }

  const gestures = (ydoc) => [...getOps(ydoc, spec.layer).values()].map(o => o.gesture)

  test('after a full gesture sequence, projectFrom a fresh layer is identical to the live layer', async () => {
    const ctx = setup()
    await spec.script(ctx)

    expect(ctx.layerEl.children.length).toBe(spec.topLevel)
    expect(serialized(replay(ctx.ydoc))).toEqual(serialized(ctx.layerEl))
  })

  test('the op log really holds the sequence (so the comparison is not vacuous)', async () => {
    const ctx = setup()
    await spec.script(ctx)
    expect(gestures(ctx.ydoc)).toEqual(['checkpoint', ...spec.gestures])
  })

  test('undoing and redoing a move keeps live equal to replay', async () => {
    const { ydoc, layerEl, L } = setup()
    await spec.addOne(L, 'e1')
    const start = L.getAnchor(L.find('e1'))
    L.applyMoveCommit(L.find('e1'), start.x + 70, start.y + 80)
    const moved = L.getAnchor(L.find('e1'))

    OpLayer.undoGesture(ydoc, spec.layer, layerEl, TABLE, AUTHOR)
    expect(L.getAnchor(L.find('e1'))).toEqual(start)
    expect(serialized(replay(ydoc))).toEqual(serialized(layerEl))

    OpLayer.redoGesture(ydoc, spec.layer, layerEl, TABLE, AUTHOR)
    expect(L.getAnchor(L.find('e1'))).toEqual(moved)
    expect(serialized(replay(ydoc))).toEqual(serialized(layerEl))
  })

  test('undoing a delete restores the whole element', async () => {
    const { ydoc, layerEl, L } = setup()
    await spec.addOne(L, 'e1')
    const before = serialized(layerEl)
    L.delete('e1')
    expect(layerEl.children.length).toBe(0)

    OpLayer.undoGesture(ydoc, spec.layer, layerEl, TABLE, AUTHOR)
    expect(serialized(layerEl)).toEqual(before)
    expect(serialized(replay(ydoc))).toEqual(serialized(layerEl))
  })
})
