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

* **confined to the toys layer.** All observable effect happens inside
  `#toys-layer`. A handler that writes outside it (eg, `document.body`,
  `localStorage`, a global) has escaped the model, and the operation we
  record and transmit to peers will be incomplete or erroneous.

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
(including an inverse operation — §7). The log a *history*, not a
mutable state blob with extra steps.

`authorId` is self-reported at commit time and is the persistent
`user.js` localId, not Yjs's `clientID`. `clientID` is per-session and
means nothing to a peer who has never met that session. `joinSequence` is
keyed on localId, so an operation must carry the thing authority is
actually resolved against.

### 2.3 A head is local state

Analagous to Git, every peer has a **head**: the op id (or ids) whose
projection its DOM currently reflects. `parents` for a new op is the
current head.

The head is *not* in the shared document. It is per-peer, per-table local
state (localStorage, alongside the table registry). Two peers legitimately
sitting on different heads is not an error state to be reconciled away —
an offline GM working on their own branch while players continue on the
shared one is a valid use case.

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
  two tips. *This is not yet a problem.* Alice recoloured a token while
  Bob moved a different one; both intentions survive and any order gives
  the same result.

* **Conflicting** — concurrent *and* the two branches cannot be projected
  into one DOM. Two peers dropped different dice into the same empty tray
  and each recomputed its total. Two peers reparented the same toy to
  different containers. A node cannot have two parents; a `<tspan>` cannot
  hold two authors' sums.

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

A total order over concurrent operations is a *presentation* choice. Never
build a merge on it.

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
this entire subtree into an empty layer." Which means one primitive covers
four things we would otherwise build separately:

* **Genesis.** A new table's first operation, with an empty or seeded
  layer.
* **Import.** Loading an exported `.svg` creates a *new table* whose
  genesis operation carries that file's toys layer. (Import as a gesture
  against a live table would need a merge semantics we don't have and don't
  want.)
* **Checkpoint.** Periodically, an operation that supersedes its ancestry,
  so joining a six-month-old table does not mean replaying six million
  gestures. Log growth is real and this is the answer to it; the policy for
  *when* to write one is deferred, the primitive is not.
* **Fork.** A branch's new table gets a checkpoint of the LCA state plus
  the splitter branch's ops.

### 6.2 Export

Export serializes the **live DOM**, not a replay of the log. The DOM is a
faithful projection by construction, so replaying to produce something we
already have in memory would be ceremony. Export writes valid, standalone,
Inkscape-openable SVG with the hoisted document-level `<script>` elements
appended — same as `buildExportSvg` does today, and that function survives
mostly as-is, reading the DOM instead of the Yjs tree.

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
5. A gesture's entire observable effect is inside `#toys-layer`.
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
11. Total order over concurrent operations is for display. Never build a
    merge on it, and never build authority on it either.
12. Projecting a branch means checkpoint-then-replay. Never inverse-and-
    patch.

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

* **Log growth and checkpoint policy** (§7.1). The primitive is specified;
  when to write one, and whether old operations are ever dropped from the
  `Y.Map` (and what that does to a peer returning from a long offline
  stretch with ops parented to a discarded ancestor), is not.

  *Shandy:* transitions from/to home.html are an obvious checkpoint trigger.
  Also, switching away from the Toys layer in the UI is a good chance.
  Beyond that, I think a user control in ui.js (Peers tab) that lets users
  select auto-checkpointing between 1-10 minute frequencies.

<!--
* **SVG's non-local semantics.** `<use>` references, `<defs>`
  dependencies, `xlink:href` targets. Removing a node can break something
  that references it, and no `MutationRecord` reports that. We may need to
  declare a constrained SVG subset rather than "all of SVG."

  *Shandy:* Yes, this is something that the user will be constrained from.
  Skip this until a distant-future user-facing documentation step
-->

* **Multi-node conflict granularity** (§6.1). "Conflicting" is currently
  "these branches touched overlapping nodes in incompatible ways." Where
  exactly the line falls — is concurrent `fill` and concurrent `x` on the
  same rect a conflict? — is a policy we will get wrong at least once.

  *Shandy:* we should start coarse and refine it in subsequent optimization
  steps. So let's just start with ANY object ids shared in two concurrent
  commits implies conflict.  This may actually last for a long time, as
  user actions are slow (turn taking is the dominant mode of play) and the
  soft-lock feature defends against many (but not all) such conflicts.

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
  on a two-tip divergence fine — it is N *tips* that is open.

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
