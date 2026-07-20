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
— three scenarios, verified against two real `Y.Doc` replicas synced via
`Y.applyUpdate`/`Y.encodeStateAsUpdate`:
 * `scenario A` — fully concurrent, neither peer has heard from the other.
   Garbles (2 sibling text nodes).
 * `scenario B` (control) — B fully incorporates A's derived-write before
   B's own cascade runs. Clean, correct — demonstrates the mechanism
   works fine when writes are causally ordered, not concurrent.
 * `scenario C` — the sharp case: B's local view already has both dice and
   computes the *correct* sum, but its write is still causally concurrent
   with A's already-committed write. Still garbles.

These tests currently **warn instead of fail** (`warnIfNotClean(...)`,
console.warn, no `expect()` on the semantic value) — the bug is real and
tracked but not yet fixed, and hard-failing the suite for a known,
accepted gap isn't useful. The structural facts that must never regress
*are* hard-asserted: both dice always land in the tray, every replica
converges to the identical final state, and the corruption reproduces
reliably as exactly two sibling text nodes.

**Agreed design: branch on unresolvable conflict.**
Full design record in `concurrency_branching.md`. Summary:

The garble above is one symptom of a general problem: user-authored
handler code is arbitrary and synchronous-but-otherwise-unrestricted (it
may `random()`, restructure subtrees, touch sibling toys), so two
concurrent runs can produce states Yjs cannot merge sensibly, and
recompute-on-conflict is unsafe (non-idempotent handlers). The earlier
LWW-register idea (setAttribute / `Y.Map` key) fixes the *garble* for the
pure-aggregate case but not the general unmergeable-divergence case, so it
becomes only the fast-path in-place resolution, not the whole answer.

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
   yield a coherent state, or a wide causal gap — the network-partition
   case) forks the loser's *full divergent `Y.Doc`* into a new
   IndexedDB-backed branch table (`tt:`-keyed, new `roomId`, `tt_tables`
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
 1. Prototype **"fork a live `Y.Doc` at a causal fork point into a new
    IndexedDB table"** in isolation (vitest, no UI, no comparator needed).
    Everything hangs off this.
 2. One-transaction placement+reaction commit; confirm nested
    `ydoc.transact` collapse for that case.
 3. `joinSequence` `Y.Array` + comparator.
 4. Touched-set construction + post-merge overlap scan (hook relative to
    `onToysChanged` / `dispatchContentsChangeCascade`; mind the
    `_dispatchingContentsChange` reentrancy guard).
 5. Fast-path in-place resolution (winner-assertion) + quiet log line.
 6. Branch escalation predicate + fork wiring + Acknowledge dialog UX.

**Promotion path once fixed:** flip `warnIfNotClean(...)` calls in the
test file to real `expect(...)` assertions — for the fast-path case, on
the correct resolved value; for the branch case, assert the authoritative
table holds the winner's state and a branch table was created. That
graduates these tests from documentation to regression coverage.
