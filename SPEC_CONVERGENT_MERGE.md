# Convergent merges: per-child contention, canonical rebuild, local tip set

A self-contained task spec. Read these first:
- `CLAUDE.md`
- `src/CONCURRENCY_AND_BRANCHING.md`, all of it, especially §2.3, §5.1, §5.3,
  §5.6, §6, §8 (invariants 11–14)

The design record already describes the target behaviour. This task makes
the code match it. It explicitly authorizes changes to `src/op_replay.js`,
`src/op_checkpoint.js`, `src/op_dag.js`, `src/op_head.js`, the receive and
projection functions in `src/toys.js` (`receiveToyOp`, `projectLayer`,
`adoptToyBranch`, `markProjectedAt`/`projectedAt`), the result handling in
`app.js onOpsChanged`, and their tests.

Out of scope: writing merge checkpoints (a separate spec follows this one).
Also out of scope: anything touching the drawing or boundaries layers, and
`apply()` in `op_wire_mutation.js`.

## Where master (1fd104f) stands

1. **Structural contention is keyed by parent.** `touchedBy` records a
   `child` mutation as `e:<parent>`. Every toy move promotes z-order
   (`promoteZOrder` → `layerEl.appendChild`), which is a child mutation on
   the layer root. So **any two concurrent moves of different toys
   conflict** and fork the table. So do any two concurrent placements.
   §5.1 says this must not happen.
2. **Relaxing that alone lets the peers' DOMs drift apart.** Merging parallel
   inserts on top in arrival order gives different sibling order on each
   peer, and a peer's live DOM stops matching its own replay:
   `P: x,a,b,q,p   Q: x,a,b,p,q   replay: x,a,b,q,p`. §5.6 settles this with
   a canonical rebuild, which doesn't exist yet.
3. **Bug: a descendant of a merge tip duplicates the merged op.** P merges
   concurrent `q` (it becomes a merge tip). Then `r` arrives with parents
   `[p, q]`. `classify` sees P's head `p` is an ancestor of `r` and returns
   SUBSEQUENT. `pathFrom(p, r)` then returns `{q, r}`, so `q` is applied a
   second time. Probe: an insert in `q` ends up present **twice**.
   Everything that computes "what do I already have" from the head alone has
   this bug.
4. **Code reading, not probed:** `projectLayer` at boot projects
   `getHead()` only. Merge tips in localStorage are ignored, so after a
   reload the merged ops are missing from the DOM.
5. **Code reading:** `nearestCheckpoint` picks a checkpoint that may sit
   on **one** branch of a merge. Replaying "that checkpoint, then the other
   branch" puts the whole checkpointed branch first, whatever `totalOrder`
   says. A later projection can then disagree with the rebuild that
   produced the live DOM.

## Concepts the implementation needs

**Local tips.** This peer's position in the DAG is not one head but a
set: `head` plus `mergeTips` (op_head.js), kept **maximal** (no tip is an
ancestor of another). "What I have" is the inclusive ancestry of the whole
set. Add a helper in `op_head.js` that returns the maximal set, dropping ids
missing from the log. Every place that currently uses the head alone to
mean "what my DOM reflects" must use this set instead. That covers
classification, delta paths, and boot projection.

**Cut checkpoint (projection base).** Given a set of tips with union
ancestry `U`, a checkpoint `C ∈ U` is a *cut* if every op in `U` is an
ancestor of `C`, is `C`, or is a descendant of `C`. The cuts in `U` are
totally ordered. The projection base is the **latest cut**. Genesis always
qualifies, since there's a single root per table. Replay is then:
1. clear the layer
2. apply the cut's content
3. apply `U − ancestry(cut)` in `totalOrder`

This makes projection a function of the tip set alone, and that's what
makes the rebuild equal later replays.

`projectFrom(layer, ops, headId)` becomes the one-tip case of a new
`projectTips(layer, ops, tipIds, joinSequence)`. Keep `projectFrom`'s
signature for its existing callers (fork seed, tests). `nearestCheckpoint`
should implement the cut rule. Rename it only if the old name misleads.
`opsSinceCheckpoint` / `shouldCheckpoint` should measure from the cut.

## Receiving an operation

Replace `classify`'s head-based test with this. Keep the `RECEIVED_*`
result names and add `RECEIVED_REBUILT`.

```
have = inclusive ancestry of local tips
D    = inclusive ancestry(incoming) − have          // everything new
if D is empty                           → KNOWN
H'   = { h ∈ have : some d ∈ D does not have h as an ancestor }
       // ops this peer holds that are concurrent with something new
       // (ignore checkpoints on both sides, per §6.1 / invariant 13)
if conflicts(H', D)                     → CONFLICT   (apply nothing)
if H' is empty                          → SUBSEQUENT (apply D − checkpoints
                                                      as deltas, in totalOrder)
if orderSensitive(H', D)                → REBUILT    (projectTips over the new tips)
else                                    → MERGED     (apply D as deltas, in totalOrder)
new tips = maximal(local tips ∪ {incoming})
```

- **SUBSEQUENT:** the head becomes `incoming` and merge tips clear
  whenever every local tip is an ancestor of `incoming`. That's always true
  when `H'` is empty.
- **MERGED / REBUILT:** the head stays, and merge tips become the new tips
  minus the head.
- **CONFLICT:** keep today's return shape (`tips: [head, incoming]`, `lca`).
  `handleToyBranchConflict` and `labelBranches` stay pairwise. N-way
  conflicts remain a §9 dragon.
- **Adopting a branch** (`adoptToyBranch`): the tips become exactly
  `[target]`, and merge tips clear.
- `D` can hold several ops when a batch arrives before earlier members of
  the batch were processed. `onOpsChanged` iterates `evt.changes.keys` in
  no guaranteed causal order. Processing the later members then comes out
  KNOWN. That's intended, and it removes any dependence on iteration order.
- Bug 3 is fixed by `have` covering the merge tips. Add its regression
  test.

`H'` must be computed without walking the whole log for each `d`. Compute
the ancestor set of each op in `D` (usually one or two), intersect them, and
take `have` minus that intersection. Say so in a brief comment.

## The contention rules (`touchedBy` / `conflicts`)

Per §5.1:

- **Structural, per child.** For each `child` mutation, key each **top-level**
  added and removed element by its `data-id`. A text node added or removed
  has no id: key it as `t:<parentId>`. Two sides conflict structurally
  when they share a child key, **unless** both sides only remove that child
  (net-removed on both, no re-add on either). That's the double-delete case,
  and it merges. `apply` already skips a victim that's gone.
- **Valued** (same attribute, same text position): unchanged.
- **Delete vs. edit** (`netRemoved` against `targetIds`): unchanged.
- **Text vs. structure under the same parent is a conflict.** A text ref is
  `{parentId, index}`. If the other side changes that parent's child list,
  the index can point at a different node on the other peer, and no replay
  order fixes that (§3.1's weak joint). Coarse and rare, since toys keep text
  in `<tspan>`s. Add a comment pointing to the dragon in §9.
- **Order sensitivity** (not a conflict): the two sides have `child` mutations
  under **the same parent**. That parent is the mutation's `target` id.
  Expose it as a separate predicate `orderSensitive(ops, idsA, idsB)` next to
  `conflicts`, sharing the gathering code. Don't fold it into `conflicts`.

Keep `touchedBy`'s existing fields for compatibility, and add what's needed.
The current per-parent `structural` set becomes the parent set used by
`orderSensitive`. Update the tests that asserted parent-keyed conflicts
("two structural changes to the same container conflict"). That's a
source-driven test change: two placements into the same tray **with no
derived value** now merge. Keep a variant where each side also writes the
tray's total text: that one still conflicts.

## Boot and projection marker

- `projectLayer` projects the local tips, not the head alone.
- `markProjectedAt` / `projectedAt` identify what the DOM reflects. With a
  tip set, store the sorted tips joined with `,` in `data-tt-head`, so the
  "already showing this" short-circuit stays correct. `buildExportSvg`
  already strips that attribute.

## After a rebuild

`receiveToyOp` already calls `activateAllToyScriptsDom` for every result
other than known and conflict. Make sure REBUILT goes through that path.
`app.js onOpsChanged` calls `Overlay.render()` at the end, so the selection
rings survive a rebuild because they're keyed by id. Log a trace for
REBUILT (`Trace.op('rebuild', …)`) with the tip set, the cut, and the replay
length. The debug panel reads these.

## Tests: the guardrail (live == replay, on every peer)

Add `tests/unit/concurrent-convergence.test.js`, or extend
`toys-projection-mirror.test.js` if that stays readable. Reuse the mirror
test's real-toy setup (asset loading, `placeToy`, the LayerAPI) so the moves
go through the real `promoteZOrder`.

Harness: two or three simulated peers. Each has its own layer, its own
local-tip storage (stub `localStorage` per peer, or key it by a per-peer
table id), and a shared op `Map`. Every peer commits locally, then "delivers"
the others' ops to itself through `receiveOp` / `receiveToyOp`, **in a
chosen order**. After all deliveries, assert both:
- every peer's `serializeNode` of every layer child is identical to every
  other peer's
- each equals `projectTips` into a fresh scratch layer over the union of
  tips

Scenarios. Each one runs with every delivery order for 2 peers, and at
least two distinct orders for 3 peers:

1. Two concurrent placements (different toys) → REBUILT, converged.
2. Two concurrent moves of different toys → REBUILT or MERGED, converged,
   **not** CONFLICT.
3. Placement on one peer, move on another.
4. Double delete of the same toy → merges, converged, toy gone once.
5. Three peers, three concurrent placements. Deliver in different orders.
6. The bug-3 regression: merge, then a descendant of the merge tip arrives.
   Nothing is applied twice.
7. A reload after a merge: `projectLayer` on a fresh layer with the peer's
   stored tips equals its live DOM.
8. A cut-checkpoint case: a checkpoint on one branch, then a merge. The
   projection base is the earlier common cut, not the one-branch
   checkpoint, and the result equals the rebuild.

These must still come out CONFLICT:
- same toy moved on both sides (x/y valued)
- one toy reparented into two different containers
- two dice into one tray, where each side rewrites the total text
- delete vs. move of the same toy
- a text edit vs. a child insert under the same parent

Write scenarios 1, 2, 6 and 7 first and watch them fail on master, each for
the reason given above.

```bash
npx vitest run tests/unit/op-replay.test.js tests/unit/op-checkpoint.test.js tests/unit/concurrent-convergence.test.js
npx vitest run          # full suite once, before presenting
bin/test_e2e.sandbox.sh tests/e2e/sync.spec.js tests/e2e/container-drop.spec.js   # once, at the end
```

A deterministic concurrent e2e test isn't required. If you find a reliable
way to make two browser peers act before syncing (e.g. dropping the
provider connection via `page.evaluate` and reconnecting), add one
two-placements case to `sync.spec.js`. Otherwise say so and skip it.

## Docs

The design record mostly describes this already. Make these small edits to
`src/CONCURRENCY_AND_BRANCHING.md`, in its normative voice:

- **§2.3:** a peer's position is its head plus merge tips (its **local
  tips**), all local state.
- **§5.6:** the rebuild resets to the **latest cut checkpoint** of the tip
  set, and a one-sentence definition of a cut.
- **§5.1:** text-vs-structure under the same parent is a conflict, with the
  §3.1 reason.

## Suggested commits (each green)

1. `projectTips` plus the cut-checkpoint base, in `op_checkpoint.js`, with
   tests (scenario 8 at the unit level).
2. The local tip set plus the new receive algorithm, still with parent-keyed
   contention. Nothing is order-sensitive-but-not-conflicting yet, so
   REBUILT is unreachable. Fix boot projection and the marker. Scenarios 6
   and 7.
3. Per-child contention, double delete, text-vs-structure, and
   `orderSensitive`, which makes REBUILT reachable. Scenarios 1–5, the
   must-conflict list, and the updated `op-replay` tests.
4. Doc edits.

## Done when

- All scenarios pass. The must-conflict list still conflicts. The full unit
  suite and the named e2e specs pass.
- No code path decides "what I have" from the head alone.
- Two concurrent moves of different toys no longer fork a table.
