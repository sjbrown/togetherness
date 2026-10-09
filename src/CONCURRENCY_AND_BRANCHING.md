# Concurrency and Branching

How the toys layer replicates, how peers diverge, and what happens when they do.

This document is the design record for the toys layer's replication model.

---

## 1. The model

```
  User gesture (pointer, menu action, tool)
        │
        ▼
  Toy handler JS runs against the live SVG DOM      ← execution surface
        │
        ▼
  MutationObserver envelope captures the batch
        │
        ▼
  Operation  { id, parents[], authorId, gesture, mutations[] }
        │
        ▼
  Y.Map<opId, Operation>  +  local head            ← replication
        │
        ▼
  Operation DAG                                     ← truth
        │
        ▼
  Replay: apply mutations to the DOM
        │
        ▼
  SVG DOM                                           ← materialized view
        │
        ▼
  Browser renders
```

Three statements, each of which the old design violated:

1. **The SVG DOM is the execution surface.** Toy scripts — including
   user-written ones — see an ordinary DOM and use ordinary DOM APIs.
   The engine must accept any synchronous, dependency-free JS that
   manipulates SVG. This is the project's whole core promise for
   users who extend it.

2. **The operation DAG is the source of truth.** Not the DOM. The DOM is
   the current projection of the DAG, reconstructible from it and
   discardable at will.

3. **Yjs is transport.** For the toys layer it replicates an append-only
   set of immutable operation records and nothing else.
   Yjs does not hold toy document content, and has no opinion about our
   semantics. It is very good at the job it now has:
   offline sync, causal delivery, efficient encoding.

**Each op layer has its own DAG.** Everything above and below describes one
op layer, and the toys layer is the only one today. Each op layer has its own
ops map and checkpoint-content map, its own local tips (§2.3), its own
checkpoints and prune root (§6.3), and its own conflict resolution (§5). Op
ids are globally unique, but an op belongs to exactly one layer: layers never
share ops, a parent pointer never crosses layers, and a gesture never spans
two layers (invariant 5). What a layer is called, which elements it owns and
where its state is stored is data in its descriptor (`op_layers.js`); the op
machinery contains no layer names.

### 1.1 Drawing, Boundaries & Postions Layers are still Yjs

`Y.Xml` is fine, and stays, for `drawing` and `boundaries`. Those layers
have no object identity to preserve, no reparenting, no derived values,
and no user scripts.

---

## 2. Gestures and operations

### 2.1 A gesture is a transaction

A **gesture** is one user intention: a drag, a resize, a menu action
("Roll"), a placement, a delete, an edit. Its execution is:

* **explicitly delimited.** The envelope opens before any handler runs and
  closes after. We do not infer the boundary from `MutationObserver`'s
  microtask batching — the browser's batch boundary is "everything before
  the next checkpoint," which is not the same thing as our gesture, and
  conflating them means an unrelated animation frame lands inside
  someone's dice roll.

* **synchronous, and enforced so.** No `await`, no `setTimeout`, no
  `fetch`, no promise. `runInEnvelope` **throws** if a handler returns a
  thenable.

* **confined to its layer.** All observable effect happens inside the
  layer the gesture belongs to (`#toys-layer`, for a toy handler). A handler
  that writes outside it (eg, `document.body`, `localStorage`, a global, or
  another op layer) has escaped the model, and the operation we record and
  transmit to peers will be incomplete or erroneous. An envelope opened
  inside another layer's envelope **throws**.

* **recursive.** A handler may trigger another handler, which may trigger
  another. All of it is one envelope, one batch, one operation.


### 2.2 An operation

```
Operation {
  id        : string          // content-independent unique id
  parents   : string[]        // op ids; the DAG edges
  authorId  : string          // persistent user.js localId, never Yjs clientID
  gesture   : string          // 'move' | 'roll' | 'place' | … , for the audit log
  mutations : WireMutation[]  // §3
  ts        : number          // wall clock, for display only, never for ordering
}
```

Stored in `Y.Map<opId, Operation>`.
Using a (unordered) map, because when Alice's three offline ops meet
Bob's two, there is no correct place in a list for Bob's first op to
go. A map says only "these operations exist"; the `parents` pointers
say how they relate. The DAG is computed from the map, never stored as a
second structure that can disagree with it.

**Operations are immutable.** Never rewrite one. Never append to a
`parents` array. Correcting something means appending a new operation
(including an inverse operation — §7). The log is a recent history plus a
snapshot (§6.3), not a mutable state blob with extra steps.

`authorId` is self-reported at commit time and is the persistent
`user.js` localId, not Yjs's `clientID`. `clientID` is per-session and
means nothing to a peer who has never met that session. `joinSequence` is
keyed on localId, so an operation must carry the thing authority is
actually resolved against.

### 2.3 A head is local state

A peer's position is its **local tips**, kept per op layer: moving in one
layer never moves another. Within a layer they are its head plus zero or more
**merge tips**, ops it has absorbed into its live DOM without either being
an ancestor of the other. "What this peer has" is the inclusive ancestry of
the whole set, not of the head alone — every place that used to reason from
the head reasons from this set instead.

Local tips are *not* in the shared document. They are per-peer, per-table, per-layer
local state (localStorage, alongside the table registry). Two peers sitting
on different tips is not an error state — an offline GM working on their
own branch while players continue on the shared one is valid.

---

## 3. The wire format

The browser's native `MutationRecord` cannot be transmitted. It holds live
node references, and its `addedNodes`/`removedNodes` are detached from the
tree by the time anyone serializes them.

A wire form is needed.  Taking inspiration from MutationRecord makes things
easy to reason about.

**The wire form is a transcription, not an interpretation.** One
`WireMutation` per `MutationRecord`, same three types, same fields, same
order. We do *not* infer `MoveNode` from a remove-then-add pair. We do not
coalesce two `setAttribute`s on the same node. We do not lift anything
into a semantic vocabulary. The op log does not know what a die is.

```
WireMutation =
  | { t:'attr',  target:NodeRef, name:string, ns:string|null,
                 oldValue:string|null, newValue:string|null }
  | { t:'text',  target:NodeRef, oldValue:string, newValue:string }
  | { t:'child', target:NodeRef,
                 removed:SerializedNode[], added:SerializedNode[],
                 prevSibling:NodeRef|null, nextSibling:NodeRef|null }
```

Distilling/optimizing further is *deliberately deferred*. Compactness
and a cleaner inverse can be achieved, it is known. When 
performance or correctness demands it, it will be implemented, and
documented in this section.

Three things the wire form must get right, none of which are optional:

**Added and removed subtrees are serialized in full.** `added` carries the
complete markup of each inserted node, not a reference — the receiving
peer has never seen it. `removed` likewise carries the full subtree of
each removed node, captured *before* the removal takes effect. That second
one costs us nothing at capture time and buys invertibility for free (§7),
which is the whole reason undo stops being a research project.

**Old values are captured.** `attributeOldValue` and
`characterDataOldValue` stay on in the observer options. Same reason.

**Sibling anchors are node references, not indices.** A `child` record
records `previousSibling`/`nextSibling` as identities. An index is a
statement about a tree state the receiving peer may not be in.

### 3.1 Node identity

Every element in the toys layer carries a stable, immutable `data-id`,
assigned at creation and never rewritten. `data-id` belongs to Togetherness
Table. The SVG stays valid, inspectable, Inkscape-editable. Respect 
`data-id` like a database primary key.

**Text nodes are the weak joint.** A text node cannot carry an attribute,
and `characterData` records target it directly. It is addressed as
`{ parentId, childIndex }`. Within a single operation this is exact: the
parent is identified, and the batch's own records fully describe any
sibling changes. Across operations it is only as stable as the parent's
child list, which is why the checkpoint primitive (§6) has to be able to
express text positions too, and why coalescing text mutations across
operations is not safe. This is the part of the design most likely to need
revisiting; a distilled `ReplaceText(nodeId, value)` op with real text-node
identity is the obvious escape hatch if it bites.

---

## 4. Replay

### 4.2 Applying a batch is not capturing one

A peer applying a remote operation is mutating its own DOM, and its own
`MutationObserver` will see every one of those mutations. If that produced
a new operation, two peers would generate operations at each other
forever in a loop.

Replay therefore runs with capture suppressed.

### 4.3 Replay never re-runs handler code

This is the most important sentence in the document.

A peer receiving an operation applies its recorded **mutations**. It does
not re-execute the gesture that produced them.

Everything follows from this:

**Handler non-determinism is fine.** A die's `Math.random()` runs once, on
the peer that rolled it, and the result is a recorded mutation. There is
no need for a seeded `context.random()`, no need for a virtualized
`Date.now()`.
We get to keep the loose, permissive, do-whatever-you-want scripting
environment that is the point of the project.

**Derived values must be captured, not recomputed.** A tray's running
total is computed by the peer that changed the tray's contents, inside
that peer's envelope, as part of that operation. A receiving peer applies
the resulting mutation and that's it.

**Corollary — the envelope must be greedy.** If a gesture's reaction
cascade is not inside its envelope, the operation is an incomplete
description of the gesture and applying it produces a DOM that no peer
ever had.

---

## 5. Divergence

### 5.1 Three relationships, not two

When an operation arrives, compare its `parents` to the local head:

* **Subsequent** — `parents` is (or descends from) my head. Apply it,
  advance the head. This is the overwhelmingly common case and it is
  cheap.

* **Concurrent** — neither is an ancestor of the other. The DAG now has
  two tips, and the two branches **commute**: applied on top of the local
  DOM in arrival order, they give the same result regardless of which
  order that is, so each peer can see the two branches in the opposite
  order from its counterpart and still converge. Replay, later, applies
  them in `totalOrder` (§5.3) instead of arrival order, and must land on
  the same DOM. Alice recoloured a token while Bob moved a different one;
  both intentions survive and any order gives the same result. Anything
  concurrent that does *not* commute is either a conflict, below, or a
  case the receiving peer resolves with a deterministic rebuild (§5.6)
  rather than an arrival-order apply.

* **Conflicting** — concurrent *and* the two branches cannot be projected
  into one DOM. Precisely, one of:

  * **Same node, structurally**, other than both sides removing it.
    Structural contention is per child, not per parent: two branches
    conflict only when both insert, remove, or move the **same** node.
    Two peers placing different toys into the same layer, or moving
    different toys (every move promotes the moved toy's z-order through
    the layer root, which touches the layer only incidentally), do not
    conflict — see the non-conflicting examples below.
  * **Same attribute, or the same text position, on the same node.**
    Neither side's value wins automatically. Soft-lock is the
    workhorse that makes this collision rare for connected peers;
    intentional offline users should expect their edits to conflict;
    partitioned peers get the branch dialog (§5.4), which is accepted.
    This is also what keeps a derived value safe (§4.3) — two peers who
    each recomputed a tray's running total and produced different sums
    have no correct way to average or pick between them.
  * **Text vs. structure under the same parent.** A text mutation
    addresses `{parentId, index}` (§3.1); if the other branch changes that
    parent's child list, the index can point at a different node on this
    peer than on that one, and no replay order fixes that — §3.1's weak
    joint. Coarse and rare in practice, since toys keep text in
    `<tspan>`s, but real: dropping a second item into a tray while
    someone edits that tray's total conflicts, even though the drop and
    the text write don't touch the same child.
  * **Delete vs. edit.** One branch's *net* removal of a node — removed,
    and not re-added on that same branch, so a reparent or an undone
    delete does not count — conflicts with the other branch addressing
    that node or anything inside it.

  Two peers reparenting the same toy to different containers is the
  same-node-structurally case: a node cannot have two parents. Two peers
  each dropping a die into the same empty tray and each recomputing its
  total is the same-attribute case: a `<tspan>` cannot hold two authors'
  sums.

  **Not conflicting:** two peers placing different toys (different nodes,
  no contention). Two peers moving different toys (different nodes, even
  though both promote z-order at the layer root). Two peers deleting the
  same node — a **double delete** merges, because applying a removal
  whose target is already gone does nothing.

  Checkpoints (§6.1) are ignored when classifying either relationship —
  a checkpoint changes nothing relative to its parents and carries no
  one's intent, so it cannot itself be concurrent, conflicting, or
  contended.

Concurrency is a property of the graph and is cheap to compute.
Conflict is a property of the *operations* and requires looking at what
they touched.

### 5.2 Leader and splitter

```
      +-------+
      |       |
      |  LCA  |
      |       |
      +-------+
          ^
        /   \
       /     \
  +------+    +------+
  |      |    |      |
  |  A1  |    |  B1  |
  |      |    |      |
  +------+    +------+
                 |
  (leader)    +------+
              |      |
              |  B2  |
              |      |
              +------+

             (splitter)

```

When two branches conflict, both get labels, computed identically by every
peer from data every peer has:

* Find the **lowest common ancestor** of the two tips.
* For each branch, find the earliest-joining `authorId` among its
  operations, by `joinSequence` index.
* The branch containing the earlier-joining author is the **leader**. The
  other is the **splitter**.

Ties (both branches' earliest author is the same person, or neither is in
`joinSequence`) fall back to a deterministic comparison of op ids. Every
peer computes the same labels without communicating, because
`joinSequence` is append-only, never pruned, and never derived from
ephemeral awareness.

Bias toward the table's creator is intentional. Someone is running this
game, and when the system has to guess whose reality is the shared one,
the "originator" is the right guess.

### 5.3 Causal order is not display order

Two separate questions, repeatedly conflated:

* *Did A happen before B?* — ancestry in the DAG. Real, meaningful,
  computable.
* *If A and B are concurrent, which do we list first?* — a deterministic
  tie-break, for the activity log and for reproducible iteration. Says
  nothing about time.

A total order over concurrent operations is a *presentation* choice, with
one exception: it decides sibling order for a canonical rebuild (§5.6),
because there the receiving peer is not choosing an arrival order at all —
it is reconstructing the one order every peer can agree on. Outside that,
never build a merge on it, and it never decides an attribute or text value
or who has authority.

### 5.4 What a peer does about it

If the local peer has contributed nothing to the splitter branch, it
follows the leader. Silently — this is the ordinary case for a bystander
and warrants an activity-log line at most.

If the local peer authored something on the splitter branch, it is asked,
because only the user knows whether that work matters:

* **Join the "authoritative" table.** Adopt the leader as head, reproject
  (§6). Their splitter work is not destroyed, it is still in the op log,
  still reachable, but it is no longer on their head.
* **Keep working on my branch.** Fork to a new table with the splitter
  branch as its history and a fresh `joinSequence` (§5.5)

The dialog does not dismiss on scrim-click or Escape. It is a real choice,
not a notice.

**Orphan branches and disconnected components are splitters too.** Pruning
(§6.3) can remove a branch's fork point from the log, and two peers who both
pruned their shared history have components with no common ancestor. Neither
case has an LCA to compare against, so the rules above apply with these
additions:

* **Bystanders** never apply orphan ops (§8, invariant 16).
* **A peer whose own work is orphaned** (it authored ops on that branch)
  forks. The fork is seeded from **its own live DOM**, because the fork
  point is gone from the log. Remote deletes never touch the DOM, so the DOM
  still holds that work. The peer then sees the dialog above: keep working
  on the fork, or join the shared table. This is the "offline longer than 10
  minutes" outcome: such a player should expect a fork rather than a smooth
  merge.
* **A peer with no ops of its own on the orphaned side** (an idle tab that
  slept past the prune) silently adopts the current shared tips.
* **Two components with no common ancestor are a conflict.** If both sides
  pruned their shared history (a GM preparing offline while the players kept
  playing), each branch is rooted at its own checkpoint and the LCA is null.
  It is labelled exactly like any conflict (§5.2): the branch holding the
  earliest-joining author leads, and the splitter forks from its own live
  DOM. If the GM joined first, the GM's branch leads and the players are the
  ones who fork. That is intended.

Orphan detection runs **before** any rebuild (§5.6), so the DOM it would
seed from is still intact.

### 5.5 The forked table's joinSequence

More than one peer can have contributed to the splitter branch. Bob
diverges, Clyde syncs with Bob through a partition that excludes Alice,
and both build on the splitter. Both are offered the dialog. Both may
choose to split off.

The new table's `joinSequence` is therefore reset to **every author
with a contribution on the splitter branch, ordered by their position
in the original joinSequence**

Splitter contributions are the operations reachable from the splitter tip
but *not* from the LCA. The LCA's own author is shared ancestry and does
not count; an author who contributed only to the leader branch is absent
entirely (and if they later open the branch, `ensureJoined` appends them,
sorting them last — which is right, they arrived last).

**Ordering: inherited.** The branch contributions determine the *set*. The
parent table's `joinSequence` determines the *order* — filter it down to
the contributing subset, preserving relative position.

**Authors absent from the parent `joinSequence`** sort last, in op-id order
among themselves. This is reachable in practice — at a fork of a fork, the
branch's `joinSequence` was reset while op-log ancestry from before that
reset survives, so an ancestral author can be in the log and not in the
sequence.

**Inherited arbitrariness is still arbitrary.** If two peers joined the
parent table concurrently, their relative order there was settled by Yjs's
own tie-break, and the fork carries that forward.

**Why this is load-bearing and not cosmetic.** `generateForkTableId` names
the branch by hashing its content, precisely so that Bob and Clyde forking
independently, with no coordination, land on the same table.

Which also means the reset must now happen **before** the hash.

### 5.6 Order-sensitive merges

Structural conflict (§5.1) is per child. But when concurrent branches
insert, remove, or reorder children of the **same parent** without
touching the same child, there is no conflict and no single arrival order
either branch's peer can just apply on top and expect to match its
counterpart — sibling order is exactly the thing arrival order does not
settle.

So the receiving peer does not apply the arrival on top. It **rebuilds**:
reset to the **latest cut checkpoint** of the tip set, then replay the
union of every tip's ancestry back to that checkpoint, in `totalOrder`. A
checkpoint is a **cut** of a set of ops when every op in the set is an
ancestor of it, is it, or descends from it — a moment every branch in the
set has passed through. A checkpoint on only one branch isn't a cut and
isn't used as the base, since it contributes nothing as a delta (§6.1) and
would silently drop the other branch. Every peer that sees the same tips
computes the same order and lands on the same siblings.

A consequence of the tie-break: when two branches concurrently insert or
promote children of the same parent, `totalOrder` favors the more junior
author (later in `joinSequence`), so their insertions or promotions end up
on top.

A rebuild replaces DOM nodes, same as adopting a branch (§5.4) — toy
scripts on the affected subtree are re-activated afterward. It happens
only when a remote update arrives, never mid-gesture, which is why
handlers never keep node references between gestures (§8, invariant 14):
code inside a gesture never sees a rebuild happen underneath it.

A rebuild may also write a **merge checkpoint** (§6.1), if `shouldCheckpoint`
allows one at that point (more than `CHECKPOINT_MIN_OPS` operations since
the last checkpoint). That checkpoint's `parents` are the sorted tips just
rebuilt, which makes it the merge commit: it is the point in the graph
where the branches join. It is fully deterministic — computed the same way
by every peer that rebuilt the same tips — so:

* `authorId` is null.
* `ts` is the latest parent's `ts`.
* its id is a hash of the parents plus the content, the same technique a
  fork's genesis operation uses (§5.5).

Every peer who rebuilds those tips writes the byte-identical checkpoint,
so the duplicates collapse in the `Y.Map` rather than creating divergent
merge points.

---

## 6. Projection / Reprojection

**To project any branch: reset the toys layer to a checkpoint, then apply
that branch's operations in order.**

No inverses. No snapshots. No idempotence problem, because applying a
set of operations to a known base is idempotent by construction -- run
it twice, get the same DOM.

The DOM is durable: normal operation mutates it incrementally and
only reprojection rebuilds it.

### 6.1 A checkpoint is an operation

The base to reset to is just an operation whose `mutations` are "insert
this entire subtree into an empty layer."

**A checkpoint is a projection base, and only a projection base.** Relative
to its parents it changes nothing and records no one's intent — it is
never a delta, and §5.1's classification of concurrent and conflicting
ignores it entirely. Applied anywhere other than as the base of a
projection, it is a no-op.

**A checkpoint's content lives apart from the graph.** The checkpoint op in
the ops map carries its graph data (`id`, `parents`, `authorId`, `gesture`,
`ts`). Its snapshot lives in a second shared map, keyed by op id. The op
record stays immutable (invariant 2); only its content entry is ever
deleted. A toys snapshot is roughly 12–13 KB per toy (≈ 380 KB at 30 toys),
against about 300 B per gesture op, so without this split merge checkpoints
would outweigh the ops many times over.

Once a newer cut with content exists, a checkpoint's content may be
deleted. The **root-most** checkpoint's content (genesis, or the prune root
after a prune, §6.3) is never deleted. A projection's base is the latest cut
**that still has content**. If that is an older cut, the replay is longer but
just as correct.

**A checkpoint with missing parents is a legal root.** Its content stands
alone. Any other op whose ancestry reaches a missing parent, without passing
through a checkpoint first, is an **orphan**, handled in §5.4.

Which means one primitive covers five things we would otherwise build
separately:

* **Genesis.** A new table's first operation, with an empty or seeded
  layer.
* **Import.** Loading an exported `.svg` creates a *new table* whose
  genesis operation carries that file's toys layer. (Import as a gesture
  against a live table would need a merge semantics we don't have and don't
  want.)
* **Checkpoint.** Periodically, an operation that supersedes its ancestry,
  so joining a six-month-old table does not mean replaying six million
  gestures. Log growth is real; a checkpoint is what lets the log be pruned
  (§6.3). The policy for *when* to write one is deferred, the primitive is
  not.
* **Fork.** A branch's new table gets a checkpoint of the LCA state plus
  the splitter branch's ops.
* **Merge.** A canonical rebuild (§5.6) may write a checkpoint of the
  rebuilt state, parented on the tips it merged. Deterministic, so every
  peer that rebuilds the same tips writes the same checkpoint.

  An idle checkpoint (§9) is the opposite choice: it isn't triggered by a
  rebuild every peer computed identically, so it stays authored by the
  triggering peer rather than hashed — there's nothing to gain from
  determinism when only one peer is ever going to write it.

### 6.2 Export

Export serializes the **live DOM**, not a replay of the log. The DOM is a
faithful projection by construction, so replaying to produce something we
already have in memory would be ceremony. Export writes valid, standalone,
Inkscape-openable SVG with the hoisted document-level `<script>` elements
appended — same as `buildExportSvg` does today, and that function survives
mostly as-is, reading the DOM instead of the Yjs tree.

### 6.3 Pruning

The op log does not grow without bound. Any peer may prune, unilaterally:
it deletes from the shared map every op that is a strict ancestor of a
chosen **prune root**, plus those ops' content entries (§6.1). The deletes
replicate, so a peer that joins later downloads only what is left. There is
no acknowledgement and no coordination, including with a peer that is
offline.

**The prune root** is a cut checkpoint, with content, in the ancestry of the
peer's local tips, that meets both conditions:

* **At least T = 10 minutes old, measured from when this peer first saw
  it**, not from its `ts`. That makes the age immune to clock skew. First
  sight is held in memory only, so after a page load every existing cut
  counts as just seen, and nothing is pruned in the first 10 minutes after
  loading.
* **Not the newest cut.** K = 2: at least one newer cut exists. This holds
  whatever the clocks say.

The peer picks the newest checkpoint that satisfies both.

Live play converges within seconds, so a 10-minute lag never orphans an op
from a connected peer. A player who hasn't heard from anyone for 10 minutes
is offline, and should expect a fork (§5.4) rather than a smooth merge.

**When.** A peer prunes after it writes any checkpoint. It never prunes
inside an envelope or while replaying.

**What is deleted.** Strict ancestors of the prune root, and their content
entries. The prune root itself stays, and so does its content: it becomes
the root-most checkpoint (§6.1), and its missing parents make it a legal
root.

**History is recent, not complete.** Undo (§7) cannot reach a pruned op, and
neither can the activity log as an audit trail. With T = 10 minutes, about
10 minutes of history is guaranteed. This is accepted.

**What pruning reclaims.** 1,000 small ops took 310 KB. After deleting 990
of them, the whole document is 31.7 KB, and that is what a new peer
downloads. Each deleted entry leaves about 30 B behind permanently: its key
survives as a tombstone. That residue is the remaining growth (§9).

---

## 7. Undo

For toys, undo is: **append the inverse operation.**

This is mechanically available because §3 already requires every mutation
to carry its old value and every removal to carry its full subtree.
Inverting a `WireMutation` is a local transformation with no lookups:
swap `oldValue`/`newValue`, swap `removed`/`added`, reverse the batch
order. Undo is a gesture like any other, with a `gesture` name that says
so, and it appears in the activity log as an action rather than as a
silent rewriting of history.

Consequences worth stating rather than discovering:

* **Undo is not "reverse the current state."** It is "apply the inverse of
  my operation on top of the current head." If Bob deleted the token
  after Alice moved it, Alice's undo of her move is an operation against a
  token that isn't there, and it does nothing visible. That is correct and
  is what she asked for.
* **Undoing a peer's action becomes tractable.** It is just appending an
  inverse of an operation someone else authored — no `trackedOrigins`
  surgery required. It stays gated on the audit trail
  and on being loud and visible, for social reasons rather than technical
  ones. A trust-based table should let you undo your friend's mistake; it
  should not let you do it invisibly.
* **Redo is the inverse of the inverse.** Falls out. No separate stack.
* **Undo reaches back as far as the prune line** (§6.3), about 10 minutes.
  An op that was pruned cannot be inverted.

### 7.1 Non-Toys Layers

`UndoManager` **still handles** `drawing` and `boundaries` layers,
which are still ordinary `Y.Xml` state layers where it works fine.

---

## 8. Invariants

Cite these by number in code comments and commit messages.

1. Every element in the toys layer has an immutable `data-id`.
2. Operation records are immutable once appended. Corrections are new
   operations.
3. Every mutation carries enough to invert it: old value, or full
   serialized subtree.
4. Gesture execution is synchronous. A handler returning a thenable is an
   error, not a fallback.
5. A gesture's entire observable effect is inside its own layer: the one op
   layer whose DOM its envelope observes. A gesture never spans two layers.
6. A gesture's full reaction cascade is inside its own envelope and its own
   operation.
7. Replay applies mutations. Replay never re-runs handler code.
8. Applying a remote operation never produces an operation.
9. The head is local, per-peer state and is never written to the shared
   document.
10. Authority derives only from `joinSequence`, which is append-only and
    never pruned — except at a fork, where it is filtered down to the
    splitter branch's contributors, preserving their inherited relative
    order
11. Total order over concurrent operations decides sibling order when
    concurrent branches insert, remove, or reorder children of the same
    parent, and nothing else. It never decides an attribute or text value
    and never decides authority. Otherwise it is for display.
12. Projecting a branch means checkpoint-then-replay. Never inverse-and-
    patch.
13. A checkpoint is a projection base, never a delta. It carries no intent
    and never participates in conflict classification.
14. Handlers never keep node references between gestures.
15. Only strict ancestors of a prune root are ever deleted from the log. A
    prune root is a cut with content that this peer first saw at least T
    ago, and it is never the newest cut (§6.3).
16. A checkpoint whose parents are missing is a root. Any other op whose
    ancestry reaches a missing parent is an orphan, and bystanders never
    apply it (§6.1, §5.4).
17. A checkpoint's content may be deleted once a newer cut with content
    exists. The root-most checkpoint's content never is (§6.1).

---

## 9. Dragons

Known-unresolved, listed so nobody thinks they're resolved.

* **Text node identity** (§4.1). The `{parentId, childIndex}` addressing is
  exact within an operation and only as stable as the parent's child list
  across operations. Most likely thing to force a distilled op format.

  *Shandy:* there must be an obvious, if coarse, way to handle this. We don't
  need to worry about CRDT style elegance.  Most text presented in the toys
  layer is a simple label or a numerical displayed value. Save any
  optimization or handling-of-fiddly-cases to later.

* **Log growth and checkpoint policy** (§6.3). Resolved: any peer prunes
  strict ancestors of a prune root, and a peer returning from a long offline
  stretch is handled by the orphan rules (§5.4). What remains open is only
  *when* checkpoints are written. A canonical rebuild (§5.6) is one trigger:
  it may write a merge checkpoint whenever `shouldCheckpoint` allows it.

  *Shandy:* transitions from/to home.html are an obvious checkpoint trigger.
  Also, switching away from the Toys layer in the UI is a good chance.
  Beyond that, I think a user control in ui.js (Peers tab) that lets users
  select auto-checkpointing between 1-10 minute frequencies.

* **Tombstone residue** (§6.3). Each pruned op leaves about 30 B behind
  permanently: its key survives in the shared map as a tombstone. Shorter op
  ids, or starting a fresh document for a table, are the obvious remedies.
  Not needed yet.

<!--
* **SVG's non-local semantics.** `<use>` references, `<defs>`
  dependencies, `xlink:href` targets. Removing a node can break something
  that references it, and no `MutationRecord` reports that. We may need to
  declare a constrained SVG subset rather than "all of SVG."

  *Shandy:* Yes, this is something that the user will be constrained from.
  Skip this until a distant-future user-facing documentation step
-->

* **Multi-node conflict granularity** (§5.1). Resolved: conflict is
  per-child for structure, per-attribute (or per-text-position) for
  values, and same-attribute-on-the-same-node is a conflict regardless of
  whether the values happen to agree. See §5.1 for the precise list.

<!--
* **Cherry-picking.** Adopting the leader branch currently abandons the
  splitter's work to history. Selectively replaying individual splitter
  operations onto the leader is the obvious want and is not designed.

  *Shandy:* Cherry-picking is not a needed or suitable feature for this
  software.  Skip it.
-->

* **Multi-peer partition.** Three-way divergence, where the DAG has three
  tips and pairwise conflict labels do not compose into a single answer.
  Two-way is specified; N-way is not. Note that §6.5 handles N *authors*
  on a two-tip divergence fine — it is N *tips* that is open. A canonical
  rebuild (§5.6) already covers the union of every tip's ancestry, so N
  tips that pairwise don't conflict merge fine today; what's still open is
  labelling *conflicting* N-way splits, where pairwise leader/splitter
  labels don't compose into one answer.

  *Shandy:* I suspect that if we don't get too fiddly in our implementation,
  this will fall out naturally.  But let's defer until our above design
  is validated (no sense working on N-way if we can't get 2-way working)

<!--
* **Fork of a fork.** Inherited ordering (§6.5) composes cleanly — each
  fork narrows the membership and preserves relative order, so seniority
  chains back to the original table rather than being reshuffled at every
  branch. The loose end is the op log's pre-reset ancestry: authors in the
  log but not in the current `joinSequence` hit the sort-last fallback, and
  nobody has checked how deep that can get after several forks.

  *Shandy:* exceedingly rare, and fine.  joinSequence's order is an ergonomic
  convenience.  What's load-bearing is that *some* order can be
  deterministically computed.
-->
