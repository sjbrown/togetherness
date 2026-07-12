# TODO

Known gaps flagged during the archive2025 tray integration (phases 5.1–5.4),
deliberately deferred rather than silently folded into an unrelated commit.
Logged here so they don't get lost.

## 1. Nested toys never get `data-yid` / `id="yid-…"` / `data-module` / `.$` stamped

**Where:** `toys.js` — `_toSVGEl()` is what stamps those app-facing handles
(`data-yid`, the SVG `id="yid-{id}"` used by `<use href="#yid-…">` in
overlay.js, `data-module="toys"`, and the `.$()` scoped-lookup helper), but
it's only ever called by `listToys()`'s **top-level** walk of `yToys`.
`mirror()` (which `_toSVGEl` wraps) recurses through the whole tree
correctly regardless of depth and mirrors every real Yjs attribute — a
nested toy has correct `data-toy-id`, `data-toy-type`, etc. — it's
specifically the extra top-level-only handles that never get added once a
toy lives inside a tray's `.contents_group`.

**Why it matters:** any code path that finds a toy via
`querySelector('[data-yid="…"]')` — which is most of app.js's dispatch:
`App.getBBox`, `App.getAnchor`, `startDrag`/`commitMove`, `invokeMenuAction`
routing, `<use href="#yid-…">` ghost/selection rendering in overlay.js —
silently can't find a nested toy at all. In practice this means a toy
placed inside a tray currently can't be independently selected, dragged
back out, or have its own menu invoked through the normal UI paths, even
though it renders correctly and its own Yjs state is perfectly sound.

**Already bit us once:** `dispatchContentsChangeCascade` (phase 5.4)
originally looked up a tray via `[data-yid="…"]}` to run its
`contents_change_handler`, which silently skipped every *nested* tray
(tray-in-tray) — found via a failing test, fixed by switching that one
call site to `[data-toy-id="…"]` instead. That fix is narrow (one lookup);
the general gap above is not fixed.

**Fix shape (not yet done):** either make `listToys()`/rendering walk into
every `.contents_group` and stamp nested toys the same way, or give
`_toSVGEl` (or an equivalent) a recursive mode so containment doesn't
silently opt a toy out of the app's normal addressing scheme.

## 2. Reparenting is not undoable

**Where:** `app.js` — `App.undo()` only has `'add'`/`'del'`/`'move'`/`'batch'`
branches. `commitMove()`'s reparent path (phase 5.3) deliberately does not
push anything to `_undoStack`, rather than push a `'reparent'` entry
`App.undo()` wouldn't know how to reverse.

**Fix shape:** add a `'reparent'` undo branch — needs to snapshot enough to
reconstruct the pre-move state (source parent, index, and probably the
pre-move subtree, since `reparentToy` clones and the old items are gone).

## 3. ~~No visual layout for toys once inside a tray's `.contents_group`~~ — RESOLVED

**Was:** `reparentToy` never touched the moved toy's embedded `<svg>`
`x`/`y`, so a die dropped into a tray kept its stale table-space
coordinates, which — once nested inside the tray's own local viewBox —
were essentially never visible. Compounded by item 7 (below): every toy,
tray included, was also being forced to a fixed 64×64 square, so
`tray_sum` itself rendered at a fraction of its real 200×150 size.

**Fix:** two parts, both needed together (see `app.js`'s `commitMove` and
`toys.js`'s `svgTextToYXml`/`addToySync`):
- Toys now keep their own native SVG size (item 7’s fix) instead of a
  forced square, so `tray_sum` actually renders near 200×150.
- On a successful reparent-into-a-tray, `commitMove` now rebases the
  moved toy's position into the tray's local coordinate space —
  `localX = dropTableX - trayTableX` (via `getGeom` on the tray +
  `applyMoveCommit` on the moved toy) — the same approach
  archive2025's `push_to_parent` used. Uses the actual drop point
  (already known to be geometrically inside the tray), not a synthetic
  layout slot, so it preserves where the user chose to drop it.

**Known limitation, not fixed:** assumes a 1:1 ratio between a tray's own
viewBox and its rendered width/height (true for `tray_sum`; a tray type
authored with a different ratio would need an extra scale factor). Also
no packing/overlap avoidance — two toys dropped near the same spot in a
tray will overlap, same as archive2025's behavior; not treated as a bug.


## 8. No menu action logging for user & peer visibility and auditing

**Where:** `app.js`'s `invokeToyMenuAction` — the handler for any toy menu
action (a die's own "Roll", "Turn Up", a tray's "Roll All", anything a toy
declares) — runs the action and re-renders, but never calls `addHistory`
or any equivalent. Menu actions are currently invisible in the activity
log entirely, for every toy type, not just trays.

**Context:** noticed while comparing `tray.roll_all` against archive2025's
own `roll_handler`, which wrapped every dispatched action (via
`ui.augmented_handlers_for_element`'s `boundHandler`) with
`userlog.add(...)` + `ui.addActivityLogItem(...)` — so archive2025 logged
each individual die roll from a "Roll All" as its own activity entry.
Ours currently logs none: not per-die, not even one entry for "Roll All"
as a whole. This isn't specific to trays or to phase 5 — it's a gap in
the general menu-action dispatch path that happened to become visible
here.

**Fix shape:** add an `addHistory(...)` call (matching the pattern already
used for placement/move/delete) in `invokeToyMenuAction`, logging the
action's label at least once per invocation. Whether a multi-sub-action
handler like "Roll All" should log once for the whole action or once per
contained toy it actually rolled (closer to archive2025's granularity) is
a real design choice, not obvious which is better for peer-visibility —
worth deciding deliberately rather than defaulting to one or the other.


## 10. Fixing a toy's script doesn't fix already-placed instances of that toy

**What you're likely hitting with "Action failed: tray.roll_handler is not
a function":** that error is real, and it's the *exact* pre-fix bug from
item 5 — but item 5 *is* fixed, in the current `tray_sum.svg` on disk.
The catch: a toy's behaviour scripts aren't fetched fresh each time they
run. `addToySync` reads the SVG file once, at placement time, and embeds
its `<script>` contents as literal data inside that specific toy's own
Yjs subtree (`svgTextToYXml` → `elementToYXml`). `activateToyScripts`
later evaluates whatever text is *sitting in the Yjs document* for that
instance (`inlineScriptText(yScript)`), not the current file on disk.
So: any tray placed *before* the `tray_sum.svg` fix has the old, broken
`tray.roll_handler(this, evt)` call permanently baked into its own
persisted Yjs data — and keeps throwing that exact error on "Roll All"
forever, even after the fix ships, even after a page reload, because
there's nothing that goes back and re-embeds the corrected script into
data that already exists. A *new* tray placed after the fix is fine,
since it fetches the current file at placement time.

**Where this bites, concretely:** this is a local-first app with
persistence (Yjs + presumably IndexedDB and/or peer sync) — a tray placed
during any earlier testing session is still sitting in that persisted
document with the old script baked in, and will be for as long as that
specific toy instance exists.

**Immediate workaround:** delete the affected tray and place a fresh one
from the palette.

**Fix shape (not attempted — real design question, not just an
implementation detail):** there's no "toy script version" concept right
now, so there's no way to detect "this instance's embedded script is
stale relative to the current template" short of a full-text diff against
the current file, let alone a mechanism to re-embed a fixed script into
an existing instance without disturbing its actual state (position,
current die value, contents, etc). Worth deciding deliberately whether
toy scripts should carry a version stamp, whether "refresh this toy's
script from the current template" should be an explicit user action, or
whether toys should reference their behaviour script by URL at runtime
instead of embedding it (trading the "living document" self-containment
property for easier upgrades) — each has real trade-offs for a
local-first, self-contained-document app, so this shouldn't be decided
in passing.

### 11. Resizing of trays

### 12. User changing of trays' labels

### 13. "Fix"ing or "Opening" of trays so that contents can be pulled out

### 14. separate the concerns of the yid and a Togetherness-centric "tt id"
