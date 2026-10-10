# Audit: the three op layers, and the code around them

Audited master @ 90c73e9: 1,762 unit tests and 45 e2e specs pass. Line
numbers refer to that commit.

Each finding is tagged:
- **Unjustified**: a difference with no reason in the code or the design doc.
  Fix it.
- **Justified**: real toy, drawing or boundary semantics. Leave it.
- **Decision**: the owner's call.

---

## 1. The LayerAPIs don't line up

Each module's `makeLayerAPI` (`toys.js:2099`, `drawing.js:898`,
`boun_pos.js:1020`) is a hand-written copy of the same pattern.

| | toys | drawing | boun_pos |
|---|---|---|---|
| `add` | — | ✓ (returns el) | ✓ (returns el) |
| `delete` returns | `{ op }` (gesture result) | boolean | boolean |
| `applyTtState` | — | ✓ | ✓ |
| `previewResize` | — (logic sits inside `overlay.js`) | ✓ | ✓ |
| `getTtState` maps to | `getTtStateDom` | `getTtState` | `getTtState` |
| gesture helper | `(name, fn, extraOpts)` | `(name, fn)` | `(name, fn)` |
| `render`, `receive` | identical in all three | | |

- **Unjustified:** the different `delete` return types, toys having no
  `add`/`applyTtState`/`previewResize`, and the `getTtState` naming
  inversion (see §6).
- **Justified:** drawing alone has pivot (`applyPivot`, `getPivot`,
  `computePivot`, `pivotShift`, `previewPivot`). Boundaries have no rotation.
- **Dead in practice:** `receive`. `app.js:804` calls
  `OpLayer.receiveLayerOp` directly. The LayerAPI `receive` methods, and the
  three wrappers `receiveToyOp`, `receiveDrawingOp` and `receiveBounPosOp`,
  are only called from tests.
- **Formatting bug:** `toys.js:2099` has `{  const layer = …` on the same line
  as the function signature.

**Proposal.** A generic `makeOpLayerAPI(layer, ydoc, getLayerEl, user, tableId, isCreator, primitives)`
in `op_layer.js` supplies:
- `find`, `render`, `receive`
- the gesture helper
- `deleteMany`, `moveMany`, `importMany` (§2)
- the uniform return types

Each layer passes only its per-element primitives (find/add/delete/move/
resize/edit/preview/state) and its extras (pivot, rotation). The three
`makeLayerAPI`s shrink to a table of primitives.

## 2. Batch and import functions exist three times over

- `deleteToysBatch` (`toys.js:2052`), `deleteDrawingsBatch` (`drawing.js:809`)
  and `deleteBoundariesBatch` (`boun_pos.js:964`) are line-for-line the same,
  apart from the delete primitive.
- `move*Batch` is the same story. The one real difference: toys call
  `promoteZOrder` per element. That's justified, and it belongs in the toys
  move primitive, not in a separate batch function.
- `importToys`, `importDrawings` and `importBoundaries`: the drawing and
  boundaries versions are identical (re-id on collision, append).

`app.js` then branches on the layer three times to call them:

| Where | Branches |
|---|---|
| `deleteMultiSelected` (`app.js:1074–1086`) | if/else over toys, drawing, boun_pos |
| `commitMultiMove` (`app.js:1910–1919`) | same |
| `importSVG` (`app.js:2076–2090`) | same |

**Proposal.** Generic `deleteMany`/`moveMany`/`importMany` in `op_layer.js`,
built on the primitives. The three call sites each become one line, e.g.
`_Layers[mtype].deleteMany(ids)`.

`duplicateDrawingsBatch` is drawing-only, and so is the UI
(`ui.js:206`, `canDuplicate = data.ltype === 'drawing'`).
- **Decision:** should toys and boundaries be duplicable?
- **Unjustified either way:** `duplicateMultiSelected` (`app.js:1099`)
  hard-codes `#drawing-layer` without checking the selection's layer. It's
  unreachable today only because the UI hides the button.

## 3. Layer descriptors repeat what their names already say

Five of the seven descriptor fields are derived from `name` in exactly the
same way for all three layers:
- `layerDataId: 'tt-layer-<name>'`
- `opsKey: 'ops:<name>'`
- `contentKey: 'checkpointContent:<name>'`
- `headKey`
- `mergeKey`

**Proposal:** `defineOpLayer({ name, selector, hooks })` derives the other
five. An explicit override remains possible, but nothing needs one.

## 4. Each layer has up to three names (decision)

| Concept | toys | drawing | boundaries |
|---|---|---|---|
| UI layer id (`_layerMeta`, panel, visibility) | `toys` | `drawing` | `boundaries-positions` |
| `data-module` / `_Layers` key / `ltype` | `toys` | `drawing` | `boun_pos` |
| op layer `name` | `toys` | `drawing` | `boundaries` |

Two hand-kept tables translate between them:
- `LAYER_ID_TO_MODULE` (`app.js:864`)
- `LAYER_TYPE` (`canvas.js:158`), whose comment still cites the deleted
  `_toSVGEl` functions

**Decision:** pick one name per layer and use it for all three roles. The
tables then disappear, and `_Layers` can be keyed by the op layer.
Renaming `data-module` changes stored markup. Under the no-migration
policy, that only affects alpha tables.

## 5. `app.js` repeats itself per layer, and `overlay.js` reaches past the bus

**`app.js`:**
- **Three identical render functions:** `renderBounPosLayer`,
  `renderToysLayer` and `renderDrawingLayer` (`app.js:642–661`). Replace
  them with one loop over `opLayers()`.
- **Hard-coded layer lookups:** 25 copies of
  `_svgEl.querySelector('#…-layer')` in `app.js`, although
  `layerElOf(layer)` already exists (`app.js:663`).
- **`applyLayerVisibility`** (`app.js:633`) builds selectors by string
  convention (`#${id}-layer`) instead of reading them from the descriptor.

**`overlay.js`:**
- The `app.js` header says it's "the only module that imports from all
  others". But `overlay.js:71–78` imports from `toys.js`, `boun_pos.js` and
  `drawing.js` directly.
- `updateResizeGhost` (`overlay.js:527–553`) branches on `data-module`,
  with the toys resize preview written inline.

**Proposal:** each LayerAPI has `previewResize` (toys gains one by moving
that inline block), and the overlay calls it through the App bus.

**Justified, leave as is:** toy-only behaviour in `app.js`:
- drop targets and reparenting (`app.js:1445–1490`)
- toy classes used to constrain drags inside boundaries (`app.js:564`,
  `1373`)
- toy menus (`app.js:1209`)
- snap points read from boundaries during a toy drag

These are toy semantics, not leftovers.

## 6. Rotation is implemented twice

`toys.js:1102–1145` and `drawing.js:190–330` implement the same model:
`data-rotate`, a centre, and a `rotate(deg cx cy)` transform. They differ in
three ways:
- **Signatures:** `rotationCenter(domEl, geom)` in toys, but
  `rotationCenter(geom, pivot)` in drawing. The drawing LayerAPI papers over
  this with a lambda.
- **Formatting:** toys builds the transform string inline, while drawing
  has `rotationTransform`.
- **The overlay** uses *drawing's* `resolveRotation` for every ghost,
  including toys (`overlay.js:75`, `573`, `589`).

**Proposal.** Shared rotation helpers in `geometry.js` (or a small
`rotation.js`) where the pivot is optional:
- toys always use the centre
- drawing reads `data-pivot-x/y`

## 7. Naming left over from the Yjs era

The `Dom` suffix used to distinguish DOM functions from their Yjs twins. The
twins are gone, and the three layers now name things three different ways:

| | toys | drawing | boun_pos |
|---|---|---|---|
| find | `findToyDom` | `findDrawingDom` | `findEl` (+ unused alias `find`, `boun_pos.js:504`) |
| delete | `deleteToyDom` | `deleteDrawingDom` | `deleteEl` |
| move primitive | `applyMoveDom` | `applyMoveDom` | `applyMoveCommit`: **the same name as the LayerAPI method that wraps it in a gesture** |
| list | `toysDataDom` | `drawingsData` | `layerData` |
| state | `getTtStateDom` | `getTtState` | `getTtState` |

**Proposal:** one naming scheme across all three, with no `Dom` suffix.
This would naturally come with §1, since the primitives table would name
them anyway.

## 8. Dead code

| What | Where | Used by |
|---|---|---|
| `getTtState(yToy)`, the Yjs version | `toys.js:1494` | nothing. The LayerAPI maps `getTtState` to `getTtStateDom` |
| `domToY` | `storage.js:62`, plus `import * as Y` | its own tests only |
| `addBoundary`, `createPositionSetElement`, `addPositionSet` ("convenience wrappers — kept for call sites") | `boun_pos.js:460–486` | tests only |
| `find` alias | `boun_pos.js:504` | nothing |
| `receiveToyOp` / `receiveDrawingOp` / `receiveBounPosOp` and LayerAPI `receive` | per module | tests only |
| `undoToyGesture`, `redoToyGesture`, `canUndoToyGesture`, `canRedoToyGesture` | `toys.js:1924–1931` | tests only |
| `RESIZE_CORNER_NE`, `RESIZE_CORNER_SW` | `toys.js` | defined, never referenced |

**Not dead, but mislabelled:** `App.commitBoundary`/`commitPositionSet`
(`app.js:1146`) are called by `canvas.js:678–689`. They aren't "legacy
aliases kept for e2e tests". Reword the comment.

## 9. Stale comments

Each of these describes code or a mechanism that no longer exists. Grouped
by file:

- **`toys.js:1–23`, the module header.** It says the data model is "a
  Y.XmlFragment of Y.XmlElement" and draws a `yToys` tree. Wrong since the op
  log.
- **`toys.js`, smaller ones:**
  - `663–669`: refers to an "outer ydoc.transact()" and "the old pure-Yjs"
    behaviour
  - `1181`, `1222`: "no Yjs write"
  - `1297`: "rather than the Yjs tree"
  - `1463`: "part of the Yjs tree"
  - `1755`: the section header "no Yjs until the final commit"
- **`ydoc.transact` wrappers justified by a deleted file.**
  `toys.js:1954–1979` (`invokeMenuAction`, `initializeToy`) and
  `app.js:1478` (reparent) wrap `runGesture` in `ydoc.transact`, and the
  comments cite "undo_redo.js's Atomicity note". That file and
  `UndoManager` are gone, so the wrappers have no stated purpose. Either
  remove them and confirm the tests stay green, or rewrite the comment with
  a reason that still holds.
- **`app.js`:**
  - `69`, `73`: "the Yjs fragments exist"; "toys.js's applyTtState was dead
    code — removed"
  - `787`: "the old Yjs-observer version"
  - `1216`: "to Yjs as a single transaction"
  - `1282–1284`: about transaction origins
  - `1359–1360`, `1792–1793`: "writes … to Yjs", "no Yjs write"
  - `1512`: "observeDeep fires and calls renderDoc()"
- **`overlay.js:491`, `615`:** "innerHTML rebuild fired by any peer's Yjs
  transaction". Layers aren't rebuilt by `innerHTML` any more. Rebuilds are
  projections.
- **`ui.js:561–572`:** "App.commitEdit writes to the live Yjs doc".
- **`storage.js:2`, `16`, `57–80`, `245`:** the headers "DOM ⇄ Yjs",
  "DOM → Yjs", "Yjs → DOM (export)". The export section clones the live DOM.
- **`canvas.js:157`:** cites `shapes._toSVGEl` / `toys._toSVGEl`.
- **Plan references** (`CLAUDE.md` forbids these):
  - `envelope.js:10`: "REVISION_PLAN.md Phase C"
  - the test name at `toys-layer-api.test.js:214`: "(REVISION_PLAN.md C5)"
- **Retention excuses that aren't true:**
  - `op_checkpoint.js:267`: "kept for the fork seed and existing callers"
  - `boun_pos.js:460`: see §8

## 10. Module structure and function order

`drawing.js` and `boun_pos.js` already follow nearly the same outline:
1. registry
2. element operations
3. geometry
4. ttState
5. "The layer"
6. batch gestures
7. `makeLayerAPI`

`boun_pos` adds an "Elevated layer API" block (the dead wrappers in §8) and
"Drag context helpers". The latter is justified: boundaries are what toys
are constrained by.

`toys.js` (2,141 lines) doesn't follow that outline:
- `TOYS_LAYER` sits at line 1895, between the cascade section and
  "lifecycle", with no "The layer" header.
- The registry (`TOOLS`, `TOY_TYPES`) is at 1311, mid-file.
- The batch functions sit under "lifecycle".
- Roughly 600 lines are the toy *behaviour contract*: hoisting scripts,
  activation, menus, cascades. That's a different concern from the layer.

**Decision.** `CLAUDE.md` forbids reordering functions inside a file that's
being edited. So any reorder has to be its own **move-only commit**. Options:
- (a) Leave `toys.js` as it is.
- (b) One move-only commit that puts `toys.js` in the shared outline.
- (c) Split the behaviour contract into `toy_scripts.js` (move only), then
  apply (b) to what's left.

If §1 lands first, (b) and (c) get easier, because most of the layer
plumbing has moved to `op_layer.js`.

## 11. Tests that still treat a layer as special

1. **Three "live equals replay" files:**
   - `toys-projection-mirror.test.js`
   - `drawing-projection-mirror.test.js`
   - `boun_pos-projection-mirror.test.js`

   They're one test with three gesture scripts. Make it a single
   table-driven file.
2. **Convergence is repeated per layer.**
   `concurrent-convergence.test.js` has a toys section (`:149`), then
   drawing (`:524`) and boundaries (`:702`). They repeat the same generic
   cases: different elements merge, the same attribute conflicts. Drive the
   generic cases from a table of layers with `{ add, move }` fixtures. Keep
   the layer-specific cases (toy z-order promotion, the single
   position-set `transform` mutation) as they are.
3. **Generic op-layer behaviour is tested only through toys.**
   `toys-layer-api.test.js` covers, via the toy wrappers:
   - `projectLayer`, plus creator vs joiner (`:269–480`)
   - conflict resolution, adopt and fork seed (`:482–700`)
   - undo/redo and `canUndo` (`:700–987`)

   That's all `op_layer.js` behaviour. Move it into `op_layer` tests and run
   it over all three layers (or the synthetic `scratch` layer). Then delete
   the toy undo wrappers from §8. Parts of the undo block overlap
   `undo-across-layers.test.js` and `op-dag.test.js`. Deduplicate while
   moving.
4. **Batch tests three times** (toys `:889`, drawing `:288`, boundaries
   inline). Once §2 lands they become one table-driven test.
5. **`op-layer-independence.test.js` duplicates `op-layers.test.js`**
   ("gestures stay in their own layer"). Merge them.
6. **`pure-mirror.test.js`** was written to prove each renderer mirrored the
   Yjs tree. That subject is gone. What's left asserts that writers set only
   schema attributes, for drawing and boundaries but not toys. Fold it into
   the table-driven mirror test, or rename it after what it now checks.
7. **`storage.test.js` tests `domToY`**, which is dead code (§8).

## Suggested order

Each step is independently landable and keeps tests green:

1. **Remove dead code (§8) and sweep stale comments (§9).** Includes
   deciding about the `ydoc.transact` wrappers. No behaviour change.
2. **The shared LayerAPI base, plus generic batches and import (§1, §2),
   plus the descriptor derivation (§3).** Collapse the `app.js` if-chains
   and render functions, and use `layerElOf` everywhere (§5, `app.js` part).
   Rename the primitives in the process (§7).
3. **Overlay through the bus, with a toys `previewResize`, and the shared
   rotation helpers (§5 overlay part, §6).**
4. **Unify the tests (§11).** Best done right after step 2, when every
   layer has the same API.
5. **Decisions:** one name per layer (§4), the `toys.js` structure (§10),
   and whether toys and boundaries can be duplicated (§2).
