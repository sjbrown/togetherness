# Unify undo: undo ops name what they revert, and any author's history can be undone

A self-contained task spec. Read these first:
- `CLAUDE.md`
- `src/CONCURRENCY_AND_BRANCHING.md` §2.2, §5, §6.3, §7 and §7.1
- the undo code as it stands:
  - `authorUndoRedoStacks` and `findLastAuthoredOp` in `src/op_dag.js`
  - `applyUndoRedo`, `undoCandidate`, `redoCandidate`, `undoGesture`,
    `redoGesture`, `canUndo` and `canRedo` in `src/op_layer.js`
  - `App.undo`, `App.redo`, `runLatestFirst` and `describeGesture` in
    `src/app.js`

This task explicitly authorizes changes to:
- `src/op_dag.js`, `src/op_layer.js`, `src/envelope.js` (one optional field
  on ops), `src/app.js`
- `src/CONCURRENCY_AND_BRANCHING.md`
- `tests/unit/op-dag.test.js`, `tests/unit/undo-across-layers.test.js`,
  `tests/e2e/undo-redo.spec.js`

## Where master stands

Every canvas layer is an op layer, and `UndoManager` is gone. Undo picks
across layers by the author's own `ts`. Two assumptions remain from when
undo only ever meant "my own last action, on my own peer".

**1. Undo ops don't say what they undo.**
`authorUndoRedoStacks(ops, headId, authorId)` pairs `undo:`/`redo:` ops
with real gestures **by position**, on one author's own stack. Suppose Alice
undoes Bob's move:
- Alice's inverse op lands on *Alice's* simulated stack, and pops her last
  action, which it has nothing to do with.
- Bob's stack still shows his move as active. Pressing Undo, Bob inverts it
  a second time, which acts like a redo.

**2. The walk follows `parents[0]` only.**
That's correct for "my own history from my own head". From Alice's head,
though, Bob's ops mostly arrive as merge parents (`parents[1+]`), so
walking `parents[0]` mostly skips them. Bob's history is largely invisible
from Alice's peer.

`findLastAuthoredOp` has no callers in `src/`. Only its own tests use it.

## The model

**Undo and redo ops carry `reverts`: the id of the op they invert.**
- An undo op reverts a real gesture. A redo op reverts an undo op.
- `gesture` keeps its `undo:<original>` / `redo:<original>` label, for
  history text.
- `reverts` is a new optional field on new ops only, so invariant 2
  (immutability) holds.

**Whether an op is in effect is computed from the log, never stored:**

```
active(op) = no op that is active itself has reverts === op.id
```

This recursion settles every sequence. Undo U₁ reverts X, so X is
inactive. Redo R₁ reverts U₁, so U₁ is inactive and X is active again. A
second undo U₂ reverts X, so X is inactive again. Memoize per call.

**Roles.** Two people are involved in any undo:
- the **actor**: who presses the button, and who authors the undo or redo op
- the **owner**: whose action it is, i.e. the `authorId` of the real gesture
  at the root of a revert chain

"Undo my last action" is owner = actor. "Undo Bob's last action" is
owner = Bob, actor = me.

**What undo acts on, in one layer, for an owner:**
- **Candidates:** the owner's **real** gestures (not checkpoints, not
  `reverts` ops) that are `active`. Look across the **union ancestry of
  this peer's local tips**, not a `parents[0]` walk. That's what this
  peer's DOM shows, so Bob's ops arriving through merge parents count.
- **Target:** the candidate with the highest `ts` (the owner's own clock).
  Ties are broken by op id.
- **The new op:** an undo op whose `reverts` is that real gesture and whose
  mutations are `invert(target.mutations)`. Always reference the **real**
  gesture, even when it's active because of a redo. Check against the
  recursion: an active redo R₁ keeps undo U₁ inactive, and a new U₂ makes
  X inactive again.

**What redo acts on, in one layer, for an actor.** Redo is only ever for
**your own** undos.
- **Candidates:** the actor's own undo ops that are `active`.
- **Exclude all of them** if the actor has committed any real gesture in
  this layer with a higher `ts` than the newest candidate. That's ordinary
  editor semantics: doing something new invalidates what you could redo.
  Every value compared is from the actor's own clock.
- **Target:** the candidate with the highest `ts`.
- **The new op:** a redo op whose `reverts` is that undo op and whose
  mutations are `invert(undo.mutations)`.

**A target whose inverse can no longer apply** (its node is gone;
`canApplyWire` fails) is **skipped**. The next-latest candidate is offered
instead, both within a layer and across layers. Today a stuck target would
otherwise block every later press.

**Across layers:** unchanged. Each layer's candidate carries a `ts`, and
the highest wins. For undo, that's the target's `ts`. For redo, it's the
undo op's `ts`. `App.undo`/`App.redo` already do this through
`runLatestFirst`.

**Old ops without `reverts`.** They come from alpha tables before this
change, and pruning removes them within about 10 minutes. Treat an
`undo:`/`redo:` op without `reverts` as reverting nothing: it's a plain
gesture with an unusual label, and never an undo candidate itself. No
migration code.

## The code

**`op_dag.js`**
- Add `isActive(ops, id, memo)`.
- Add `undoTarget(ops, tipIds, ownerId)` and
  `redoTarget(ops, tipIds, actorId)`, implementing the model above over the
  union ancestry of `tipIds`. They return candidates newest first, so that
  `op_layer` can skip any that don't apply.
- **Delete** `authorUndoRedoStacks` and `findLastAuthoredOp`, and their
  tests. Replace them with the new tests below.

**`op_layer.js`**
- `undoCandidate(ydoc, layer, tableId, actorId, { owner = actorId } = {})`:
  the newest `undoTarget` whose inverse applies to the live layer. This
  needs the layer element, so either pass `layerEl` or accept that the
  applicability check happens in `undoGesture` and fall through to the next.
  Pick one, and say which in a comment.
- `redoCandidate(ydoc, layer, tableId, actorId)`, likewise.
- `undoGesture(..., { owner })` and `redoGesture(...)` commit through
  `runGesture` with `reverts` set. `canUndo`/`canRedo` take the same
  arguments.
- Rewrite the doc comment above `applyUndoRedo`. It describes the
  position-based stack.

**`envelope.js`**: `commitGesture` accepts an optional `reverts` and copies
it onto the op. Nothing else changes.

**`app.js`**
- `App.undo()` and `App.redo()` keep their behaviour: owner = actor = me.
- Add `App.undoFor(ownerId)`. It's the same dispatch with
  `owner: ownerId`, choosing across layers by the target `ts`. **No UI in
  this task.** Where the button lives, and whether soft-lock should block
  it, are decisions for later. It's reachable from `page.evaluate` for the
  e2e test.
- **History text.** When a received or local undo op's target is owned by
  someone other than its author, the line reads "*<actor>* undid
  *<owner>*'s *<gesture>*" in every peer's history.
  - The owner's own peer also shows a toast.
  - Use whatever name lookup the Peers panel uses for ids. If there isn't
    one, show a short id. Don't build a new registry.
  - Undoing your own action keeps today's text.

## Docs (`src/CONCURRENCY_AND_BRANCHING.md`)

- **§2.2:** add `reverts?: string` to the Operation shape.
- **§7:**
  - Undo and redo ops name what they invert.
  - Whether an op is in effect is computed recursively from the log.
  - The actor/owner roles.
  - Redo is for your own undos only.
  - Targets that can't apply are skipped.
  - Undoing another author's action is mechanically supported. Keep the
    existing "loud and visible" paragraph, and point it at the history line
    and the toast.
- **§7.1:** the candidate search covers the union ancestry of the local
  tips, not one parent chain.
- **§8:** append **18.** *An undo or redo operation names the operation it
  inverts (`reverts`). Whether an operation is in effect is computed from
  the log, never stored.*

## Tests

**`op-dag.test.js`**: replace the `authorUndoRedoStacks` and
`findLastAuthoredOp` blocks with a table of sequences for
`isActive`/`undoTarget`/`redoTarget`:
1. X; undo → X inactive. Redo → X active. Undo → X inactive. The undo
   target after each step is right.
2. X₁, X₂, X₃: three undos reach X₃, X₂, X₁ in that order. Three redos
   bring them back X₁, X₂, X₃.
3. Undo X₂, then a new real gesture Y → no redo target.
4. **Alice undoes Bob's X.** Bob's undo target becomes his previous action,
   not X. Bob's redo has nothing, because the undo was Alice's. Alice's redo
   brings X back.
5. **Bob's ops arrive only through merge parents** from Alice's tips.
   `undoTarget(..., 'bob')` still finds them.
6. Checkpoints are never targets. Old `undo:` ops without `reverts` are
   never targets and revert nothing.

**`undo-across-layers.test.js`**
- The existing interleaved-order tests pass unchanged.
- Add: a target whose node was deleted by another peer is skipped for the
  next one, in the same layer and across layers.
- Add: `undoFor(bob)` picks Bob's latest action across layers by Bob's
  `ts`.

**Convergence harness** (`concurrent-convergence.test.js`):
- Alice undoes Bob's move while Bob concurrently moves something else:
  this converges.
- Alice and Bob concurrently undo the **same** move: this is a conflict,
  because both write the same attribute (§5.1, B1).

Record the second case as expected behaviour in a test comment. Don't
special-case it.

**e2e (`undo-redo.spec.js`):**
- Two peers. A moves a toy, then moves it again. B calls
  `App.undoFor(<A's id>)` through `page.evaluate`. The toy is back at its
  first position on both pages, and both history panels name A and B.
- Then A presses the real Undo button. The toy returns to its **original**
  position: A's earlier move was undone, not the same one a second time.
  This is the regression test for the first problem above.
- The existing undo/redo e2e tests pass.

```bash
npx vitest run tests/unit/op-dag.test.js tests/unit/undo-across-layers.test.js tests/unit/concurrent-convergence.test.js
npx vitest run          # full suite once, before presenting
bin/test_e2e.sandbox.sh tests/e2e/undo-redo.spec.js tests/e2e/sync.spec.js   # once, at the end
```

## Suggested commits (each green)

1. `reverts` on new undo/redo ops, plus `isActive`/`undoTarget`/
   `redoTarget` with their unit tests. `op_layer` switches to them, and
   `authorUndoRedoStacks` and `findLastAuthoredOp` are deleted.
2. Skip targets that can't apply, within and across layers.
3. `App.undoFor`, the history line naming both people, and the owner's
   toast. The e2e cases.
4. Docs.

## Done when

- `grep -rn "authorUndoRedoStacks\|findLastAuthoredOp\|parents?.\[0\]" src/op_dag.js src/op_layer.js`
  finds nothing used for undo.
- Every new undo and redo op has `reverts`.
- Undoing another author's action leaves that author's own Undo acting on
  their *previous* action. The e2e regression covers this.
- The full unit suite and the named e2e specs pass.
