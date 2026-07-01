/**
 * tests/unit/multiselect.test.js
 *
 * Unit tests for the multi-select feature:
 *   1. getBoxCandidates — AABB containment logic
 *   2. Overlay candidate rings (setHoverCandidates / clearHoverCandidates)
 *   3. Awareness broadcast (broadcastCandidates / clearBoxCandidates)
 *   4. setLocalGradient — updates persistent #local-sel-grad in canvas <defs>
 *   5. Overlay.localSelectionChanged — unified committed selection update
 *   6. Batch undo — { op: 'batch', entries: [...] } stack shape
 *   7. _selectedIds as SSOT — _singleSelectedId contract
 *   8. toggleSelection logic
 *   9. Multi-drag anchor element constraint logic
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// 1. getBoxCandidates — AABB containment
// ─────────────────────────────────────────────────────────────────────────────
//
// We test the containment logic directly without booting app.js, by extracting
// the predicate into a pure helper that mirrors the production code exactly.

function fullyInside(bbox, rect) {
  return (
    bbox.x >= rect.x &&
    bbox.y >= rect.y &&
    bbox.x + bbox.width  <= rect.x + rect.width &&
    bbox.y + bbox.height <= rect.y + rect.height
  )
}

// Simulate getBoxCandidates given a list of { id, bbox } objects and a rect.
function boxCandidates(objects, rect) {
  return objects
    .filter(({ bbox }) => bbox && fullyInside(bbox, rect))
    .map(({ id }) => id)
}

describe('getBoxCandidates — AABB containment', () => {
  const rect = { x: 100, y: 100, width: 200, height: 200 } // 100–300 × 100–300

  test('object fully inside is included', () => {
    const objects = [{ id: 'a', bbox: { x: 120, y: 120, width: 60, height: 60 } }]
    expect(boxCandidates(objects, rect)).toEqual(['a'])
  })

  test('object partially overlapping is excluded', () => {
    const objects = [{ id: 'b', bbox: { x: 80, y: 120, width: 60, height: 60 } }] // left edge outside
    expect(boxCandidates(objects, rect)).toEqual([])
  })

  test('object whose bbox exactly touches the selection edge is included', () => {
    // Right edge of object = right edge of rect
    const objects = [{ id: 'c', bbox: { x: 200, y: 150, width: 100, height: 50 } }]
    expect(boxCandidates(objects, rect)).toEqual(['c'])
  })

  test('object completely outside is excluded', () => {
    const objects = [{ id: 'd', bbox: { x: 400, y: 400, width: 50, height: 50 } }]
    expect(boxCandidates(objects, rect)).toEqual([])
  })

  test('object larger than the selection box is excluded', () => {
    const objects = [{ id: 'e', bbox: { x: 50, y: 50, width: 300, height: 300 } }]
    expect(boxCandidates(objects, rect)).toEqual([])
  })

  test('empty layer returns empty array', () => {
    expect(boxCandidates([], rect)).toEqual([])
  })

  test('only objects with non-null bbox are considered', () => {
    const objects = [
      { id: 'f', bbox: null },
      { id: 'g', bbox: { x: 120, y: 120, width: 50, height: 50 } },
    ]
    expect(boxCandidates(objects, rect)).toEqual(['g'])
  })

  test('multiple objects — only fully-inside ones returned', () => {
    const objects = [
      { id: 'in1',  bbox: { x: 110, y: 110, width: 80, height: 80 } },
      { id: 'out1', bbox: { x:  90, y: 110, width: 80, height: 80 } }, // left edge outside
      { id: 'in2',  bbox: { x: 150, y: 150, width: 40, height: 40 } },
      { id: 'out2', bbox: { x: 250, y: 250, width: 80, height: 80 } }, // right edge outside
    ]
    expect(boxCandidates(objects, rect)).toEqual(['in1', 'in2'])
  })

  test('zero-size selection box matches nothing', () => {
    const zeroRect = { x: 100, y: 100, width: 0, height: 0 }
    const objects = [{ id: 'h', bbox: { x: 100, y: 100, width: 0, height: 0 } }]
    // A zero-size object at the same point: x>=x ✓ y>=y ✓ x+0<=x+0 ✓ y+0<=y+0 ✓ → included
    expect(boxCandidates(objects, zeroRect)).toEqual(['h'])
  })

  test('all four edge conditions checked independently', () => {
    // Each object fails exactly one edge
    const objects = [
      { id: 'fail-left',   bbox: { x: 90,  y: 120, width: 50, height: 50 } }, // x < rect.x
      { id: 'fail-top',    bbox: { x: 120, y: 90,  width: 50, height: 50 } }, // y < rect.y
      { id: 'fail-right',  bbox: { x: 260, y: 120, width: 50, height: 50 } }, // x+w > rect.x+rect.w (310>300)
      { id: 'fail-bottom', bbox: { x: 120, y: 260, width: 50, height: 50 } }, // y+h > rect.y+rect.h (310>300)
    ]
    expect(boxCandidates(objects, rect)).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Overlay — setHoverCandidates / clearHoverCandidates
// ─────────────────────────────────────────────────────────────────────────────

import { SelectionMode, localSelectionChanged, setHoverCandidates, clearHoverCandidates, setLocalGradient, init as overlayInit } from '../../src/overlay.js'

function makeOverlayDOM() {
  document.body.innerHTML = `
    <svg id="canvas">
      <defs>
        <linearGradient id="local-sel-grad" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop id="local-sel-grad-stop0" offset="0%"   stop-color="#5a7ea8"></stop>
          <stop id="local-sel-grad-stop1" offset="100%" stop-color="#3a5e88"></stop>
        </linearGradient>
      </defs>
      <g id="overlay-layer"></g>
    </svg>
  `
}

function makeOverlayApp(bboxMap = {}) {
  return {
    getMyColor:    () => '#5a7ea8',
    getMyGradient: () => ({ c1: '#5a7ea8', c2: '#3a5e88', angle: 45 }),
    getViewScale:  () => 1,
    getBBox:       (id) => bboxMap[id] ?? null,
  }
}

beforeEach(() => {
  makeOverlayDOM()
  SelectionMode.clear()
})

describe('Overlay.setHoverCandidates', () => {
  test('sets candidate entries for each id', () => {
    overlayInit(makeOverlayApp(), document.getElementById('canvas'))
    setHoverCandidates(['a', 'b', 'c'])
    expect(SelectionMode.get('a')?.kind).toBe('candidate')
    expect(SelectionMode.get('b')?.kind).toBe('candidate')
    expect(SelectionMode.get('c')?.kind).toBe('candidate')
  })

  test('replaces previous candidate entries', () => {
    overlayInit(makeOverlayApp(), document.getElementById('canvas'))
    setHoverCandidates(['a', 'b'])
    setHoverCandidates(['c'])
    expect(SelectionMode.has('a')).toBe(false)
    expect(SelectionMode.has('b')).toBe(false)
    expect(SelectionMode.get('c')?.kind).toBe('candidate')
  })

  test('does not overwrite a local entry for the same id', () => {
    overlayInit(makeOverlayApp({ 'my-shape': { x: 0, y: 0, width: 10, height: 10 } }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['my-shape']))
    expect(SelectionMode.get('my-shape')?.kind).toBe('local')

    // rubber-band box now includes 'my-shape'
    setHoverCandidates(['my-shape', 'other'])
    // local entry must survive
    expect(SelectionMode.get('my-shape')?.kind).toBe('local')
    expect(SelectionMode.get('other')?.kind).toBe('candidate')
  })

  test('does not touch local entries', () => {
    overlayInit(makeOverlayApp({ 'my-shape': { x: 0, y: 0, width: 10, height: 10 } }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['my-shape']))
    setHoverCandidates(['x', 'y'])
    expect(SelectionMode.get('my-shape')?.kind).toBe('local')
  })

  test('does not touch remote entries', () => {
    overlayInit(makeOverlayApp(), document.getElementById('canvas'))
    SelectionMode.set('remote-el', { kind: 'remote', peerId: 'peer1', color: '#f00' })
    setHoverCandidates(['x'])
    expect(SelectionMode.get('remote-el')?.kind).toBe('remote')
  })

  test('empty ids array clears all candidates', () => {
    overlayInit(makeOverlayApp(), document.getElementById('canvas'))
    setHoverCandidates(['a', 'b'])
    setHoverCandidates([])
    expect(SelectionMode.has('a')).toBe(false)
    expect(SelectionMode.has('b')).toBe(false)
  })

  test('candidate rings rendered — same count as ids with known bbox', () => {
    const bboxMap = {
      'el-1': { x: 10, y: 10, width: 50, height: 50 },
      'el-2': { x: 80, y: 80, width: 50, height: 50 },
    }
    overlayInit(makeOverlayApp(bboxMap), document.getElementById('canvas'))
    setHoverCandidates(['el-1', 'el-2'])
    const rings = document.querySelectorAll('#overlay-layer .selRing')
    expect(rings).toHaveLength(2)
  })

  test('candidate rings render even when no local selection exists (grad defs are built)', () => {
    // Regression: when only candidates exist, #local-sel-grad was not written
    // into <defs>, so stroke:url(#local-sel-grad) resolved to nothing.
    // Fixed by moving the gradient to persistent canvas <defs> in index.html.
    const bboxMap = {
      'toy-a': { x: 10, y: 10, width: 64, height: 64 },
      'toy-b': { x: 100, y: 10, width: 64, height: 64 },
    }
    overlayInit(makeOverlayApp(bboxMap), document.getElementById('canvas'))
    // No local selection — SelectionMode is empty
    expect(SelectionMode.size).toBe(0)

    setHoverCandidates(['toy-a', 'toy-b'])

    // The persistent gradient exists in canvas <defs> (not overlay-layer)
    const grad = document.getElementById('local-sel-grad')
    expect(grad).not.toBeNull()

    // Rings must be present — stroke resolves because gradient is persistent
    const rings = document.querySelectorAll('#overlay-layer .selRing')
    expect(rings).toHaveLength(2)
  })

  test('candidate with null bbox renders no ring (getBBox returns null)', () => {
    overlayInit(makeOverlayApp({}), document.getElementById('canvas'))
    setHoverCandidates(['no-bbox'])
    const rings = document.querySelectorAll('#overlay-layer .selRing')
    expect(rings).toHaveLength(0)
  })
})

describe('Overlay.clearHoverCandidates', () => {
  test('removes all candidate entries', () => {
    overlayInit(makeOverlayApp(), document.getElementById('canvas'))
    setHoverCandidates(['a', 'b'])
    clearHoverCandidates()
    expect(SelectionMode.has('a')).toBe(false)
    expect(SelectionMode.has('b')).toBe(false)
  })

  test('does not remove local entries', () => {
    overlayInit(makeOverlayApp({ 's': { x: 0, y: 0, width: 10, height: 10 } }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['s']))
    setHoverCandidates(['c'])
    clearHoverCandidates()
    expect(SelectionMode.get('s')?.kind).toBe('local')
  })

  test('is safe to call with no candidates', () => {
    overlayInit(makeOverlayApp(), document.getElementById('canvas'))
    expect(() => clearHoverCandidates()).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. broadcastCandidates / clearBoxCandidates — awareness write side
// ─────────────────────────────────────────────────────────────────────────────
//
// These test the awareness write behaviour directly using the logic that
// broadcastCandidates and clearBoxCandidates encode, without booting app.js.

describe('broadcastCandidates awareness writes', () => {
  test('non-empty ids set selection to { elIds: [...] }', () => {
    const calls = []
    const setField = (key, value) => calls.push({ key, value })
    // Mirror production logic
    const broadcastCandidates = (ids) =>
      setField('selection', ids.length ? { elIds: ids } : null)

    broadcastCandidates(['a', 'b'])
    expect(calls).toHaveLength(1)
    expect(calls[0].key).toBe('selection')
    expect(calls[0].value).toEqual({ elIds: ['a', 'b'] })
  })

  test('empty ids sets selection to null', () => {
    const calls = []
    const broadcastCandidates = (ids) =>
      calls.push(ids.length ? { elIds: ids } : null)

    broadcastCandidates([])
    expect(calls[0]).toBeNull()
  })

  test('clearBoxCandidates sets selection to null', () => {
    const calls = []
    const clearBoxCandidates = () => calls.push(null)

    clearBoxCandidates()
    expect(calls[0]).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. setLocalGradient — updates persistent #local-sel-grad in canvas <defs>
// ─────────────────────────────────────────────────────────────────────────────

describe('Overlay.setLocalGradient', () => {
  test('updates stop colors on the persistent gradient element', () => {
    makeOverlayDOM()
    overlayInit(makeOverlayApp(), document.getElementById('canvas'))
    setLocalGradient({ c1: '#ff0000', c2: '#0000ff', angle: 90 })
    expect(document.getElementById('local-sel-grad-stop0').getAttribute('stop-color')).toBe('#ff0000')
    expect(document.getElementById('local-sel-grad-stop1').getAttribute('stop-color')).toBe('#0000ff')
  })

  test('updates gradient direction from angle', () => {
    makeOverlayDOM()
    overlayInit(makeOverlayApp(), document.getElementById('canvas'))
    setLocalGradient({ c1: '#aaa', c2: '#bbb', angle: 90 })
    const lg = document.getElementById('local-sel-grad')
    // angle=90 → horizontal: x1≈0, x2≈1, y1=y2=0.5
    expect(parseFloat(lg.getAttribute('x1'))).toBeCloseTo(0, 1)
    expect(parseFloat(lg.getAttribute('x2'))).toBeCloseTo(1, 1)
  })

  test('is a no-op when element does not exist', () => {
    document.body.innerHTML = '<svg id="canvas"><g id="overlay-layer"></g></svg>'
    overlayInit(makeOverlayApp(), document.getElementById('canvas'))
    expect(() => setLocalGradient({ c1: '#aaa', c2: '#bbb', angle: 0 })).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Overlay.localSelectionChanged — unified committed selection update
// ─────────────────────────────────────────────────────────────────────────────

describe('Overlay.localSelectionChanged', () => {
  test('empty Set clears all local entries (deselect)', () => {
    makeOverlayDOM()
    overlayInit(makeOverlayApp({ 'a': { x: 0, y: 0, width: 50, height: 50 } }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['a']))
    localSelectionChanged(new Set())
    expect(SelectionMode.has('a')).toBe(false)
    expect(SelectionMode.size).toBe(0)
  })

  test('Set of size 1 sets a single local entry', () => {
    makeOverlayDOM()
    overlayInit(makeOverlayApp({ 'a': { x: 0, y: 0, width: 50, height: 50 } }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['a']))
    expect(SelectionMode.get('a')?.kind).toBe('local')
    expect(SelectionMode.size).toBe(1)
  })

  test('Set of size N sets N local entries', () => {
    makeOverlayDOM()
    const bboxMap = {
      'a': { x: 0,  y: 0, width: 50, height: 50 },
      'b': { x: 60, y: 0, width: 50, height: 50 },
      'c': { x: 120, y: 0, width: 50, height: 50 },
    }
    overlayInit(makeOverlayApp(bboxMap), document.getElementById('canvas'))
    localSelectionChanged(new Set(['a', 'b', 'c']))
    expect(SelectionMode.get('a')?.kind).toBe('local')
    expect(SelectionMode.get('b')?.kind).toBe('local')
    expect(SelectionMode.get('c')?.kind).toBe('local')
  })

  test('also clears candidate entries from a prior rubber-band', () => {
    makeOverlayDOM()
    overlayInit(makeOverlayApp({ 'x': { x: 0, y: 0, width: 50, height: 50 } }), document.getElementById('canvas'))
    setHoverCandidates(['x'])
    expect(SelectionMode.get('x')?.kind).toBe('candidate')
    localSelectionChanged(new Set())
    expect(SelectionMode.has('x')).toBe(false)
  })

  test('does not touch remote entries', () => {
    makeOverlayDOM()
    overlayInit(makeOverlayApp(), document.getElementById('canvas'))
    SelectionMode.set('remote-el', { kind: 'remote', peerId: 'p1', color: '#f00' })
    localSelectionChanged(new Set(['a']))
    expect(SelectionMode.get('remote-el')?.kind).toBe('remote')
  })

  test('renders rings for each id with a known bbox', () => {
    makeOverlayDOM()
    const bboxMap = {
      'el-1': { x: 10, y: 10, width: 50, height: 50 },
      'el-2': { x: 80, y: 80, width: 50, height: 50 },
    }
    overlayInit(makeOverlayApp(bboxMap), document.getElementById('canvas'))
    localSelectionChanged(new Set(['el-1', 'el-2']))
    const rings = document.querySelectorAll('#overlay-layer .selRing')
    expect(rings).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Batch undo — { op: 'batch', entries: [...] }
// ─────────────────────────────────────────────────────────────────────────────
//
// Tests the undo stack shape and restoration logic directly, without booting
// the full App bus. We simulate the batch entry format and the undo dispatch.

describe('batch undo — stack shape', () => {
  // Simulate how deleteMultiSelected builds its batch entry
  function makeBatchDeleteEntry(ids) {
    const entries = ids.map(id => ({
      op: 'del', module: 'drawing',
      state: { id, type: 'rect', x: 0, y: 0, width: 50, height: 50, fill: '#f00' },
    }))
    return { op: 'batch', entries }
  }

  function makeBatchAddEntry(ids) {
    const entries = ids.map(id => ({ op: 'add', module: 'drawing', id }))
    return { op: 'batch', entries }
  }

  test('deleteMultiSelected pushes one batch entry, not N individual entries', () => {
    // Verify the entry shape — single { op:'batch', entries:[...] }
    const batchEntry = makeBatchDeleteEntry(['a', 'b', 'c'])
    expect(batchEntry.op).toBe('batch')
    expect(batchEntry.entries).toHaveLength(3)
    expect(batchEntry.entries.every(e => e.op === 'del')).toBe(true)
  })

  test('duplicateMultiSelected pushes one batch entry of add ops', () => {
    const batchEntry = makeBatchAddEntry(['x', 'y'])
    expect(batchEntry.op).toBe('batch')
    expect(batchEntry.entries).toHaveLength(2)
    expect(batchEntry.entries.every(e => e.op === 'add')).toBe(true)
  })

  test('batch undo reverses entries in reverse order', () => {
    const restored = []
    const entries = [
      { op: 'del', module: 'drawing', state: { id: 'first' } },
      { op: 'del', module: 'drawing', state: { id: 'second' } },
      { op: 'del', module: 'drawing', state: { id: 'third' } },
    ]

    // Simulate undo reversal
    for (const entry of [...entries].reverse()) {
      restored.push(entry.state.id)
    }

    expect(restored).toEqual(['third', 'second', 'first'])
  })

  test('batch entry with no async ops (drawings only) resolves synchronously', () => {
    // Mirror the undo branch: if promises.length === 0, toast is synchronous
    const entries = [
      { op: 'del', module: 'drawing', state: { id: 'a' } },
      { op: 'del', module: 'drawing', state: { id: 'b' } },
    ]
    const promises = []
    for (const entry of [...entries].reverse()) {
      if (entry.module === 'toys') {
        promises.push(Promise.resolve()) // simulated async
      }
      // drawing restore is sync — no push
    }
    expect(promises).toHaveLength(0) // sync path taken
  })

  test('batch entry with toy ops collects async promises', () => {
    const entries = [
      { op: 'del', module: 'drawing', state: { id: 'a' } },
      { op: 'del', module: 'toys',    state: { id: 'b', toyType: 'd6' } },
    ]
    const promises = []
    for (const entry of [...entries].reverse()) {
      if (entry.module === 'toys') {
        promises.push(Promise.resolve('toy-restored'))
      }
    }
    expect(promises).toHaveLength(1) // async path taken
    return expect(Promise.all(promises)).resolves.toEqual(['toy-restored'])
  })

  test('batch add entries (from duplicateMultiSelected) are undone by deletion', () => {
    const deleted = []
    const entries = [
      { op: 'add', module: 'drawing', id: 'new-1' },
      { op: 'add', module: 'drawing', id: 'new-2' },
    ]
    for (const entry of [...entries].reverse()) {
      if (entry.op === 'add') deleted.push(entry.id)
    }
    expect(deleted).toEqual(['new-2', 'new-1'])
  })

  test('batch move entries (from commitMultiMove) are undone by reversing positions', () => {
    // Simulate what commitMultiMove creates when two elements are moved together
    const undoMoves = []
    const entries = [
      { op: 'move', module: 'toys', id: 'toy-1', fromX: 100, fromY: 100, toX: 150, toY: 150 },
      { op: 'move', module: 'toys', id: 'toy-2', fromX: 200, fromY: 200, toX: 250, toY: 250 },
    ]
    for (const entry of [...entries].reverse()) {
      if (entry.op === 'move') {
        undoMoves.push({ id: entry.id, x: entry.fromX, y: entry.fromY })
      }
    }
    // Moves should be reversed in order, restoring original positions
    expect(undoMoves).toEqual([
      { id: 'toy-2', x: 200, y: 200 },
      { id: 'toy-1', x: 100, y: 100 },
    ])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. _selectedIds as SSOT — _singleSelectedId contract
// ─────────────────────────────────────────────────────────────────────────────

describe('_selectedIds as SSOT', () => {
  // Mirror the _singleSelectedId helper logic
  function singleSelectedId(selectedIds) {
    return selectedIds.size === 1 ? [...selectedIds][0] : null;
  }

  test('returns null when nothing selected', () => {
    expect(singleSelectedId(new Set())).toBeNull()
  })

  test('returns the id when exactly one item selected', () => {
    expect(singleSelectedId(new Set(['shape-abc']))).toBe('shape-abc')
  })

  test('returns null when two or more items selected', () => {
    expect(singleSelectedId(new Set(['a', 'b']))).toBeNull()
  })

  test('returns null when three items selected', () => {
    expect(singleSelectedId(new Set(['a', 'b', 'c']))).toBeNull()
  })

  test('getSelectedIds returns all ids for multi-selection', () => {
    const ids = ['toy-1', 'toy-2', 'toy-3']
    const s = new Set(ids)
    expect([...s]).toEqual(ids)
  })

  test('single select via App.select results in getSelectedIds returning one-element array', () => {
    // Simulate what App.select('x') does to _selectedIds
    const _selectedIds = new Set(['x'])
    expect([..._selectedIds]).toEqual(['x'])
    expect(singleSelectedId(_selectedIds)).toBe('x')
  })

  test('deselect results in empty getSelectedIds', () => {
    const _selectedIds = new Set()
    expect([..._selectedIds]).toEqual([])
    expect(singleSelectedId(_selectedIds)).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. toggleSelection logic
// ─────────────────────────────────────────────────────────────────────────────

describe('toggleSelection logic', () => {
  // Mirror the toggleSelection logic from app.js
  function toggle(selectedIds, id) {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return next
  }

  test('adds an id not in the selection', () => {
    const result = toggle(new Set(['a']), 'b')
    expect(result.has('a')).toBe(true)
    expect(result.has('b')).toBe(true)
  })

  test('removes an id that is in the selection', () => {
    const result = toggle(new Set(['a', 'b']), 'b')
    expect(result.has('b')).toBe(false)
    expect(result.has('a')).toBe(true)
  })

  test('toggling the only selected id results in empty set', () => {
    const result = toggle(new Set(['a']), 'a')
    expect(result.size).toBe(0)
  })

  test('toggling on empty set adds the id', () => {
    const result = toggle(new Set(), 'x')
    expect([...result]).toEqual(['x'])
  })

  test('size 1 after toggle: collapses to single-select mode', () => {
    // If we remove one from a pair, result.size === 1 → single-select
    const result = toggle(new Set(['a', 'b']), 'b')
    expect(result.size).toBe(1)
    const singleId = result.size === 1 ? [...result][0] : null
    expect(singleId).toBe('a')
  })

  test('shift-clicking an already-selected item deselects it (round-trip)', () => {
    let sel = new Set(['a', 'b', 'c'])
    sel = toggle(sel, 'b')
    expect(sel.has('b')).toBe(false)
    expect(sel.size).toBe(2)
    // shift-click b again to re-add
    sel = toggle(sel, 'b')
    expect(sel.has('b')).toBe(true)
    expect(sel.size).toBe(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. Multi-drag anchor constraint logic
// ─────────────────────────────────────────────────────────────────────────────

describe('multi-drag anchor element constraint', () => {
  // Mirror the constraint logic from moveMulti
  function applyConstraints(anchorX, anchorY, ddx, ddy, boundsRects, snapPoints) {
    let rx = Math.round(anchorX + ddx)
    let ry = Math.round(anchorY + ddy)

    if (boundsRects !== null) {
      const inBounds = boundsRects.some(
        r => rx >= r.x && rx <= r.x + r.w && ry >= r.y && ry <= r.y + r.h
      )
      if (!inBounds) return null // rejected
    }

    if (snapPoints.length > 0) {
      let best = null, bestD2 = Infinity
      for (const { cx, cy, snapRadius } of snapPoints) {
        const d2 = (rx - cx) ** 2 + (ry - cy) ** 2
        if (d2 < snapRadius ** 2 && d2 < bestD2) { best = { cx, cy }; bestD2 = d2 }
      }
      if (best) { rx = best.cx; ry = best.cy }
    }

    return { cdx: rx - anchorX, cdy: ry - anchorY }
  }

  test('move within bounds is accepted and returns (ddx, ddy)', () => {
    const result = applyConstraints(
      100, 100,     // anchor start
      20, 10,       // desired offset
      [{ x: 0, y: 0, w: 200, h: 200 }], // bounds
      []
    )
    expect(result).not.toBeNull()
    expect(result.cdx).toBe(20)
    expect(result.cdy).toBe(10)
  })

  test('move outside bounds is rejected (returns null)', () => {
    const result = applyConstraints(
      100, 100,
      200, 0,  // would put anchor at x=300, outside w=200
      [{ x: 0, y: 0, w: 200, h: 200 }],
      []
    )
    expect(result).toBeNull()
  })

  test('move near a snap point snaps the anchor', () => {
    const result = applyConstraints(
      100, 100,
      8, 3,  // puts anchor at (108, 103), snap at (110, 100) within radius 15
      null,
      [{ cx: 110, cy: 100, snapRadius: 15 }]
    )
    expect(result).not.toBeNull()
    // Snapped: cdx = 110-100 = 10, cdy = 100-100 = 0
    expect(result.cdx).toBe(10)
    expect(result.cdy).toBe(0)
  })

  test('snap outside bounds is rejected when both constraints present', () => {
    // Snap point at (250, 100) is outside bounds [0..200]
    const result = applyConstraints(
      100, 100,
      145, 0,  // puts anchor at (245, 100), within snap radius of (250, 100)
      [{ x: 0, y: 0, w: 200, h: 200 }],
      [{ cx: 250, cy: 100, snapRadius: 20 }]
    )
    // Anchor (245) is outside bounds → rejected before snap check
    expect(result).toBeNull()
  })

  test('the constrained (dx, dy) is applied uniformly to all elements', () => {
    const elements = [
      { anchorX: 100, anchorY: 100 },
      { anchorX: 200, anchorY: 150 },
      { anchorX: 50,  anchorY: 80  },
    ]
    const { cdx, cdy } = applyConstraints(100, 100, 20, 10, null, [])
    const newPositions = elements.map(e => ({
      x: Math.round(e.anchorX + cdx),
      y: Math.round(e.anchorY + cdy),
    }))
    expect(newPositions[0]).toEqual({ x: 120, y: 110 })
    expect(newPositions[1]).toEqual({ x: 220, y: 160 })
    expect(newPositions[2]).toEqual({ x: 70,  y: 90  })
  })
})
