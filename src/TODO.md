# TODO

Known gaps in the toys/trays system, logged here so they don't get lost.
Grouped by kind: identity & addressing, interaction gaps, observability,
open design questions, process/docs.

## Interaction gaps


### 5. Reparenting is not undoable

**Where:** `app.js` — `App.undo()` only has `'add'`/`'del'`/`'move'`/`'batch'`
branches. `commitMove()`'s reparent path deliberately does not push
anything to `_undoStack`, rather than push a `'reparent'` entry
`App.undo()` wouldn't know how to reverse.

**Fix shape:** add a `'reparent'` undo branch — needs to snapshot enough to
reconstruct the pre-move state (source parent, index, and probably the
pre-move subtree, since `reparentToy` clones and the old items are gone).

### 6. Drop-target hit-testing uses overlap, not the dragged toy's center point

**Where:** `toys.js` — `findDropTargetTray` accepts any rectangle overlap
between the dragged toy and a tray, not just the drop point landing inside
the tray. This allows a drop whose *center* is up to half the dragged
toy's width outside the tray's bounds. The subsequent local-space rebase
(`commitMove` in `app.js`) can then place the toy at a negative or
out-of-viewBox local position — nested `<svg>` clips by default, so the
toy becomes both selectable-in-theory (once item 1's fix lands) and
invisible in practice, with no way to see or drag it back into view.

**Fix shape:** accept the drop only when the dragged toy's *center point*
falls within the tray's rect, not on any overlap. Once fixed,
`findDropTargetTray` no longer needs the dragged toy's own geometry —
only its center — simplifying the function. 

### 10. Multi-select drop into a tray doesn't reparent anything

**Where:** `app.js` — `commitMultiMove` (the pointerup handler for a
dragged multi-selection) only ever calls `applyMoveCommit` on each
selected element with the shared group delta. Unlike single-toy drag
(`commitMove`), it never calls `findDropTargetTray`/`reparentToy` for any
element in the group — dragging a multi-selection on top of a tray just
moves everything as a rigid group across the open table, tray or no tray.

**Fix shape:** for each dragged element, run the same drop-target check
`commitMove` does against its own final position (not the group's shared
anchor), and reparent the ones that land inside a tray while leaving the
rest on the table.

**Known follow-on risk once this lands:** a multi-drop that reparents
several toys into the same tray in one gesture can place more than one of
them at overlapping or out-of-viewBox local positions — the same
invisible-placement risk item 6 already describes for a single toy, just
easier to trigger with several toys landing at once. Worth a dedicated
look once the reparenting itself exists; not blocking landing the
reparenting first.

**Test note:** the overlap-vs-center-point policy is currently asserted
in two places — `find-drop-target-tray.test.js`'s "partial overlap still
counts" and `reparent-position.test.js`'s "dropped near the edge" — both
need updating together when this lands;

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
