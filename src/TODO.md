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

## 3. No visual layout for toys once inside a tray's `.contents_group`

**Where:** `reparentToy` (`toys.js`, phase 5.2) is purely structural — it
never touches the moved toy's embedded `<svg>` `x`/`y`. Those coordinates
were set in **table/canvas space** (the toys layer's coordinate frame) but
once nested, they're rendered inside the tray's own **local** viewBox
(e.g. `tray_sum`'s `0 0 200 150`). A die dropped into a tray keeps
whatever absolute table position it last had, which is very likely well
outside the tray's small local viewBox — so contained toys are typically
invisible/off-canvas within the tray, even though they're structurally
correct in Yjs and their value correctly feeds the tray's sum.

**Fix shape:** some in-tray layout on reparent-in (even a simple cascade/
stack), and probably a coordinate reset to the tray's local space rather
than carrying over table-space x/y. Not attempted — no layout design was
specified, and this felt like a real design decision to check on rather
than guess at.

## 4. `tray_sum`'s "Roll All" menu action calls a handler that doesn't exist

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
