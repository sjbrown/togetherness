# Manual Checks Before Merge

Run these checks before merging large changesets. Automated tests catch logic errors; humans catch visual regressions.

**Prerequisites:** Unit & e2e tests pass, Docker runs, browser console clean.

---

## Home

1. Open http://localhost:3000/home.html
2. Visual check
3. Ctrl-Shift-M Mobile view visual check
4. Start Here button works

---

## Import / Export Roundtrip

1. Create mixed doc: 2–3 drawing shapes, 3 toys, 2 boundaries
2. Export → edit in Inkscape (change boundary name) → re-import
3. Verify: toys same position, boundary name updated, no structural corruption
4. Export again, diff against edited SVG (allow whitespace, not structural)

---

## Rect Rotation

1. Draw a rect; click it once to select, again for resize, again for rotate
2. Handles change from squares to round discs with a turn arrow
3. Drag a corner; the rect turns in 15° steps and the ring turns with it
4. Rotate to 45°, then cycle back to resize and drag a corner
   - The corner you grab is the one that moves; the opposite one stays put
5. Rotate to 45°, then drag the rect somewhere else
   - It stays at 45°, turning about its own new centre (not the old one)
6. Second browser window: the rotation appears there too
7. Export, reopen in Inkscape: the rect is drawn turned
8. Re-import: still turned, and the Yjs `<rect>` has `data-rotate` but no
   `transform` (the transform is derived on render, never stored)
9. In Inkscape, rotate the rect FURTHER and move it, then re-import
   - Both edits survive: the new angle is in `data-rotate`, the move in x/y
   - Try it with Store transformation set to Optimized and to Preserved;
     the result must be the same either way
10. In Inkscape, SCALE the rect, then re-import
   - The rect renders as Inkscape drew it, keeps its own `transform`, and no
     longer offers rotate mode (move and resize still work)

---

## Rotation Pivot

1. Rect in rotate mode: a dot with eight short rays, paired two-per-quadrant,
   sits at its centre
2. Drag it toward the left edge — both left-quadrant pairs (four rays) fade
   out as it goes; the two right-quadrant pairs stay full strength
3. Drag it into a corner — only the one pair pointing back into the shape
   remains, and the corner's rotate handle stays clean and grabbable
4. Click that corner again: the pivot is picked up, not the rotate handle
5. Rotate the rect 45°, then drag the pivot somewhere else
   - The rect must not move at all; only the handle does
6. With the pivot on a corner, drag a rotate handle — it swings about that
   corner, not the centre
7. Resize the rect: a pivot on a corner stays on that corner
8. Double-tap the pivot handle — it returns to the centre, and on a rotated
   rect the shape still must not move
9. Double-tap bare canvas: that still resets the VIEW, not a pivot
10. Second browser window: the pivot position appears there too

---

## Toy Rotation (chip, single_poker_card)

1. Place a chip; click once to select, again for rotate (no resize step —
   chip has none)
2. Handles are the same round discs with a turn arrow as a rect's, at the
   toy's own corners
3. Drag a corner; the chip turns in 45° steps (not a rect's 15°) and the
   ring/handles turn with it, about the chip's own centre
4. The pivot never moves — there is no pivot handle at all for a toy
5. Rotate the chip, then drag it somewhere else — it stays rotated, turning
   about its own new centre
6. Second browser window: the rotation appears there too
7. Place a single_poker_card and repeat — same 45° grain, same behaviour
8. Any OTHER toy (dice, tray, bag, ...) never offers rotate mode — only
   chip and single_poker_card declare `tt_able_rotate`
9. A resizable toy (bag, tray_sum) still resizes normally — rotation and
   resize are independent capabilities, and today no toy has both
10. Rotate a chip 90°, then click once to cycle back to plain selection
    (its action-square/bowstring handle) — the handle square is visible at
    the rotated corner; clicking IT (not where the corner used to be)
    fires the chip's first menu action, and pulling it back like a
    bowstring and releasing still charges/fires normally
10a. While pulling the bowstring on that rotated chip, the faint toy/ring
    "ghost" echoes in the delight layer sit turned the same way the chip
    itself is — not sitting upright as if the chip were never rotated
11. Same check for single_poker_card — clicking its rotated action handle
    flips the card
12. Second browser window, while the local player charges a rotated toy's
    bowstring: the peer's charge indicator (ghost + ring) shows up at the
    rotated corner too, not the old unrotated one

---

## Supply — clones carry a prototype's data- attributes

1. Place a Supply and a chip; rotate the chip 45° or 90°, then drag it onto
   the Supply
2. Take a clone (menu → Take) — the clone comes out at the SAME rotation,
   turning about its OWN centre (not the prototype's)
3. A tray_sum with a nested, rotated chip inside it, stacked on the Supply
   — the nested chip's rotation survives the clone too
4. Second browser window: the cloned rotation appears there too

---

## Boundary Constraints

1. **Single boundary:** Create boundary named `"toy"`, toy with class `"toy"` inside
   - Drag to edges; should stop (no jitter)
   - Rename boundary to `"other"`; toy now free-moving
   - Move toy outside via edit panel, drag; should be unconstrained

2. **Multiple boundaries:** Two overlapping boundaries named `"toy"`, toy in overlap
   - Drag; should respect union of both

---

## Square Grid Position Sets

1. Tool: `'pos-grid-sq'`, spacing `80`, snap-radius `30`
2. Draw 240×240px; expect 4×4=16 circles
3. Inspector: each `<circle>` has `cx`, `cy`, `r="30"`
4. Drag toy near grid point; should snap when within radius
5. Edit panel: change snap-radius to `50`; all circles update to `r="50"`

---

## Hex Grid Position Sets

1. Tool: `'pos-grid-hex'`, hex-size `40`, snap-radius `30`
2. Draw 300×300px; circles form staggered pointy-top pattern
3. Inspector: odd rows offset by `hexSize * √3/2` (≈34.6px)
4. Drag toy; should snap to nearest hex point
5. Compare with square grid on same canvas; no confusion

---

## Snap + Boundary Interaction

1. Boundary named `"toy"`, position set named `"toy"`, toy with class `"toy"` inside
2. Drag toy; should snap only to grid points inside boundary
3. Snap point outside boundary rejected

---

## Undo / Redo

1. Create boundary + position set, modify toy position → undo 3× → redo 3×
2. Elements reappear with identical geometry
3. Inspector: no orphaned elements, correct child counts

---

## Edit Panel

1. **Boundary:** Edit `name` → label updates; edit `x`/`y` → boundary moves
2. **Position set:** Edit `name` and `snap-radius` → both update in one transaction

---

## Layer Visibility

1. Create 2 boundaries, 2 position sets, toys
2. Toggle boundaries-positions layer off/on
3. Boundaries and position sets hide/show; toys unaffected

---

## Browser Inspector Spot Checks

1. **Boundary:** `<g data-bounpos-type="boundary">` has 2 children (`<path>`, `<text>`); all attrs in Yjs
2. **Position set:** `<g data-bounpos-type="pos-set">` has `<path>`, `<text>`, N `<circle>` children; `snap-radius`, `data-gen-type`, `data-gen-param` on `<g>`
3. **Yjs sync (two windows):** Create boundary in one; appears in other within 1–2s

---

## Shared Background Image

1. Tools panel → Background layer → "Choose an image…" → pick a PNG
2. The table background becomes that image; the line under the button
   names the file and its size
3. Second browser window on the same table: the same background appears,
   with no URL anywhere in the flow
4. Pick a large photo (> 1 MB): the toast says it was resized, and the
   background still renders
5. Pick a PNG with transparency: it stays a PNG — no black where the
   transparency was
6. Open a third window on the table *after* sharing: the background
   arrives with it
7. Export SVG, open the file in Inkscape: the background is there, and
   the file needs nothing alongside it
8. Re-import that file: background intact, and the Background panel still
   names an image rather than showing a data: URL
9. Pick a second image: the first one's bytes are gone from the document
   (Debug panel → doc size, or re-export and compare)
10. home.html: the table's thumbnail shows the shared background

---

## Merge Checklist

- [ ] Sections above all pass
- [ ] Inspector: correct structure and child counts
- [ ] No visual regressions
