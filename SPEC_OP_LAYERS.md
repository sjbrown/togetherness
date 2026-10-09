# Generalize the op machinery: one DAG per layer

A self-contained task spec. **This is a refactor: no behaviour changes.**
After it, the toys layer works exactly as it does today, but nothing in the op
machinery assumes "toys". A second op layer could be registered without
touching `op_*.js`.

Read first:
- `CLAUDE.md`
- `src/CONCURRENCY_AND_BRANCHING.md`, all of it

The drawing and boundaries layers stay on Yjs in this task. Migrating them
comes later and builds on this.

This task explicitly authorizes changes to:
- `src/op_*.js`, `src/envelope.js`, `src/toys.js`, `src/app.js`,
  `src/tables.js`, `src/storage.js`, `src/debug_panel.js`
- a new `src/op_layers.js` (registry) and a new `src/op_layer.js` (per-layer
  orchestration). Rename them if better names fit.
- their tests

## Decisions already made

- **One DAG per layer.** Each op layer has its own:
  - ops map and checkpoint content map
  - local tips (head plus merge tips)
  - checkpoints, prune root and first-sight record
  - conflict resolution

  An op never belongs to two layers. A gesture never spans two layers
  (invariant 5, generalized).
- **The toys layer keeps its existing storage keys**, so alpha tables keep
  their toys:
  - `ops` and `checkpointContent` in the Y.Doc
  - `tt_head_<tableId>` / `tt_head_merge_<tableId>` in localStorage
  - `data-id="tt-layer-toys"` on the layer element

  New layers use `ops:<name>`, `checkpointContent:<name>`,
  `tt_head_<name>_<tableId>`, `tt_head_merge_<name>_<tableId>` and
  `tt-layer-<name>`. These are data in the layer descriptor, not code
  branches.

## Where master stands (toys assumptions to remove)

| Where | Assumption |
|---|---|
| `op_dag.js` | `OPS_KEY = 'ops'`, `CONTENT_KEY = 'checkpointContent'`; `getOps(ydoc)`, `getContent(ydoc)`, `appendOp`, `appendCheckpoint` take only `ydoc` |
| `op_head.js` | keys are `tt_head_<tableId>`; every function takes only `tableId` |
| `op_prune.js` | `prune(ydoc, tips)` reads the single ops map; `noteAllSeen` is called once for "the" log |
| `op_wire_mutation.js` | imports `nodeRef`/`resolveRef` **from `toys.js`** (a generic module depending on a specific one) |
| `op_checkpoint.js` | imports and re-exports `ensureLayerId`/`LAYER_DATA_ID` from `toys.js` |
| `envelope.js` | `runInEnvelope` scopes to `closest('#toys-layer')`; `commitGesture` appends to the one ops map |
| `toys.js` | holds all layer-level orchestration, not just toy semantics: `runGesture` (generic envelope, commit and head, plus toy cascades), `ensureEnvelope`, `projectLayer`, `markProjectedAt`/`projectedAt`, `receiveToyOp`, `adoptToyBranch`, `resolveOrphanedTips`, `resolveToyBranchConflict`, `buildToyForkSeed`, `writeMergeCheckpointIfWarranted`, `pruneAfterCheckpoint`, undo/redo and `canUndo`/`canRedo` |
| `op_dag.js` | `toyUndoRedoStacks` is generic despite its name |
| `app.js` | one `getOps(_ydoc).observe(onOpsChanged)`; `onOpsChanged`, `maybeCheckpoint`, `maybeIdleCheckpoint`, `handleOrphanedLocalTips`, `handleToyBranchConflict` and the debug op dump are all hard-wired to `#toys-layer` and the one map |
| `tables.js` | `forkLiveDoc` seeds "the" ops map |
| `storage.js` | import genesis goes to "the" ops map |

## Target shape

**A layer descriptor, registered once** (`op_layers.js`):

```js
defineOpLayer({
  name: 'toys',
  selector: '#toys-layer',          // the layer element in index.html
  layerDataId: 'tt-layer-toys',
  opsKey: 'ops',
  contentKey: 'checkpointContent',
  headKey: (tableId) => `tt_head_${tableId}`,
  mergeKey: (tableId) => `tt_head_merge_${tableId}`,
  hooks: {
    // Extra capture after the gesture fn, inside the same op: the toys
    // contents_change / positions_change cascades. Returns more records.
    afterCapture: (records, layerEl, opts) => [...],
    // After any projection, rebuild or adopt: toy script activation.
    afterProject: (ydoc, layerEl) => {},
  },
})
```

`getOpLayer(name)` and `opLayers()` read the registry. Toys registers
itself from `toys.js` (or `app.js` at boot, whichever avoids an import
cycle). The hooks are the **only** place toy semantics enter the generic
code.

**Accessors take the layer explicitly. No default parameters.** Every call
site has to say which layer it means.
- `getOps(ydoc, layer)`, `getContent(ydoc, layer)`, `appendOp(ydoc, layer, op)`,
  `appendCheckpoint(ydoc, layer, op, content)`
- `op_head`: every function takes `(tableId, layer, …)`
- `op_prune`: `prune(ydoc, layer, tips, …)`, `noteAllSeen(ops)` per layer.
  Op ids are globally unique, so the first-sight map can stay one map.
- **Pure graph functions** (`ancestors`, `projectTips`, `receiveOp`,
  `conflicts`, …) already take map-likes. They don't change.

**Node identity is generic.**
- Move `nodeRef`/`resolveRef` out of `toys.js` into `op_wire_mutation.js`
  (or a small `op_node_ref.js`). `toys.js` imports them from there.
- `ensureLayerId(layerEl, layer)` stamps `layer.layerDataId` and a marker
  attribute, e.g. `data-op-layer="<name>"`.

**The envelope is per layer.**
- `runInEnvelope` scopes to `closest('[data-op-layer]')`, not
  `'#toys-layer'`.
- The envelope tracks which layer it's open on. A nested envelope on a
  **different** layer throws, since a gesture can't span layers.
- `commitGesture` takes the layer and appends to that layer's map.
- `isReplaying` / capture suppression stays global. That's correct across
  layers.

**Orchestration lives in a generic module** (`op_layer.js`). Move the
layer-level functions listed in the table out of `toys.js`. Each takes
`(ydoc, layer, layerEl, tableId, …)` and calls `layer.hooks` where toys
code used to be inline.
- `runGesture` becomes: envelope → `hooks.afterCapture` → commit → head.
- `ensureEnvelope` follows.
- `toys.js` keeps only toy semantics (cascades, scripts, handlers, toy DOM
  ops, `makeLayerAPI`). Its exported names that `app.js` and tests use can
  become thin wrappers that pass the toys layer. Remove a wrapper where
  callers can be updated cleanly instead.
- Rename `toyUndoRedoStacks` → `authorUndoRedoStacks`. Update its callers.
  No alias.

**`app.js` loops over op layers.**
- One ops observer per registered layer: `onOpsChanged(layer, evt, tx)`.
- Per-layer `maybeCheckpoint` / `maybeIdleCheckpoint`, orphan handling,
  conflict handling and merge-checkpoint writing.
- Undo/redo dispatch is unchanged in this task. Toys is the only op layer,
  so the drawing/boundaries `UndoManager` path stays as it is.
- The debug op dump includes the layer name and iterates over the layers.
- Trace events from the op machinery carry a `layer` field.

**Forks are per layer.**
- `forkLiveDoc(liveDoc, orderedIds, { layer, seed })` replaces only that
  layer's ops and content maps in the fork doc. Every other map, including
  other op layers' maps, is copied as today.
- `storage.populateFromSvgDoc` writes the import genesis to the toys layer.

## Commits (each green, each landable)

Keep moves and edits in **separate commits**, so the diff of a moved
function is empty apart from its imports. Never reorder functions within a
file (`CLAUDE.md`).

1. **Node identity out of toys.** Move `nodeRef`/`resolveRef`. Make
   `ensureLayerId` and the envelope scope generic (`data-op-layer`). Toys
   keeps `tt-layer-toys`.
2. **Registry and explicit-layer accessors.** Add `op_layers.js`, register
   toys with its legacy keys, and thread `layer` through `op_dag`,
   `op_head`, `op_prune`, `envelope`, `storage` and `tables`. Update callers
   and tests mechanically.
3. **Pure move.** Move the orchestration functions from `toys.js` into
   `op_layer.js`, unchanged apart from imports.
4. **Parameterize.** The orchestration takes a layer and calls the hooks.
   Toys provides `afterCapture` (its two cascades) and `afterProject`
   (`activateAllToyScriptsDom`). Rename `authorUndoRedoStacks`.
5. **`app.js` per-layer wiring**, the debug dump, trace `layer` fields, and
   the per-layer `forkLiveDoc`.
6. **Independence test** (below).
7. **Docs.** Make small, normative edits to
   `src/CONCURRENCY_AND_BRANCHING.md`:
   - **§1:** each op layer has its own DAG, local tips, checkpoints and
     pruning, and layers never share ops.
   - **§2.1:** "confined to the toys layer" becomes "confined to its layer".
   - **§2.3:** local tips are per layer.
   - **Invariant 5:** generalize to the gesture's own layer.

   Leave §1.1 and §7.1 alone. Drawing and boundaries are still on Yjs.

## Tests

**Existing tests pass with only mechanical changes:** the explicit `layer`
argument, and new import paths. If a test needs a *semantic* change, that's
a behaviour change. Stop and report it.

**New: `tests/unit/op-layers.test.js`.** Register a synthetic second layer
in the test, e.g. `name: 'scratch'`, a plain `<g>`, no hooks. Use it with
toys, both through the real `op_layer.js` functions:
1. A gesture on each layer lands only in that layer's ops map. Each
   layer's local tips advance independently.
2. A nested envelope on the other layer throws. Same-layer nesting still
   folds in, as `ensureEnvelope` does today.
3. Receiving a remote op on `scratch` (with the two-peer harness from
   `concurrent-convergence.test.js`) never touches the toys layer's DOM or
   tips, and the reverse.
4. A conflict on `scratch` resolves without changing toys' tips. A fork
   seeded for `scratch` leaves the fork doc's toys maps equal to the
   source's.
5. Pruning `scratch` deletes nothing from toys' maps.
6. The legacy toys keys still hold: after a toys gesture, `ydoc.getMap('ops')`
   holds the op, and `localStorage['tt_head_<tableId>']` is the new head.

Run:
```bash
npx vitest run tests/unit/op-layers.test.js tests/unit/concurrent-convergence.test.js tests/unit/op-replay.test.js
npx vitest run          # full suite once, before presenting
bin/test_e2e.sandbox.sh # all specs, once, at the end: app.js, sync and the envelope all change
```

## Done when

- `grep -n "toys" src/op_*.js src/envelope.js` finds nothing but comments
  that mention toys as an example.
- No `op_*.js` or `envelope.js` file imports `toys.js`.
- The independence tests pass. Existing tests pass with mechanical changes
  only. The full unit suite and all e2e specs pass.
- Opening an existing alpha table still shows its toys. The legacy keys are
  unchanged.
