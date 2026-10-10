# Move the drawing layer onto the op log

A self-contained task spec. Read these first:
- `CLAUDE.md`
- `src/CONCURRENCY_AND_BRANCHING.md`, all of it
- `src/op_layers.js` and `src/op_layer.js`: the generic per-layer machinery
  the toys layer uses
- the end of `src/toys.js`, where `TOYS_LAYER` is defined: the pattern this
  task copies

This task explicitly authorizes changes to:
- `src/drawing.js`, `src/app.js`, `src/storage.js`, `src/undo_redo.js` (one
  small addition, below), `src/ui.js` where it reads drawing data
- `src/CONCURRENCY_AND_BRANCHING.md`
- the tests listed below

## Decisions already made

- **One DAG per layer.** Drawing becomes the second registered op layer.
- **Concurrent same-attribute writes are a conflict** (§5.1), on drawing
  as on toys. Today Yjs silently picks a winner when two people move the same
  rect. After this change it's a conflict and the branch dialog. That's
  intended: soft-lock is what prevents it for connected peers.
- **No migration.** Existing alpha tables lose their drawings: the old
  `drawing` Y.XmlFragment is no longer read. Leave it in the document
  untouched; don't delete it.
- **Choosing which layer to undo** uses the author's own `ts`. Undo acts
  on whichever layer holds this author's most recent undoable action. This
  task also replaces `_lastActionScope` (below).

## The layer

Define `DRAWING_LAYER` in `drawing.js` with `defineOpLayer`, the same way
`TOYS_LAYER` is defined:
- `name: 'drawing'`
- `selector: '#drawing-layer'`
- `layerDataId: 'tt-layer-drawing'`
- `opsKey: 'ops:drawing'`, `contentKey: 'checkpointContent:drawing'`
- `headKey`: `tt_head_drawing_${tableId}`, `mergeKey`:
  `tt_head_merge_drawing_${tableId}`
- **No hooks.** Drawing has no scripts and no cascades.

`app.js` already loops over `opLayers()` for observers, checkpoints, pruning,
orphans and conflicts. The new layer should come along for free. Check each
loop, and fix any place that still special-cases toys.

## Writes become gestures on the DOM

Every write in `drawing.js` that takes `(ydoc, yEl)` or `(ydoc, yDrawing)`
becomes a DOM operation on the live element. `makeLayerAPI` wraps each one in
`OpLayer.runGesture(ydoc, DRAWING_LAYER, layerEl, fn, { gesture, authorId, tableId })`.

| Today (Yjs) | After (DOM, inside a gesture) | gesture |
|---|---|---|
| `addDrawing` | build the element (`id`, `data-id`, `data-module`, schema attributes, the derived `transform`) and append it | `draw` |
| `deleteDrawing` | remove the element | `delete` |
| `applyMoveCommit` | `applyMoveDom` | `move` |
| `applyResize` | the commit form of `previewResize` | `resize` |
| `applyRotate` / `applyPivot` | the commit forms of `previewRotate` / `previewPivot` | `rotate` / `pivot` |
| `edit` / `applyTtState` | set the attributes | `edit` |

- **The derived `transform`** (#150 made it stored) is written by
  `syncRotation` **inside the same gesture** whenever geometry, rotation or
  pivot change (invariant 6).
- **`makeLayerAPI(ydoc, getLayerEl, user, tableId, isCreator)`** follows
  the toys signature. `find()` returns the live DOM element, and every method
  accepts what `find()` returns.
- **`render`** becomes `OpLayer.projectLayer(ydoc, DRAWING_LAYER, …)`. The
  creator writes the genesis checkpoint, as for toys.
- **Delete** the Yjs-side code with no remaining callers: `mirror`,
  `_toSVGEl`, `listDrawings`, `findDrawing`, `yElAsSvgEl`, `syncRotationY`,
  `getRotationFromAttr`, and the `yDrawing` parameters. Keep the pure
  geometry functions.
- **`reconcileImportedTransform`** keeps its logic, but works on a DOM
  element.

**Multi-select actions are one gesture each**, like `deleteToysBatch` and
`moveToysBatch`. Add drawing equivalents: delete, move and duplicate as a
batch. In `app.js`:
- `deleteMultiSelected` currently wraps drawing and boundaries in one
  `ydoc.transact`. Drawing goes through its batch gesture. Boundaries keep
  the Yjs path.
- `duplicateMultiSelected` reads `yEl.getAttributes()`. It reads DOM
  attributes instead and becomes one `duplicate` gesture.
- `commitDrawing`, `commitMove`, multi-move, resize, rotate, pivot and edit
  all go through the LayerAPI.
- Remove every remaining `Drawing.findDrawing(_yDrawing, …)` and `_yDrawing`.

**Remote changes and the layer panel.**
- Remove `onDrawingChanged` and the drawing `onDocChanged` observer.
  `onOpsChanged(layer, …)` already logs remote gestures.
- Make sure `UI.refreshFromDoc()` (the layer list) runs after local
  **and** remote drawing ops, as it did on every Yjs change.

**Import and export.**
- `storage.populateFromSvgDoc` parses drawing children (and the "everything
  else goes to drawing" fallback) into a scratch layer, running
  `reconcileImportedTransform` on each one. Then:
  - **As a new table:** a drawing genesis checkpoint.
  - **Into a live table:** one `import` gesture that appends them, the way
    `importToys` does.
- `buildExportSvg` clones the live drawing layer, the same way it handles
  toys, and stops rebuilding it from Yjs. Strip `data-tt-head` and
  `data-op-layer` from the clone.

## Undo: pick the most recent action by `ts`, across every mechanism

There are now three mechanisms: the toys op layer, the drawing op layer, and
`UndoManager` (boundaries only from now on).

- **`UndoRedo.init` scopes** become `[_yBounPos]`.
- **`op_layer.js`:** add `undoCandidate(ydoc, layer, tableId, authorId)` and
  `redoCandidate(...)`. Each returns the target op without applying it.
  `authorUndoRedoStacks` already computes it.
- **`undo_redo.js`:** on `stack-item-added`, store `ts: Date.now()` in the
  item's `meta`, next to its label. Export `peekUndoTs()` and `peekRedoTs()`.
- **`App.undo`:** gather the candidates (each op layer's target `ts`, plus
  `peekUndoTs()`), act on the one with the highest `ts`, and toast "Nothing
  to undo" if there are none. **`App.redo`** does the same for redo.
- **Delete `_lastActionScope`**, `setLastActionScope`, and every assignment
  to them.

This fixes an interleaving bug in today's dispatch, found by reading
`App.undo` (not tested). After toy₁, draw₁, toy₂, draw₂, the first Undo
correctly reverses draw₂. But the second reverses draw₁ instead of toy₂,
because `_lastActionScope` keeps pointing at drawing.

Undoing other users' actions is out of scope here. So are the `undoes`
reference on undo ops and walking an author's own chain of ops. Those
belong to the step that unifies undo.

## Docs (`src/CONCURRENCY_AND_BRANCHING.md`)

- **§1.1:** the drawing layer is an op layer. Only the boundaries and
  positions layer is still on Yjs.
- **§7.1:** `UndoManager` handles only boundaries. Undo picks across
  layers by the author's own `ts`.
- **§2.2:** add the one-line carve-out. `ts` is never used to merge or
  decide authority, but it does order one author's own actions for undo.

## Tests

**Source-driven rewrites.** `tests/unit/drawing.test.js`,
`drawing-rotate-mode.integration.test.js` and the drawing half of
`pure-mirror.test.js` test the Yjs fragment. Rewrite them against the DOM
and the LayerAPI. The pure geometry tests stay as they are.
`storage.test.js`'s drawing cases follow the new import path.
`undo-redo.test.js` (UndoManager) keeps testing boundaries.

**New:**
1. **Live equals replay for drawing**, modelled on
   `toys-projection-mirror.test.js`. Run draw, move, resize, rotate, pivot,
   edit, duplicate (batch), delete (batch), then `projectFrom` into a fresh
   layer. It must be identical to the live layer.
2. **Convergence**, using the `concurrent-convergence.test.js` harness on
   the drawing layer:
   - two peers drawing different shapes concurrently → rebuilt, converged
   - two peers moving different shapes → converged
   - two peers moving the **same** shape → conflict
3. **Independence.** A drawing gesture changes nothing in toys' maps or
   tips, and the reverse.
4. **Undo order.** Interleave toy₁, draw₁, bound₁, toy₂, draw₂. Five
   Undo presses reverse draw₂, toy₂, bound₁, draw₁, toy₁ in that order. Then
   Redo walks them forward again.

**e2e:**
- Add to `sync.spec.js`: a rect drawn on peer A appears on peer B, and a
  move on A reaches B.
- Add to `undo-redo.spec.js`: the interleaved order from test 4, using the
  real Undo button. The existing "a toy action then a drawing action" case
  must still pass.

```bash
npx vitest run tests/unit/drawing.test.js tests/unit/concurrent-convergence.test.js tests/unit/op-layers.test.js
npx vitest run          # full suite once, before presenting
bin/test_e2e.sandbox.sh # all specs, once, at the end
```

## Suggested commits (each green)

1. Register `DRAWING_LAYER`. Add the DOM write functions and the LayerAPI
   on gestures, and rewrite the drawing unit tests. `app.js` still on the old
   path behind the new API.
2. Wire `app.js` to the new LayerAPI, the batch gestures and the panel
   refresh. Remove `_yDrawing` and its observers. Import and export.
3. Undo across layers by `ts`, with `undoCandidate` and `peekUndoTs`.
   Remove `_lastActionScope`.
4. Docs.

## Done when

- `grep -n "_yDrawing\|getXmlFragment('drawing')\|_lastActionScope" src/`
  finds nothing.
- Drawing ops live in `ops:drawing`, and live equals replay for drawing.
- The undo-order test passes, along with the full unit suite and every e2e
  spec.
