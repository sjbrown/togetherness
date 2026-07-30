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

See CONCURRENCY_AND_BRANCHING.md and REVISION_PLAN.md

