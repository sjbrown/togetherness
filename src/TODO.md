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
were essentially never visible. Compounded by item 5 (below): every toy,
tray included, was also being forced to a fixed 64×64 square, so
`tray_sum` itself rendered at a fraction of its real 200×150 size.

**Fix:** two parts, both needed together (see `app.js`'s `commitMove` and
`toys.js`'s `svgTextToYXml`/`addToySync`):
- Toys now keep their own native SVG size (item 5's fix) instead of a
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

## 4. Reparenting is not undoable

**Where:** `app.js` — `App.undo()` only has `'add'`/`'del'`/`'move'`/`'batch'`
branches. `commitMove()`'s reparent path (phase 5.3) deliberately does not
push anything to `_undoStack`, rather than push a `'reparent'` entry
`App.undo()` wouldn't know how to reverse.

**Fix shape:** add a `'reparent'` undo branch — needs to snapshot enough to
reconstruct the pre-move state (source parent, index, and probably the
pre-move subtree, since `reparentToy` clones and the old items are gone).

## 5. `tray_sum`'s "Roll All" menu action calls a handler that doesn't exist

**Where:** `src/toy/tray_sum.svg`'s inline script — the `'Roll All'` menu
entry's handler does `return tray.roll_handler(this, evt)`, but
`tray.js` (the shared tray helper namespace) has no `roll_handler` — only
`dice_utils.js`'s `dice` namespace does, and that's per-die, not
generic-across-contained-toy-types. Invoking "Roll All" from the UI today
will throw.

**Fix shape:** presumably `tray_sum`'s own handler should
`tray.visit_contents_group` the tray, and for each contained toy look up
*its own* roll-capable namespace (mirroring how `tray.evaluate_sub_element`
already resolves a contained toy's `getValue` generically) rather than
assuming everything inside a sum tray is a die. Not implemented — flagged
as a known-broken menu entry rather than guessed at.

## 6. ~~Every toy forced to a fixed 64\u00d764 square~~ — RESOLVED

**Was:** `addToySync` unconditionally overwrote every placed toy's
`width`/`height` to a hardcoded `DISPLAY = 64`, discarding whatever size
the SVG file actually specified. `dice_d6.svg` (authored 80\u00d7100) and
`tray_sum.svg` (authored 200\u00d7150) both got squashed into an identical
64\u00d764 box — directly why the tray rendered far smaller than designed
(see item 3, above, which this was half the cause of).

**Fix:** `addToySync` now uses each toy's own native width/height (via a
new `svgTextToYXml` return field, read from the SVG file before Yjs
conversion — see the next paragraph for why), clamped to `[30, 420]` with
a `64` fallback for a missing/pathological dimension — the same shape as
archive2025's `add_object` sanity clamp, not a normalization.

**A real trap along the way:** the first version of this fix read the
native size back via `ySvg.getAttribute('width')` — but `ySvg` is still a
*detached* `Y.XmlElement` at that point (not yet inserted into the doc),
and per this codebase's own documented Yjs pitfall, attribute reads on a
detached node silently return nothing. The clamp's "missing → fallback to
64" path fired every time, so every toy still came out 64\u00d764 — this
initially looked like the fix had no effect at all, not like an error.
Fixed by having `svgTextToYXml` capture width/height as plain numbers
from the *live DOM* `root` element (before Yjs conversion) and return
them directly, rather than reading them back off `ySvg` afterward.

**Also exposed (and fixed):** `applyMoveCommit`, `applyMoveDom`, and
`getTtState` all computed a single `width`-derived half-offset and
applied it to *both* x and y — silently correct only because every toy
was square under the old forced sizing. Once toys could be non-square
again, this became a real bug (e.g. `dice_d6` would drift vertically on
every move). Fixed to use width and height independently in all three.
