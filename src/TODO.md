# TODO

Known gaps in the toys/trays system, logged here so they don't get lost.
Grouped by kind: identity & addressing, interaction gaps, observability,
open design questions, process/docs.

## Identity & addressing

### 1. Toy identity contract: id scheme, the `data-yid` rename, `isToyG()` scope

Merges what were two separate entries (nested-toy addressing, and
`yid`/`tt id` naming) — they turned out to be the same root cause: a
render-time convenience attribute had been promoted into the on-disk
storage contract.

**The rename.** `data-yid` and `id="yid-{id}"` never held information
independent of `data-toy-id` — `_toSVGEl` always set them to the same
value, verbatim. They're not a second identity, just a bare copy of the
first one under a name that references Yjs for no reason (nothing about
addressing a rendered DOM node is Yjs-specific). Renamed:

- `data-yid` → `data-id`
- `id="yid-{id}"` → `id="{id}"` (bare — no wrapper prefix needed once toy
  ids have their own distinctive scheme, below; an internal toy id like
  `pie4` is always namespaced `${toyId}__pie4` before it reaches the DOM,
  so a bare `id="{id}"` on the toy's own root `<g>` can't collide with it)
- Same rename applies in `drawing.js` and `boun_pos.js`, which stamp
  `data-yid` for the identical reason (fast DOM addressing, not identity).
  `data-module` has the same problem one level up — see below — so it's
  folded into this same pass rather than left as a loose end.

**The id scheme.** `data-toy-id` values get a real format instead of
`{playerId}_{random36}`: `tt-t-v1-<random>` — `tt` (Togetherness Table,
matching the existing `tt_player` localStorage key convention), `t` for
toy (leaves room for `tt-d-v1-…` / `tt-b-v1-…` if drawing/boun_pos ever
want the same treatment), `v1` so the scheme itself can version. Toy
authors never generate these — they're assigned at placement — but a toy
author or anyone reading an exported file can now tell what an id is for
at a glance, and the format survives export/reimport as plain, tool-legible
XML attribute data. This is also the answer to "does the app have identity
independent of Yjs": yes — `data-toy-id` never touched Yjs's own internal
`(clientID, clock)` item addressing, and didn't need this rename to be
correct, only to stop implying a relationship to Yjs it never had.

**`isToyG()` update, and why `data-module` joins the rename.**
`storage.js`'s import gate currently requires `data-yid` *and*
`data-module="toys"` to recognize a `<g>` as a toy — both are pure
rendering/dispatch conveniences (`data-module` only ever feeds
`app.js`'s `moduleForElement()` lookup, and is always re-derivable from
which top-level layer fragment — `yToys` vs `yDrawing` vs `yBounPos` —
transitively contains the node). Requiring either on import means a
hand-authored SVG file — the artifact the whole toy-author story is built
around — is invalid unless the author also adds attributes that exist
solely to help *this app's current rendering code* find nodes quickly.
New `isToyG()`:

```js
export function isToyG(el) {
  return el.localName === 'g' && el.classList.contains('toy') &&
         el.getAttribute('data-toy-id') && el.getAttribute('data-toy-type') &&
         el.querySelector(':scope > svg')
}
```

`data-id`, `id=`, `data-module`, and `.$()` are never read on import and
never required — they're recomputed fresh by the renderer, at every
depth, every time.

**The actual bug this fixes.** Give the stamping step (currently
`_toSVGEl`, only called by `listToys()`'s top-level walk) a recursive
mode so every nested toy — arbitrarily deep inside trays-in-trays — gets
`data-id`/`id=`/`data-module`/`.$()` too, not just top-level placements.
That's what makes a toy nested in a tray independently selectable,
draggable back out, and reachable by `invokeMenuAction`'s normal routing
— all of which currently silently fail for anything not at the top level.

See TOYS.md for the authoring-facing version of this contract.

## Interaction gaps

### 2. "Fix"ing or "Opening" of trays so that contents can be pulled out

### 3. User changing of trays' labels

### 4. Resizing of trays

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

## Open design questions

### 8. Fixing a toy's script doesn't fix already-placed instances of that toy

**What you're likely hitting with "Action failed: tray.roll_handler is not
a function":** a toy's behaviour scripts aren't fetched fresh each time
they run. `addToySync` reads the SVG file once, at placement time, and
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

## Process / docs

### 9. Tray end-to-end (Playwright) test

Two browsers, drag die into tray, Roll All, both peers converge.
