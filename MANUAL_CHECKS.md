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

## Merge Checklist

- [ ] Sections above all pass
- [ ] Inspector: correct structure and child counts
- [ ] No visual regressions
