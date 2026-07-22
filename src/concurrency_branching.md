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

### Fast path vs. branch escalation

Branching is heavyweight (a new table, a blocking dialog). We do **not** want a
two-second WiFi hiccup to spray a room with branches and train people to
dismiss the dialog unread. So:

- **Fast path (in place):** trivially-overlapping conflicts — e.g. two
  reactions that both wrote one aggregate result slot, small divergence — are
  resolved in place by asserting the winner's recorded values across the
  touched set. No branch, no dialog. (A quiet activity-log line is fine.)
- **Branch escalation:** only genuinely non-trivial divergence — where
  in-place assertion cannot produce a coherent state, or the divergent region
  is large (the partition case) — escalates to a full branch + Acknowledge
  dialog.

The exact predicate separating "fast path" from "escalate" is an open
implementation detail (see TODO). The touched-set scan is how the fast path
detects overlap; the state-vector gap is how the branch path sizes divergence.

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
   `contents_change_handler` reactions, `Roll All`, and any menu handler that
   reads-and-rewrites existing nodes. These are the transactions that can
   produce unmergeable divergence and thus may require the fast path or a
   branch.

The dividing line is **whether the transaction ran arbitrary envelope-wrapped
code that rewrote existing state**, not which hook fired it and not merely
whether `MutationRecord` is non-empty (a plain reparent has non-empty records
but is a CRDT-safe insert).

---

## Touched-sets (conflict detection for the fast path)

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

---

## Authority ordering (who wins)

The comparator only needs three properties: **total, deterministic, and
computable from synced data on every peer.** Every rule meeting that bar is
equally *correct*; the choice among them is pure ergonomics.

Humans carry a "first-come-first-served" ownership intuition even at an
explicitly owner-free table. To minimize surprise, authority follows **join
order**:

- A dedicated `Y.Array` — `joinSequence` — lives in the document. On startup,
  each client appends its `clientID` **once** (guarded: only if not already
  present).
- Because it is a `Y.Array`, its insertion order *is* the join order:
  CRDT-ordered, causally consistent, identical on every peer, and it survives
  partitions.
- **Comparator:** earlier index in `joinSequence` wins (oldest peer is
  authoritative). For the genuinely-concurrent-join case (two peers append
  before seeing each other), the `Y.Array` insertion order degrades
  automatically to Yjs's own `clientID` tie-break — deterministic, and in a
  case where no human could perceive a "first" anyway.

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

- Rooms persist via `IndexeddbPersistence(`tt:${roomId}`, ydoc)`.
- `home.html` lists tables from the `localStorage` `tt_tables` registry
  (`touchTableRecord`).
- `makeDoc()` is the single doc-construction seam.

So a branch is: a **new `roomId`**, a **new `tt:`-keyed IndexedDB doc** seeded
from the loser's forked state, and a `tt_tables` registry entry with the
shown name. No new persistence machinery.

The first, self-contained implementation step is a **"Duplicate (Fork)"
button on each row of `home.html`'s table list**, alongside the existing
`Delete` button. It reuses `loadRoomDoc(roomId)` (already loads a table's
persisted doc from IndexedDB) to read the source doc, `Y.encodeStateAsUpdate`
to snapshot it, writes that as the seed of a new `tt:${newRoomId}` IndexedDB
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
  slot.
- **Fast path** (small divergence): authority (say A, earlier in
  `joinSequence`) wins in place. The end state on the authoritative table is
  A's whole unit; B's whole unit (die2 *and* its reaction) is what diverges.
- Because die2's insert and its reaction were one unit, there is no
  stale-slot-with-uncounted-die intermediate to repair. This is the key payoff
  of one-transaction commit.
- If divergence were non-trivial (or this were a long partition), B's
  divergent document forks to a branch table and B gets the Acknowledge
  dialog.

Note the earlier "reassert the winner's recorded values across the touched
set" idea is the *fast-path* in-place resolution. The branch path does not
need it — it forks the whole divergent doc rather than repairing individual
nodes.

---

## Open implementation questions (tracked in TODO)

- Exact predicate: fast-path-in-place vs. escalate-to-branch (divergence size
  threshold; what "coherent in-place result" means for opaque handlers).
- Fork primitive: how to snapshot/copy a `Y.Doc` at a causal point into a new
  IndexedDB table, cleanly detaching from the room's provider.
- Dialog UX copy and the branch-naming scheme.
- Where the post-merge scan hooks in relative to `onToysChanged` /
  `dispatchContentsChangeCascade`, and its reentrancy interaction with the
  existing `_dispatchingContentsChange` guard.
