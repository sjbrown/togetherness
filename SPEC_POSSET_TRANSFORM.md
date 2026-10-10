# Move boundaries and position sets with a `transform`

A self-contained task spec. Read `CLAUDE.md` first.

This task explicitly authorizes changes to `src/boun_pos.js`, the boundary
paths in `src/app.js` that read boundary geometry, and their tests. The
boundaries layer **stays on Yjs** in this task. This is groundwork for
moving it onto the op log later.

## Why

`boun_pos.applyMoveCommit` rewrites every child on a move:
- the path `d`
- the label's `x`/`y`
- **every circle's** `cx`/`cy`, for a position set

Measured earlier: moving a 121-circle position set produced a 3.7 KB Yjs
update. On the op log it would be a 21 KB op, because each attribute change
carries its old value. A move should be **one attribute change**.

## The rule

A boundaries element (`<g data-bounpos-type="boundary|pos-set">`) has a
**world position** made of two parts:
- **its children's coordinates**, called local: the path `d`, text `x`/`y`
  and circle `cx`/`cy`
- **plus the group's `transform="translate(tx, ty)"`**. A missing transform
  means `(0, 0)`.

**A move changes only the transform.** To move the element so its anchor
(the path's top-left, in world coordinates) lands on `(x, y)`, set
`translate(x − localX, y − localY)`, where `(localX, localY)` is the path's
top-left in local coordinates. This works for **both** layouts without
migrating anything:
- **Old elements** have absolute children and no transform.
- **New elements** are created at the local origin, as in the next section.

**Create in local coordinates.** `create` for a boundary and
`_createPositionSet` write:
- the path at `rectToPath(0, 0, w, h)`
- the text at `x = w, y = −5`
- the circles relative to `(0, 0)`
- the group's transform as `translate(x, y)`

**Resize** keeps working the way it does: it sets the transform to the new
top-left, and regenerates the path and the circles in local coordinates.
That's `rebuildPositionSetGrid` for position sets, already a full rewrite
today.

## Everything that reads geometry has to add the translation

Add one helper, e.g. `translationOf(el)`, which reads `translate(tx, ty)`
from either a DOM element or a `Y.XmlElement` and returns `{tx: 0, ty: 0}`
when there isn't one. Every reader goes through it:
- `getGeom` / `getAnchor` (DOM)
- `getSnapPoints` (Yjs): each circle's world `cx + tx`, `cy + ty`
- `computeBoundaryRects` (Yjs): the path rect plus the translation
- `toolParamsToCreateParams`, and anything else that builds or reads a rect
  for an existing element. Grep for `pathToRect(` and `getAttribute('cx'`
  in `src/` and check each hit.

Parse only `translate(...)`. These elements never get a rotate or scale.
If an imported file carries anything else, read it as `(0, 0)` and leave
the attribute alone. Add a one-line comment saying why.

**Ghosts and previews.**
- `previewResize` and `previewEdit` act on a detached clone. Make sure they
  set the clone's transform and write its children in local coordinates,
  the same way a commit would.
- Check that the drag preview in `overlay.js` (a `<use href="#id">`
  carrying its own translation) composes with the element's own transform.
  It should, since a `<use>` renders the referenced element including its
  transform. Confirm it in the e2e test rather than assuming.

Export needs no change. `transform` is ordinary SVG, and Inkscape reads it.

## Tests

Update `tests/unit/boun_pos.test.js` and `boun_pos_resize.test.js`. Where
an expectation changes because of the new layout (children are local after
create), that's a source-driven test change.

1. **A move writes one attribute.** After `applyMoveCommit` on a 121-circle
   position set, exactly one attribute changed: the group's `transform`.
   Assert with a Yjs `observeDeep` event, or by snapshotting the attributes.
   Log the Yjs update size next to the old 3.7 KB.
2. **World geometry after a move.** `getGeom`, `getAnchor`, `getSnapPoints`
   and `computeBoundaryRects` all report world coordinates that match the
   pre-change implementation for the same sequence (create → move → resize →
   move).
3. **Old elements still work.** A position set built in the old absolute
   layout, with no transform, reports the same geometry. After a move its
   children are untouched, and its world position is correct.
4. **Snapping is unchanged.** `toy-position-snap.test.js` and the snap paths
   keep passing. Add one case where the position set has been moved, so the
   snap points must include the translation.

```bash
npx vitest run tests/unit/boun_pos.test.js tests/unit/boun_pos_resize.test.js tests/unit/toy-position-snap.test.js
npx vitest run          # full suite once, before presenting
bin/test_e2e.sandbox.sh tests/e2e/boundary-drag.spec.js   # once, at the end
```

If `boundary-drag.spec.js` doesn't already drag a **position set** and
then check that a toy snaps to a moved circle, add that case.

## Done when

- Moving a boundary or a position set changes only its `transform`.
- Every geometry reader goes through the one translation helper.
- Old-layout elements behave correctly without being migrated.
- The listed unit tests, the full suite and `boundary-drag.spec.js` pass.
