# Fix: a received checkpoint duplicates the whole toys layer

A self-contained task spec. Read these first:
- `CLAUDE.md`
- `src/CONCURRENCY_AND_BRANCHING.md` §5 (Divergence), §6 (Projection), §8
  (Invariants)

This task explicitly authorizes changes to `src/op_replay.js` and
`src/op_checkpoint.js`, plus the tests that cover them.

## The bug

A checkpoint op's mutations say "insert every child into an empty layer"
(`op_checkpoint.checkpointOp`). That's only correct as the base of a
projection, in `projectFrom`, where the layer is cleared first. Everywhere
else, operations are applied as deltas on top of the live DOM, and a
checkpoint applied that way inserts a second copy of every element:

| Path | What happens |
|---|---|
| `advanceTo` (descendant case) | `pathFrom(head, target)` includes the checkpoint, and `applyWire` re-inserts every child |
| `mergeConcurrent` | a concurrent checkpoint is applied on top, with the same result |
| `projectFrom` | the base is applied correctly, but if `path` contains *another* checkpoint (two checkpoints on concurrent branches, where `nearestCheckpoint` picks one), that one is applied as a delta |

Classification has the same problem. `touchedBy(checkpoint)` reports a
structural touch on the layer root and adds every element id. Any concurrent
op that changes the layer root's children (every toy move does, via
`promoteZOrder`) therefore comes out **CONFLICTING** with a checkpoint that
recorded nobody's intent.

**Live trigger:**
1. `DEFAULT_CHECKPOINT_FREQUENCY` is 2 minutes (`user.js`).
2. On deselect, `app.js` `maybeIdleCheckpoint` → `maybeCheckpoint` writes a
   checkpoint once more than `CHECKPOINT_MIN_OPS` ops have passed.
3. Every connected peer receives it through `onOpsChanged` →
   `receiveToyOp` → `receiveOp`.

### Repro (confirmed on master @ 4f1ed78)

```js
// @vitest-environment jsdom
import * as Y from 'yjs'
import { runInEnvelope, commitGesture } from '../../src/envelope.js'
import { receiveOp } from '../../src/op_replay.js'
import { checkpointOp } from '../../src/op_checkpoint.js'
const NS = 'http://www.w3.org/2000/svg'
function peer() {
  const L = document.createElementNS(NS, 'g'); L.setAttribute('data-id', 'tt-layer-toys'); L.id = 'toys-layer'
  for (const id of ['a', 'b']) { const r = document.createElementNS(NS, 'g'); r.setAttribute('data-id', id); L.appendChild(r) }
  document.body.appendChild(L); return L
}
const P = peer(), Q = peer()
const base = { id: 'base', parents: [], mutations: [] }
const ck = { ...checkpointOp(P, { authorId: 'alice', parents: ['base'] }), id: 'ck' }
receiveOp(Q, new Map([['base', base], ['ck', ck]]), 'base', 'ck')
// → received-subsequent, Q's children: a,b,a,b

const Q2 = peer()
const qe = commitGesture(new Y.Doc(), runInEnvelope(Q2, () => Q2.querySelector('[data-id=b]').setAttribute('x', '1')), { id: 'qe', parents: ['base'] })
receiveOp(Q2, new Map([['base', base], ['ck', ck], ['qe', qe]]), 'qe', 'ck')
// → received-merged, Q2's children: a,b,a,b
```

## The rule the fix implements

**A checkpoint is a projection base, never a delta.** Its state is by
construction the result of replaying its ancestors. Relative to its parents
it changes nothing, and it records nobody's intent. So:

1. **Applied as a delta, a checkpoint does nothing.** `advanceTo`,
   `mergeConcurrent`, and the path portion of `projectFrom` all skip checkpoint
   ops. Only `projectFrom`'s **base** applies a checkpoint's mutations, onto a
   layer it has just cleared.
2. **Classification ignores checkpoints.** `conflicts` leaves checkpoint ops
   out of both sides' op sets, so a checkpoint can never contribute a conflict.
   Apply this in `conflicts` or `classify`, not by mutating the op.
3. **A concurrent checkpoint still counts as a merge tip.** `receiveOp`
   returns `RECEIVED_MERGED` with `mergeTip: incomingId` exactly as today, so
   the next local commit names it as a parent. Only the DOM application is
   skipped. This keeps it reachable for `nearestCheckpoint`.

Use `isCheckpoint` from `op_checkpoint.js`. It's already exported. Put the
"delta of an op" logic in **one place**, e.g. a small helper returning
`isCheckpoint(op) ? [] : op.mutations`, that every delta path calls. Don't
copy the check into each caller. Put the helper in `op_checkpoint.js`.
`op_replay.js` already imports from `op_checkpoint.js`, so the reverse
import would create a cycle.

A **parentless** checkpoint (genesis, or a fork's seed) can't reach a delta
path. `advanceTo` only takes the delta branch when the current head
descends from the target's ancestry root, and `projectFrom` always uses the
nearest checkpoint as its base. No extra handling is needed. Do add a test
showing that projecting a log with a genesis plus a later checkpoint yields
each element exactly once.

### Out of scope

- Writing checkpoints on rebuild, merge checkpoints, and any change to *when*
  checkpoints are written (`maybeCheckpoint`, `shouldCheckpoint`).
- Any other change to the conflict rule (per-child structural keys, sibling
  order). That's separate work.
- `apply()` in `op_wire_mutation.js`. Leave it untouched.

## Tests

Add to `tests/unit/op-replay.test.js`, and to
`tests/unit/op-checkpoint.test.js` for the projection cases. Write them
first and confirm they fail for the right reason.

- **Subsequent checkpoint:** the repro's first case gives
  `received-subsequent` with children exactly `a,b`, and the head moves to
  `ck`.
- **Concurrent checkpoint:** the repro's second case gives `received-merged`,
  `mergeTip === 'ck'`, children exactly `a,b`, and `b` still has `x="1"`.
- **A path with real ops around a checkpoint:** head → op1 → ck → op2. Advancing
  from head to op2 applies op1 and op2 once each, and there are no duplicates.
- **Classification:** a checkpoint concurrent with a toy move that calls
  `promoteZOrder` (a child mutation on the layer root) classifies as
  CONCURRENT, not CONFLICTING. And `conflicts(ops, [ck], [anything])` is
  `false`.
- **Two checkpoints on concurrent branches:** `projectFrom` onto the
  merge of both yields each element exactly once.
- **Genesis plus a later checkpoint:** projecting gives each element exactly once.
- The existing `op-replay`, `op-checkpoint` and `toys-projection-mirror` tests
  still pass unchanged.

**e2e (run once, at the end):** add a case to `tests/e2e/sync.spec.js`, or a
new spec using its two-peer helpers:
1. Peer A places a few toys and makes more than 10 moves.
2. Call `App.maybeCheckpoint('test')` in A's page via `page.evaluate`. It's on
   the App bus, `app.js` ~line 929.
3. Assert that peer B's `#toys-layer` child count and `data-id` set equal
   A's.

Run it with `bin/test_e2e.sandbox.sh tests/e2e/sync.spec.js`.

```bash
npx vitest run tests/unit/op-replay.test.js tests/unit/op-checkpoint.test.js
npx vitest run     # full suite once, before presenting
```

## Done when

- The new unit tests and the e2e case pass. Existing tests pass unchanged.
- No delta path applies a checkpoint's mutations. `projectFrom`'s base is
  the only place they're applied.
- It lands as one or two small commits. Suggested split: the delta fix, then
  the classification fix. Each message says what changed and why.
