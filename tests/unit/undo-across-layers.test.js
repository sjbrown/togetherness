// @vitest-environment jsdom
/**
 * tests/unit/undo-across-layers.test.js
 *
 * Undo and redo pick the author's most recent action by ts across every
 * mechanism: the toys op layer, the drawing op layer and the boundaries
 * UndoManager. App.undo/App.redo do exactly this selection (app.js has no
 * unit coverage, so it is mirrored here from the same public pieces:
 * undoCandidate/redoCandidate and peekUndoTs/peekRedoTs); the e2e spec drives
 * the real buttons.
 */
import * as Y from 'yjs'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { TOYS_LAYER, runGesture as runToyGesture } from '../../src/toys.js'
import { DRAWING_LAYER, makeLayerAPI as makeDrawingAPI } from '../../src/drawing.js'
import { addBoundary } from '../../src/boun_pos.js'
import { ensureLayerId } from '../../src/op_layers.js'
import * as OpLayer from '../../src/op_layer.js'
import * as UndoRedo from '../../src/undo_redo.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const TABLE  = 'undo-across-layers-table'
const ME     = 'me'

let clock
beforeEach(() => {
  localStorage.clear()
  // Strictly increasing, so two actions never share a ts.
  clock = 1_000_000
  vi.spyOn(Date, 'now').mockImplementation(() => (clock += 10))
})
afterEach(() => { vi.restoreAllMocks() })

function setup() {
  const ydoc = new Y.Doc()
  const yBounPos = ydoc.getXmlFragment('boundaries')
  UndoRedo.init({ ydoc, scopes: [yBounPos] })

  const toysEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), TOYS_LAYER)
  const drawEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), DRAWING_LAYER)
  const draw = makeDrawingAPI(ydoc, () => drawEl, { id: ME }, TABLE, true)
  draw.render(drawEl)

  const layers = [
    { layer: TOYS_LAYER,    el: toysEl },
    { layer: DRAWING_LAYER, el: drawEl },
  ]

  const toy = (id) => runToyGesture(ydoc, toysEl, () => {
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('data-id', id)
    toysEl.appendChild(g)
  }, { gesture: 'place', authorId: ME, tableId: TABLE })
  const shape = (id) => draw.add({ id, type: 'rect', x: 0, y: 0, width: 10, height: 10 })
  const bound = (id) => {
    UndoRedo.tag(`add boundary ${id}`)
    addBoundary(ydoc, yBounPos, { id, name: id, x: 0, y: 0, w: 10, h: 10 })
  }

  // Everything currently on the table, by id.
  const present = () => [
    ...[...toysEl.children].map(e => e.getAttribute('data-id')),
    ...[...drawEl.children].map(e => e.getAttribute('data-id')),
    ...yBounPos.toArray().map(e => e.getAttribute('id')),
  ]

  // App.undo / App.redo's selection: highest ts wins.
  const press = (kind) => {
    const candidates = layers.flatMap(({ layer, el }) => {
      const op = (kind === 'undo' ? OpLayer.undoCandidate : OpLayer.redoCandidate)(ydoc, layer, TABLE, ME)
      if (!op) return []
      const run = kind === 'undo' ? OpLayer.undoGesture : OpLayer.redoGesture
      return [{ ts: op.ts, run: () => !!run(ydoc, layer, el, TABLE, ME) }]
    })
    const bTs = kind === 'undo' ? UndoRedo.peekUndoTs() : UndoRedo.peekRedoTs()
    if (bTs != null) {
      candidates.push({ ts: bTs, run: () => (kind === 'undo' ? UndoRedo.undo() : UndoRedo.redo()) })
    }
    return candidates.sort((a, b) => b.ts - a.ts).some(c => c.run())
  }

  // Press once and name the id that left (undo) or arrived (redo).
  const pressAndDiff = (kind) => {
    const before = new Set(present())
    expect(press(kind)).toBe(true)
    const after = new Set(present())
    const changed = kind === 'undo'
      ? [...before].filter(id => !after.has(id))
      : [...after].filter(id => !before.has(id))
    expect(changed).toHaveLength(1)
    return changed[0]
  }

  return { ydoc, toy, shape, bound, present, press, pressAndDiff }
}

describe('undo picks the most recent action across layers', () => {
  test('toy1, draw1, bound1, toy2, draw2: five Undos reverse them newest first, and Redo walks forward', () => {
    const t = setup()
    t.toy('toy1'); t.shape('draw1'); t.bound('bound1'); t.toy('toy2'); t.shape('draw2')
    expect(t.present().sort()).toEqual(['bound1', 'draw1', 'draw2', 'toy1', 'toy2'])

    const undone = [1, 2, 3, 4, 5].map(() => t.pressAndDiff('undo'))
    expect(undone).toEqual(['draw2', 'toy2', 'bound1', 'draw1', 'toy1'])
    expect(t.present()).toEqual([])
    expect(t.press('undo')).toBe(false)   // nothing left

    const redone = [1, 2, 3, 4, 5].map(() => t.pressAndDiff('redo'))
    expect(redone).toEqual(['toy1', 'draw1', 'bound1', 'toy2', 'draw2'])
    expect(t.present().sort()).toEqual(['bound1', 'draw1', 'draw2', 'toy1', 'toy2'])
    expect(t.press('redo')).toBe(false)
  })

  test('the second Undo after toy1, draw1, toy2, draw2 reverses toy2, not draw1 (the stale-scope bug)', () => {
    const t = setup()
    t.toy('toy1'); t.shape('draw1'); t.toy('toy2'); t.shape('draw2')

    expect(t.pressAndDiff('undo')).toBe('draw2')
    expect(t.pressAndDiff('undo')).toBe('toy2')
    expect(t.pressAndDiff('undo')).toBe('draw1')
    expect(t.pressAndDiff('undo')).toBe('toy1')
  })

  test('a new action after an undo starts a fresh history: redo has nothing left', () => {
    const t = setup()
    t.toy('toy1'); t.shape('draw1')
    expect(t.pressAndDiff('undo')).toBe('draw1')
    t.toy('toy2')
    expect(t.pressAndDiff('undo')).toBe('toy2')
    expect(t.pressAndDiff('redo')).toBe('toy2')
  })

  test('peekUndoTs/peekRedoTs report the top stack item and are null when empty', () => {
    const t = setup()
    expect(UndoRedo.peekUndoTs()).toBeNull()
    expect(UndoRedo.peekRedoTs()).toBeNull()

    t.bound('b1')
    const added = UndoRedo.peekUndoTs()
    expect(added).toBeGreaterThan(1_000_000)

    UndoRedo.undo()
    expect(UndoRedo.peekUndoTs()).toBeNull()
    expect(UndoRedo.peekRedoTs()).toBeGreaterThan(added)   // stamped when the undo happened
  })

  test('undoCandidate returns the op without applying it', () => {
    const t = setup()
    t.shape('draw1')
    const op = OpLayer.undoCandidate(t.ydoc, DRAWING_LAYER, TABLE, ME)
    expect(op.gesture).toBe('draw')
    expect(t.present()).toEqual(['draw1'])
    expect(OpLayer.undoCandidate(t.ydoc, DRAWING_LAYER, TABLE, 'someone-else')).toBeNull()
    expect(OpLayer.redoCandidate(t.ydoc, DRAWING_LAYER, TABLE, ME)).toBeNull()
  })
})
