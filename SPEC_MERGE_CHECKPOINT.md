# Merge checkpoint: write a deterministic checkpoint when a rebuild happens

A self-contained task spec. **Prerequisite:** the convergent-merge work
(local tip set, `projectTips` with a cut-checkpoint base, the
`RECEIVED_REBUILT` result) has landed. If `op_replay.js` has no
`RECEIVED_REBUILT`, stop and say so.

Read these first:
- `CLAUDE.md`
- `src/CONCURRENCY_AND_BRANCHING.md` §2.3, §5.5 (deterministic fork
  genesis), §5.6 (merge checkpoint), §6.1, §8 (invariants 11–14), §9
  ("Log growth")

This task explicitly authorizes changes to `src/op_checkpoint.js`,
`src/op_head.js`, `src/toys.js` (`receiveToyOp` and helpers), `src/app.js`
(`onOpsChanged`, `maybeCheckpoint`), and their tests.

## Why

A canonical rebuild replays everything since the latest cut checkpoint.
During active play every concurrent toy move is order-sensitive, so rebuilds
are frequent. Without new cuts, the replay length grows until an idle
checkpoint happens. §5.6 settles it: after a rebuild, the peer may write a
**merge checkpoint**. Its parents are the tips it just rebuilt, which makes
it:

- a new cut, so the next rebuild's base is here
- the **merge commit**, where the branches join in the graph. The local tip
  set collapses to this one op.

## The checkpoint

After `receiveToyOp` gets `RECEIVED_REBUILT`, the peer's new tip set is `T`
(maximal, sorted). If `shouldCheckpoint` measured from `T`'s latest cut says
yes (more than `CHECKPOINT_MIN_OPS`), write:

| field | value |
|---|---|
| `parents` | `T`, sorted |
| `authorId` | `null` |
| `gesture` | `'checkpoint'` (it must satisfy `isCheckpoint`) |
| `ts` | the max `ts` of the ops in `T` |
| `mutations` | `checkpointOp`'s content, serialized from the just-rebuilt live layer |
| `id` | `tt-op-ck-` + a hash of `JSON.stringify([parents, mutations])` |

Use the same FNV-1a `deterministicSuffix` that `buildForkSeed` uses. Don't
add a second hash. Factor one helper, e.g.
`mergeCheckpointOp(layerEl, tips, ops)`, into `op_checkpoint.js`, next to
`buildForkSeed`. Both build "a checkpoint that every peer computes
identically".

Every peer that rebuilt the same `T` produces a byte-identical op with the
same id. `appendOp` already returns early when the id exists. Concurrent
`Y.Map` sets of an identical value under the same key are harmless. Peers
that rebuilt different tip sets write different checkpoints. Both are valid
cuts of their own ancestry, and classification ignores checkpoints
(invariant 13), so they can't conflict with anything.

Then set the local tips to `[checkpoint.id]` (head = it, merge tips
cleared) and mark the layer projected at it.

**Rule the implementation must not break:** the checkpoint's content has to
equal a fresh `projectTips(T)`. It will, because the live DOM was just
produced by exactly that rebuild. Add an assertion in the tests, not in
production code.

## Where it's written

- **`receiveToyOp`**, right after a REBUILT result. Not inside `receiveOp`,
  which stays storage-free.
- The write happens inside a `Y.Map` observer callback (`onOpsChanged` →
  receive). A Yjs write from inside an observer starts a new transaction
  after the current one. Check that this works and doesn't re-enter
  `onOpsChanged` as a *remote* change. `onOpsChanged` already returns early
  on `transaction.local`. If there is a re-entrancy problem, defer the
  write with `queueMicrotask` and say why in a comment.
- **Guards**, the same as `app.js maybeCheckpoint`: not while
  `isInsideEnvelope()`; not with capture suppressed.
- **Idle checkpoints** (`maybeCheckpoint` in `app.js`) keep working. With
  more than one local tip, an idle checkpoint's `parents` must be the full
  tip set, not `[head]`. Otherwise it isn't a cut. Use the same helper, and
  author it the same deterministic way, or keep it authored by the user.
  Pick one, say which, and keep the tests consistent.

## Receiving a merge checkpoint

No new receive code should be needed. Walk through it and confirm with
tests:

- **A peer that already rebuilt the same `T`:** `D = {ck}`, `H'` is empty,
  so the result is SUBSEQUENT. The checkpoint is a no-op delta, and the tips
  collapse to `ck`.
- **A peer that hasn't received one of `T`'s members yet:** `D` holds that
  member plus `ck`. `H'` isn't empty, so the result is REBUILT, and the
  rebuild's cut is `ck` itself. That's cheap: just its content. The tips
  collapse to `ck`.
- **A peer holding a concurrent op of its own**, not in `T`: REBUILT or
  MERGED over `{ck, own}`. Its tips are `[ck, own]`. It writes its own merge
  checkpoint only if `shouldCheckpoint` says so.

## Merge tips after this change

§5.6 calls the merge checkpoint the merge commit. Merge tips still exist for
MERGED results, and for REBUILT results where `shouldCheckpoint` declined.
The next local commit folds them in as parents through `consumeParents`,
as today. Don't remove the merge-tip mechanism. It stops being the only way
branches join in the graph.

Update the `op_head.js` merge-tip comment, and the `mergeConcurrent`/
`receiveOp` doc comments in `op_replay.js`, to say this briefly.

## Tests

Use the convergence harness from the previous task (multi-peer, shared op
map, per-peer tip storage).

1. **Determinism:** two peers rebuild the same tip set, and each writes a
   merge checkpoint. Same id, identical `JSON.stringify(op)`, and the shared
   map holds exactly one.
2. **Gate:** with `CHECKPOINT_MIN_OPS` or fewer ops since the cut, no merge
   checkpoint is written, and the tips stay `[head, ...mergeTips]`.
3. **Collapse:** after writing, the local tips are `[ck]`. A following local
   commit has `parents: [ck]`.
4. **Base moves:** the next rebuild after a merge checkpoint uses it as its
   cut. Assert via the trace or `nearestCheckpoint`/cut helper output, and
   check its replay length is small.
5. **Content equals projection:** `ck.mutations` deep-equals
   `checkpointOp(projectTips(fresh, T))` content.
6. **The three receive cases above**, each converging (live == replay on
   every peer).
7. **An idle checkpoint with merge tips** has the full tip set as
   `parents` and is a cut.

```bash
npx vitest run tests/unit/op-checkpoint.test.js tests/unit/concurrent-convergence.test.js
npx vitest run          # full suite once, before presenting
bin/test_e2e.sandbox.sh tests/e2e/sync.spec.js   # once, at the end
```

## Docs

Only if the code forces a deviation from §5.6 / §6.1: fix the doc in the
same commit, in its normative voice. The idle-checkpoint authorship choice
belongs in §6.1 in one sentence.

## Done when

- Tests 1–7 pass. The full unit suite and `sync.spec.js` pass.
- A rebuild during active play leaves the peer on a single tip whenever
  `shouldCheckpoint` allows, and the replay length of the next rebuild is
  bounded by `CHECKPOINT_MIN_OPS` plus whatever arrived since.
