// @vitest-environment jsdom
//
// Tests for undo_redo.js — the Y.UndoManager-backed undo/redo stack.
//
// These drive the module directly against Yjs fragments, mirroring how
// app.js uses it: tag a label, run the action's transaction, then undo/redo.
// The transaction origins here match what app.js / envelope.js actually use:
//   - null            → structural writes (add/move/delete/reparent)
//   - ENVELOPE_ORIGIN → a user-intent toy handler (a die roll)         [tracked]
//   - DERIVED_ORIGIN  → a tray recomputing its sum                     [untracked]
//   - LIFECYCLE_ORIGIN→ a toy's placement-time initialize()            [untracked]

import * as Y from 'yjs'
import { describe, test, expect, beforeEach } from 'vitest'
import * as UndoRedo from '../../src/undo_redo.js'
import { ENVELOPE_ORIGIN, DERIVED_ORIGIN, LIFECYCLE_ORIGIN } from '../../src/envelope.js'
import { addToySync, findToy, reparentToy } from '../../src/toys.js'

const TRAY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" id="tray_fixture" class="tray_fixture tray">
  <g id="contents_group" class="contents_group"></g>
  <text id="result"><tspan id="tspan_result" class="tspan_result">0</tspan></text>
</svg>`

const DIE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="die_fixture" class="die_fixture">
  <text id="text_value"><tspan id="tspan_value">6</tspan></text>
</svg>`

const placeTray = (ydoc, yToys, id) =>
  addToySync(ydoc, yToys, { id, toyType: 'tray_fixture', x: 0, y: 0, color: '#fff' }, TRAY_SVG)
const placeDie = (ydoc, yToys, id) =>
  addToySync(ydoc, yToys, { id, toyType: 'die_fixture', x: 0, y: 0, color: '#fff' }, DIE_SVG)

// Is `id` a direct child of `container` (not descending into nested trays)?
const isDirectChild = (container, id) =>
  container.toArray().some(c => c instanceof Y.XmlElement && c.getAttribute('data-toy-id') === id)

// Locate the tray's .contents_group Y node.
function contentsGroupOf(yTray) {
  const svg = yTray.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
  return svg.toArray().find(
    c => c instanceof Y.XmlElement && (c.getAttribute('class') || '').split(/\s+/).includes('contents_group')
  )
}

// Fresh doc + module per test. The module holds one UndoManager in module
// scope, so re-init each time to reset the stack.
function freshDoc() {
  const ydoc    = new Y.Doc()
  const yToys   = ydoc.getXmlFragment('toys')
  const yDraw   = ydoc.getXmlFragment('drawing')
  const yBoun   = ydoc.getXmlFragment('boundaries')
  const applied = []
  UndoRedo.init({
    ydoc,
    scopes: [yToys, yDraw, yBoun],
    onApply: (kind, label) => applied.push({ kind, label }),
    onEmpty: (kind)        => applied.push({ kind, label: null, empty: true }),
  })
  return { ydoc, yToys, yDraw, yBoun, applied }
}

describe('undo_redo — tracked structural actions', () => {
  let ctx
  beforeEach(() => { ctx = freshDoc() })

  test('a drop-into-tray wrapped in one transaction is a single undo step', () => {
    const { ydoc, yToys } = ctx
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')

    // The drop, exactly as app.js commits it: reparent + reposition in ONE
    // transaction so the two inner transacts collapse into one stack item.
    UndoRedo.tag('move die1 into a tray')
    ydoc.transact(() => {
      const moved = reparentToy(ydoc, yToys, 'die1', 'tray1')
      moved.setAttribute('x', '20')
      moved.setAttribute('y', '20')
    })

    const tray = findToy(yToys, 'tray1')
    expect(isDirectChild(contentsGroupOf(tray), 'die1')).toBe(true)
    expect(isDirectChild(yToys, 'die1')).toBe(false)

    // ONE undo takes the whole drop back to the top level.
    expect(UndoRedo.undo()).toBe(true)
    expect(isDirectChild(yToys, 'die1')).toBe(true)
    expect(isDirectChild(contentsGroupOf(findToy(yToys, 'tray1')), 'die1')).toBe(false)

    // ...and one redo puts it back inside, repositioned.
    expect(UndoRedo.redo()).toBe(true)
    const back = findToy(yToys, 'die1')
    expect(isDirectChild(contentsGroupOf(findToy(yToys, 'tray1')), 'die1')).toBe(true)
    expect(back.getAttribute('x')).toBe('20')
  })

  test('undoing a delete restores the exact subtree (contents included)', () => {
    const { ydoc, yToys } = ctx
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')
    // die nested inside the tray, so the tray delete must bring it back too.
    ydoc.transact(() => { reparentToy(ydoc, yToys, 'die1', 'tray1') })

    UndoRedo.tag('delete tray1')
    ydoc.transact(() => {
      const idx = yToys.toArray().findIndex(
        c => c instanceof Y.XmlElement && c.getAttribute('data-toy-id') === 'tray1')
      yToys.delete(idx, 1)
    })
    expect(findToy(yToys, 'tray1')).toBeNull()
    expect(findToy(yToys, 'die1')).toBeNull()

    UndoRedo.undo()
    // Whole subtree is back — tray AND its nested die, no file re-fetch.
    expect(findToy(yToys, 'tray1')).not.toBeNull()
    expect(isDirectChild(contentsGroupOf(findToy(yToys, 'tray1')), 'die1')).toBe(true)
  })

  test('a move is one undo step and reverts to the prior position', () => {
    const { ydoc, yToys } = ctx
    placeDie(ydoc, yToys, 'die1')
    const die = findToy(yToys, 'die1')
    const x0 = die.getAttribute('x')

    UndoRedo.tag('move die1')
    ydoc.transact(() => { findToy(yToys, 'die1').setAttribute('x', '999') })
    expect(findToy(yToys, 'die1').getAttribute('x')).toBe('999')

    UndoRedo.undo()
    expect(findToy(yToys, 'die1').getAttribute('x')).toBe(x0)
  })
})

describe('undo_redo — rolls are undoable', () => {
  test('a die roll (ENVELOPE_ORIGIN) is a tracked, reversible step', () => {
    const { ydoc, yToys } = freshDoc()
    placeDie(ydoc, yToys, 'die1')
    UndoRedo.clear()   // isolate: forget the placement, keep only the roll

    // A roll commits under ENVELOPE_ORIGIN, like invokeMenuAction → commitEnvelope.
    // (The real handler rewrites the tspan text; a tracked attribute write
    // exercises the same origin-tracking path this test cares about.)
    UndoRedo.tag('roll die1')
    ydoc.transact(() => { findToy(yToys, 'die1').setAttribute('data-face', '3') }, ENVELOPE_ORIGIN)
    expect(findToy(yToys, 'die1').getAttribute('data-face')).toBe('3')

    expect(UndoRedo.canUndo()).toBe(true)
    UndoRedo.undo()
    expect(findToy(yToys, 'die1').getAttribute('data-face') ?? null).toBeNull()
  })
})

describe('undo_redo — derived and lifecycle writes stay off the stack', () => {
  test('DERIVED_ORIGIN (tray sum recompute) is never its own undo step', () => {
    const { ydoc, yToys } = freshDoc()
    placeTray(ydoc, yToys, 'tray1')
    UndoRedo.clear()   // isolate from the placement

    // A structural, tracked change first.
    UndoRedo.tag('move tray1')
    ydoc.transact(() => { findToy(yToys, 'tray1').setAttribute('x', '50') })
    expect(UndoRedo.canUndo()).toBe(true)

    // A derived recompute (untracked) must NOT push a new step.
    ydoc.transact(() => { findToy(yToys, 'tray1').setAttribute('data-derived', 'yes') }, DERIVED_ORIGIN)

    // Undo skips the derived write entirely and reverses the tracked move;
    // exactly one tracked step existed, so nothing is left to undo after.
    UndoRedo.undo()
    expect(findToy(yToys, 'tray1').getAttribute('x')).not.toBe('50')
    expect(UndoRedo.canUndo()).toBe(false)
  })

  test('LIFECYCLE_ORIGIN (initialize) is not tracked', () => {
    const { ydoc, yToys } = freshDoc()
    placeDie(ydoc, yToys, 'die1')
    UndoRedo.clear()   // isolate from the placement

    ydoc.transact(() => { findToy(yToys, 'die1').setAttribute('data-init', '1') }, LIFECYCLE_ORIGIN)
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
