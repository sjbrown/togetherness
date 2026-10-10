# Audit: the three op layers, and the code around them

Audited master @ 90c73e9: 1,762 unit tests and 45 e2e specs pass. Line
numbers refer to that commit. The owner's decisions on the first draft are
folded in.

Each finding is tagged:
- **Fix**: agreed, do it.
- **Decided**: the owner chose; the decision is recorded here.
- **Leave**: reviewed, and stays as it is.

---

## 1. The LayerAPIs don't line up (Fix)

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

- **Fix:** the different `delete` return types, toys having no
  `add`/`applyTtState`, and the `getTtState` naming inversion (§7).
- **Leave:** drawing alone has pivot (`applyPivot`, `getPivot`,
  `computePivot`, `pivotShift`, `previewPivot`). Boundaries have no rotation.
- **Dead in practice:** `receive`. `app.js:804` calls
  `OpLayer.receiveLayerOp` directly. The LayerAPI `receive` methods, and the
  three wrappers `receiveToyOp`, `receiveDrawingOp` and `receiveBounPosOp`,
  are only called from tests.
- **Formatting bug:** `toys.js:2099` has `{  const layer = …` on the same line
  as the function signature.

**Fix.** A generic
`makeOpLayerAPI(layer, ydoc, getLayerEl, user, tableId, isCreator, primitives)`
in `op_layer.js` supplies:
- `find`, `render`, `receive`
- the gesture helper
- `deleteMany`, `moveMany`, `importMany` (§2)
- the uniform return types

Each layer passes only its per-element primitives (find/add/delete/move/
resize/edit/preview/state) and its extras (pivot, rotation). The three
`makeLayerAPI`s shrink to a table of primitives.

## 2. Batch and import functions exist three times over (Fix)

- `deleteToysBatch` (`toys.js:2052`), `deleteDrawingsBatch` (`drawing.js:809`)
  and `deleteBoundariesBatch` (`boun_pos.js:964`) are line-for-line the same,
  apart from the delete primitive.
- `move*Batch` is the same story.
- `importToys`, `importDrawings` and `importBoundaries`: the drawing and
  boundaries versions are identical (re-id on collision, append).

`app.js` then branches on the layer three times to call them:

| Where | Branches |
|---|---|
| `deleteMultiSelected` (`app.js:1074–1086`) | if/else over toys, drawing, boun_pos |
| `commitMultiMove` (`app.js:1910–1919`) | same |
| `importSVG` (`app.js:2076–2090`) | same |

**Fix.** Generic `deleteMany`/`moveMany`/`importMany` in `op_layer.js`,
built on the primitives. The three call sites each become one line, e.g.
`_Layers[mtype].deleteMany(ids)`.

### 2a. Bringing a moved element to the front is the standard move (Decided)

Toys call `promoteZOrder` on every move. **Decided:** every layer's move
does the same. The generic move brings the element to the top of its layer.
- **Toys keep their extension:** whatever is stacked on the toy's
  `tt_positions` comes along too.
- **Visible change:** a moved drawing shape or boundary now lands on top of
  its siblings.

**Measured cost.** Moving an element to the front is a remove plus a re-add
under the layer. The wire format (§3 of the design doc) carries the full
serialized subtree for both. Probe on a `<g>` with 121 circles, the size of
a big position set:

| Gesture | Wire size |
|---|---|
| move as one `transform` change (today, #169) | 107 B |
| move + bring to front | 19,173 B |
| bring to front when the element is **already on top** | 19,055 B |

Two consequences:
- **Toys pay this on every move today**, roughly twice the toy's markup per
  move op. The average toy SVG is 12.6 KB. This also adds directly to what
  the 10-minute retention window holds.
- **Adopting it for boundaries** turns #169's one-attribute move back into
  a full-subtree op. The #169 test "a position-set move is a single
  `transform` mutation" would need to change.

**Fix, cheap, with the decision:** skip the re-append when the element is
already the layer's last child. Today an `appendChild` of the last child
still records a remove plus an add. Repeated moves of the same element then
cost one attribute, as before.

**Decision needed for the rest.** A move that really changes the order
still ships the whole subtree twice. §3 of the design doc defers
"distilling" the wire format "until performance or correctness demands
it", and this is a number for that. One option fits the rule that the wire
format "does not infer moves": when the same node id appears in both
`removed` and `added` within **one** `child` entry, serialize its subtree
once and reference it from the other side. `apply` already reuses a node it
has detached by id. Whether to do it, and when, is the owner's call.

### 2b. Duplicate is single drawing shapes only (Decided)

**Decided:** remove multi-select duplicate. Duplicate stays a
single-selection action for drawing shapes.
- Delete `App.duplicateMultiSelected` (`app.js:1096–1111`), and the
  multi-selection branch in `UI.duplicateSelected` (`ui.js:1385–1388`).
- `duplicateDrawingsBatch` becomes the single-shape primitive the drawing
  LayerAPI exposes, e.g. `duplicate(el)`, as one gesture.
- That removes the multi-select path that hard-coded `#drawing-layer`
  (`app.js:1099`).

## 3. Layer descriptors repeat what their names already say (Fix)

Five of the seven descriptor fields are derived from `name` in exactly the
same way for all three layers:
- `layerDataId: 'tt-layer-<name>'`
- `opsKey: 'ops:<name>'`
- `contentKey: 'checkpointContent:<name>'`
- `headKey`
- `mergeKey`

**Fix:** `defineOpLayer({ name, selector, hooks })` derives the other five.
An explicit override remains possible, but nothing needs one.

## 4. One name per layer: `boun_pos` (Decided)

| Concept | toys | drawing | boundaries |
|---|---|---|---|
| UI layer id (`_layerMeta`, panel, visibility) | `toys` | `drawing` | `boundaries-positions` → **`boun_pos`** |
| `data-module` / `_Layers` key / `ltype` | `toys` | `drawing` | `boun_pos` |
| op layer `name` | `toys` | `drawing` | `boundaries` → **`boun_pos`** |

**Decided:** use `boun_pos` for all three roles. No migration.

What changes:
- **Two lookup tables go away:** `LAYER_ID_TO_MODULE` (`app.js:864`) and
  `LAYER_TYPE` (`canvas.js:158`), whose comment cites the deleted
  `_toSVGEl`. Everything is keyed by the one name.
- **Storage keys:** the op layer's `ops:boundaries`,
  `checkpointContent:boundaries` and `tt_head_*boundaries*` keys become
  `…boun_pos…`. Existing alpha tables lose their boundaries again.
- **Element id:** the layer element id `#boundaries-positions-layer`
  (`index.html`) becomes `#boun_pos-layer`, so the `${id}-layer` convention
  in `applyLayerVisibility` (`app.js:633`) holds for every layer. Change
  `index.html`, `ui.css`, `defs.js`'s scoped stylesheet selectors,
  `canvas.js:60`, `storage.js` (import selector) and the e2e selectors to
  match.
- **Persisted UI state:** localStorage keyed by the old UI id (layer
  visibility, the active layer, `layer-state-persists.spec.js`) resets
  once. That's accepted.
- **Display text** ("Boundaries and Positions") is a label, not an id.
  It stays.

## 5. `app.js` repeats itself per layer (Fix); `overlay.js` stays as it is (Leave)

**`app.js`, Fix:**
- **Three identical render functions:** `renderBounPosLayer`,
  `renderToysLayer` and `renderDrawingLayer` (`app.js:642–661`). Replace
  them with one loop over `opLayers()`.
- **Hard-coded layer lookups:** 25 copies of
  `_svgEl.querySelector('#…-layer')` in `app.js`, although
  `layerElOf(layer)` already exists (`app.js:663`).
- **`applyLayerVisibility`** (`app.js:633`) builds selectors by string
  convention (`#${id}-layer`). It reads them from the descriptor, or keeps
  the convention, which holds once §4 lands.

**`overlay.js`, Leave.** It imports `toys.js`, `boun_pos.js` and
`drawing.js` directly, and writes the toys resize preview inline
(`overlay.js:71–78`, `527–553`). The owner accepts that. It does mean the
"only module that imports from all others" sentence in the `app.js` header
is no longer true. Fix that sentence in the comment sweep (§9).

**Leave:** toy-only behaviour in `app.js`:
- drop targets and reparenting (`app.js:1445–1490`)
- toy classes used to constrain drags inside boundaries (`app.js:564`,
  `1373`)
- toy menus (`app.js:1209`)
- snap points read from boundaries during a toy drag

These are toy semantics, not leftovers.

## 6. Rotation is implemented twice (Fix, compatible with the different snap steps)

`toys.js:1102–1145` and `drawing.js:190–330` implement the same model:
`data-rotate`, a centre, and a `rotate(deg cx cy)` transform. They differ in
three ways:
- **Signatures:** `rotationCenter(domEl, geom)` in toys, but
  `rotationCenter(geom, pivot)` in drawing.
- **Formatting:** toys builds the transform string inline, while drawing has
  `rotationTransform`.
- **The overlay** uses drawing's `resolveRotation` for every ghost,
  including toys.

**Toys and drawing rotate by different amounts** (`ROTATE_SNAP_DEG` 45 and
15). That doesn't get in the way of unifying them:
- The snap step is already a per-layer parameter outside the rotation model:
  `_rotateSnapDegByLayer` (`app.js:339`), passed into `computeRotate` (it's
  even user-settable through `App.setRotateSnapDeg`).
- Neither `resolveRotation`, `rotationCenter` nor `syncRotation` looks at
  the step.

**Fix.** Shared rotation helpers in `geometry.js` (or a small
`rotation.js`) where the pivot is optional:
- toys use the fixed centre
- drawing reads `data-pivot-x/y`

Each layer keeps exporting its own `ROTATE_SNAP_DEG`, plus whatever decides
whether an element may rotate at all (`tt_able_rotate` for toys, the
`rotate` schema key for drawing).

## 7. Naming left over from the Yjs era (Fix)

The `Dom` suffix used to distinguish DOM functions from their Yjs twins. The
twins are gone, and the three layers now name things three different ways:

| | toys | drawing | boun_pos |
|---|---|---|---|
| find | `findToyDom` | `findDrawingDom` | `findEl` (+ unused alias `find`, `boun_pos.js:504`) |
| delete | `deleteToyDom` | `deleteDrawingDom` | `deleteEl` |
| move primitive | `applyMoveDom` | `applyMoveDom` | `applyMoveCommit`: **the same name as the LayerAPI method that wraps it in a gesture** |
| list | `toysDataDom` | `drawingsData` | `layerData` |
| state | `getTtStateDom` | `getTtState` | `getTtState` |

**Fix:** one naming scheme across all three, with no `Dom` suffix. This
comes naturally with §1, since the primitives table names them anyway.

## 8. Dead code (Fix)

| What | Where | Used by |
|---|---|---|
| `getTtState(yToy)`, the Yjs version | `toys.js:1494` | nothing. The LayerAPI maps `getTtState` to `getTtStateDom` |
| `domToY` | `storage.js:62`, plus `import * as Y` | its own tests only |
| `addBoundary`, `createPositionSetElement`, `addPositionSet` ("convenience wrappers — kept for call sites") | `boun_pos.js:460–486` | tests only |
| `find` alias | `boun_pos.js:504` | nothing |
| `receiveToyOp` / `receiveDrawingOp` / `receiveBounPosOp` and LayerAPI `receive` | per module | tests only |
| `RESIZE_CORNER_NE`, `RESIZE_CORNER_SW` | `toys.js` | defined, never referenced |
| `App.duplicateMultiSelected` and its UI branch | `app.js:1096`, `ui.js:1386` | removed by decision §2b |

**Keep:** `undoToyGesture`, `redoToyGesture`, `canUndoToyGesture`,
`canRedoToyGesture` (`toys.js:1924–1931`). Only tests use them, but the
toy-focused tests stay as they are (§11), and these are what they call.

**Not dead, but mislabelled:** `App.commitBoundary`/`commitPositionSet`
(`app.js:1146`) are called by `canvas.js:678–689`. They aren't "legacy
aliases kept for e2e tests". Reword the comment.

## 9. Stale comments (Fix)

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
  - the header claim that `app.js` is "the only module that imports from
    all others" (see §5)
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
- **`canvas.js:157`:** cites `shapes._toSVGEl` / `toys._toSVGEl`. Goes away
  with the table in §4.
- **Plan references** (`CLAUDE.md` forbids these):
  - `envelope.js:10`: "REVISION_PLAN.md Phase C"
  - the test name at `toys-layer-api.test.js:214`: "(REVISION_PLAN.md C5)"
- **Retention excuses that aren't true:**
  - `op_checkpoint.js:267`: "kept for the fork seed and existing callers"
  - `boun_pos.js:460`: see §8

## 10. Module structure and function order (Leave)

`drawing.js` and `boun_pos.js` already follow nearly the same outline:
1. registry
2. element operations
3. geometry
4. ttState
5. "The layer"
6. batch gestures
7. `makeLayerAPI`

`toys.js` doesn't:
- its layer definition sits mid-file (line 1895)
- its registry is at line 1311
- about 600 lines of toy behaviour contract (scripts, activation, menus,
  cascades) live in the same file

**Decided: leave it.** No reordering and no split.

## 11. Tests that still treat a layer as special

**Fix:**
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
   the layer-specific cases (toy stacks moving together, the boundaries move
   size) as they are.
3. **Batch tests three times** (toys `:889`, drawing `:288`, boundaries
   inline). Once §2 lands they become one table-driven test, including the
   new standard: a moved element ends up on top (§2a).
4. **`op-layer-independence.test.js` duplicates `op-layers.test.js`**
   ("gestures stay in their own layer"). Merge them.
5. **`pure-mirror.test.js`** was written to prove each renderer mirrored the
   Yjs tree. That subject is gone. What's left asserts that writers set only
   schema attributes, for drawing and boundaries. Fold it into the
   table-driven mirror test, or rename it after what it now checks.
6. **`storage.test.js` tests `domToY`**, which is dead code (§8).

**Leave:** `toys-layer-api.test.js` keeps covering generic op-layer
behaviour through toys: rebuilds, creator vs joiner, conflicts, adopt, fork
seed, undo/redo. Toys are the primary layer, and that's where this
behaviour matters most.

## Suggested order

Each step is independently landable and keeps tests green:

1. **Remove dead code (§8) and sweep stale comments (§9).** Includes
   deciding about the `ydoc.transact` wrappers and removing multi-select
   duplicate (§2b). No other behaviour change.
2. **Rename to one name per layer, `boun_pos` (§4).** It's mechanical and
   touches many files, so do it before the API work rather than in the
   middle of it.
3. **The shared LayerAPI base, plus generic batches and import (§1, §2),
   plus the descriptor derivation (§3).** Collapse the `app.js` if-chains
   and render functions, and use `layerElOf` everywhere (§5). Rename the
   primitives in the process (§7).
4. **Bring-to-front as the standard move (§2a)**, together with the
   already-on-top skip. Update the #169 single-mutation test to match. The
   wire-format compaction for moved subtrees is a separate decision.
5. **Shared rotation helpers (§6).**
6. **Unify the tests (§11)**, right after step 3, when every layer has the
   same API.
