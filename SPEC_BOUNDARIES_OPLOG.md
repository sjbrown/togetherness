# Move the boundaries and positions layer onto the op log, and delete UndoManager

A self-contained task spec. Read these first:
- `CLAUDE.md`
- `src/CONCURRENCY_AND_BRANCHING.md`, all of it
- `src/op_layers.js` and `src/op_layer.js`
- the drawing layer as the model to copy: `DRAWING_LAYER` and the `*Dom` /
  `*Batch` functions in `src/drawing.js`, plus how `app.js` uses them.
  Drawing went through exactly this migration in #170.

This task explicitly authorizes changes to:
- `src/boun_pos.js`, `src/app.js`, `src/storage.js`, `src/overlay.js` (only
  where it calls into `boun_pos`)
- deleting `src/undo_redo.js`
- `src/CONCURRENCY_AND_BRANCHING.md`
- the tests listed below

## Decisions already made

- **Boundaries become the third op layer**, with one DAG per layer.
- **No migration.** Existing alpha tables lose their boundaries: the old
  `boundaries` Y.XmlFragment is no longer read. Leave it in the document
  untouched.
- **Concurrent same-attribute writes are a conflict** (§5.1). Two people
  moving the same position set at once write its `transform` concurrently,
  which brings up the branch dialog. That's intended.
- **Choosing which layer to undo** uses the author's own `ts`.
- **After this task nothing uses `Y.UndoManager`**, so `undo_redo.js` is
  deleted. Out of scope: the `undoes` reference on undo ops, walking an
  author's own chain of ops, and undoing other users' actions. Those belong
  to the undo-unification step.

## The layer

Define `BOUNDARIES_LAYER` in `boun_pos.js` with `defineOpLayer`, following
`DRAWING_LAYER`:
- `name: 'boundaries'`
- `selector: '#boundaries-positions-layer'`
- `layerDataId: 'tt-layer-boundaries'`
- `opsKey: 'ops:boundaries'`, `contentKey: 'checkpointContent:boundaries'`
- `headKey`: `tt_head_boundaries_${tableId}`, `mergeKey`:
  `tt_head_merge_boundaries_${tableId}`
- **No hooks.**

The rendered elements keep `data-module="boun_pos"`, and the `_Layers` key
stays `'boun_pos'`. Only the op layer's `name` is `'boundaries'`. Say so in
a comment where `BOUNDARIES_LAYER` is defined, so nobody "fixes" the
mismatch.

## Writes become gestures on the DOM

Every write in `boun_pos.js` that takes `(ydoc, yEl)` or `(ydoc, yBounPos)`
becomes a DOM operation on the live element. `makeLayerAPI` wraps each one in
`OpLayer.runGesture(ydoc, BOUNDARIES_LAYER, layerEl, fn, { gesture, authorId, tableId })`.

| Today (Yjs) | After (DOM, inside a gesture) | gesture |
|---|---|---|
| boundary `create`, `_createPositionSet` | build the `<g>` in local coordinates with `translate(x, y)` (the #169 layout), plus `id`, `data-id`, `data-module`, the path, the label text and the circles; then append | `add` |
| `deleteEl` | remove the element | `delete` |
| `applyMoveCommit` | set the group's `transform`. **One attribute** (#169) | `move` |
| `applyResize` | set the `transform` and regenerate the path and circles in local coordinates (`rebuildPositionSetGrid`, now on the DOM) | `resize` |
| `editEl` / `editBounPos` / `applyTtState` | set attributes. A label rename changes the `<text>`'s text node. A grid-parameter change regenerates the circles | `edit` |

- **`setYTextContent`** becomes a DOM text change: set `textContent`, or the
  text node's `data`. The envelope records it as a `text` mutation.
- **`makeLayerAPI(ydoc, getLayerEl, user, tableId, isCreator)`** follows the
  drawing signature. `find()` returns the live `<g>`.
- **`render`** becomes `OpLayer.projectLayer(ydoc, BOUNDARIES_LAYER, …)`.
- **Delete** the Yjs-side code with no remaining callers: `mirrorBounPos`,
  `_toSVGEl`, `_positionSetToSVGEl`, `findEl`/`find` on the fragment,
  `yChildByTag`, `setYTextContent`, the `yBounPos` parameters, and the
  `Y` import, if nothing still needs it. Keep the pure geometry and
  grid-generation functions. `translationOf` already handles DOM elements.

**Readers move from the fragment to the layer element.**
- `computeBoundaryRects(layerEl, toyClasses, anchor)`,
  `getSnapPoints(layerEl)` and `layerData(layerEl)` read the live DOM, still
  through `translationOf`, so the results stay in world coordinates.
- `app.js` passes `_svgEl.querySelector('#boundaries-positions-layer')` at
  the drag call sites (around lines 1428 and 1867 on master) and wherever the
  layer panel reads boundary data.

**Multi-select actions are one gesture each.** Add `deleteBoundariesBatch`
and `moveBoundariesBatch`, following `deleteDrawingsBatch` and
`moveDrawingsBatch`. In `app.js`:
- `deleteMultiSelected` stops wrapping boundaries in `ydoc.transact`.
- Multi-move uses the batch.
- `commitBounPos` goes through the LayerAPI.

**Remote changes and the layer panel.**
- Remove `onBounPosChanged`, and the boundaries `onDocChanged` observer.
  `onOpsChanged(layer, …)` logs remote gestures.
- `UI.refreshFromDoc()` runs after local and remote boundaries ops, as it
  now does for drawing.

**Import and export.**
- `storage.populateFromSvgDoc` parses boundary children into a scratch
  layer. `ensureIdentity` already stamps them. Then:
  - **As a new table:** a boundaries genesis checkpoint.
  - **Into a live table:** one `import` gesture, the way drawing does it.
- Imported old-layout elements (absolute children, no transform) are
  valid as they are (#169). Don't normalize them.
- `buildExportSvg` already clones the live layer. Strip `data-tt-head` and
  `data-op-layer` from the boundaries clone, as for the other op layers.

## Delete UndoManager

- **Delete `src/undo_redo.js`** and its import.
- **`App.undo` / `App.redo`:** drop the `UndoRedo.peekUndoTs()` /
  `peekRedoTs()` candidates. The candidates are now just the op layers'
  `undoCandidate` / `redoCandidate`, chosen by highest `ts`. Drop the
  `UndoRedo.canUndo()` / `canRedo()` terms from `canUndo` / `canRedo`.
- **Remove every `UndoRedo.tag(...)` call.** History and toast labels for
  boundaries come from the op's gesture, through the same describe helper
  the op layers use (`describeToyGesture` in `app.js`). Rename that helper
  to something layer-neutral while you're there.
- **Delete `tests/unit/undo-redo.test.js`.** It tests `UndoManager`. Move
  any case that tests *app* behaviour, as opposed to `UndoManager` itself,
  into `undo-across-layers.test.js` first.

## Docs (`src/CONCURRENCY_AND_BRANCHING.md`)

- **§1.1:** every canvas layer is now an op layer. Rewrite the section,
  renaming it if needed, to say what stays plain Yjs state:
  - `meta`
  - `joinSequence`
  - `playerOptions`
  - the hoisted-scripts fragment

  None of those are op layers. Yjs is transport for everything else.
- **§7.1:** remove `UndoManager`. Undo is op layers only, chosen across
  layers by the author's own `ts`.

## Tests

**Source-driven rewrites.**
- `tests/unit/boun_pos.test.js`, `boun_pos_resize.test.js` and the
  boundaries half of `pure-mirror.test.js` test the Yjs fragment. Rewrite
  them against the DOM and the LayerAPI.
- `toy-position-snap.test.js` passes a layer element to `getSnapPoints` /
  `computeBoundaryRects`.
- `undo-across-layers.test.js`: boundaries are now an op-layer candidate.
- Grep `tests/` for `getXmlFragment('boundaries')`, `UndoRedo` and
  `undo_redo` and update every hit.

**New:**
1. **Live equals replay for boundaries**, modelled on the drawing version:
   - add a boundary and a square and a hex position set
   - move, resize, rename, change the grid parameters
   - delete and move as batches
   - then `projectFrom` into a fresh layer: identical to the live layer
2. **A move is one mutation.** The op for moving a 121-circle position set
   has exactly one `attr` mutation, on `transform`. Log its serialized size.
3. **Convergence**, using the harness:
   - two peers adding different boundaries → converged
   - two peers moving the same position set → conflict
4. **Undo order across all three layers.** Interleave toy₁, draw₁, bound₁,
   toy₂, bound₂. Undo reverses them newest first. Redo walks them forward.
5. **Snapping after a move.** A toy dragged near a moved position set snaps
   to the moved circles, read from the DOM layer.

**e2e:** `boundary-drag.spec.js` and `undo-redo.spec.js` pass. Add to
`sync.spec.js`: a boundary drawn on peer A appears on peer B, and a position
set moved on A lands at the same place on B.

```bash
npx vitest run tests/unit/boun_pos.test.js tests/unit/toy-position-snap.test.js tests/unit/undo-across-layers.test.js
npx vitest run          # full suite once, before presenting
bin/test_e2e.sandbox.sh # all specs, once, at the end
```

## Suggested commits (each green)

1. Register `BOUNDARIES_LAYER`. Add the DOM write functions, the readers on
   `layerEl`, the LayerAPI on gestures and the batches, and rewrite the
   boundaries unit tests.
2. Wire `app.js`: call sites, readers at the drag sites, panel refresh.
   Remove `_yBounPos` and its observers. Import and export.
3. Delete `undo_redo.js` and the `UndoRedo` paths, and use one
   gesture-label helper.
4. Docs.

## Done when

- `grep -rn "_yBounPos\|getXmlFragment('boundaries')\|UndoManager\|undo_redo\|UndoRedo" src/`
  finds nothing.
- `boun_pos.js` no longer imports `yjs`, unless a pure function genuinely
  needs it. If it does, say why.
- Boundary ops live in `ops:boundaries`, and live equals replay for
  boundaries.
- A position-set move is a single `transform` mutation.
- The undo-order test passes, along with the full unit suite and every e2e
  spec.
