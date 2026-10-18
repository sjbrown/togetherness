# Action Square on the South-East-Most Corner

Design record and commit plan for moving a rotated toy's action square (the
bowstring's resting handle) to whichever corner of its selection ring is
furthest south-east on screen.

---

## Why

The action square sits on the toy's **own** SE ring corner and turns with
the toy. Rotate a toy 180° and the square ends up at the top-left on
screen, sitting over or behind the toy.

The radial menu (`radial.js`) assumes the toy is to the square's north-west.
It never draws in the NW quadrant around the square, and its six spokes fan
from North clockwise to West. That only holds if the square is on the
south-east-most corner. So this change is a prerequisite for the radial
behaving on rotated toys, as well as a usability fix on its own.

## Current state

Three places compute the square's position, and they agree with each other:

- **Drawing.** `overlay.js` `render()` puts each element's selection
  furniture in `decorGroup(rot)`, a `<g>` carrying the toy's rotation.
  For `sel-action` it calls `renderActionAffordance(geo, scale, parent)`,
  which draws at `resizeCorners(geo)[2]`, the unrotated SE ring corner.
  The surrounding rotation then moves it onto the toy's rotated SE corner,
  and also tilts the square.
- **Hit-testing.** `app.js` `startBowstringAt` calls
  `Delight.hitTestBowstring(geo, px, py, scale, rot)`, which tests against
  `bowstringOrigin(geo, rot)`.
- **The live gesture and charge rings.** `delight.js` `bowstringOrigin(geo,
  rot)` returns `rotatePoint(<unrotated SE ring corner>, rot)`. It's used
  by `startBowstring`, by `hitTestBowstring`, and by `overlay.js`'s
  remote and local charge indicators (`drawCharge`).

The view transform (`canvas.js`) is translate and scale only, never
rotation, so "on screen" and "in canvas space" have the same orientation.
Canvas-space comparisons are fine.

## The change

### Which corner

Rotate all four ring corners (NW, NE, SE, SW, padded by `PAD` as now) by
the toy's rotation, and pick the one with the largest `x + y`, which is the
one furthest along the screen's south-east diagonal.

- **Ties.** At exact multiples of 45° on a square ring, two corners tie (for
  example, S and E at 45°). Compare with a small epsilon (`1e-6`) and break
  the tie toward the larger `y`, the one lower on screen. That keeps the
  choice deterministic and stable under float noise.
- **Unrotated** (`rot` null or `deg` 0): the result must still be the plain
  SE corner, exactly as today.

### One source of truth

`delight.js`'s `bowstringOrigin(geo, rot)` becomes the only place this is
computed, implementing the rule above. Everything else already calls it,
except overlay's resting square.

### Drawing the resting square

`renderActionAffordance` stops drawing inside the rotated `decorGroup`.
It draws at `bowstringOrigin(geo, rot)` directly in `_layerEl`, so it's:

- on the chosen corner, and
- **upright**, matching the live handle `delight.js` builds on press. The
  live handle is already upright, so a tilted resting square visibly jumps
  to upright on pointerdown today. That jump goes away.

Keep the `<g class="bowstring">` wrapper (the CSS `cursor: grab` and the
e2e selectors depend on it). The selection ring itself stays in
`decorGroup` and keeps rotating with the toy. Only the square moves out.

`renderActionAffordance` currently takes `(geo, scale, parent)`. It needs
`rot` too, and should ignore `parent` for the square. Don't reorder
functions in `overlay.js` while doing this.

### Out of scope

- The resize, rotate and pivot handles keep their current behaviour.
- No change to how rotation itself is stored or applied.
- No change to `radial.js`. It's centred on `bowstringOrigin`, so it
  follows automatically.

## Tests

These pin today's behaviour and must change with it. Per CLAUDE.md, update
tests to match the source change, never the reverse.

**`tests/unit/delight.test.js`, `describe('bowstringOrigin …')`**

- "rides the toy's own rotation …" expects `(-6, 106)` for a 100×100 box
  rotated 90° about (50, 50). Under the new rule, the corner that lands
  furthest south-east is the toy's own NE corner, at **(106, 106)**.
  Rewrite this test to state the new rule.
- Add:
  - 180°: the toy's own NW corner is picked, and it lands bottom-right.
  - 30° on a non-square box: the picked corner has the max `x + y` of the
    four rotated corners.
  - Exactly 45° on a square box: the tie goes to the larger `y`.
  - Unrotated and `rot: null`: still the plain SE corner (the existing test
    stays).
- `hitTestBowstring` tests: add one rotated case that hits at the new
  origin and misses at the toy's own rotated SE corner.

**`tests/unit/bowstring-rotated-toy.integration.test.js`**

- "rotated 90°: a click at the OLD un-rotated corner misses" will now
  **fail by design**: at 90°, the new SE-most corner sits exactly where
  the old unrotated corner was. Rewrite it around a rotation where the
  positions differ (for example 180°, or 30°), asserting that a click at
  the toy's own rotated SE corner misses and a click at the SE-most corner
  fires.
- "a click where the handle is actually drawn fires the bowstring" and
  "the live gesture's own handle chrome starts at the rotated point too"
  should keep passing once their expected point comes from the new rule.
  Check that they read the point from `bowstringOrigin` or the drawn
  square, not from a hard-coded rotation of the SE corner.
- Add: the resting `.bowstring` square in `#overlay-layer` is not inside a
  rotated `<g>`, and sits at `bowstringOrigin(geo, rot)`.

**`tests/unit/rotate-mode-visual.test.js`, `bowstring-resize-mode.integration.test.js`**

- Probably unaffected. Run them; if one asserts the square's parent or
  position, update it to match.

**e2e**

This touches rendering and click wiring, so it's worth one targeted run:
`bin/test_e2e.sandbox.sh tests/e2e/radial.spec.js`. Those specs use an
unrotated supply and should pass unchanged. Consider adding one spec that
rotates a toy 180°, then clicks the square at its new bottom-right spot and
sees the default action fire.

## Commit plan

Each commit leaves the suite green.

1. **`bowstringOrigin` picks the SE-most corner.** Change the function, and
   update and add tests in `delight.test.js` and
   `bowstring-rotated-toy.integration.test.js`. After this commit the hit
   area and live handle move, but the drawn square doesn't yet. Note that in
   the commit message, or fold it into commit 2 if a mismatched intermediate
   state is unwelcome.
2. **Draw the resting square at `bowstringOrigin`, upright.** Change
   `renderActionAffordance` and its call site in `render()`, and add the
   "not inside a rotated group" assertion.
3. **(Optional) e2e for a rotated toy's action square.**

## Done when

- At every rotation, the action square is on the selection ring's corner
  furthest south-east on screen, drawn upright.
- Clicking it fires the default action, dragging it opens the radial menu,
  and the live handle starts exactly where the resting square was drawn.
- Peers' charge rings appear at the same corner. This follows from
  `drawCharge` using `bowstringOrigin`.
- The unit suite and `tests/e2e/radial.spec.js` pass.
