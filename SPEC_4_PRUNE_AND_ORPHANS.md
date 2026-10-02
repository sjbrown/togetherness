# Lagged pruning, orphans, and disconnected components

A self-contained task spec.

**Prerequisites:**
- The checkpoint content split has landed: a `checkpointContent` map and an
  `appendCheckpoint` helper.
- The pruning doc update has landed in `src/CONCURRENCY_AND_BRANCHING.md`:
  §6.3 and invariants 15–17.

If either is missing, stop and say so.

Read these first:
- `CLAUDE.md`
- `src/CONCURRENCY_AND_BRANCHING.md` §5.2, §5.4, §5.5, §6.1, §6.3, §7, §8

The doc is the source of truth for behaviour. This spec is about how to get
there.

This task explicitly authorizes changes to:
- `src/op_dag.js`, `src/op_checkpoint.js`, `src/op_replay.js`,
  `src/op_head.js`
- a new `src/op_prune.js`
- `src/toys.js` (receive, adopt, fork seed)
- `src/app.js` (`onOpsChanged`, the checkpoint call sites,
  `handleToyBranchConflict`)
- `src/tables.js` (fork seeding)
- `src/ui.js` (branch dialog text only)
- their tests

Out of scope: any UI for presence or offline state.

## Behaviour to implement

Restated briefly; the doc has the full text.

1. **Constants**, in `op_prune.js`:
   - `PRUNE_AGE_MS = 10 * 60 * 1000`
   - `PRUNE_MIN_CUTS_BACK = 2`

   Add one test-only setter for the age, e.g. `_setPruneAgeForTests(ms)`.
   Use it in unit tests, and in e2e only if you add one.
2. **First sight.**
   - An in-memory `Map<checkpointId, ms>`.
   - Record `Date.now()` when a checkpoint is appended locally or arrives in
   `onOpsChanged`.
   - At boot, after the log loads, record every existing checkpoint as seen
     now.
   - Not persisted. Keep this small: one map, one `noteSeen(id)`, one
     `ageOf(id)`.
3. **Choosing the prune root.**
   - Candidates are the cuts with content in the local tips' union ancestry.
     Those cuts are totally ordered.
   - Choose the newest candidate `R` such that `ageOf(R) ≥ PRUNE_AGE_MS`
     **and** at least `PRUNE_MIN_CUTS_BACK − 1` newer cuts exist.
   - If there's no such `R`, do nothing.
4. **Pruning.**
   - In one transaction, delete every op that is a strict ancestor of `R`,
     and their content entries.
   - Never delete `R` itself, a local tip, or anything that isn't a strict
     ancestor of `R`.
   - `R`'s content becomes root-most, so it's kept by the content-split rule.
   - **When:** right after this peer writes any checkpoint (idle or merge).
     Never inside an envelope, and never while replaying, using the same
     guards as `maybeCheckpoint`. No timers.
   - **Guard rail:** a `assertPrunable(ops, contents, ids, R, localTips)`
     check that throws before any delete if any id violates the rules above,
     or if `R` fails the age or not-newest test. The prune can't skip it.
5. **Missing parents.**
   - Audit `ancestors`, `unionAncestry`, `isCut`, `lca`, `pathFrom`,
     `totalOrder`, `heads` and `toyUndoRedoStacks` for missing parents.
   - Today `ancestors()` adds a parent id to its result even when that op
     isn't in the log. Ancestry results must contain only ids present in the
     log.
   - A checkpoint whose parents are missing is a **root**.
6. **Orphans.** Add `isOrphan(ops, id)`: walk `id`'s ancestry. A path stops
   at a checkpoint (legal root). If any path reaches a missing parent before
   a checkpoint, `id` is an orphan. Memoize per call.
7. **Receiving.**
   - An incoming op that is an orphan is **ignored**: new result
     `RECEIVED_ORPHAN`. Nothing is applied, and the tips are unchanged.
   - Before deciding that, check whether the **local** tips are the orphaned
     side (point 8). This peer may be the one returning.
8. **Detecting that this peer was orphaned.**
   - In `onOpsChanged`, **before** processing any additions in the event,
     check whether any local tip is now an orphan. That happens when deletes
     arrive, possibly in the same event as new ops.
   - **If so, and this peer authored any op on the orphaned branch:** fork
     from this peer's own live DOM. Do it before anything rebuilds the
     layer:
     - build a genesis checkpoint from the live layer
     - its id is hashed from its content, as `buildForkSeed` does, so that
       several authors on the same orphaned branch land on the same fork
     - no rebased ops
     - `joinSequence` comes from `forkJoinSequence` over the orphaned
       branch's authors
     - hand it to `tablesAPI.forkLiveDoc`

     Then adopt the shared tips and show the branch dialog.
   - **If so, and this peer authored nothing on it:** silently adopt.
   - **The shared tips** are the maximal non-orphan ops in the log. Adopting
     means `projectTips` over them, setting the tips, and re-activating
     scripts, as `adoptToyBranch` does.
9. **Disconnected components.**
   - When an incoming non-orphan op shares no ancestor with the local tips
     (`lca` null and both sides rooted at checkpoints), it's a **conflict**.
   - Route it through the existing conflict path. `labelBranches` must
     handle `lca === null`: rank each side by its earliest-joining author
     over its whole ancestry.
   - The splitter forks **from its live DOM** (point 8's seed), not from
     `buildToyForkSeed`, which needs an LCA.
   - The leader's peers just adopt or carry on.
10. **Branch dialog text.** The existing "Out of sync" dialog keeps both
    buttons. When the fork came from an orphan or a disconnected component,
    add one sentence saying this table was offline longer than 10 minutes
    while others kept playing. Otherwise the copy doesn't change.

## Tests

Use the multi-peer harness from `concurrent-convergence.test.js`, with
`_setPruneAgeForTests` and a controllable clock (`vi.useFakeTimers` or an
injected `now`). One scenario per risk diagram, plus the guard rails:

1. **Lag protects live play.** A cut was just written. A concurrent op from
   another peer has a parent just behind it. No prune happens, because the
   cut is too young and it's the newest. The concurrent op merges normally.
2. **The returning author forks.**
   - Carol goes offline, makes c1 and c2, and Alice's side prunes past
     Carol's fork point.
   - Deliver the deletes plus Alice's new ops to Carol, and Carol's ops to
     Alice.
   - **Alice:** `RECEIVED_ORPHAN` for c1 and c2. Her DOM is unchanged and
     equals her replay.
   - **Carol:** a fork is created whose genesis content equals Carol's
     pre-sync DOM. Carol's live layer then equals Alice's.
3. **The idle peer adopts.** Dave has no ops, and his head is pruned. After
   sync, no fork. His layer equals Alice's, and nothing threw.
4. **Disconnected components.** Both sides pruned their shared history. The
   side whose earliest author joined first leads. The other side forks from
   its DOM. Run it both ways round, swapping who joined first.
5. **Undo at the prune line.** An author whose only ops were pruned gets
   "nothing to undo", with no throw. `canUndoToyGesture` is false.
6. **Guard rails.** `assertPrunable` throws if handed:
   - a local tip
   - `R` itself
   - a non-ancestor of `R`
   - an `R` younger than T
   - an `R` that is the newest cut
   - an `R` without content
7. **First sight.**
   - A cut whose `ts` is a day old but was first seen now is **not**
     prunable.
   - After a simulated boot, no cut is prunable until T passes.
8. **Ancestry with holes.** `ancestors` never returns a missing id.
   `projectTips` from a pruned log equals the pre-prune DOM.
9. **Size.** After a pruned session of ~1,000 ops, `encodeStateAsUpdate` is
   within a small bound of the retained window plus about 30 B per deleted
   op. Log the number.
10. Existing convergence, mirror, op-replay and checkpoint tests pass.

```bash
npx vitest run tests/unit/op-prune.test.js tests/unit/concurrent-convergence.test.js tests/unit/op-checkpoint.test.js
npx vitest run         # full suite once, before presenting
bin/test_e2e.sandbox.sh tests/e2e/sync.spec.js   # once, at the end
```

A 10-minute e2e test isn't required. If `_setPruneAgeForTests` can be
reached from the page cheaply, one two-peer e2e of scenario 2 is welcome.

## Suggested commits (each green)

1. Ancestry functions ignore missing parents, plus checkpoint-as-root.
   Tests 8.
2. First sight, `op_prune.js` with root selection and `assertPrunable`, and
   the prune after checkpoint writes. Tests 1, 6, 7, 9.
3. Orphan detection and `RECEIVED_ORPHAN` for bystanders. The idle-peer
   adopt. Tests 3, and Alice's half of 2.
4. Author fork from the live DOM, disconnected components through the
   conflict path, and the dialog sentence. Carol's half of 2, then 4 and 5.

## Done when

- Tests 1–10 pass, the full unit suite passes, and `sync.spec.js` passes.
- Every delete from the log goes through `assertPrunable`.
- No code path seeds a fork from a pruned LCA.
