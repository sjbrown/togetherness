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

## 4. ~~`tray_sum`'s own `contents_change_handler` could overwrite a nested tray's result instead of its own~~ — RESOLVED

**Was:** unlike `tray.js`'s `getValue()` (already boundary-safe, see item 7’s
history), `tray_sum.svg`'s own inline `contents_change_handler` wrote its
computed sum via a plain `elem.querySelector('.tspan_result')`. Since
`.contents_group` sits *before* `.result_container` in the tray markup, a
tray containing a nested sub-tray (dropped in with an already-computed sum)
would shadow-match the nested tray's own result first — the outer tray's
sum got silently written onto the inner tray's display instead of its own,
leaving the outer's own result stuck at its pristine template default.
This is what "drop a tray with sum=5 into a tray with sum=3" looked like
live: the inner briefly showed the outer's just-computed total, the outer
never updated, and the *next* unrelated re-render (which remirrors from
the real, untouched Yjs data) wiped the stray value back to the template
default — so it looked intermittent even though the write was consistently
wrong every time.

**Fix:** `tray_sum.svg`'s `contents_change_handler` now uses the same
boundary-safe lookup `tray.js` exports (`tray._findOwn`, see below) instead
of a plain selector.

**A deeper finding along the way:** `tray.js`'s existing "safe" lookup was
itself a CSS `:not(:scope .toy .tspan_result)` selector — which looked
correct in every simplified test fixture, but turned out to give the
*wrong* answer against the real, full `tray_sum.svg` markup structure
(confirmed directly: `.matches()` and `.querySelector()` gave inconsistent
answers for the identical selector string against the identical element).
The exact trigger inside jsdom's selector engine (nwsapi) wasn't pinned
down — it wasn't reproducible in a minimal hand-built fixture, only against
the real asset's structure — so rather than keep chasing a third-party
selector-engine quirk, `getValue()` was switched to a plain recursive JS
walk (`tray._findOwn`, in `tray.js`), which has no dependency on `:scope`/
`:not()` support at all. Validated both ways: the same regression test
fails 5/5 runs against the old plain-selector bug and passes 15/15 against
the fix, with no flakiness either direction.

**Also worth knowing:** this bug shipped for a while *underneath* a
previously-"passing" permanent test (`contents-change-cascade.test.js`'s
tray-into-tray test) — that test's own assertion used the same kind of
unsafe/unreliable selector to *read back* the result, so it happened to
read the same (wrongly-written) element the buggy code wrote to, and the
two bugs canceled out. Both the production code and every test assertion
reading a tray's own result now go through the same `tray._findOwn`-backed
helper, so a future regression can't be masked the same way.

## 5. ~~`tray_sum`'s "Roll All" menu action calls a handler that doesn't exist~~ — RESOLVED

**Was:** the `'Roll All'` menu entry's handler did
`return tray.roll_handler(this, evt)`, but `tray.js` has no `roll_handler`
— only `dice_utils.js`'s `dice` namespace does, and that needs a
type-specific `maxFace` argument (`dice.roll_handler(elem, 6)` for a d6)
that a generic tray has no way to know for an arbitrary contained toy.

**Fix:** added `tray.roll_all(elem)`, which dispatches generically —
mirroring `evaluate_sub_element`'s existing pattern for `getValue`, but for
rolling: for each contained toy, look up its own declared namespace(s) via
`getNamespacesForType`, and invoke whichever menu action (if any) is
tagged `eventName: 'die_roll'` — the convention every die type already
uses for its own `'Roll'` entry (see `dice_d6.svg`). Honors that action's
own `applicable()` check. A contained toy with nothing tagged `die_roll`
(a nested tray, say) is silently skipped — best-effort "roll everything
that knows how," not an error if something doesn't. Called directly
(not through `invokeMenuAction`) since it's already running inside the
tray's own menu-action envelope; opening a second nested envelope per die
would be redundant and scope-checked against the wrong element.
`tray_sum.svg`'s handler is now just `tray.roll_all(this)`.

## 6. `tray_sum` no longer has a user-facing color option — RESOLVED

**Was:** `tray_sum` had a `color-hsl` option in the `TOOLS` registry
(add/addQuick panels) *and* every placed toy — trays included — got a
color control in the Edit panel via `toys.js`'s `getTtStateSchema`, which
was toy-type-agnostic.

**Fix:** removed `tray_sum`'s `options` entry from `TOOLS` (kept
`defaults.fill` so it still gets a sensible tint on placement, just not a
user-editable one), and made `getTtStateSchema` omit `color` from the
returned `types` specifically for `toyType === 'tray_sum'` — the raw color
value is still returned as data (harmless, just not exposed as a field),
matching the same "not user-colorable" decision on both the add-panel and
edit-panel paths.

## 7. ~~Every toy forced to a fixed 64\u00d764 square~~ — RESOLVED

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

## 9. ~~A tray's Edit-panel menu could show a nested toy's own actions ("Roll" / "Turn to N") alongside its own~~ — RESOLVED

**Was:** `activateToyScripts(yToyEl, toyType)` walks `findScriptNodes(yToyEl)`
to find `<script>` tags to evaluate — but that walk recursed through
`yToyEl`'s *entire* Yjs subtree with no boundary at nested-toy edges. If a
toy type's very first activation happened to occur while another toy was
already nested inside it — e.g. right after loading a document that was
already synced from a peer, where the tray and its contents all arrive and
get mirrored in one shot, before this client has activated anything —
`findScriptNodes` walked straight into the nested toy's own `<script>`
tags too, and `recordNamespace` misattributed them to the *outer* toy's
toyType. A tray whose first activation happened this way would end up with
`getNamespacesForType('tray_sum')` including `'dice'`/`'d6'` alongside
`'tray'`/`'tray_sum'` — so `getMenuActions` on the tray incorrectly also
surfaced the die's own `'Roll'` and `'Turn Up'` (shown as "Turn to N")
menu entries, alongside the tray's real `'Roll All'`. Confirmed
empirically: reparenting a die into a tray *before* that tray's first
render reproduced `['tray', 'tray_sum', 'dice', 'd6']` and
`['Roll All', 'Roll', 'Turn Up']` exactly.

**Fix:** `findScriptNodes` now stops descending once it reaches a nested
toy boundary (any descendant `<g class="toy">` other than the root it was
called with) — so activating one toy's scripts can never walk into a
different, nested toy's own `<script>` tags. That alone would leave a toy
that's *only ever seen nested* (like `die1` in the repro above) with its
own namespace never activated at all, so `render()`'s activation pass was
also changed from a top-level-only scan to a full recursive walk
(`activateAllToyScripts`), activating every distinct toyType found
anywhere in the tree — top-level or nested at any depth — each on its own
`<g>`, independently.

**Related:** this is a different manifestation of the same underlying gap
as item 1 (nested toys not being full citizens of app.js's normal
addressing) — worth keeping in mind that other top-level-only walks over
`yToys` may have similar nested-toy blind spots not yet found.

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
