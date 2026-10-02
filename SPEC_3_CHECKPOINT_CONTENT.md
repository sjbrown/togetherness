# Store checkpoint content apart from the op graph

A self-contained task spec.

**Prerequisites:**
- The WebRTC chunking fix has landed. Content entries are routinely over
  256 KB, and without chunking they can't cross the transport.
- The pruning doc update has landed in `src/CONCURRENCY_AND_BRANCHING.md`:
  §6.1 says checkpoint content lives apart, and invariant 17 exists.

If either is missing, stop and say so.

Read these first:
- `CLAUDE.md`
- `src/CONCURRENCY_AND_BRANCHING.md` §6.1, §6.3, §8

This task explicitly authorizes changes to:
- `src/op_checkpoint.js`, `src/op_dag.js`, `src/op_replay.js`
- the checkpoint writers: `src/toys.js` (`projectLayer` genesis,
  `writeMergeCheckpointIfWarranted`, `buildToyForkSeed`), `src/app.js`
  (`maybeCheckpoint`, the debug-info op dump near `isCheckpoint(op)`),
  `src/storage.js` (genesis on import), `src/tables.js` (`forkLiveDoc`
  seeding), `src/debug_panel.js`
- their tests

Out of scope: pruning ops, and orphan handling. Those are the next task.

## Why

A checkpoint's snapshot is the whole toys layer: roughly 12–13 KB per toy,
so ≈ 380 KB at 30 toys. Merge checkpoints can be written every 10+ ops
during play. Today every snapshot stays in the log forever, so a 3-hour
session can leave over 100 MB. Only the newest usable snapshot and the
root-most one are ever needed.

The op record can't be deleted, because it's a parent in the graph. It
can't be rewritten either (invariant 2). So the snapshot moves into a
separate entry that **can** be deleted.

## The change

**Storage**
- A second shared `Y.Map`, e.g. `checkpointContent`, keyed by checkpoint op
  id. Its value is the snapshot: what `mutations` holds today.
- The checkpoint op in `ops` carries `mutations: []`. `isCheckpoint`
  (`gesture === 'checkpoint'`) is unchanged.
- **Every checkpoint writer** sets the op and its content in **one**
  transaction. Add one helper, e.g. `appendCheckpoint(ydoc, op, content)`,
  next to `appendOp`, and route every writer through it:
  - genesis in `projectLayer`
  - import genesis in `storage.populateFromSvgDoc`
  - `maybeCheckpoint`
  - `writeMergeCheckpointIfWarranted`
  - the fork genesis in `tables.forkLiveDoc`, which writes into the **fork
    doc's** content map
- Deterministic ids keep hashing the same inputs (parents plus content), so
  identical merge checkpoints still collapse.

**Reading**
- Pure functions (`projectTips`, `nearestCheckpoint`, `applyOps` for the
  base, `buildForkSeed`, `opsSinceCheckpoint`) currently take `ops`. They
  need the content map too.
  - Pass it **explicitly** as a map-like: `.get` / `.has`, a `Y.Map` or a
    plain `Map`, as `op_dag` already does for `ops`. No global lookups.
  - Bundling the two maps into one `log` object is fine if it reads better
    than an extra parameter. Pick one convention and use it everywhere.
- **Projection base:** the latest cut **that has a content entry**. If the
  best cut has lost its content, fall back to the next older cut with
  content and replay further. If no cut in the ancestry has content, throw
  with a clear message. The root-most rule below guarantees it can't
  happen. Say so in the error comment.
- `opsSinceCheckpoint` / `shouldCheckpoint` measure from the latest cut
  regardless of content. Measuring from a content-less cut would make every
  merge write a checkpoint. Add a one-line comment saying why.

**Deleting superseded content**
- After any peer writes checkpoint `C`, in the same transaction, it deletes
  the content entry of every checkpoint that is a strict ancestor of `C`.
- **Except the root-most checkpoint:** one with no checkpoint among its own
  ancestors present in the log. Today that's genesis. After pruning lands,
  it'll be the prune root.
- Concurrency is harmless:
  - Two peers deleting the same entries is idempotent.
  - A concurrent identical `set` reviving an entry only costs bytes.
  - A peer whose tips don't include `C` falls back to an older cut with
    content, at worst the root-most one.

**Debug panel and app**
- `app.js`'s op dump (`checkpoint: isCheckpoint(op)`, `mutations: …`) and
  `debug_panel.js` show a checkpoint's content from the content map, or
  "(content deleted)".

## Tests

Extend `tests/unit/op-checkpoint.test.js` and
`tests/unit/concurrent-convergence.test.js`:

1. **Round trip.** After writing a checkpoint, its op has `mutations: []`,
   its content entry equals what `checkpointOp` serialized, and
   `projectTips` from it equals the live DOM.
2. **Superseded content is deleted.** Write genesis, then C1, then C2 along
   one chain. Only genesis and C2 have content entries.
3. **Fallback.** Delete the content of the best cut by hand. Projection
   falls back to an older cut with content and produces the same DOM.
4. **Root-most is kept.** No sequence of writes deletes genesis's content.
   Try idle, merge and concurrent writers.
5. **Merge determinism survives.** Two peers rebuild the same tips. Exactly
   one op and one content entry exist, and both are byte-identical.
6. **Size.** In a jsdom table with ~10 toys, write 20 checkpoints with
   ops in between. `Y.encodeStateAsUpdate(doc).length` is within a small
   factor of two snapshots plus the ops. Assert a bound, and log the number.
7. **Fork.** `forkLiveDoc` with a seed produces a fork doc whose genesis has
   its content in the fork's content map, and the fork projects correctly.
8. The existing convergence, mirror and op-replay tests pass with only
   mechanical updates: passing the content map, and genesis via
   `appendCheckpoint`.

```bash
npx vitest run tests/unit/op-checkpoint.test.js tests/unit/concurrent-convergence.test.js tests/unit/tables-fork.test.js
npx vitest run         # full suite once, before presenting
bin/test_e2e.sandbox.sh tests/e2e/sync.spec.js   # once, at the end
```

## Done when

- No checkpoint op carries snapshot data in `mutations`.
- Every writer goes through the one helper.
- Only the root-most and the newest checkpoints keep content along any
  chain.
- Tests 1–8 pass, the full unit suite passes, and `sync.spec.js` passes.
- No changes to `src/CONCURRENCY_AND_BRANCHING.md`, unless the code forced a
  deviation. If it did, fix the doc in the same commit.
