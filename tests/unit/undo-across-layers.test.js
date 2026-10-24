// @vitest-environment jsdom
/**
 * tests/unit/undo-across-layers.test.js
 *
 * Undo and redo pick the author's most recent action by ts across the three
 * op layers: toys, drawing and boundaries. App.undo/App.redo do exactly this
 * selection (app.js has no unit coverage, so it is mirrored here from the
 * same public pieces: undoCandidate/redoCandidate); the e2e spec drives the
 * real buttons.
 */
import * as Y from 'yjs'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { TOYS_LAYER, runGesture as runToyGesture } from '../../src/toys.js'
import { DRAWING_LAYER, makeLayerAPI as makeDrawingAPI } from '../../src/drawing.js'
import { BOUN_POS_LAYER, makeLayerAPI as makeBoundariesAPI } from '../../src/boun_pos.js'
import { ensureLayerId } from '../../src/op_layers.js'
import * as OpLayer from '../../src/op_layer.js'

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
  const toysEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), TOYS_LAYER)
  const drawEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), DRAWING_LAYER)
  const boundEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), BOUN_POS_LAYER)
  const draw = makeDrawingAPI(ydoc, () => drawEl, { id: ME }, TABLE, true)
  draw.render(drawEl)
  const bounds = makeBoundariesAPI(ydoc, () => boundEl, { id: ME }, TABLE, true)
  bounds.render(boundEl)

  const layers = [
    { layer: TOYS_LAYER,      el: toysEl },
    { layer: DRAWING_LAYER,   el: drawEl },
    { layer: BOUN_POS_LAYER, el: boundEl },
  ]

  const toy = (id, authorId = ME) => runToyGesture(ydoc, toysEl, () => {
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('data-id', id)
    toysEl.appendChild(g)
  }, { gesture: 'place', authorId, tableId: TABLE })
  const drawBy = (authorId) => makeDrawingAPI(ydoc, () => drawEl, { id: authorId }, TABLE, true)
  const boundsBy = (authorId) => makeBoundariesAPI(ydoc, () => boundEl, { id: authorId }, TABLE, true)
  const dropFromDom = (id) => {
    for (const el of [toysEl, drawEl, boundEl]) el.querySelector(`[data-id="${id}"]`)?.remove()
  }
  const shape = (id) => draw.add({ id, type: 'rect', x: 0, y: 0, width: 10, height: 10 })
  const bound = (id) => bounds.add('boundary', { id, name: id, x: 0, y: 0, w: 10, h: 10 })

  // Everything currently on the table, by id.
  const present = () => [
    ...[...toysEl.children].map(e => e.getAttribute('data-id')),
    ...[...drawEl.children].map(e => e.getAttribute('data-id')),
    ...[...boundEl.children].map(e => e.getAttribute('data-id')),
  ]

  // App.undo / App.redo's selection: the newest row across layers (Undo by
  // the row's ts, Redo by when it was undone), tried once. A row that cannot
  // go ends the press; nothing older is tried.
  const press = (kind, { owner = ME } = {}) => {
    const rows = layers.flatMap(({ layer, el }) => {
      const row = kind === 'undo'
        ? OpLayer.newestLiveRow(ydoc, layer, TABLE, ME, { owner })
        : OpLayer.newestUndoneRow(ydoc, layer, TABLE, ME)
      return row ? [{ layer, el, row, key: kind === 'undo' ? row.ts : row.undoneAt }] : []
    })
    const best = rows.sort((a, b) => (b.key - a.key) || (a.row.id < b.row.id ? 1 : -1))[0]
    if (!best) return false
    const run = kind === 'undo' ? OpLayer.undoOp : OpLayer.redoOp
    return !!run(ydoc, best.layer, best.el, TABLE, ME, best.row.id)
  }

  // Press once and name the id that left (undo) or arrived (redo).
  const pressAndDiff = (kind, opts) => {
    const before = new Set(present())
    expect(press(kind, opts)).toBe(true)
    const after = new Set(present())
    const changed = kind === 'undo'
      ? [...before].filter(id => !after.has(id))
      : [...after].filter(id => !before.has(id))
    expect(changed).toHaveLength(1)
    return changed[0]
  }

  return { ydoc, toysEl, bounds, boundEl, toy, drawBy, boundsBy, dropFromDom, shape, bound, present, press, pressAndDiff }
}

describe('undo picks the most recent action across layers', () => {
  test('toy1, draw1, bound1, toy2, bound2: five Undos reverse them newest first, and Redo walks forward', () => {
    const t = setup()
    t.toy('toy1'); t.shape('draw1'); t.bound('bound1'); t.toy('toy2'); t.bound('bound2')
    expect(t.present().sort()).toEqual(['bound1', 'bound2', 'draw1', 'toy1', 'toy2'])

    const undone = [1, 2, 3, 4, 5].map(() => t.pressAndDiff('undo'))
    expect(undone).toEqual(['bound2', 'toy2', 'bound1', 'draw1', 'toy1'])
    expect(t.present()).toEqual([])
    expect(t.press('undo')).toBe(false)   // nothing left

    const redone = [1, 2, 3, 4, 5].map(() => t.pressAndDiff('redo'))
    expect(redone).toEqual(['toy1', 'draw1', 'bound1', 'toy2', 'bound2'])
    expect(t.present().sort()).toEqual(['bound1', 'bound2', 'draw1', 'toy1', 'toy2'])
    expect(t.press('redo')).toBe(false)
  })

  test('a boundary move is undone as one step, and undoing the add after it removes the boundary', () => {
    const t = setup()
    t.toy('toy1'); t.bound('bound1')
    t.bounds.applyMoveCommit(t.bounds.find('bound1'), 40, 50)
    expect(t.bounds.find('bound1').getAttribute('transform')).toBe('translate(40, 50)')

    expect(t.press('undo')).toBe(true)
    expect(t.bounds.find('bound1').getAttribute('transform')).toBe('translate(0, 0)')
    expect(t.present().sort()).toEqual(['bound1', 'toy1'])

    expect(t.pressAndDiff('undo')).toBe('bound1')
    expect(t.pressAndDiff('redo')).toBe('bound1')
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

  test('newestLiveRow names the op without applying it', () => {
    const t = setup()
    t.shape('draw1')
    const row = OpLayer.newestLiveRow(t.ydoc, DRAWING_LAYER, TABLE, ME)
    expect(row.gesture).toBe('add')
    expect(t.present()).toEqual(['draw1'])
    expect(OpLayer.newestLiveRow(t.ydoc, DRAWING_LAYER, TABLE, 'someone-else')).toBeNull()
    expect(OpLayer.newestUndoneRow(t.ydoc, DRAWING_LAYER, TABLE, ME)).toBeNull()
  })

  test('a boundary add is a row', () => {
    const t = setup()
    t.bound('bound1')
    expect(OpLayer.newestLiveRow(t.ydoc, BOUN_POS_LAYER, TABLE, ME).gesture).toBe('add')
  })
})

describe('a target that can no longer apply ends the press', () => {
  test('in the same layer: nothing older is undone in its place', () => {
    const t = setup()
    t.bound('a'); t.bound('b')
    t.bounds.applyMoveCommit(t.bounds.find('a'), 40, 50)
    t.bounds.applyMoveCommit(t.bounds.find('b'), 60, 70)
    t.dropFromDom('b')                 // another peer deleted it

    expect(t.press('undo')).toBe(false)
    expect(t.bounds.find('a').getAttribute('transform')).toBe('translate(40, 50)')
  })

  test('across layers: the newest layer is the one tried, and an older layer is left alone', () => {
    const t = setup()
    t.toy('toy1'); t.shape('draw1')
    t.dropFromDom('draw1')

    const before = t.present()
    expect(t.press('undo')).toBe(false)
    expect(t.present()).toEqual(before)
    expect(before).toContain('toy1')
  })

  test('a press that gave up leaves nothing half undone', () => {
    const t = setup()
    t.toy('toy1'); t.bound('bound1')
    t.bounds.applyMoveCommit(t.bounds.find('bound1'), 40, 50)
    t.dropFromDom('bound1')

    const opsBefore = t.ydoc.getMap(BOUN_POS_LAYER.opsKey).size
    expect(t.press('undo')).toBe(false)
    expect(t.ydoc.getMap(BOUN_POS_LAYER.opsKey).size).toBe(opsBefore)
  })
})

describe('redo after undo', () => {
  test('brings back what was undone last, then the one before it', () => {
    const t = setup()
    t.toy('toy1'); t.shape('draw1')
    expect(t.pressAndDiff('undo')).toBe('draw1')
    expect(t.pressAndDiff('undo')).toBe('toy1')
    expect(t.pressAndDiff('redo')).toBe('toy1')
    expect(t.pressAndDiff('redo')).toBe('draw1')
  })
})

describe('undoFor: undoing another author’s action', () => {
  test('picks the owner’s latest action across layers by the owner’s ts, leaving the actor’s own alone', () => {
    const t = setup()
    t.toy('bob-toy', 'bob')
    t.shape('my-shape')
    t.drawBy('bob').add({ id: 'bob-shape', type: 'rect', x: 0, y: 0, width: 10, height: 10 })
    t.boundsBy('bob').add('boundary', { id: 'bob-bound', name: 'b', x: 0, y: 0, w: 10, h: 10 })

    expect(t.pressAndDiff('undo', { owner: 'bob' })).toBe('bob-bound')
    expect(t.pressAndDiff('undo', { owner: 'bob' })).toBe('bob-shape')
    expect(t.pressAndDiff('undo', { owner: 'bob' })).toBe('bob-toy')
    expect(t.press('undo', { owner: 'bob' })).toBe(false)
    expect(t.present()).toEqual(['my-shape'])

    // The actor's own undo is untouched by any of that.
    expect(t.pressAndDiff('undo')).toBe('my-shape')
  })

  test('the owner’s own Undo then reaches their previous action, not the one just undone', () => {
    const t = setup()
    t.toy('bob-1', 'bob'); t.toy('bob-2', 'bob')
    const row = OpLayer.newestLiveRow(t.ydoc, TOYS_LAYER, TABLE, 'bob')
    expect(row.gesture).toBe('place')

    expect(t.pressAndDiff('undo', { owner: 'bob' })).toBe('bob-2')
    // Bob's next target skips bob-2 (reverted by me) and finds bob-1.
    expect(OpLayer.newestLiveRow(t.ydoc, TOYS_LAYER, TABLE, 'bob').gesture).toBe('place')
    expect(t.pressAndDiff('undo', { owner: 'bob' })).toBe('bob-1')
    // Bob has no undos of his own to redo: they were mine.
    expect(OpLayer.newestUndoneRow(t.ydoc, TOYS_LAYER, TABLE, 'bob')).toBeNull()
  })

  test('every revert op carries reverts', () => {
    const t = setup()
    t.toy('toy1')
    OpLayer.undoGesture(t.ydoc, TOYS_LAYER, t.toysEl, TABLE, ME)
    const ops = [...t.ydoc.getMap(TOYS_LAYER.opsKey).values()]
    const undo = ops.find(o => o.gesture === 'undo:place')
    const real = ops.find(o => o.gesture === 'place')
    expect(undo.reverts).toBe(real.id)
  })
})
