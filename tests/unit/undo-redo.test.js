// @vitest-environment jsdom
//
// Tests for undo_redo.js — the Y.UndoManager-backed undo/redo stack.
//
// undo_redo.js is fragment-agnostic: it tracks whatever Y.XmlFragment
// scopes it's given (drawing, boundaries in production). Toys have their
// own, separate undo mechanism entirely (toys.js's undoToyGesture — see
// undo_redo.js's module doc) — these fixtures are deliberately generic
// shapes, not toy-shaped, since toys are never what this module actually
// scopes over.
//
// These drive the module directly against Yjs fragments, mirroring how
// app.js uses it: tag a label, run the action's transaction, then undo/redo.
// Every tracked write here transacts under a null origin, matching what
// app.js's structural writes actually use — trackedOrigins is just {null}.

import * as Y from 'yjs'
import { describe, test, expect, beforeEach } from 'vitest'
import * as UndoRedo from '../../src/undo_redo.js'

function makeGroup(id) {
  const g = new Y.XmlElement('g')
  g.setAttribute('data-id', id)
  return g
}

// Fresh doc + module per test. The module holds one UndoManager in module
// scope, so re-init each time to reset the stack.
function freshDoc() {
  const ydoc    = new Y.Doc()
  const yDraw   = ydoc.getXmlFragment('drawing')
  const yBoun   = ydoc.getXmlFragment('boundaries')
  const applied = []
  UndoRedo.init({
    ydoc,
    scopes: [yDraw, yBoun],
    onApply: (kind, label) => applied.push({ kind, label }),
    onEmpty: (kind)        => applied.push({ kind, label: null, empty: true }),
  })
  return { ydoc, yDraw, yBoun, applied }
}

describe('undo_redo — tracked structural actions', () => {
  let ctx
  beforeEach(() => { ctx = freshDoc() })

  test('a delete + reposition wrapped in one transaction is a single undo step', () => {
    const { ydoc, yDraw } = ctx
    const keep = makeGroup('keep')
    const gone = makeGroup('gone')
    yDraw.insert(0, [keep, gone])

    UndoRedo.tag('delete gone and reposition keep')
    ydoc.transact(() => {
      yDraw.delete(1, 1) // remove 'gone'
      keep.setAttribute('x', '20')
      keep.setAttribute('y', '20')
    })

    expect(yDraw.toArray()).toEqual([keep])
    expect(keep.getAttribute('x')).toBe('20')

    // ONE undo takes both back.
    expect(UndoRedo.undo()).toBe(true)
    expect(yDraw.toArray().length).toBe(2)
    expect(keep.getAttribute('x')).toBeUndefined()

    // ...and one redo re-applies both together.
    expect(UndoRedo.redo()).toBe(true)
    expect(yDraw.toArray().length).toBe(1)
    expect(keep.getAttribute('x')).toBe('20')
  })

  test('undoing a delete restores the exact subtree (contents included)', () => {
    const { ydoc, yDraw } = ctx
    const outer = makeGroup('outer')
    const inner = makeGroup('inner')
    outer.insert(0, [inner])
    yDraw.insert(0, [outer])

    UndoRedo.tag('delete outer')
    ydoc.transact(() => { yDraw.delete(0, 1) })
    expect(yDraw.toArray().length).toBe(0)

    UndoRedo.undo()
    // Whole subtree is back — outer AND its nested inner.
    expect(yDraw.toArray().length).toBe(1)
    expect(yDraw.toArray()[0].toArray().length).toBe(1)
  })

  test('a move is one undo step and reverts to the prior position', () => {
    const { ydoc, yDraw } = ctx
    const el = makeGroup('el')
    el.setAttribute('x', '0')
    yDraw.insert(0, [el])

    UndoRedo.tag('move el')
    ydoc.transact(() => { el.setAttribute('x', '999') })
    expect(el.getAttribute('x')).toBe('999')

    UndoRedo.undo()
    expect(el.getAttribute('x')).toBe('0')
  })
})

describe('undo_redo — only null-origin transactions are tracked', () => {
  test('a transaction under a non-null origin is not tracked', () => {
    const { ydoc, yDraw } = freshDoc()
    const el = makeGroup('el')
    yDraw.insert(0, [el])
    UndoRedo.clear() // isolate: forget the (tracked, null-origin) insert above

    ydoc.transact(() => { el.setAttribute('data-derived', '1') }, 'some-other-origin')
    // No tracked change happened, so there is nothing to undo.
    expect(UndoRedo.canUndo()).toBe(false)
    expect(UndoRedo.undo()).toBe(false)
  })
})

describe('undo_redo — empty-stack reporting', () => {
  test('undo/redo with an empty stack report via onEmpty and return false', () => {
    const { applied } = freshDoc()
    expect(UndoRedo.undo()).toBe(false)
    expect(UndoRedo.redo()).toBe(false)
    expect(applied.filter(a => a.empty).map(a => a.kind)).toEqual(['undo', 'redo'])
  })
})
