# Make the drawing and boundaries renderers pure mirrors

A self-contained task spec. First read `CLAUDE.md`, then
`src/CONCURRENCY_AND_BRANCHING.md` §1 (why the toys layer treats the DOM as the
document). This task explicitly authorizes changes to `src/drawing.js`,
`src/boun_pos.js`, `src/storage.js`, `src/defs.js`, `src/index.html` and
`src/ui.css`, and to the unit tests that cover them.

## Why

The drawing and boundaries layers are still stored as Yjs `XmlFragment`s. They
are rendered to the DOM by `drawing._toSVGEl`/`mirror`/`render` and by
`boun_pos._toSVGEl`/`_positionSetToSVGEl`/`render`. Those renderers **add
things the Yjs tree doesn't hold**: identity attributes, hard-coded styles, a
derived `transform`, a cursor, and fallback values. They also **drop** things,
namely `<script>` elements and the stored boundary styles.

A later project will move these layers onto the op log, where the DOM itself is
the document and there is no renderer in between. Any decoration still living
in a renderer at that point either leaks into captured operations or quietly
differs between peers. The second case also breaks fork-id determinism
(`buildForkSeed` hashes a checkpoint of the live DOM).

**Goal of this task:** keep Yjs as the storage, but make each renderer a
**pure mirror** of what's stored. Every attribute and child in the rendered DOM
must come from the Yjs tree, and nothing in the Yjs tree may be dropped.
Shared presentation moves into a stylesheet.

**No migration.** The app is in early alpha. Tables created before this
change may render incorrectly afterwards, and that's accepted. Don't add
compatibility fallbacks for old data. Remove the existing fallbacks where this
spec says so.

## Out of scope

- Anything op-log for drawing or boundaries. No envelopes, no ops.
- Changing how pos-sets move (e.g. switching to a `transform` on the `<g>`).
- The toys layer's rendering. It's already DOM-first. The only toys work is
  the test in item 6.

## The work: six independently landable commits

Each commit keeps the suite green. Before starting an item, grep for every
caller of the functions it touches. `app.js` has no unit coverage.

### 1. Store identity attributes at creation

Right now Yjs stores only `id`. The renderers add `data-id` and
`data-module` (`'drawing'` or `'boun_pos'`) at render time, and set the plain
`id` again.

- `drawing.addDrawing` should write `data-id` (equal to `id`) and
  `data-module="drawing"` into the `Y.XmlElement`.
- Boundary `create` and `_createPositionSet` in `boun_pos.js` should do the
  same with `data-module="boun_pos"`.
- In `storage.populateFromSvgDoc`, drawing and boundary imports should
  ensure both attributes exist on each imported top-level element, stamping
  them from `id`. A foreign shape with no `id` needs one minted, the same
  way `commitDrawing` mints one in `app.js`.
- The renderers stop setting `id`, `data-id` and `data-module`.
- Check `app.js duplicateMultiSelected`. It builds the new shape through
  `addDrawing`, so the new id must win. Confirm that the copied source
  attributes can't carry the old `data-id` through.

### 2. Move shared presentation into one stylesheet

These are per-kind constants, not per-instance data:

| Element | Constant presentation now set by code |
|---|---|
| boundary `> path` | `fill none; stroke white; stroke-width 2` (stored in Yjs, then **ignored** and hard-coded again by the renderer) |
| boundary `> text` | `text-anchor end; font-family ui-monospace, monospace; font-size 12; fill white` |
| pos-set `> path` | `fill none; stroke rgba(255,255,255,0.5); stroke-dasharray 4 2; stroke-width 1` |
| pos-set `> text` | as boundary text, `fill rgba(255,255,255,0.7)` |
| pos-set `> circle` | `fill url(#snap-point-gradient)` (never stored; renderer-only) |
| drawing shapes | `cursor: pointer` (`drawing.render` sets `style.cursor`) |

- Add a `<style>` fragment to `src/defs.js` alongside `snapPointGradientSVG`
  and inject it into `#canvas defs` in `index.html` the same way. Because it
  sits inside the SVG, `buildExportSvg`'s clone carries it into exported
  files with no extra export code. Scope every selector under
  `#boundaries-positions-layer` / `#drawing-layer`, and key on
  `[data-bounpos-type=…]`, so nothing leaks into the rest of the page.
  - The cursor rule is UI-only and can go in `ui.css` instead. Either is
    fine.
- Stop writing these attributes at creation (`boun_pos.js` `create`,
  `_createPositionSet`, `rebuildPositionSetGrid`) and stop setting them in
  the renderers.
- Drop the `data-boundary-name` attribute the boundary renderer adds to
  `<text>`. Nothing reads it.
- Per-instance values stay in markup: text `x`/`y`, circle `cx`/`cy`/`r`,
  path `d`, and every drawing shape's schema attributes (fill, stroke,
  stroke-width, rx, …).

### 3. Strip scripts at import, not at render

`drawing.mirror()` drops `<script>` elements unless `includeScripts` is set.

- In `storage.populateFromSvgDoc`, strip `<script>` elements (at any depth)
  from everything headed for the drawing and boundaries fragments **before**
  `domToY`. The "everything else → drawing" fallback loop is included.
  Document-root scripts are already handled separately; leave that path alone.
- Remove the script filter and the `includeScripts` option from `mirror` and
  `_toSVGEl`, and update their callers.

### 4. Store the rotation `transform` instead of deriving it at render

`_toSVGEl` calls `syncRotation`, which computes `transform` from
`data-rotate`, the pivot and the geometry. Yjs never holds that `transform`.

- After every write in `drawing.js` that can change what `syncRotation`
  depends on, set the `transform` on the `Y.XmlElement` inside the same
  `ydoc.transact`. That covers `addDrawing`, `applyMoveCommit`,
  `applyResize`, `applyRotate`, `applyPivot`, `edit`, `applyTtState` and
  `reconcileImportedTransform`. Reuse `resolveRotation`/`rotationTransform`.
  They currently read a DOM element via `getAttribute`/`tagName`/`hasAttribute`,
  so add a thin adapter or generalize them to accept a `Y.XmlElement`
  (`nodeName`, `getAttribute`). Don't duplicate the math.
- Keep the existing guard: a shape with no `data-rotate` keeps whatever
  `transform` its author gave it.
- `_toSVGEl` stops calling `syncRotation`. The DOM-only preview helpers
  (`previewResize`, `previewRotate`, `previewPivot`, `applyMoveDom`) keep
  calling it. They act on ghosts and must stay live.
- `reconcileImportedTransform` currently *removes* a `transform` it proves is
  ours. It should now write the canonical one instead. The tests around
  `tests/unit/drawing.test.js:750–770` that expect `transform` to be
  `undefined` after import need updating to expect the canonical value.
  That's a source-driven test change, which `CLAUDE.md` allows.

This is the most entangled item, so land it last among 1–4.

### 5. Test that each renderer is a pure mirror

This is the acceptance gate for items 1–4. For both layers, in jsdom:

- Build a fragment exercising every kind: rect (rotated and unrotated), circle,
  boundary, and square and hex pos-sets. Include a text label.
- Render it with the layer's `render()` into a scratch `<g>`.
- Assert that each rendered element's attributes and children **exactly
  equal** its `Y.XmlElement`'s attributes and children, recursively. Tag
  name, the attribute set and values, text content and child order must all
  match, with nothing extra and nothing missing.
- Run it after moves, resizes, rotates and pivots through the real `apply*`
  functions, not just after creation.

The test should fail on `main` today and pass once items 1–4 are done. Write
it first to confirm that. Remove or rework now-dead test expectations,
such as assertions that `_toSVGEl` *adds* `data-module`.

### 6. Toys guardrail: projection equals the live DOM

The toys layer is already on the op log. Add a unit test that runs a
sequence of real gestures through `runGesture`/the toys LayerAPI on a live
layer: place, move, resize, rotate, edit, delete, reparent into a container,
and a menu action. Then call `projectFrom` into a scratch layer from the
log. Assert that `serializeNode` of every child is identical between live and
scratch.

A difference means some code wrote to the toys layer outside an envelope.
That's the same class of leak this whole task removes from the other layers.
If the test finds a real leak, **don't fix it in this task**. Mark that case
`test.fails` with a comment naming the leak, and report it.

## Verification

- Targeted tests while working, e.g.
  `npx vitest run tests/unit/drawing.test.js tests/unit/boun_pos.test.js tests/unit/storage.test.js`.
- Run the full `npx vitest run` once, before presenting.
- This touches rendering, so run the relevant e2e specs **once**, at the
  end, through the sandbox runner:
  `bin/test_e2e.sandbox.sh tests/e2e/boundary-drag.spec.js tests/e2e/undo-redo.spec.js tests/e2e/sync.spec.js`.
- Manual smoke test, or describe what should be checked, in
  `MANUAL_CHECKS.md` style:
  - Boundaries and pos-sets look the same as before, including the snap
    gradient.
  - Rotated rects rotate about their pivot after move, resize and pivot drag.
  - An exported SVG opened standalone still shows boundary styling.

## Done when

- Items 1–6 have landed as separate commits, each with its tests green.
- The mirror test (item 5) passes for both layers.
- No renderer in `drawing.js` or `boun_pos.js` sets any attribute or text
  that isn't read from the Yjs node.
- The e2e specs above pass.
