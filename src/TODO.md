# TODO

Known gaps in the toys/trays system, logged here so they don't get lost.
Grouped by kind: identity & addressing, interaction gaps, observability,
open design questions, process/docs.

## Interaction gaps


### 5. Undo / Redo missing features

**Flagged follow-ups (out of scope here):**
 * **Undoing peers' actions.** Only your own actions (origin `null` /
   `ENVELOPE_ORIGIN`) are tracked; remote ops arrive under the provider's
   origin and are untracked. Undoing a peer's move is a wanted capability
   for a trust-based togetherness table, but gated on an audit trail +
   loud, visible undo — see item 7. Wire remote origins into
   `trackedOrigins` only alongside that.
 * **Redo labels are generic.** Forward actions carry a label
   (`UndoRedo.tag`); inverse (redo) items don't, so redo reports "redid a
   change". Fine for now; richer labels can ride along with item 7.
 * **`initialize()` that writes to the doc.** Committed under the untracked
   `LIFECYCLE_ORIGIN`, so it never lands as its own undo step — correct for
   common toys (dice/trays don't define `initialize`). Redo of a placement
   re-inserts the toy from Yjs and does NOT re-run `initialize`; for toys
   whose initial state comes only from `initialize` (e.g. image_object),
   confirm redo restores that state or fold initial state into the
   placement transaction.

### 5.a. Dead code

**Dead-for-undo exports.** `getTtState`/`applyTtState` in `toys.js` are
no longer used by the undo path. Left in place (still exported via the
LayerAPI); remove or repurpose in a separate pass if nothing else needs
them.

### 10. Multi-select drop into a tray doesn't reparent anything

**Where:** `app.js` — `commitMultiMove` (the pointerup handler for a
dragged multi-selection) only ever calls `applyMoveCommit` on each
selected element with the shared group delta. Unlike single-toy drag
(`commitMove`), it never calls `findDropTargetTray`/`reparentToy` for any
element in the group — dragging a multi-selection on top of a tray just
moves everything as a rigid group across the open table, tray or no tray.

**Fix shape:**

Idea one: for each dragged element, run the same drop-target check
`commitMove` does against its own final position (not the group's shared
anchor), and reparent the ones that land inside a tray while leaving the
rest on the table.

Idea two: just drop every dragged element into the tray, as long as both
the "leader" element gets dropped in the tray.




## Observability

### 7. No menu action logging for user & peer visibility and auditing

**Where:** `app.js`'s `invokeToyMenuAction` — the handler for any toy menu
action (a die's own "Roll", "Turn Up", a tray's "Roll All", anything a toy
declares) — runs the action and re-renders, but never calls `addHistory`
or any equivalent. Menu actions are currently invisible in the activity
log entirely, for every toy type, not just trays.

**Context:** noticed while comparing `tray.roll_all` against archive2025's
own `roll_handler`, which wrapped every dispatched action with
`userlog.add(...)` + `ui.addActivityLogItem(...)` — so archive2025 logged
each individual die roll from a "Roll All" as its own activity entry.
Ours currently logs none: not per-die, not even one entry for "Roll All"
as a whole.

**Fix shape:** add an `addHistory(...)` call (matching the pattern already
used for placement/move/delete) in `invokeToyMenuAction`, logging the
action's label at least once per invocation. Whether a multi-sub-action
handler like "Roll All" should log once for the whole action or once per
contained toy it actually rolled is a real design choice — worth deciding
deliberately rather than defaulting to one or the other.

### 8. Updating a toy's js script doesn't fix already-placed instances of that toy

A toy's behaviour scripts aren't fetched fresh each time they run.
`addToySync` reads the SVG file once, at placement time, and
embeds its `<script>` contents as literal data inside that specific toy's
own Yjs subtree. `activateToyScripts` later evaluates whatever text is
*sitting in the Yjs document* for that instance, not the current file on
disk. So a tray placed before a script fix has the old, broken code
permanently baked into its own persisted Yjs data — and keeps throwing on
every "Roll All" forever, even after the fix ships, even after a page
reload, because nothing goes back and re-embeds the corrected script into
data that already exists. A *new* tray placed after the fix is fine.

**Where this bites, concretely:** this is a local-first app with
persistence — a tray placed during any earlier session is still sitting
in that persisted document with the old script baked in, for as long as
that specific toy instance exists.

**Fix shape**
 * Importing SVGs: grab the latest script from toys/ and replace
   anything the document had previously.
 * First load from IndexedDb: similarly use toys/ scripts to clobber
   old scripts

**Must also fix home.html's sampler-seeding path**, which hits a sharper
version of the same root cause: missing scripts entirely, not just stale
ones.
Whatever "always re-fetch canonical scripts from
toys/" mechanism this item lands on for the general case should cover
this path too, so a sampler-seeded room's toys get real scripts embedded
the same as a live-placed one, not zero.

## Process / docs

### 9. Tray end-to-end (Playwright) test

Two browsers, drag die into tray, Roll All, both peers converge.


## Correctness

### 11. Concurrent derived-writes to the same tray can garble instead of merge

Two peers drop different dice into the same empty tray at roughly the same
time. Both dice always land in the tray correctly — concurrent inserts into
a Yjs sequence never overwrite each other. The tray's *derived* display
(e.g. `tray_sum`'s running total) is a different story: each peer's own
local reparent triggers its own local `contents_change_handler` cascade
(gated on `transaction.local` — a peer never recomputes in reaction to a
remote change, only its own), and that handler writes its result via
`tspan.textContent = ...`. Confirmed via a live jsdom `MutationObserver`,
that produces a `childList` mutation (remove old text node, insert new),
which the envelope mirrors as: delete the tspan's existing `Y.XmlText`
child, insert a brand-new one. That makes the displayed sum a Yjs
*sequence*, not a genuine last-write-wins register — so two peers'
causally-concurrent derived-writes are two concurrent
(delete-old/insert-new) ops on the same shared tspan, and the exact
mechanism that keeps both dice safe (concurrent inserts always survive)
is what keeps *both peers' computed values* as sibling text nodes here.
Renders as their concatenation. Every replica converges to the identical
final state — Yjs's convergence guarantee holds — but the value is
nonsense.

What decides the outcome isn't whether a peer computed the right total;
it's whether that peer's derived-write is causally *after* every other
derived-write it needs to supersede. A peer can sum its own local
`contents_group` correctly (both dice already present) and still corrupt
the tray, if its write hasn't yet incorporated another peer's
already-committed write.

**Reproduced and specified in `tests/unit/concurrent-derived-write.test.js`**
— verified against two real `Y.Doc` replicas synced via
`Y.applyUpdate`/`Y.encodeStateAsUpdate`: neither peer has heard from the
other before its own cascade fires; both compute a locally-correct value
against their own partial view, and the concurrent derived-writes garble
into 2 sibling text nodes rather than merging.

**Agreed design: branch on unresolvable conflict.**
Full design record in `concurrency_branching.md`. Summary:

The garble above is one symptom of a general problem: user-authored
handler code is arbitrary and synchronous-but-otherwise-unrestricted (it
may `random()`, restructure subtrees, touch sibling toys), so two
concurrent runs can produce states Yjs cannot merge sensibly, and
recompute-on-conflict is unsafe (non-idempotent handlers).

Resolution model:
 * **Placement + synchronous reaction commit as ONE atomic transaction**
   (they are two today — reaction fires in a microtask after the
   placement's observer returns). This removes the "die inserted but its
   reaction lost → stale slot, uncounted die" intermediate: the unit now
   wins or loses whole. Load-bearing; only sound because handlers are sync.
 * **Fast path (in place):** trivially-overlapping conflicts (detected via
   node-level touched-set intersection from `runInEnvelope`'s
   `MutationRecord[]`) resolve by asserting the winner's values. No branch,
   no dialog. Quiet activity-log line only.
 * **Branch escalation:** non-trivial divergence (in-place assertion can't
   yield a coherent state, or a wide causal gap — the prolonged
   network-partition case) forks the loser's *full divergent `Y.Doc`* into
   a new IndexedDB-backed branch table (`tt-`-prefixed id, new `roomId`, `tt_tables`
   entry) and shows a blocking **Acknowledge dialog** — NOT a toast.
   Dialog offers: join the authoritative table (branch preserved,
   reopenable from `home.html`) or keep working on the branch. No replay of
   the loser's actions onto the authoritative table; humans re-coordinate
   by human means.
 * **Authority = join order.** A never-pruned, append-only `Y.Array`
   (`joinSequence`) in the doc; each client appends its `clientID` once.
   Earlier index wins; concurrent joins degrade automatically to Yjs's
   `clientID` tie-break. Do NOT prune on awareness disconnect — a
   partitioned peer must stay arbitrable; that's why authority lives in the
   doc, not ephemeral awareness.
   When a new branch is created, then a new `joinSequence` is created.

Standard TT ops (move/resize) and pure inserts stay out of this entirely:
they're either non-overlapping or Yjs-auto-resolvable (attribute LWW), and
a silently-dropped resize loser is acceptable and gets no toast.

**Depends on / connects to:**
 * The Acknowledge dialog + activity-log entries are the "loud, visible"
   surface item 7 needs and item 5's peer-undo is gated on. Build the
   audit-log side of this and item 7 together.
 * One-transaction commit interacts with item 5's `initialize()` /
   placement-folding note — fold initial state into the placement
   transaction consistently.

**Implementation order (fork primitive first):**
 1. ✅ **Done.** implement a **"Duplicate (Fork)" button**
 2. ✅ **Done.** One-transaction commit for any code authored by a user.
 3. ✅ **Done.** `joinSequence` `Y.Array` + comparator — implemented in
    `tables.js` (`ensureJoined`, `compareAuthority`, `isAuthoritative`;
    `resetJoinSequenceToSelf` stays private, used only by `forkTable`).
    Originally its own `authority.js` module; folded into `tables.js` since
    `joinSequence` is a property of the table document, same as `yMeta` or
    `yToys` — and unlike those, the `Y.Array` itself is now fully
    encapsulated: nothing outside `tables.js` ever calls
    `ydoc.getArray('joinSequence')` directly, only the exported functions.
    Keyed on `user.js`'s persistent `localId`, not `ydoc.clientID` (which
    is a fresh random number every session and would silently reshuffle
    authority on reload). `ensureJoined` is called from `index.html` after
    IndexedDB sync lands, so a returning peer sees its own earlier entry
    before deciding whether to append. Forking (`tables.js`'s `forkTable`,
    used by home.html's "Duplicate (Fork)" button) now requires a
    `forkingUserId` and resets the branch's `joinSequence` to that id alone
    via `resetJoinSequenceToSelf` — otherwise every player who was ever on
    the source table would carry over and outrank the forking user on
    their own new branch. Not yet consulted by any conflict-resolution
    logic; that's step 4/5.
 4. ✅ **Done.** Touched-set construction + post-merge overlap scan —
    `conflict.js` (`touchedSetFromRecords`, `recordReactionBundle`,
    `areConcurrent`, `touchedSetsOverlap`, `scanForConflicts`) plus a small
    `origins.js` split-out (avoids an envelope.js↔conflict.js import
    cycle). `commitEnvelope` (envelope.js) now builds the touched-set from
    its records and records a bundle — `{clientID, clock, beforeState,
    touched, origin, ts}` — into a new synced `reactionLog` `Y.Array`,
    inside the SAME transaction as the commit itself (atomic, same
    reasoning as step 2). Every origin qualifies — ENVELOPE_ORIGIN,
    DERIVED_ORIGIN, and LIFECYCLE_ORIGIN alike (see the whole-layer
    envelope rework in TOYS.md/envelope.js: nothing about how a handler got
    invoked makes its writes structurally immune to concurrent collision).
    Node identity for the touched-set is each Yjs node's own backing Item
    id ({client, clock} — the same mechanism Yjs's `createRelativePosition`
    uses internally), stable across replicas once synced. `app.js` observes
    `_yReactionLog` (`onReactionLogChanged`) and runs `scanForConflicts`
    against every newly-added bundle — local or remote — logging a hit via
    `App.addLog`/`console.warn`. Verified end-to-end against two real
    synced `Y.Doc` replicas reproducing the canonical race (same result
    slot → flagged; different result slots → not flagged) in
    `tests/unit/conflict.test.js`. Detection only — no resolution yet;
    that's step 5.
 5. Fast-path in-place resolution (winner-assertion) + quiet log line.
 6. Branch escalation predicate + fork wiring (reusing step 1's copy
    mechanics, triggered from a live room instead of home.html) +
    Acknowledge dialog UX.

**Test coverage once fixed:** `concurrent-derived-write.test.js`'s
remaining test stays a warning permanently (see above) — it's substrate
documentation, not a placeholder to flip. Real regression coverage for the
fix is new tests, written as each implementation step lands, exercising the
actual production path: for the fast-path case, `expect()` a single clean
child node holding the authoritative peer's own recorded value (not
necessarily the mathematically-merged total); for the branch-escalation
case, `expect()` that the authoritative table holds the winner's state and
that a branch table was created holding the loser's.
