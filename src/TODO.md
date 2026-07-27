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

✅ **`applyTtState` removed** from `toys.js` (and its `LayerAPI` entry) —
confirmed no caller anywhere (undo/redo, UI, tests). `getTtState` stays: it
has its own live test and no confirmed-dead status the way `applyTtState`
had. `drawing.js`/`boun_pos.js` still have their own `applyTtState` —
out of scope here, not surveyed.

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

**Partially resolved by script hoisting (see `toys.js`, "Script hoisting")
— the remaining gap is narrower than originally scoped, not gone.**

Originally: a toy's *entire* script content was embedded as literal data
inside that specific toy's own Yjs subtree at placement time, so nothing
ever went back and re-embedded a corrected script into data that already
existed.

Now, scripts split into two kinds with different freshness properties:
 * **`src`-referenced scripts** (`dice_utils.js`, `tray.js`) are never
   embedded at all — fetched fresh off disk every session,
   `activateToyScripts` always runs whatever's currently on disk. Fixing a
   bug in one of these files now *does* retroactively fix every
   already-placed instance, including ones from before the fix, with no
   further work needed.
 * **Inline scripts** (a toy type's own behavior-defining code with no
   `src` file — `d6`'s menu/`initialize`, `tray`'s
   `contents_change_handler`, any hand-authored/imported custom toy) are
   still hoisted once, into the document's own `scripts` fragment, at
   first placement — and stay exactly as captured from then on. A fix to
   one of these still doesn't reach already-placed instances or
   already-hoisted document state, for the same fundamental reason as
   before: nothing re-hoists.

So the gap that remains is real but smaller: it's specifically the inline
half of a toy's behavior — for the built-in toy types, that's `d6`'s own
`Roll`/`initialize` and `tray`'s own `contents_change_handler`, the parts
most likely to actually need a fix.

**Fix shape, if still wanted:** on load (or on some explicit "refresh
scripts" action), re-hoist each known toy type's current inline script
over whatever's in the document's `scripts` fragment — the same
`hoistInlineScripts` call `addToySync` already makes at placement time,
just re-run against already-hoisted state rather than gated on "only if
not already present." Needs a decision on whether this should ever
happen automatically (risk: silently changing behavior mid-session for
toys already in play) or only on explicit user action.

## Process / docs

### 9. Tray end-to-end (Playwright) test

Two browsers, drag die into tray, Roll All, both peers converge.

Now that `onReactionLogChanged` actually resolves conflicts (item 11, step
7's wiring), this should also cover the conflict path directly: two
browsers each drag a different die into the same empty tray at roughly the
same time, and both peers converge on one die staying (the authoritative
one, per `joinSequence`) and the other's browser showing the red toast —
the one thing this project's vitest suite structurally can't verify, since
`onReactionLogChanged` is module-private in `app.js` and this project's
whole test-writing convention keeps `app.js` itself e2e-only.


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
 * **Two-tier resolution, not one.** An earlier "fast path" idea (assert
   the winner's touched-set, no branch/dialog) was designed and rejected —
   see concurrency_branching.md, "The rejected fast path, and what was
   built instead" — for good reasons that still hold. What actually got
   built afterward is a *different* mechanism, never subject to those
   objections:
   - **In-place revert (done — `escalation.js` + `snapshot.js`).** Delete
     the loser's own structural insertions; restore whatever pre-existing
     content that same commit removed, from a snapshot captured at commit
     time (before the delete that would otherwise destroy it — this
     project's docs use Yjs's default `gc:true`, so that capture has to
     happen synchronously, in the same transaction). One snapshot slot per
     peer (`(buffer size) = (peer count)`, not per-commit) — a peer's
     second qualifying commit evicts their first slot's contents. Resolves
     the canonical race entirely on the shared table: the loser's die
     ends up back exactly where it was, as a fresh item, not fabricated,
     not discarded. **Red toast**, not silence.
   - **Branch escalation (not yet built)** — for whatever in-place revert
     can't recover (a stale/evicted snapshot, or a partition wide enough
     that no snapshot ever existed for it): forks the loser's *full
     divergent `Y.Doc`* into a new IndexedDB-backed branch table
     (`tt`-prefixed id, new `tableId`, `tt_tables` entry), blocking
     **Acknowledge dialog** — NOT a toast. Dialog offers: join the
     authoritative table (branch preserved, reopenable from `home.html`)
     or keep working on the branch. No replay of the loser's actions onto
     the authoritative table; humans re-coordinate by human means.
 * **Authority = join order.** A never-pruned, append-only `Y.Array`
   (`joinSequence`) in the doc; each client appends its `clientID` once.
   Earlier index wins; concurrent joins degrade automatically to Yjs's
   `clientID` tie-break. Do NOT prune on awareness disconnect — a
   partitioned peer must stay arbitrable; that's why authority lives in the
   doc, not ephemeral awareness.
   When a new branch is created, then a new `joinSequence` is created.
 * **Restoring content isn't automatically idempotent the way deleting it
   is** (see concurrency_branching.md, "Making inserts idempotent") — Yjs
   never deduplicates inserts by content, so two peers each independently
   restoring the same snapshot (or independently reparenting the same toy
   to two different destinations, no revert involved at all) can produce
   two distinct, permanent copies of the same logical toy. Not preventable
   without real coordination machinery this project doesn't have; instead
   detected and cleaned up after the fact — `toys.js`'s `dedupToys`, wired
   into `onToysChanged`, collapses any `data-toy-id` with more than one
   live occurrence down to a deterministic survivor. **Done.**

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
    Keyed on `user.js`'s persistent `localId`.
    `ensureJoined` is called from `index.html` after
    IndexedDB sync lands, so a returning peer sees its own earlier entry
    before deciding whether to append. Forking (`tables.js`'s `forkTable`,
    used by home.html's "Duplicate (Fork)" button) now requires a
    `forkingUserId` and resets the branch's `joinSequence` to that id alone
    via `resetJoinSequenceToSelf` — otherwise every player who was ever on
    the source table would carry over and outrank the forking user on
    their own new branch. Consulted by step 7's `resolveConflictWinner`.
 4. ✅ **Done.** Touched-set construction + post-merge overlap scan —
    `conflict.js` (`touchedSetFromRecords`, `recordReactionBundle`,
    `areConcurrent`, `touchedSetsOverlap`, `scanForConflicts`) plus a small
    `origins.js` split-out (avoids an envelope.js↔conflict.js import
    cycle). `commitEnvelope` (envelope.js) now builds the touched-set from
    its records and records a bundle — `{clientID, clock, beforeState,
    touched, origin, authorId, ts}` — into a new synced `reactionLog`
    `Y.Array`, inside the SAME transaction as the commit itself (atomic,
    same reasoning as step 2). Every origin qualifies — ENVELOPE_ORIGIN,
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
    that's step 7 (step 5's originally-planned resolution mechanism was
    rejected — see step 5).
 5. ✅ **Decided: skipped, as originally conceived.** A "fast path"
    (in-place winner-assertion for trivially-overlapping conflicts, no
    branch/dialog) was designed, then rejected before implementation — see
    concurrency_branching.md, "The rejected fast path, and what was built
    instead". Two problems: asserting only the winner's touched-set
    produces a state neither peer ever had (an aggregate recomputed as if
    the loser's still-present insert didn't exist); asserting the union
    just does branch escalation's job without branch escalation's actual
    safeguard (the loser gets no say, no Acknowledge dialog, for what
    might be real, effortful work). The one case where in-place assertion
    is genuinely lossless — exactly equal touched-sets — turns out to
    structurally never occur for any real toy (`tray_sum`/`dice_d6`/`bag`
    all write via `tspan.textContent = X`, which always creates a fresh,
    per-commit-unique text node, so two concurrent recomputes of the same
    slot never have equal touched-sets). **This specific idea stayed
    rejected — but see steps 7/8: a different in-place mechanism was
    designed and built afterward, never subject to either objection
    above, because it never asserts a value across a touched-set at all.**
 6. Branch escalation: fork wiring (reusing step 1's copy mechanics,
    triggered from a live table instead of home.html, snapshotting the
    *live* doc rather than one freshly loaded from IndexedDB) +
    Acknowledge dialog UX + `tt_tables` entry for the branch. Narrower in
    scope than originally written here: only reached for whatever step 7
    can't recover (see step 7's own scope), not every detected conflict.
    **Not yet built.**
 7. ✅ **Done.** In-place revert with restoration —
    `escalation.js` (`resolveConflictWinner`, `revertBundle`) +
    `snapshot.js` (`snapshotYNode`/`restoreYNodeFromSnapshot`,
    `captureRevertSnapshot`/`recordRevertSnapshot`). `resolveConflictWinner`
    resolves a detected pair's authority using each bundle's self-reported
    `authorId` (new bundle field — see below) against `isAuthoritative`.
    `revertBundle` deletes every item in the loser's touched-set that the
    loser's own commit actually created (`item.id.client ===
    bundle.clientID` — never a pre-existing node the bundle merely
    touched), then restores whatever pre-existing content that commit
    *removed*, if a matching snapshot is available. The snapshot itself:
    `envelope.js`'s `commitEnvelope` now captures a removed pre-existing
    node's full content (clone-before-delete — verified empirically that
    capturing after delete finds nothing, since this project's `gc:true`
    docs strip deleted content synchronously) into the committing peer's
    one `revertSnapshots` slot, consumed (evicted) on successful
    restoration so sequential reprocessing doesn't duplicate. Verified
    end-to-end against the canonical two-peer race, including the
    restored die landing at its original position with its original
    content — not the state at time of revert.

    **Bundles gained `authorId`** (`envelope.js`'s `opts.authorId` →
    `conflict.js`'s `recordReactionBundle`): the committing peer's own
    persistent `user.js` `localId`, self-reported at commit time rather
    than looked up in a separate structure — a bundle needs to be
    resolvable by peers who may never see the authoring peer's own local
    state. Threaded through every production call site.

    **Known, documented gap, not silent:** `revertBundle` doesn't undo a
    losing bundle's own *deletions* if no snapshot survives to cover them
    (evicted by a later commit, or genuinely never captured because
    nothing has captured deletions outside the envelope's own removal
    path). And restoration itself isn't automatically idempotent across
    *concurrent* peers the way deletion is — see step 8.

    **Wired into `onReactionLogChanged`** — see the "Still open" entry
    below for the exact wiring shape and what it deliberately does and
    doesn't guard against.
 8. ✅ **Done.** Duplicate-insert idempotence — `toys.js`'s `dedupToys`,
    wired into `onToysChanged`. Restoring is an insert, and Yjs never
    deduplicates inserts by content, so two peers independently restoring
    the same snapshot (or independently reparenting the same toy to two
    different destinations, no revert involved at all) can each produce a
    permanent, distinct copy — see concurrency_branching.md, "Making
    inserts idempotent", for both scenarios sequenced with the actual
    transmissions. Not preventable (any "check then insert" is racy
    across unsynced peers by construction); detected and cleaned up after
    the fact instead — every `data-toy-id` with more than one live
    occurrence anywhere in the tree collapses to a deterministic survivor
    (smallest `{client,clock}` item-id), independent of
    `resolveConflictWinner`/authority entirely, since there's no
    "conflict" here for authority to adjudicate, just an invariant
    violation. Runs on every structural change, local or remote. Red
    toast on an actual dedup.

**Wiring, done as of this pass:**
 * `resolveConflictWinner`/`revertBundle` are now called from
   `onReactionLogChanged` itself. Every peer that scans a
   newly-added bundle and finds a conflict calls
   `resolveConflictWinner`, then `revertBundle(ydoc, loser)` inside its own
   `ydoc.transact()`, then a red toast (personalized if the local peer is
   the loser) + activity log. Deliberately no
   `_dispatchingContentsChange` guard around the revert transact — unlike
   `invokeMenuActionSync`/`commitMove`, `revertBundle` runs no cascade of
   its own, so `onToysChanged`'s normal fallback (dedup, then the
   observer-driven `contents_change_handler` cascade) is exactly what
   should run afterward, the same as for any other raw structural write
   (undo/redo, import). Guards instead against a same-pass double-count:
   a pair where both sides are newly-added in one observer call is found
   from both directions, deduped locally to resolve each distinct loser
   once. **Not covered by a vitest test** — `onReactionLogChanged` is
   module-private in `app.js`, which stays e2e-only by this project's
   existing convention (see item 9); the functions it calls
   (`resolveConflictWinner`, `revertBundle`, `scanForConflicts`) are each
   already tested in isolation.

**Still open, after steps 7/8:**
 * **Step 6 itself** (branch escalation), now specifically for whatever
   step 7 can't recover.
 * The predicate for which tier applies falls out mechanically already
   (snapshot present + `bundleStamp`-matching → in-place; absent or
   mismatched → should escalate) but nothing currently *acts* on the
   "should escalate" case — right now a mismatch just means nothing gets
   restored, with no branch triggered to catch what step 7 couldn't.

**Test coverage:** `concurrent-derived-write.test.js`'s remaining test
stays a warning permanently (see above) — it's substrate documentation,
not a placeholder to flip. Step 7's actual regression coverage exercises
the real production path end to end: `tests/unit/escalation.test.js`
(`revertBundle` deleting insertions and restoring removals, including the
canonical two-peer race with the restored die's exact position asserted,
plus the concurrent-restoration duplicate race demonstrated directly, not
just described), `tests/unit/snapshot.test.js` (capture/restore
round-trip fidelity against a real toy asset), `tests/unit/envelope.test.js`
(the clone-before-delete capture itself, including an empirical check that
a real `commitMove`-shaped drop captures the *pre*-drop position, not the
post-drop one), and `tests/unit/toys.test.js` (`dedupToys` against both
scenarios in concurrency_branching.md's "Making inserts idempotent",
by name). Once step 6 (branch escalation) is built, it needs the same
treatment: `expect()` that the authoritative table holds the winner's
state and that a branch table was created holding the loser's.
