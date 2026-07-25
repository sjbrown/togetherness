# Concurrency & Branching

Design record for TODO #11 ("Correctness"): what happens when two peers act
simultaneously and their handler code (user-authored, arbitrary) produces
states that Yjs cannot merge into a single sensible result.

Status: **agreed design, not yet implemented.** This document is the contract;
the TODO list tracks the build.

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
  wholesale; the other is branched off (see below).
- **We do not replay the loser's actions onto the authoritative table.** Human
  players coordinate re-entry by human means. "Join the table" abandons the
  branch's post-fork edits *on the authoritative table* (the branch itself is
  preserved and reopenable).
- **We do not build a connected-quorum / consensus mechanism** for defining
  authority. See "Authority ordering" for the deliberately-simple rule.
- **Throwing away (relocating) a real user action is acceptable.** The branch
  model means "thrown away" really means "moved to a table you can reopen,"
  not "destroyed."

---

## The model: branch on unresolvable conflict

When two peers' transactions conflict in a way Yjs cannot auto-resolve into a
sensible single state, we pick an **authoritative** side deterministically. The
**losing** side's divergent document is forked into a **new branch table**
saved in the loser's own IndexedDB. The loser is shown a blocking
**Acknowledge dialog** (not a transient toast) telling them:

1. State got out of sync with the other players.
2. The name of their branched-off table.
3. A choice: **join the authoritative table** (their branch is preserved and
   findable in `home.html`, but they resume on the shared table), or **keep
   working on the branch** (they continue solo/however they like, fully
   sync-capable, on the forked table).

The same mechanism scales from a two-transaction race to an hour-long network
partition. A partition is just a conflict with a wide causal gap and a large
divergent region. This unification is the main reason to prefer branching over
discard-with-toast: one mechanism covers both, and no user work is ever
destroyed.

### No fast path — every detected conflict escalates

An earlier version of this design had a "fast path": trivially-overlapping
conflicts (e.g. two reactions that both wrote one aggregate result slot)
would be resolved in place by asserting the winner's recorded values across
the touched set, no branch, no dialog — on the theory that small,
localized divergence didn't warrant the weight of a full branch.

**Rejected.** Working through what "safe to assert in place" would actually
require exposed two problems, not one implementation detail:

- **Asserting only the winner's touched-set** produces a state neither peer
  ever had: e.g. an aggregate slot recomputed as if the loser's die were
  never dropped, while the die itself (a CRDT-safe insert, never in
  question) is still physically sitting in the tray. Confidently wrong is
  worse than visibly stuck.
- **Asserting across the union of both touched-sets** avoids that
  incoherence but is just branch escalation's "discard the loser's
  contribution" outcome, minus the thing that makes discarding
  acceptable — the loser gets a say. A quiet log line is the wrong weight
  for silently dropping real work; a peer who put five minutes into a
  network-partitioned edit deserves the Acknowledge dialog and the
  preserved, reopenable branch, not a toast they'll never see.

The only case where in-place assertion is actually *lossless* — not just
convenient — is when the two touched-sets are **exactly equal**: neither
side has any node the other lacks, so nothing is discarded by favoring
either one. But touched-sets include every node a commit's `MutationRecord[]`
touched, including each side's own freshly-inserted content — and every
toy handler that exists (`tray_sum`, `dice_d6`, `bag`) writes its result via
`tspan.textContent = X`, which always creates a *new* text node with a
fresh, per-commit-unique item id. Two concurrent recomputes of the same
slot therefore never produce equal touched-sets — each side's own new text
node is always in its own set and never the other's. The "equal touched
sets" condition that would make in-place assertion safe essentially never
occurs for real toy code, and would fire for at most a rarely-taken edge
case, at the cost of real complexity (resolving a touched-set key back to
a live Yjs node, mapping each bundle's ephemeral `clientID` to its
author's persistent identity for the authority comparison). Not worth
building for a case that's mostly theoretical.

So: **every conflict `scanForConflicts` detects escalates to a branch.**
There is exactly one resolution mechanism, not two, which also removes an
entire axis of "did we pick the right threshold" risk. The touched-set scan
is how a conflict is detected; the branch operation (below) is what happens
once one is.

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
handler whose own output would require re-running an already-seen tray — a
genuine write-back cycle between trays, not just nesting — is logged
loudly (`console.error`) and skipped, never looped. `commitMove`'s
drop-into-tray path and the observer-driven fallback
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
   divergence and thus may require branch escalation.

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
  described above and returns a `Map<idKeyString, {client, clock}>`.
- **The bundle:** `commitEnvelope` (`envelope.js`) calls
  `recordReactionBundle(ydoc, tr, origin, touched)` from *inside* the same
  `ydoc.transact(...)` that applied the reaction's records — atomic with the
  reaction, per "Preliminary: placement + reaction in ONE transaction"
  above. A bundle is `{clientID, clock, beforeState, touched, origin, ts}`:
  `clientID`/`clock` are this commit's own causal stamp (`clock` read via
  `Y.getState(ydoc.store, ydoc.clientID)` right after the reaction's ops
  landed, since `Transaction.afterState` isn't populated yet inside an open
  transact() call); `beforeState` (`tr.beforeState`, a full state vector) is
  the causal-knowledge boundary this commit started from. Only
  `ENVELOPE_ORIGIN` and `DERIVED_ORIGIN` commits qualify — `LIFECYCLE_ORIGIN`
  is skipped, since a placement's one-time `initialize()` only ever touches
  a freshly-created toy's own fresh subtree, which nothing else has seen yet
  and so can never overlap with another peer's concurrent touched-set.
  Bundles live in a new synced `reactionLog` `Y.Array` (`getReactionLog`).
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
  duplicate origin-filtering logic that already lives in `conflict.js`. It
  makes no Yjs writes of its own (detection only, for now), so it doesn't
  need to consult or set `_dispatchingContentsChange` at all.
- **Status: detection only.** A hit is logged (`console.warn` +
  `App.addLog`); nothing is resolved yet. Fast-path in-place resolution and
  branch escalation are steps 5/6.
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
  `ydoc.getArray('joinSequence')` directly. Not yet consulted by any
  conflict-resolution logic; that's step 4/5.

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

## Worked example (the canonical race)

Peers A and B each hold a die over the same `tray_sum` and release
simultaneously.

- With **one-transaction commit**: A commits {insert die1 + reaction
  slot=sum(die1)} atomically; B commits {insert die2 + reaction
  slot=sum(die2)} atomically. The two reactions overlap on the shared result
  slot — both wrote a fresh text node into the same `tspan`, so `tspan`'s
  own item-id is in both bundles' touched-sets.
- `scanForConflicts` flags the pair (concurrent, overlapping touched-sets).
  Authority (say A, earlier in `joinSequence`) wins: **B's whole document,
  as of B's own current state, forks to a new branch table**, and B gets
  the Acknowledge dialog. A's table is untouched — nothing to repair there,
  since A's own commit was never in question, only synced-against B's.
- Because die2's insert and its reaction were one unit, there is no
  stale-slot-with-uncounted-die intermediate on either side to repair. This
  is the key payoff of one-transaction commit, independent of whether
  resolution is in-place or a branch.
- On B's new branch, die2 is present and correctly counted (it's B's own
  divergent document, unedited) — B loses shared-table membership going
  forward, not the die.

---

## Open implementation questions (tracked in TODO)

- How to snapshot/copy a *live* `Y.Doc` (not an at-rest one loaded fresh
  from IndexedDB) at the moment a conflict is detected into a new
  IndexedDB table, cleanly detaching it from the room's WebRTC provider so
  the branch doesn't keep syncing with the table it just diverged from.
- Mapping a bundle's `clientID` (ephemeral, Yjs-assigned) to its author's
  persistent `localId` (what `joinSequence`/`isAuthoritative` actually key
  on) — needed to know who's authoritative in a detected pair at all.
- Dialog UX copy and the branch-naming scheme.
- Whether "join the authoritative table" should attempt anything beyond a
  plain navigate to `tableId` (e.g. surfacing a diff/summary of what the
  branch has that the authoritative table doesn't) or leave that entirely
  to the branch being reopenable from `home.html`.
