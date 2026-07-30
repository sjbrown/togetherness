# Concurrency and Branching

How the toys layer replicates, how peers diverge, and what happens when they do.

This document is the design record for the toys layer's replication model.
It supersedes `concurrency_branching.md`, which described a
detect-and-revert design built on top of `Y.XmlFragment` that has been
abandoned wholesale — not tuned, not narrowed. If you are looking for
`conflict.js`, `escalation.js`, `snapshot.js`, or the `reactionLog`, they
are gone and this file explains why they had to be.

The audience is us.

---

## 1. What went wrong

The toys layer was a `Y.XmlFragment` of `Y.XmlElement`. The premise was
that since SVG is XML, and Yjs ships an XML CRDT, the CRDT tree could
simply *be* the SVG tree. That premise is wrong, and it is wrong at the
level of the data model rather than at the level of our use of it.

**XML has no object identity; SVG pretends it does.** `<rect id="r1">`
has an identity to a user, to a script, and to a `getElementById` call.
It has no identity to XML, which knows only "a node at a position in a
child list." Yjs's identity for that node is its backing `Item` — a
different thing, with a different lifetime.

Three symptoms, one cause:

* **Z-order.** Raising a toy in front of another is, in SVG semantics,
  "the same rect, now later in the child list." In `Y.Xml` it is a delete
  plus an insert, and the node's CRDT identity is destroyed. Everything
  keyed to it — a touched-set entry, a snapshot, a relative position —
  silently refers to a corpse.

* **Reparenting.** Dropping a die into a tray is `MoveNode` to a user and
  to the DOM API. It is delete-then-insert to XML. `reparentToy` was
  rewritten twice to work around this and the second rewrite (DOM-based,
  exploiting the fact that the DOM is a lossless mirror) was really a
  quiet admission that the DOM had already become the better
  representation.

* **The `<tspan>67</tspan>` bug.** Two peers concurrently set a tray's
  displayed sum. `Y.XmlText` is a character sequence CRDT, so two
  concurrent whole-value assignments merged as a sequence rather than
  contending as a register. Every replica converged — Yjs's guarantee
  held perfectly — on a value that was nonsense. This is not a Yjs defect.
  It is what a sequence CRDT is *for*. We had an integer property and told
  the library it was a collaborative text field.

The pattern: we asked a replicated *data structure* to serve as a
replicated *object model*. Every fix we shipped was a patch at the wrong
layer, and the two-tier transaction classes, the touched-set intersection,
the surgical revert, and the duplicate-`data-toy-id` sweeper were all
epicycles on that mistake. They are removed.

**What was right and is kept:** `joinSequence`. An append-only,
never-pruned `Y.Array` of persistent user ids, in join order, biasing
authority toward the peer who created the table. That is still exactly the
tie-breaker we want, and it is now the *only* thing authority is derived
from.

---

## 2. The model

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
   user-written ones — see an ordinary DOM and use ordinary DOM APIs. We
   will never know all the verbs; the engine must accept any synchronous,
   dependency-free JS that manipulates SVG. This is the project's whole
   reason for existing and everything else bends around it.

2. **The operation DAG is the source of truth.** Not the DOM. The DOM is
   the current projection of the DAG, reconstructible from it and
   discardable at will.

3. **Yjs is transport.** For the toys layer it replicates an append-only
   set of immutable operation records and nothing else. It no longer holds
   document content, no longer arbitrates anything, and no longer has an
   opinion about our semantics. It is very good at the job it now has:
   offline sync, causal delivery, efficient encoding.

### 2.1 Layers that did *not* change

`Y.Xml` is fine, and stays, for `drawing` and `boundaries`. Those layers
have no object identity to preserve, no reparenting, no derived values,
and no user scripts — a freehand stroke is genuinely just a node at a
position. `meta` stays a `Y.Map`. The document's hoisted `scripts`
fragment stays a `Y.XmlFragment`; it is append-mostly and never contended.

The mistake was never "Yjs XML types." It was "Yjs XML types for the toys
layer."

---

## 3. Gestures and operations

### 3.1 A gesture is a transaction

A **gesture** is one user intention: a drag, a resize, a menu action
("Roll"), a placement, a delete, an edit. Its execution is:

* **explicitly delimited.** The envelope opens before any handler runs and
  closes after. We do not infer the boundary from `MutationObserver`'s
  microtask batching — the browser's batch boundary is "everything before
  the next checkpoint," which is not the same thing as our gesture, and
  conflating them means an unrelated animation frame lands inside
  someone's dice roll.

* **synchronous, and enforced so.** No `await`, no `setTimeout`, no
  `fetch`, no promise. `runInEnvelopeSync` throws if a handler returns a
  thenable. This is not a limitation we tolerate; it is the property that
  makes the boundary meaningful, and the async variants that survive in
  `envelope.js` today are removed.

* **confined to the toys layer.** All observable effect happens inside
  `#toys-layer`. A handler that writes outside it — `document.body`,
  `localStorage`, a global — has escaped the model, and the operation we
  record will be an incomplete description of what happened.

* **recursive.** A handler may trigger another handler, which may trigger
  another. All of it is one envelope, one batch, one operation. This is
  what makes the derived-value cascade correct rather than a hazard (§5).

### 3.2 An operation

```
Operation {
  id        : string          // content-independent unique id
  parents   : string[]        // op ids; the DAG edges
  authorId  : string          // persistent user.js localId, never Yjs clientID
  gesture   : string          // 'move' | 'roll' | 'place' | … , for the audit log
  mutations : WireMutation[]  // §4
  ts        : number          // wall clock, for display only, never for ordering
}
```

Stored in `Y.Map<opId, Operation>`, not `Y.Array`. The reason is not
stylistic: a `Y.Array` asserts that position is meaningful, and it is not.
When Alice's three offline ops meet Bob's two, there is no correct place
in a list for Bob's first op to go — any position we choose is invented,
and having invented it we will be tempted to believe it. A map says only
"these operations exist"; the `parents` pointers say how they relate. The
DAG is computed from the map, never stored as a second structure that can
disagree with it.

**Operations are immutable.** Never rewrite one. Never append to a
`parents` array. Correcting something means appending a new operation
(including an inverse operation — §8). This is the rule that makes the log
a history rather than a mutable state blob with extra steps.

`authorId` is self-reported at commit time and is the persistent
`user.js` localId, not Yjs's `clientID`. `clientID` is per-session and
means nothing to a peer who has never met that session. `joinSequence` is
keyed on localId, so an operation must carry the thing authority is
actually resolved against.

### 3.3 A head is local state

Every peer has a **head**: the op id (or ids) whose projection its DOM
currently reflects. `parents` for a new op is the current head.

The head is *not* in the shared document. It is per-peer, per-table local
state (localStorage, alongside the table registry). Two peers legitimately
sitting on different heads is not an error state to be reconciled away —
a GM working on their own branch while players continue on the shared one
is the system working. Putting the head in the doc would make it a
contended value and reintroduce, at the coordination layer, exactly the
class of bug we just deleted from the content layer.

---

## 4. The wire format

A `MutationRecord` cannot be transmitted. It holds live node references,
and its `addedNodes`/`removedNodes` are detached from the tree by the time
anyone serializes them. So there is a wire form.

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

Distilling further — into `MoveNode(node, parent, before)` and friends —
is deliberately deferred. It buys compactness and a cleaner inverse, and
it costs a semantic commitment we are not ready to make. We will do it
when something concrete demands it, and this section is where the argument
will go when it does.

Three things the wire form must get right, none of which are optional:

**Added and removed subtrees are serialized in full.** `added` carries the
complete markup of each inserted node, not a reference — the receiving
peer has never seen it. `removed` likewise carries the full subtree of
each removed node, captured *before* the removal takes effect. That second
one costs us nothing at capture time and buys invertibility for free (§8),
which is the whole reason undo stops being a research project.

**Old values are captured.** `attributeOldValue` and
`characterDataOldValue` stay on in the observer options. Same reason.

**Sibling anchors are node references, not indices.** A `child` record
records `previousSibling`/`nextSibling` as identities. An index is a
statement about a tree state the receiving peer may not be in.

### 4.1 Node identity

Every element in the toys layer carries a stable, immutable `data-id`,
assigned at creation and never rewritten. `id` remains user-facing and
mutable; `data-id` is ours. This does not compromise the standards-first
goal — the SVG stays valid, inspectable, Inkscape-editable, and
`data-*` is exactly the standard's provision for this. It is the same
arrangement as a database primary key that the application doesn't let you
edit, and nobody finds that strange.

We considered simply forbidding users to change `id`. Rejected: the moment
we support imported SVG, copy/paste, or a third-party toy — all of which
are on the roadmap — that rule is violated by someone who never read it,
and the failure is silent corruption rather than an error.

**Text nodes are the weak joint.** A text node cannot carry an attribute,
and `characterData` records target it directly. It is addressed as
`{ parentId, childIndex }`. Within a single operation this is exact: the
parent is identified, and the batch's own records fully describe any
sibling changes. Across operations it is only as stable as the parent's
child list, which is why the checkpoint primitive (§7) has to be able to
express text positions too, and why coalescing text mutations across
operations is not safe. This is the part of the design most likely to need
revisiting; a distilled `ReplaceText(nodeId, value)` op with real text-node
identity is the obvious escape hatch if it bites.

### 4.2 Applying a batch is not capturing one

A peer applying a remote operation is mutating its own DOM, and its own
`MutationObserver` will see every one of those mutations. If that produced
a new operation, two peers would generate operations at each other
forever.

Replay therefore runs with capture suppressed. This is a flag, it is
unglamorous, and getting it wrong produces an infinite loop rather than a
subtle bug, which is the good kind of failure mode.

---

## 5. Replay never re-runs handler code

This is the most important sentence in the document, so it gets its own
section.

A peer receiving an operation applies its recorded **mutations**. It does
not re-execute the gesture that produced them.

Everything follows from this:

**Handler non-determinism is fine.** A die's `Math.random()` runs once, on
the peer that rolled it, and the result is a recorded mutation. There is
no need for a seeded `context.random()`, no need for a virtualized
`Date.now()`, no need for a deterministic sandbox, and no need to police
`getBoundingClientRect` inside handlers. The discussion this design came
out of spent real effort on determinism-of-replay; that effort is only
required if replay means *re-execution*, and ours doesn't. We get to keep
the loose, permissive, do-whatever-you-want scripting environment that is
the point of the project.

**Derived values must be captured, not recomputed.** A tray's running
total is computed by the peer that changed the tray's contents, inside
that peer's envelope, as part of that operation. A receiving peer applies
the resulting mutation and does not run `contents_change_handler` at all.

This is the direct fix for the `<tspan>67</tspan>` failure. That bug was
two peers each independently computing a locally-correct value and both
writing it as merging data. Under this model the drop and the recomputed
sum are one indivisible operation; two concurrent drops are two operations
that both touch the sum, which is a *branch* (§6) and gets adjudicated as
one, rather than a merge that produces a number no peer ever computed.

Note the shape of the reversal. The old design's `transaction.local` gate
on the cascade was an optimization — avoid redundant work. Here the same
gate is a correctness invariant: a peer that recomputes in reaction to a
remote operation has fabricated an operation that nobody performed.

**Corollary — the envelope must be greedy.** If a gesture's reaction
cascade is not inside its envelope, the operation is an incomplete
description of the gesture and applying it produces a DOM that no peer
ever had. `runGestureSync`'s existing behaviour — run the handler, run the
full cascade, then serialize everything as one batch — is exactly right
and becomes load-bearing rather than merely tidy.

---

## 6. Divergence

### 6.1 Three relationships, not two

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
they touched. Collapsing these two was a persistent source of confusion in
the old design, which reported conflicts for things that merged fine.

### 6.2 Leader and splitter

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
the host is the right guess.

### 6.3 Causal order is not display order

Two separate questions, repeatedly conflated:

* *Did A happen before B?* — ancestry in the DAG. Real, meaningful,
  computable.
* *If A and B are concurrent, which do we list first?* — a deterministic
  tie-break, for the activity log and for reproducible iteration. Says
  nothing about time.

A total order over concurrent operations is a *presentation* choice. Never
build a merge on it.

### 6.4 What a peer does about it

If the local peer has contributed nothing to the splitter branch, it
follows the leader. Silently — this is the ordinary case for a bystander
and warrants an activity-log line at most.

If the local peer authored something on the splitter branch, it is asked,
because only the user knows whether that work matters:

* **Join the shared table.** Adopt the leader as head, reproject (§7).
  Their splitter work is not destroyed — it is still in the op log, and
  still reachable — but it is no longer on their head.
* **Keep working on my branch.** Fork to a new table with the splitter
  branch as its history and a fresh `joinSequence` — see §6.5, which is
  more than the one-liner it looks like.

The dialog does not dismiss on scrim-click or Escape. It is a real choice,
not a notice.

Both mechanisms already exist and survive the teardown intact:
`tables.js`'s `forkLiveDoc`/`generateForkTableId` (content-hash-named, so
two peers forking independently land on the same table id without
coordinating) and `ui.js`'s `showBranchDialog`.

### 6.5 The forked table's joinSequence

More than one peer can have contributed to the splitter branch. Bob
diverges, Clyde syncs with Bob through a partition that excludes Alice,
and both build on the splitter. Both are offered the dialog. Both may
choose to keep working.

The new table's `joinSequence` is therefore **not** reset to the forking
user. It is reset to **every author with a contribution on the splitter
branch, ordered by their position in the original joinSequence**

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

Which also means the reset must now happen **before** the hash, reversing
the current ordering constraint and the comment that explains it.

* `resetJoinSequenceToSelf(ydoc, soleId)` generalizes to
  `resetJoinSequence(ydoc, orderedIds)`. `forkTable` — home.html's
  "Duplicate" button, forking an at-rest table with no branch to compute
  anything from — keeps the old behaviour by passing a single-element
  array.
* `forkLiveDoc` no longer needs `forkingUserId`. It takes the ordered
  sequence, computed by the caller. This keeps `tables.js` ignorant of the
  operation DAG, which it should stay.
* A single-op splitter branch yields a single-element sequence — exactly
  today's behaviour. The new rule generalizes the old one rather than
  replacing it.

---

## 7. Reprojection replaces revert

The old design, faced with "this peer's DOM reflects a branch it should
not be on," tried to *undo the difference*: compute the losing commit's
touched-set, delete the items it created, restore from a snapshot whatever
it had removed. That is `escalation.js` and `snapshot.js`, and it is
deleted.

It could not have been made to work. Every one of its problems traces to
the same root: it needed a durable cross-replica identity for content in
order to surgically remove it, and `Y.Xml` destroys exactly that identity
on the operations we most needed to reverse. The snapshot slots, the
one-per-peer eviction rule, the ordering trap where asking
`needsEscalation` after `revertBundle` reports a false positive, the
"documented gap" where a losing commit's own deletions survive if the
snapshot was evicted, and finally the `dedupToys` sweeper to clean up after
concurrent restorations that a coordinator could have prevented and we had
no coordinator to provide — that is not a feature with rough edges. That
is a structure telling us it is the wrong structure.

With an operation log the answer is wholesale and boring:

**To project any branch: reset the toys layer to a checkpoint, then apply
that branch's operations in order.**

No inverses. No snapshots. No touched-set arithmetic. No idempotence
problem, because applying a set of operations to a known base is
idempotent by construction — run it twice, get the same DOM. The
expensive-sounding "throw away the DOM and rebuild it" is a thing we
already do on every single Yjs transaction today (`render()` does
`layerEl.innerHTML = ''` and rebuilds from scratch), so it is not even a
new cost; it is the *same* cost, moved to the rare path where it belongs.

And it removes a whole bug class along the way. Today's
rebuild-on-every-transaction is why no DOM reference can be cached across
a drag, why click handlers have to be rewired on every render, and why
`commitEnvelope` deliberately doesn't render. Under the new model the DOM
is durable: normal operation mutates it incrementally and only reprojection
rebuilds it.

### 7.1 A checkpoint is an operation

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

### 7.2 Export

Export serializes the **live DOM**, not a replay of the log. The DOM is a
faithful projection by construction, so replaying to produce something we
already have in memory would be ceremony. Export writes valid, standalone,
Inkscape-openable SVG with the hoisted document-level `<script>` elements
appended — same as `buildExportSvg` does today, and that function survives
mostly as-is, reading the DOM instead of the Yjs tree.

The same code produces a checkpoint's payload. That is not a coincidence
worth resisting.

---

## 8. Undo

`Y.UndoManager` does not survive for the toys layer. It cannot: the toys
layer's Yjs content is now an append-only map of immutable operation
records, and undoing "an operation record was appended" removes the record
without touching the DOM state it described. The abstraction is at the
wrong level, in the same way and for the same reason that Yjs's internal
update history was never a candidate for our operation log.

`UndoManager` **does** survive for `drawing` and `boundaries`, which are
still ordinary `Y.Xml` state layers where it works fine and where nobody
has complained.

For toys, undo is: **append the inverse operation.**

This is mechanically available because §4 already requires every mutation
to carry its old value and every removal to carry its full subtree.
Inverting a `WireMutation` is a local transformation with no lookups:
swap `oldValue`/`newValue`, swap `removed`/`added`, reverse the batch
order. Undo is a gesture like any other, with a `gesture` name that says
so, and it appears in the activity log as an action rather than as a
silent rewriting of history.

Consequences worth stating rather than discovering:

* **Undo is not "reverse the current state."** It is "apply the inverse of
  my operation on top of the current head." If Bob deleted the goblin
  after Alice moved it, Alice's undo of her move is an operation against a
  goblin that isn't there, and it does nothing visible. That is correct and
  is what she asked for.
* **Undoing a peer's action becomes tractable.** It is just appending an
  inverse of an operation someone else authored — no `trackedOrigins`
  surgery required. It stays gated on the audit trail (`TODO.md` item 7)
  and on being loud and visible, for social reasons rather than technical
  ones. A trust-based table should let you undo your friend's mistake; it
  should not let you do it invisibly.
* **Redo is the inverse of the inverse.** Falls out. No separate stack.

---

## 9. Invariants

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
    order (§6.5).
11. Total order over concurrent operations is for display. Never build a
    merge on it, and never build authority on it either.
12. Projecting a branch means checkpoint-then-replay. Never inverse-and-
    patch.

---

## 10. Dragons

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
