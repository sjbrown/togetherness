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


### 10. Multi-select drop into a tray doesn't reparent anything

**Where:** `app.js` — `commitMultiMove` (the pointerup handler for a
dragged multi-selection) only ever calls `applyMoveCommit` on each
selected element with the shared group delta. Unlike single-toy drag
(`commitMove`), it never calls `findDropTargetTray`/`reparentToy` for any
element in the group — dragging a multi-selection on top of a tray just
moves everything as a rigid group across the open table, tray or no tray.

**Fix shape:**

Just drop every dragged element into the tray, as long as
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

So the gap that remains is: specifically the inline
half of a toy's behavior — for the built-in toy types, that's `d6`'s own
`Roll`/`initialize` and `tray`'s own `contents_change_handler`, the parts
most likely to actually need a fix.

**Fix shape:** on network load of a toy .svg, or file load of an exported
table .svg , or the clicking of a yet-to-be-built "Refresh" button in the
"Tools" tab, re-hoist each known toy type's current inline script
over whatever's in the document's `scripts` fragment — the same
`hoistInlineScripts` call `addToySync` already makes at placement time,
just re-run against already-hoisted state rather than gated on "only if
not already present."

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
Full design record in `concurrency_branching.md`.

**Depends on / connects to:**
 * The Acknowledge dialog + activity-log entries are the "loud, visible"
   surface item 7 needs and item 5's peer-undo is gated on. Build the
   audit-log side of this and item 7 together.
 * One-transaction commit interacts with item 5's `initialize()` /
   placement-folding note — fold initial state into the placement
   transaction consistently.

**Implementation order (fork primitive first):**
 6. Branch escalation: fork wiring (reusing table fork's copy mechanics,
    triggered from a live table instead of home.html, snapshotting the
    *live* doc rather than one freshly loaded from IndexedDB) +
    Acknowledge dialog UX + `tt_tables` entry for the branch.
    Narrower in scope than originally written here: only reached for
    whatever step 7 can't recover
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

**Still open, after steps 7/8:**
 * **Step 6 itself** (branch escalation), now specifically for whatever
   step 7 can't recover. **The fork primitive is done** —
   `tables.js`'s `forkLiveDoc`/`generateForkTableId`: simpler than the
   existing `forkTable`, not harder (no `loadTableDoc` step, since the
   source doc is already live in memory), named deterministically from
   content (SHA-256 of `Y.encodeStateAsUpdate`, truncated) rather than
   randomly, so that Bob and Clyde (see concurrency_branching.md, "Making
   inserts idempotent") can each fork independently, no coordination, and
   land on the identical branch table id — verified empirically first that
   `Y.encodeStateAsUpdate` is genuinely byte-deterministic for two peers
   with identical merged content regardless of sync order. Untested
   end-to-end (jsdom has no `indexedDB`, and `fake-indexeddb` is a
   dependency this project has already, deliberately, deferred — same gap
   `forkTable` has always had); `generateForkTableId` itself is pure and
   fully tested. **Still open within step 6**: the wiring (gated per-peer
   — only the loser's own client forks, never a peer forking on someone
   else's behalf), the Acknowledge dialog, and hard-reload navigation for
   "keep working on the branch."
 * ~~The predicate for which tier applies.~~ ✅ **Done.**
   `conflict.js`'s `touched` gained real structure to make this exact,
   rather than another ad-hoc flag: each entry is now `{domId, mutation}`,
   with `mutation` the record's own type (`'attributes'`/`'characterData'`/
   `'childList'`) for `record.target`, or `'added'`/`'removed'` for a node
   in `addedNodes`/`removedNodes` — overwritten in record order, so a
   reparent's node correctly ends up `'added'`, not `'removed'` (it moved,
   it didn't vanish). `escalation.js`'s `needsEscalation(ydoc, bundle)`:
   true iff the bundle has an unrecovered `'removed'` entry (no matching
   snapshot) — false for a bundle that never removed anything, false when
   a snapshot covers it, true otherwise. Must be called *before*
   `revertBundle` for the same bundle, not after — restoring consumes the
   snapshot on success, so asking afterward sees "no snapshot" and reports
   a false positive for a case that actually already succeeded (this
   ordering trap is demonstrated directly in
   `tests/unit/escalation.test.js`, not just written down). Pure — makes
   no Yjs writes, decides nothing about who forks; that's still open
   below. **This also surfaced a real, independent correctness fix**:
   `revertBundle`'s deletion step used to key off `item.id.client ===
   bundle.clientID`, which only tells you a peer created an item *ever* —
   not that *this commit* did. A peer's touched-set can legitimately
   reference something they made in an earlier, unrelated commit, merely
   attribute-touched here; the old check would have deleted that too.
   Switched to `mutation === 'added'`, which asks the right question —
   regression test in `escalation.test.js` demonstrates the old check
   getting this wrong.
 * Nothing yet *acts* on a `needsEscalation` true result — no fork
   primitive, no wiring, no dialog. All still ahead.

