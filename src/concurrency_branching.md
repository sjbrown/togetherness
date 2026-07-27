# Concurrency & Branching

Design record for TODO #11 ("Correctness"): what happens when two peers act
simultaneously and their handler code (user-authored, arbitrary) produces
states that Yjs cannot merge into a single sensible result.

Status: **detection, in-place resolution (revert + restore), duplicate-id
cleanup, and wiring resolution into the live observer are all implemented
and tested (or, for the observer wiring itself, verified by the pure
functions it calls — see below). True branch escalation, for what
in-place resolution can't recover, is not built.** See "Open
implementation questions" at the end for the precise remaining list.

---

## The problem

A `toy` may carry arbitrary user-authored JavaScript in a
`contents_change_handler` (fired when a tray's contents change) or in a menu
handler like `Roll All`. Both run through the same envelope path
(`runToyHandler` → `commitEnvelope`), which translates the DOM mutations the
handler made into a Yjs transaction.

This code has free rein. Within the layer it may add sub-elements, delete
them, rewrite attributes and text, duplicate or delete whole toys, reach into
sibling toys, and call `random()`. We regulate exactly one thing: **no async**
(handlers must be synchronous). Beyond that, we treat handler effects as
opaque and irreversible-in-the-general-case.

When two peers run such handlers concurrently, Yjs merges the resulting ops
per-CRDT-type, independently:

- Concurrent **attribute** writes to one key resolve last-write-wins-ish
  (deterministic, but not intuitively "latest wall-clock"). This is fine and
  needs no intervention.
- Concurrent **sequence** writes (child inserts, and `Y.XmlText` content
  writes, which is what `tspan.textContent =` compiles to) **both survive**.
  Two peers each writing a computed total of `3` and `4` to the same result
  slot yield `"34"`, not `3` or `4`. This is the core garbling bug.

More fundamentally: even where Yjs *can* pick a single survivor, the surviving
value may be **stale** — each peer computed its handler result against its own
pre-merge view of the contents, so neither result reflects the merged state,
and (by deliberate design, see below) nothing recomputes it afterward.

We cannot fix this by making Yjs "merge smarter." Two independently-computed
outcomes of opaque code are not mergeable. We also cannot fix it by
recompute-on-conflict as a general policy, because handlers may consume
randomness or otherwise produce non-idempotent side effects: re-running a
handler is not a safe do-over.

---

## Non-goals / decisions we are explicitly NOT revisiting

- **We do not attempt server-side or coordinator-based resolution.** A TT table
  is owner-free and peer-to-peer. Every peer must reach the same decision
  independently, from synced data alone.
- **We do not attempt to merge two conflicting handler outcomes.** One wins
  wholesale; the other's contribution is reverted in place where
  recoverable, or branched off where it isn't (see "The model" below).
- **We do not replay the loser's actions onto the authoritative table.** Human
  players coordinate re-entry by human means. "Join the table" abandons the
  branch's post-fork edits *on the authoritative table* (the branch itself is
  preserved and reopenable).
- **We do not build a connected-quorum / consensus mechanism** for defining
  authority. See "Authority ordering" for the deliberately-simple rule.
- **Discarding a real user action outright is never acceptable.** Where
  in-place revert can recover it, nothing is discarded at all — the
  content comes back. Where it can't, "discarded" still means "moved to a
  table you can reopen," via the branch model, not "destroyed."

---

## The model: revert in place; branch when that isn't enough

When two peers' transactions conflict in a way Yjs cannot auto-resolve into a
sensible single state, we pick an **authoritative** side deterministically
(see "Authority ordering"). What happens to the losing side is now a
two-tier answer, not the single "always branch" answer this document
originally specified — the second tier (in-place revert) was designed and
built *after* the first tier's "fast path" was explicitly rejected (see
below), and is a genuinely different, more surgical mechanism, not a
resurrection of the rejected idea:

- **In-place revert (implemented — `escalation.js`).** The loser's own
  structural insertions are deleted from wherever they currently live;
  anything pre-existing the loser's commit *removed* is restored, if a
  matching snapshot is still available (`snapshot.js` — captured at
  commit time, before the delete that would otherwise destroy it, and
  consumed on successful restore). This resolves the canonical race (see
  "Worked example") entirely on the shared table — no branch, no dialog.
  The loser gets a **red toast**, not silence: visible, but not blocking,
  and not offering a choice.
- **Branch escalation (not yet built).** For whatever in-place revert
  can't fully recover — a stale/evicted snapshot (the loser made a second
  qualifying commit before their first was resolved; only the most recent
  is kept, see "Making inserts idempotent" and `snapshot.js`'s
  one-slot-per-peer rule), or divergence wide enough that no snapshot ever
  existed for it (a long network partition) — the losing side's **whole
  divergent document** forks into a new branch table, and the loser gets
  a blocking **Acknowledge dialog**, not a toast: a real choice, because
  what's being set aside might be real, uncoordinated effort, not just an
  insertion or two.

Both tiers answer the same underlying question — "what happens to the
loser's contribution" — the tier only changes *how much* of it can be
recovered *how automatically*. Neither tier is a per-conflict judgment
call the code makes situationally; which one applies falls out
mechanically from whether a matching snapshot exists.

### The rejected fast path, and what was built instead

An earlier version of this design had a "fast path": trivially-overlapping
conflicts (e.g. two reactions that both wrote one aggregate result slot)
would be resolved in place by asserting the winner's recorded values across
the touched set, no branch, no dialog — on the theory that small,
localized divergence didn't warrant the weight of a full branch.

**That specific idea was rejected.** Working through what "safe to assert in
place" would actually require exposed two problems, not one implementation
detail:

- **Asserting only the winner's touched-set** produces a state neither peer
  ever had: e.g. an aggregate slot recomputed as if the loser's die were
  never dropped, while the die itself (a CRDT-safe insert, never in
  question) is still physically sitting in the tray. Confidently wrong is
  worse than visibly stuck.
- **Asserting across the union of both touched-sets** avoids that
  incoherence but is just branch escalation's "discard the loser's
  contribution" outcome, minus the thing that makes discarding
  acceptable — the loser gets a say. A quiet log line is the wrong weight
  for silently dropping real work.

The condition that would have made in-place assertion safe — the two
touched-sets being **exactly equal** — turns out to essentially never occur
for real toy code (every handler writes its result via
`tspan.textContent = X`, which always creates a fresh, per-commit-unique
text node, so two concurrent recomputes of the same slot never produce
equal touched-sets). That's what actually killed the idea: not that
in-place resolution is unsafe in general, but that *this particular
condition for it* was almost never true.

**What was built instead (`escalation.js` + `snapshot.js`) is not that
idea, corrected — it's a different mechanism that was never subject to
either objection above:**

- It doesn't assert a *value* across a touched-set at all. It deletes
  exactly the loser's own newly-created items (`item.id.client ===
  bundle.clientID`, checked per item — never a pre-existing node the
  bundle merely touched) and, separately, restores exactly what that same
  commit *removed*, from a snapshot captured at commit time. Nothing here
  is "assert the winner's version" — it's "undo the loser's insert,
  undo the loser's delete," each independently, using the loser's own
  actual prior content, not a value inferred from the winner's.
- That's why it doesn't produce a state neither peer had: restoring
  die2 to its pre-drop position and content is *literally* a state Bob's
  own client had one moment earlier — not fabricated, not inferred.
- It doesn't silently discard real work either — see "The model" above:
  the loser gets a red toast, and — this is the actual boundary that
  replaces "touched-sets exactly equal" — the mechanism only ever
  recovers what it has a snapshot for. Divergence too large or too old to
  have a matching snapshot doesn't get silently asserted away; it falls
  through to branch escalation instead, where the loser gets the
  Acknowledge dialog and their whole document preserved.

So the "one resolution mechanism, not two" framing this document used to
have is gone, but not because the reasoning that produced it was wrong —
the *specific* fast path it ruled out really was unsafe, for the reasons
above. What replaced it is a genuinely different pair of mechanisms, sized
to what's actually recoverable, that never falls into either trap.

---

## Preliminary: placement + reaction in ONE transaction — done

Previously, a placement (e.g. dropping a die into a tray — a CRDT-safe
sequence insert) and its triggered reaction (the tray's
`contents_change_handler` output) committed as **two** transactions: the
reaction fired in a microtask after the placement's observer returned.

**The placement and its synchronous reaction now commit as a single atomic
transaction**, at every callsite that runs possibly-user-written handler
code — a drop into a tray, a die's own `Roll`, a tray's `Roll All`, and a
toy's placement-time `initialize()`. This was load-bearing for the rest of
this design:

- It removes the "die is inserted but its reaction lost, leaving the slot
  stale and the die uncounted" intermediate state. The placement and its
  reaction now win or lose *together*, as one unit.
- It makes "the loser's divergent state" a well-defined, atomic thing to fork.

This was only sound because handlers are synchronous (our one regulation) —
`envelope.js`'s synchronous envelope path (`runInEnvelopeSync` /
`runToyHandlerSync`) throws rather than silently drop mutations from an
async handler, so that regulation is enforced, not just assumed.

Note this supersedes an earlier framing where "placements are never discard
candidates." Under one-transaction commit, a placement whose reaction loses is
branched *with* its reaction — the unit is the transaction, not the individual
op. Pure inserts with no reaction (or a no-op/side-effect-only reaction) still
never cause a conflict, because they touch fresh nodes and overlap nothing.

**Mechanism:**
A gesture (`invokeMenuActionSync`, `initializeToySync`) runs entirely against
the live DOM first — the handler, then every `contents_change_handler` it
triggers, cascading in rounds from the deepest element upward.
Each round's own new mutations checked for further contents-group membership,
accumulating one combined `MutationRecord[]` with no re-rendering anywhere
in that process, since nothing in it depends on Yjs at all.
Only then is everything translated into Yjs in one `commitEnvelope` call.
Each affected tray's
`contents_change_handler` runs at most once per gesture (a "seen" set); a
handler whose own output would require re-running an already-seen
container — a genuine write-back cycle between containers, not just
nesting — is logged loudly (`console.error`) and skipped, never looped.
`commitMove`'s drop-into-container path and the observer-driven fallback
(`dispatchContentsChangeCascade`, for raw Yjs writes with no self-cascade of
their own: undo/redo, import) are a different case — no DOM records to work
from — and still use the original Yjs-tree-walking mechanism
(`findAncestorTrayIds`, `affectedTrayIdsInnerFirst`,
`runContentsChangeCascadeSync`), nested-transact-collapsed exactly as
before.

---

## Two transaction classes

This clarifies which transactions can ever need bespoke resolution:

1. **Standard TT ops** — move, resize, and the like. Either they never enter
   user code, or the user code they trigger is a no-op / pure side effect
   (e.g. `console.log`) producing an empty or attribute-only `MutationRecord`
   set. Concurrent instances are either non-overlapping or Yjs-auto-resolvable
   (attribute LWW). **No bespoke resolution. No toast.** A silently-dropped
   loser here (e.g. two peers resize the same tray) is acceptable and
   unremarkable.

2. **Envelope-opening ops with non-trivial `MutationRecord` content** —
   `contents_change_handler` reactions, `Roll All`, a toy's placement-time
   `initialize()`, and any menu handler that reads-and-rewrites existing
   nodes. These are the transactions that can produce unmergeable
   divergence and thus may need resolution — in-place revert where a
   snapshot covers it, branch escalation where it doesn't.

The dividing line is **whether the transaction ran arbitrary envelope-wrapped
code that rewrote existing state**, not which hook fired it and not merely
whether `MutationRecord` is non-empty (a plain reparent has non-empty records
but is a CRDT-safe insert).

---

## Touched-sets (conflict detection)

A reaction bundle records the set of Yjs nodes it touched, built from the raw
`MutationRecord[]` that `runInEnvelope` already returns:

- For each record, map `record.target` to its Yjs node via `yNodeFor`.
- Include `addedNodes` and `removedNodes` identities too (a "reroll by
  replace" implementation targets the container via a childList record; the
  affected dice show up in `removedNodes`).
- Granularity is **node-level**, not per-attribute-key. Since the discard unit
  is the whole bundle (arbitrary code, no safe partial revert), a node
  appearing in two concurrently-committed bundles' sets is enough to flag the
  pair.

**No ancestor/descendant inference.** Overlap is keyed on nodes literally
written, never on tree position. Two peers dropping *different* dice into the
*same* tray touch disjoint nodes (each die's own subtree, plus — for an
aggregate tray — the shared result slot). They conflict *only* on the shared
slot they both wrote, not for sharing a container. Inferring "touched a node ⇒
touched its descendants" would produce false positives on exactly the
independent-drop case that must stay conflict-free.

### Implemented in `conflict.js` (+ a `origins.js` split-out)

- **Node identity:** each Yjs node's own backing Item id (`{client, clock}`)
  — the same mechanism Yjs's own `createRelativePosition` uses internally.
  Stable across replicas once synced, so a touched-set built on one peer can
  be compared against one built on another without any app-level id scheme.
  `touchedSetFromRecords(records)` walks the in-scope records exactly as
  described above and returns a `Map<idKeyString, {domId, mutation}>` — a
  small, purpose-built distillation of `MutationRecord`, not a bare id set:
  `mutation` is `'added'`/`'removed'` for a node in a record's
  addedNodes/removedNodes, or the record's own `MutationRecord.type`
  (`'attributes'`/`'characterData'`/`'childList'`) for `record.target`
  itself; `domId` is the touched node's own `data-id` (falling back to a
  plain DOM `id`, falling back to `nodeName`) — for inspection/debugging
  only, never for identity (the Map's own key is the only thing anything
  resolves an item by). Records are processed in order, each entry
  overwriting any earlier one for the same item, so the *final* mutation
  reflects whatever actually happened to that item last within the commit —
  this is what makes a reparent (removed from its old parent, added to its
  new one, same commit) correctly end up tagged `'added'`, not `'removed'`:
  the node didn't vanish, it moved. `escalation.js`'s `revertBundle` keys
  its delete/restore split directly off this: `mutation === 'added'` →
  delete (this bundle's own insertion); anything still `'removed'` by the
  end of the commit → needs a snapshot to recover, the actual signal for
  whether a conflict is fully resolvable in place or needs to escalate.
- **The bundle:** `commitEnvelope` (`envelope.js`) calls
  `recordReactionBundle(ydoc, tr, origin, touched, authorId)` from *inside*
  the same `ydoc.transact(...)` that applied the reaction's records — atomic
  with the reaction, per "Preliminary: placement + reaction in ONE
  transaction" above. A bundle is `{clientID, clock, beforeState, touched,
  origin, authorId, ts}`: `clientID`/`clock` are this commit's own causal
  stamp (`clock` read via `Y.getState(ydoc.store, ydoc.clientID)` right
  after the reaction's ops landed, since `Transaction.afterState` isn't
  populated yet inside an open transact() call); `beforeState`
  (`tr.beforeState`, a full state vector) is the causal-knowledge boundary
  this commit started from; `touched` is `touchedSetFromRecords`'s Map,
  serialized as a plain object (`Object.fromEntries`) for storage; `authorId`
  is the committing peer's own persistent `user.js` `localId` — self-reported
  at commit time rather than looked up in a separate structure, since a
  bundle needs to be resolvable by peers who may never see the authoring
  peer's own local state (see "Authority ordering" for why this matters).
  Every qualifying origin (`ENVELOPE_ORIGIN`, `DERIVED_ORIGIN`,
  `LIFECYCLE_ORIGIN` alike) is bundled — nothing about *how* a handler got
  invoked makes its writes structurally immune to concurrent collision with
  another peer's, so nothing is excluded. Bundles live in a new synced
  `reactionLog` `Y.Array` (`getReactionLog`).
- **Concurrency test:** two bundles are concurrent
  (`areConcurrent(a, b)`) if they have different authors and neither's
  `beforeState` covers the other's `{clientID, clock}` stamp — i.e. neither
  peer had integrated the other's commit when its own began. Combined with
  `touchedSetsOverlap` (set intersection on the touched-set keys),
  `scanForConflicts(reactionLogEntries, newBundle)` returns every existing
  bundle that conflicts with a newly-added one.
- **The scan hook:** `app.js` observes the synced `reactionLog` directly
  (`onReactionLogChanged`, wired in `boot()` alongside the other CRDT
  observers) rather than hooking `onToysChanged` /
  `dispatchContentsChangeCascade` as originally sketched — every commit that
  qualifies (local or remote) always appends to `reactionLog`, so watching
  that array directly sees exactly the events that matter, with no need to
  duplicate origin-filtering logic that already lives in `conflict.js`.
- **Status: detection is wired; resolution is not — this is the actual
  remaining gap, not a rounding error.** `onReactionLogChanged` currently
  only logs a hit (`console.warn` + `App.addLog`) when `scanForConflicts`
  finds one. `escalation.js`'s `resolveConflictWinner`/`revertBundle` exist,
  are tested, and work correctly when called directly — but nothing in
  `app.js` calls them yet. A real conflict today is detected and logged,
  not resolved. See "Open implementation questions."
- **Verified end-to-end** in `tests/unit/conflict.test.js`, including two
  real synced `Y.Doc` replicas driven through the actual production
  `commitEnvelope` path (not hand-built bundles): two peers writing the same
  result slot are flagged; two peers writing different slots are not.

---

## Authority ordering (who wins)

The comparator only needs three properties: **total, deterministic, and
computable from synced data on every peer.** Every rule meeting that bar is
equally *correct*; the choice among them is pure ergonomics.

Humans carry a "first-come-first-served" ownership intuition even at an
explicitly owner-free table. To minimize surprise, authority follows **join
order**:

- A dedicated `Y.Array` — `joinSequence` — lives in the document. On startup,
  each client appends its persistent id **once** (guarded: only if not
  already present). This is `user.js`'s `localId` (`tt-p-v1-DD-XXX`), not
  `ydoc.clientID` — `clientID` is a fresh random number every session and
  would silently reshuffle authority on every reload; `localId` survives
  reloads and reconnects, which "Pruning: no" below requires.
- Because it is a `Y.Array`, its insertion order *is* the join order:
  CRDT-ordered, causally consistent, identical on every peer, and it survives
  partitions.
- **Comparator:** earlier index in `joinSequence` wins (oldest peer is
  authoritative). For the genuinely-concurrent-join case (two peers append
  before seeing each other), the `Y.Array` insertion order degrades
  automatically to Yjs's own `clientID` tie-break — deterministic, and in a
  case where no human could perceive a "first" anyway.
- **Implemented in `tables.js`**: `ensureJoined` (the guarded append, called from
  `index.html` after IndexedDB sync lands, so a returning peer sees its own
  earlier entry before deciding whether to append), `compareAuthority` /
  `isAuthoritative` (the comparator), and `resetJoinSequenceToSelf` (private
  — used internally by `forkTable`, see below). The `Y.Array` itself is
  fully encapsulated: nothing outside `tables.js` ever calls
  `ydoc.getArray('joinSequence')` directly. Consulted by
  `escalation.js`'s `resolveConflictWinner`, which is itself tested and
  correct but not yet called from anywhere live — see "Open implementation
  questions."

### Forking clears `joinSequence` down to the forking user alone

A fork copies the whole source document via `Y.encodeStateAsUpdate` —
including `joinSequence`, and thus every player who was ever on the source
table. Left as copied, that would make those other players outrank the
forking user on their own brand-new branch (they joined the *source* table
earlier), even though they've never seen this branch and may not know it
exists. So `forkTable` (`tables.js`) requires a `forkingUserId` and calls
`resetJoinSequenceToSelf` on the forked doc before persisting it: the new
branch's `joinSequence` ends up containing only the forking user, who is
therefore its sole — and automatically authoritative — member. This isn't
"start a fresh empty `joinSequence`": an empty array would leave the forking
user themselves unrecorded, sorting last against nobody. It's the same array,
reset to exactly one entry.

### Pruning: no

`joinSequence` is **append-only and never pruned.** In particular, do NOT
prune on awareness disconnect. A peer that partitions (tab open, network
dropped — same `Y.Doc`, same `clientID`) must remain arbitrable when it
reconnects, which requires its `joinSequence` entry to still exist. Awareness
is ephemeral and evaporates on disconnect — that is exactly why authority must
live in the *document*, not in awareness. The growth cost is a few integers per
lifetime join, negligible against the SVG document.

### Why not awareness / join-time

Awareness (`provider.awareness`) is ephemeral, LWW, not causally ordered
against document ops, and torn down on disconnect. It is fine for presence
(cursors, colors) but unsound as a conflict arbiter: two peers can hold
disagreeing awareness snapshots at the conflict moment (→ divergent winner
selection), and a partitioned peer's awareness is already gone when you need
it. Self-reported wall-clock join *times* additionally suffer clock skew.
`joinSequence` avoids all of this by living in the CRDT.

---

## The branch (fork) operation

Reached only when in-place revert can't fully recover the loser's
contribution (see "The model" above). The loser is shown a blocking
**Acknowledge dialog** telling them:

1. State got out of sync with the other players.
2. The name of their branched-off table.
3. A choice: **join the authoritative table** (their branch is preserved and
   findable in `home.html`, but they resume on the shared table), or **keep
   working on the branch** (they continue solo/however they like, fully
   sync-capable, on the forked table).

The same mechanism scales from a small unrecoverable divergence to an
hour-long network partition — a partition is just a conflict with a wide
causal gap and a large divergent region, wide enough that no snapshot
could ever have existed for all of it. This unification is the reason to
prefer branching over silent discard for whatever in-place revert can't
reach: one mechanism covers both, and nothing in-place resolution can't
recover is ever simply destroyed.

The loser's branch must be a **full divergent document** — a real, live
`Y.Doc` the user can keep editing and syncing — not a flattened SVG snapshot.
Degrading them to a single-player static file would defeat the "your work is
not trapped, the network is optional" goals.

Architecture already cooperates:

- Rooms persist via `IndexeddbPersistence(tableId, ydoc)`
- `home.html` lists tables from the `localStorage` `tt_tables` registry
  (`touchTableRecord`).
- `makeDoc()` is the single doc-construction seam.

So a branch is: a **new `${tableId}` IndexedDB doc**
seeded from the loser's forked state, and a `tt_tables` registry entry with
the shown name. No new persistence machinery.

The first, self-contained implementation step is a **"Duplicate (Fork)"
button on each row of `home.html`'s table list**, alongside the existing
`Delete` button. It reuses `loadRoomDoc(roomId)` (already loads a table's
persisted doc from IndexedDB) to read the source doc, `Y.encodeStateAsUpdate`
to snapshot it, writes that as the seed of a new `${tableId}` IndexedDB
database, and appends a `tt_tables` registry entry. This exercises the
copy-a-doc-into-a-new-table mechanics that branch escalation needs later,
fully decoupled from causal-fork-point selection (this prototype forks the
whole at-rest doc, not a specific point mid-transaction) and from any live-room
wiring — a clean, isolated first commit. The later, harder version — forking
from a specific causal point in a *live* room, mid-session, at the moment a
conflict is detected — extends this same primitive rather than replacing it.

---

## Making inserts idempotent

Resolution — reverting a losing bundle, or restoring what it removed — is
itself something every peer computes and applies independently, with no
coordinator. That's the whole design. But it has a consequence worth
sequencing out in full: a *delete* converges safely no matter how many
peers redundantly issue it (deleting an already-deleted item is a no-op),
but an *insert* does not — Yjs never deduplicates inserts by content, so
two peers each independently deciding "I should insert X" produce two
distinct X's, permanently. Two scenarios below, sequenced with the actual
transmissions, show this isn't a contrived corner case — one comes
directly out of the revert mechanism itself, the other out of perfectly
ordinary drag-and-drop with no revert involved at all.

### Scenario A: Bob/Clyde revert race

1. **Bob** drags die2 (currently top-level, x=340,y=210) into Tray1. His
   `commitEnvelope`: snapshots die2's pre-drop content into **Bob's own**
   `revertSnapshots['bob']` slot, deletes it from top-level, inserts a
   fresh copy into Tray1 (new item, Bob's clientID), recomputes Tray1's
   sum. Records `bundle_bob` (`touched` = [Tray1's contents_group, Tray1's
   tspan, die2's fresh nodes]). → **transmits** the whole transaction +
   bundle + snapshot to whoever's connected.
2. **Alice**, concurrently, unsynced from Bob, drags die1 into the *same*
   Tray1. Same mechanism — her own snapshot slot, her own bundle
   (`bundle_alice`, `touched` overlapping Tray1's contents_group/tspan
   with Bob's). → **transmits**.
3. **Clyde** was offline for 1–2, comes online, receives both `bundle_bob`
   and `bundle_alice` close together. His `onReactionLogChanged` fires,
   `scanForConflicts` finds the shared Tray1 keys, `resolveConflictWinner`
   picks Alice (earlier `joinSequence`). Clyde calls
   `revertBundle(ydoc, bundle_bob)`: deletes Bob's die2-in-tray copy,
   checks `revertSnapshots['bob']` — present, matching — restores die2 at
   top-level from the snapshot (**new item, Clyde's clientID** — call it
   `die2-C`), evicts `revertSnapshots['bob']`. → **transmits** Clyde's
   whole revert transaction.
4. **Bob**, independently, *also* received Alice's bundle around the same
   time (direct peer link, say) — before Clyde's eviction reached him.
   Bob's own `onReactionLogChanged` *also* fires, *also* concludes he
   lost, *also* calls `revertBundle(ydoc, bundle_bob)` on his own
   replica: deletes his own tray-copy, checks his own (not-yet-evicted)
   `revertSnapshots['bob']` — still present — restores die2 (**new item,
   Bob's clientID** — `die2-B`), evicts locally. → **transmits** Bob's
   revert transaction.
5. Clyde's and Bob's transactions cross-sync. Every peer's doc now
   contains **both** `die2-B` and `die2-C` — same `data-toy-id`, identical
   content (both restored from the one snapshot value that existed before
   either eviction propagated), sitting at the same position, both
   top-level.
6. This is exactly what the dedup pass needs to catch on arrival.

### Scenario B: Alice/Bob reparent the *same* die concurrently

1. **Alice** drags die3 (top-level) into Tray-A. `commitEnvelope`:
   snapshots die3's pre-move content into *her own* slot (this happens on
   *every* reparent, not just revert-related ones), deletes it from
   top-level, inserts a fresh copy into Tray-A (new item, Alice's
   clientID). Bundle recorded, `touched` = Tray-A's stuff + die3-A's fresh
   nodes. → **transmits**.
2. **Bob**, concurrently, unsynced, drags the *same* die3 (from his own
   still-pre-move view) into Tray-B. Same mechanism — fresh copy `die3-B`
   in Tray-B, his own bundle. → **transmits**.
3. Sync: both deletes of the *original* die3 apply (deleting an
   already-deleted item is a no-op, so that convergence is fine) — but
   **both inserts survive**, because Yjs never rejects a concurrent
   insert. Result: `die3-A` sitting in Tray-A, `die3-B` sitting in Tray-B,
   both real, both permanent, same `data-toy-id`.
4. Here's the important part: **`scanForConflicts` never sees this at
   all.** Alice's `touched` and Bob's `touched` share zero keys —
   different trays, different fresh items, no overlapping node anywhere.
   The existing conflict machinery is structurally blind to this, because
   it detects overlapping *nodes*, and this failure mode has no
   overlapping node — it's a duplicated *logical identity* across two
   disjoint locations. This is a genuinely different failure class from
   Scenario A, not another instance of it, and it's exactly why the dedup
   pass needs to be independent of `resolveConflictWinner`/authority
   entirely — there's no "conflict" here for authority to adjudicate,
   just an invariant violation to clean up.

Both converge on the same fix: whoever's `onToysChanged` observer sees a
`data-toy-id` that now has more than one live occurrence, anywhere in the
tree, collapses it deterministically (`toys.js`'s `dedupToys` — smallest
`{client,clock}` item-id survives, same "every peer computes it
independently from the same synced data" principle as authority ordering
itself, just keyed on the items rather than on `joinSequence`, since
there's no "who's more authoritative" question here — both occurrences are
equally legitimate).

---

## Worked example (the canonical race)

Peers A and B each hold a die — die1, die2, already placed elsewhere on the
table — over the same `tray_sum` and release simultaneously. (Dropping an
*already-placed* die into a tray is a reparent, not a fresh insert — that
distinction matters below.)

- With **one-transaction commit**: A's `commitEnvelope` snapshots die1's
  pre-drop content into her own `revertSnapshots` slot (the reparent
  removes it from wherever it was), then commits {reparent die1 into the
  tray + reaction slot=sum(die1)} atomically; B's does the same for die2.
  The two reactions overlap on the shared result slot — both wrote a fresh
  text node into the same `tspan`, so `tspan`'s own item-id (and the
  tray's `contents_group` item-id, both pre-existing, shared) end up in
  both bundles' touched-sets.
- `scanForConflicts` flags the pair (concurrent, overlapping touched-sets).
  Authority (say A, earlier in `joinSequence`) wins.
- Every peer that sees both bundles — A, B, and any third peer who synced
  both — independently calls `revertBundle(ydoc, bundleB)` (wired in
  `onReactionLogChanged`; see "Open implementation questions" for what
  isn't wired yet). It deletes die2's post-drop item (created
  by B, so it qualifies) from the tray, then checks B's revertSnapshots
  slot — present, matching this exact commit — and restores die2 to its
  own pre-drop content and position, as its own fresh item, at the top
  level (or wherever it originally was). B gets a red toast. A's side is
  untouched — her own commit was never in question, only synced-against
  B's.
- Because die2's insert-into-the-tray and its reaction were one unit, there
  is no stale-slot-with-uncounted-die intermediate to repair — the delete
  and the restore both land in one transaction. This is the key payoff of
  one-transaction commit, independent of which resolution tier ends up
  handling it.
- Die2 ends up back where B actually had it a moment before — not
  discarded, not forked to a separate table, not asserting a fabricated
  value. B's next move is still on the shared table, with the die in hand
  again.
- **If B had made a second qualifying commit before this resolution ran**,
  B's `revertSnapshots` slot would hold a *different* `bundleStamp` (or
  none), and `revertBundle`'s restoration step would find no match —
  die2's post-drop item still gets deleted, but nothing gets restored in
  its place. This is exactly the case that needs branch escalation
  instead, not something the current mechanism silently gets wrong.

---

## Open implementation questions (tracked in TODO)

**Done, no longer open:**
- ~~Mapping a bundle's `clientID` to its author's persistent identity~~ —
  bundles self-report `authorId` at commit time (`envelope.js`'s
  `opts.authorId`); no separate lookup structure needed.
- ~~In-place resolution mechanism~~ — `escalation.js`'s
  `resolveConflictWinner`/`revertBundle`, `snapshot.js`'s capture/restore.
  Tested against the canonical two-peer race end to end, including the
  restored die landing at its original position.
- ~~Duplicate-`data-toy-id` cleanup~~ — `toys.js`'s `dedupToys`, wired into
  `onToysChanged`. Needed because resolution's own restoration step, and
  ordinary concurrent reparenting, can both legitimately produce two
  inserts of the same logical toy — see "Making inserts idempotent" above.

**Still open:**
- ~~Wiring `resolveConflictWinner`/`revertBundle` into `onReactionLogChanged`
  itself~~ ✅ **Done.** Every peer that finds a conflict now resolves it —
  see `TODO.md`'s item 11, step 7's "Still open" note for the exact
  mechanism and why it deliberately has no `_dispatchingContentsChange`
  guard (unlike the gesture-triggered paths, `revertBundle` runs no
  cascade of its own, so the normal fallback should run after it, not be
  suppressed).
- **The branch escalation fallback itself** — nothing built yet for the
  case `revertBundle`'s restoration can't cover (see "The model" and the
  worked example's last bullet). Needs: how to snapshot/copy a *live*
  `Y.Doc` (not an at-rest one loaded fresh from IndexedDB) at the moment
  a conflict is detected into a new IndexedDB table, cleanly detaching it
  from the room's WebRTC provider so the branch doesn't keep syncing with
  the table it just diverged from.
- **The predicate for which tier applies.** Falls out mechanically today
  (snapshot present and `bundleStamp`-matching → in-place; absent or
  mismatched → should escalate) but nothing currently *acts* on the
  "should escalate" case at all — right now `revertBundle` just silently
  doesn't restore, with no branch triggered to catch what it couldn't.
- Dialog UX copy and the branch-naming scheme.
- Whether "join the authoritative table" should attempt anything beyond a
  plain navigate to `tableId` (e.g. surfacing a diff/summary of what the
  branch has that the authoritative table doesn't) or leave that entirely
  to the branch being reopenable from `home.html`.
