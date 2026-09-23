# Fix: concurrent delete vs. edit crashes `receiveOp`

A self-contained task spec. Read `CLAUDE.md` and `src/CONCURRENCY_AND_BRANCHING.md`
(§5 Divergence, §8 Invariants) before touching code. This task explicitly
authorizes a change to `src/op_replay.js`.

## The bug

Two peers share a base where toy `A` exists. Concurrently:

- Peer P deletes `A`. Its op is a `child` mutation on the **layer** (or on
  `A`'s container), with `removed: [<A's full subtree>]`.
- Peer Q edits `A`. Its op is an `attr` mutation targeting `{ id: 'A' }`.

`op_replay.touchedBy` puts P's op under `structural = { e:<layer> }` and
Q's under `valued = { e:A#x }`. The two sets don't intersect, so
`classify` returns **CONCURRENT** instead of **CONFLICTING**. `receiveOp`
then calls `mergeConcurrent`, which calls `op_wire_mutation.apply`. On peer P,
`A` no longer exists, so `apply` throws:

```
WireApplyError: unresolvable target {"id":"A"}
```

Live path: `app.js onOpsChanged` → `Toys.receiveToyOp` → `receiveOp` →
`mergeConcurrent` → `applyWire` → throw, inside a Yjs observer callback.
Peer Q gets P's delete, applies it cleanly and drops its own edit, so
the two peers also end up disagreeing about what happened.

The same thing happens when Q's edit targets anything **inside** A's subtree.
That covers an attribute on a descendant, a text node whose `parentId` is
inside A, and a `child` mutation whose target is A or one of its
descendants (for example, dropping a toy into a tray that was deleted
concurrently).

### Repro (confirmed failing on `main` @ f890efb)

```js
// @vitest-environment jsdom
import * as Y from 'yjs'
import { runInEnvelope, commitGesture } from '../../src/envelope.js'
import { receiveOp } from '../../src/op_replay.js'
const SVG_NS = 'http://www.w3.org/2000/svg'
function peer() {
  const svg = document.createElementNS(SVG_NS, 'svg')
  const L = document.createElementNS(SVG_NS, 'g'); L.setAttribute('data-id', 'layer')
  for (const id of ['x', 'a']) { const r = document.createElementNS(SVG_NS, 'rect'); r.setAttribute('data-id', id); L.appendChild(r) }
  svg.appendChild(L); document.body.appendChild(svg); return L
}
const P = peer(), Q = peer()
const ops = new Map([['base', { id: 'base', parents: [], mutations: [] }]])
const del = commitGesture(new Y.Doc(), runInEnvelope(P, () => P.querySelector('[data-id=a]').remove()), { id: 'del', parents: ['base'] })
const mv  = commitGesture(new Y.Doc(), runInEnvelope(Q, () => Q.querySelector('[data-id=a]').setAttribute('x', '5')), { id: 'mv', parents: ['base'] })
ops.set('del', del); ops.set('mv', mv)
receiveOp(P, ops, 'del', 'mv')   // throws: unresolvable target {"id":"a"}
```

## The decision: this is a conflict

A concurrent delete plus an edit of anything inside the deleted subtree
counts as **CONFLICTING**. It then goes through the existing leader/splitter
resolution (§5.2–5.4). Every peer computes the same result, nothing throws,
and nobody's work is silently discarded.

This matches §9's stated policy ("start coarse… ANY object ids shared in two
concurrent commits implies conflict").

Rejected alternatives, which stay out of scope:
- **Delete wins, skip the edit.** This would make `apply` skip unresolvable
  targets, which breaks its "refuse rather than silently diverge" contract and
  invariant 3. Don't change `apply()`'s throw.
- **Catching the throw in `receiveToyOp` / `onOpsChanged`.** It hides the
  symptom and leaves the peers diverged.

## The change: `src/op_replay.js`

1. **Extend `touchedBy(op)`** so that, alongside `structural` and `valued`, it
   also returns:
   - `removedIds`: the `data-id` of every element in every `removed` subtree
     of every `child` mutation, recursively. Walk `SerializedNode.ch`; the id
     sits in `at` as `['data-id', <id>]`. Text entries (`{ tx }`) have no id,
     so skip them.
   - `addedIds`: the same walk over `added` subtrees.
   - `targetIds`: every element id the op **addresses**. That's `target.id`
     for `attr`, `text` and `child`, and `target.parentId` for text-node refs.
     Leave out `prevSibling`/`nextSibling`. A vanished anchor already falls
     back to append in `insertionPoint` and never throws.

   Keep the existing `structural` and `valued` sets exactly as they are.
   Existing tests assert on them.

2. **In `conflicts(ops, idsA, idsB)`**, gather these per side. For each side,
   the **net-removed** ids are `removedIds − addedIds` taken over that
   side's whole op set. Taking the difference matters: a reparent or move
   removes a node and re-adds it inside a single op, and an undone delete
   re-adds it later on the same branch. Neither of those deletes anything.
   Then:

   ```
   conflict ||= intersects(netRemoved(A), targetIds(B))
             || intersects(netRemoved(B), targetIds(A))
   ```

   Both directions are needed. Classification has to agree on both peers,
   and only the deleting peer throws today.

The comments in the file should stay brief and follow `CLAUDE.md`. Don't
reorder functions.

## Tests: `tests/unit/op-replay.test.js`

Add the new tests next to the existing `touchedBy` / `conflicts` / `classify`
describes, using the file's own `attrOp` / `childOp` helpers where they fit.
You'll need a `childOp` variant that carries a `removed` subtree.

- **touchedBy:** a delete op reports the removed element's id **and its
  descendants' ids** in `removedIds`.
- **conflicts:**
  - delete A vs. attr on A → `true`
  - attr on A vs. delete A (argument order swapped) → `true`
  - delete A vs. attr on a descendant of A → `true`
  - delete A vs. text edit whose `parentId` is inside A → `true`
  - delete A vs. `child` op targeting A (drop into a deleted tray) → `true`
  - delete A vs. attr on unrelated B → `false`
  - reparent A (removed and re-added in one op) vs. attr on A → `false`
  - the existing six `conflicts` tests still pass unchanged
- **receiveOp end-to-end:** use the repro above. `receiveOp(P, ops, 'del', 'mv')`
  returns `result: 'received-conflict'` and does not throw. Q receiving
  `del` also returns `received-conflict`.

Before writing the fix, run the new tests and confirm they fail for the
right reason. After the fix they should pass.

Run the tests from the narrowest scope outwards:

```bash
npx vitest run tests/unit/op-replay.test.js
npx vitest run            # full suite once, before presenting
```

e2e isn't needed. `sync.spec.js` is the only spec near this code and it
doesn't cover concurrent delete. Run it only if something in `receiveOp`'s
return shape changes, and it shouldn't.

## Done when

- The new tests pass, the existing `op-replay.test.js` tests pass unchanged,
  and the full unit suite is green.
- `apply()` in `op_wire_mutation.js` is untouched.
- There is one small commit. Its message says what the fix is and why
  (conflict classification now treats a concurrent delete of an addressed
  node as a conflict).
