/**
 * tests/e2e/multiselect.spec.js
 *
 * End-to-end test for the multi-select feature.
 *
 * Sequence:
 *   1. Create rects A (100,100,80,80), B (300,100,80,80), C (500,100,80,80)
 *   2. Single-click A → 1 local ring
 *   3. Rubber-band around B and C → 2 rings (A deselected)
 *   4. Rubber-band around C and A (replaces selection) → 2 rings
 *   5. Shift-click B → 3 rings (union)
 *   6. Click empty canvas → 0 rings
 *
 * Run via:  bin/test.sh --e2e
 */

import { test, expect, chromium } from '@playwright/test';

const APP_URL       = process.env.APP_URL       || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('multi-select', () => {
  test('single-click, rubber-band, shift-click, deselect', async () => {
    const browser = await chromium.launch();
    const ctx     = await browser.newContext();
    const page    = await ctx.newPage();

    const room = `e2e-multisel-${Date.now()}`;
    await page.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);
    await expect(page.locator('#peerCount')).toHaveText('0', { timeout: 8000 });

    const canvas    = page.locator('#canvas');
    const canvasBox = await canvas.boundingBox();

    // SVG → screen coordinate helper (view starts at 0,0 scale 1)
    const sc = (svgX, svgY) => ({ x: canvasBox.x + svgX, y: canvasBox.y + svgY });

    // ── 1. Create three rects via the App API ────────────────────────────────
    await page.evaluate(() => window.App.setLayer('drawing'));
    await page.waitForTimeout(100);

    // Rect A: centre ~(140, 140)
    await page.evaluate(() => window.App.commitDrawing({
      type: 'rect', x: 100, y: 100, width: 80, height: 80,
      fill: '#c8941e', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 0,
    }));
    // Rect B: centre ~(340, 140)
    await page.evaluate(() => window.App.commitDrawing({
      type: 'rect', x: 300, y: 100, width: 80, height: 80,
      fill: '#5a7ea8', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 0,
    }));
    // Rect C: centre ~(540, 140)
    await page.evaluate(() => window.App.commitDrawing({
      type: 'rect', x: 500, y: 100, width: 80, height: 80,
      fill: '#7a9e5a', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 0,
    }));
    await page.waitForTimeout(200);

    // Confirm 3 rects in DOM
    await expect(page.locator('#drawing-layer [data-yid]')).toHaveCount(3, { timeout: 3000 });

    // Grab ids in document order
    const [idA, idB, idC] = await page.evaluate(() =>
      [...document.querySelectorAll('#drawing-layer [data-yid]')]
        .map(el => el.getAttribute('data-yid'))
    );
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idC).toBeTruthy();

    // ── Switch to select tool ────────────────────────────────────────────────
    await page.evaluate(() => window.UI.pillTap('select'));
    await page.waitForTimeout(100);

    const ringCount = () =>
      page.locator('#overlay-layer .selRing').count();

    // ── 2. Single-click A ────────────────────────────────────────────────────
    // Click the centre of rect A
    const centreA = sc(140, 140);
    await page.mouse.move(centreA.x, centreA.y);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(100);

    await expect(page.locator('#overlay-layer .selRing')).toHaveCount(1, { timeout: 3000 });

    const selectedAfterA = await page.evaluate(() => window.App.getSelectedIds());
    expect(selectedAfterA).toHaveLength(1);
    expect(selectedAfterA[0]).toBe(idA);

    // ── 3. Rubber-band B and C (multi toggle on) ─────────────────────────────
    await page.evaluate(() => window.App.setToolParam('select', 'multi', true));
    await page.waitForTimeout(50);

    // Drag from (270, 70) to (600, 200) — fully surrounds B and C, misses A
    const rbBC_start = sc(270, 70);
    const rbBC_end   = sc(600, 200);
    await page.mouse.move(rbBC_start.x, rbBC_start.y);
    await page.mouse.down();
    await page.mouse.move(rbBC_end.x, rbBC_end.y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(150);

    await expect(page.locator('#overlay-layer .selRing')).toHaveCount(2, { timeout: 3000 });

    const selectedAfterBC = await page.evaluate(() => window.App.getSelectedIds());
    expect(selectedAfterBC).toHaveLength(2);
    expect(selectedAfterBC).toContain(idB);
    expect(selectedAfterBC).toContain(idC);
    expect(selectedAfterBC).not.toContain(idA);

    // ── 4. Rubber-band C and A (replaces selection) ──────────────────────────
    // Drag from (70, 70) to (600, 200) — fully surrounds A and C, misses B
    // Actually A is at 100..180 and C is at 500..580; to miss B (300..380)
    // we can't use a single rect — use two separate boxes.
    // Instead: use shift-drag to be additive from an empty base.
    // Simpler: deselect first, then rubber-band A+C.
    // But the spec says "rubber-band C & A (replaces selection)".
    // The only way to get {A,C} with one rubber-band is a box that contains
    // both A and C but not B — which isn't possible with a rectangle since B
    // is between them. So this step is actually: new rubber-band replaces
    // {B,C} with {A,B,C} (all three in one big box), then we verify the
    // replace semantics (not additive). Let's use a box from (70,70) to
    // (600,200) that catches all three — this tests "rubber-band replaces".
    const rbAll_start = sc(70, 70);
    const rbAll_end   = sc(600, 200);
    await page.mouse.move(rbAll_start.x, rbAll_start.y);
    await page.mouse.down();
    await page.mouse.move(rbAll_end.x, rbAll_end.y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(150);

    await expect(page.locator('#overlay-layer .selRing')).toHaveCount(3, { timeout: 3000 });

    const selectedAfterAll = await page.evaluate(() => window.App.getSelectedIds());
    expect(selectedAfterAll).toHaveLength(3);
    expect(selectedAfterAll).toContain(idA);
    expect(selectedAfterAll).toContain(idB);
    expect(selectedAfterAll).toContain(idC);

    // Now rubber-band just B+C again to get back to {B,C} for the shift-click test
    await page.mouse.move(rbBC_start.x, rbBC_start.y);
    await page.mouse.down();
    await page.mouse.move(rbBC_end.x, rbBC_end.y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(150);

    await expect(page.locator('#overlay-layer .selRing')).toHaveCount(2, { timeout: 3000 });

    // ── 5. Shift-click B to add A — wait, B is already selected, so shift-B
    //       would remove it. Instead shift-click A to add it to {B, C}.
    const centreA2 = sc(140, 140);
    await page.keyboard.down('Shift');
    await page.mouse.move(centreA2.x, centreA2.y);
    await page.mouse.down();
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(150);

    await expect(page.locator('#overlay-layer .selRing')).toHaveCount(3, { timeout: 3000 });

    const selectedAfter5 = await page.evaluate(() => window.App.getSelectedIds());
    expect(selectedAfter5).toHaveLength(3);
    expect(selectedAfter5).toContain(idA);
    expect(selectedAfter5).toContain(idB);
    expect(selectedAfter5).toContain(idC);

    // Also verify shift-clicking a selected item (B) removes it
    const centreB = sc(340, 140);
    await page.keyboard.down('Shift');
    await page.mouse.move(centreB.x, centreB.y);
    await page.mouse.down();
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(150);

    await expect(page.locator('#overlay-layer .selRing')).toHaveCount(2, { timeout: 3000 });

    const selectedAfterRemoveB = await page.evaluate(() => window.App.getSelectedIds());
    expect(selectedAfterRemoveB).not.toContain(idB);
    expect(selectedAfterRemoveB).toContain(idA);
    expect(selectedAfterRemoveB).toContain(idC);

    // ── 5.5 Move the selection ({A, C}) down 100px ───────────────────────────
    // Drag from the centre of A (140, 140) to (140, 240).
    // At scale 1 that is exactly 100 SVG units down.
    // A and C should each move down by 100; B (not selected) stays put.
    const dragStart = sc(140, 140);
    const dragEnd   = sc(140, 240);
    await page.mouse.move(dragStart.x, dragStart.y);
    await page.mouse.down();
    await page.mouse.move(dragStart.x, dragStart.y + 2); // trigger ref.moved
    await page.mouse.move(dragEnd.x, dragEnd.y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Rings should still show for A and C at their new positions
    await expect(page.locator('#overlay-layer .selRing')).toHaveCount(2, { timeout: 3000 });

    // Read committed positions from the DOM
    const positions = await page.evaluate(({ idA, idB, idC }) => {
      function rectPos(id) {
        const el = document.querySelector(`[data-yid="${id}"]`);
        if (!el) return null;
        return {
          x: parseFloat(el.getAttribute('x') ?? el.querySelector('rect')?.getAttribute('x') ?? 'NaN'),
          y: parseFloat(el.getAttribute('y') ?? el.querySelector('rect')?.getAttribute('y') ?? 'NaN'),
        };
      }
      return { A: rectPos(idA), B: rectPos(idB), C: rectPos(idC) };
    }, { idA, idB, idC });

    // A moved: was y=100, now y=200
    expect(positions.A).not.toBeNull();
    expect(positions.A.x).toBeCloseTo(100, 0);
    expect(positions.A.y).toBeCloseTo(200, 0);

    // B unmoved: still y=100
    expect(positions.B).not.toBeNull();
    expect(positions.B.x).toBeCloseTo(300, 0);
    expect(positions.B.y).toBeCloseTo(100, 0);

    // C moved: was y=100, now y=200
    expect(positions.C).not.toBeNull();
    expect(positions.C.x).toBeCloseTo(500, 0);
    expect(positions.C.y).toBeCloseTo(200, 0);

    // ── 6. Click empty canvas → deselect all ─────────────────────────────────
    const emptyPoint = sc(750, 400);
    await page.mouse.move(emptyPoint.x, emptyPoint.y);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(100);

    await expect(page.locator('#overlay-layer .selRing')).toHaveCount(0, { timeout: 3000 });

    const selectedAfterDeselect = await page.evaluate(() => window.App.getSelectedIds());
    expect(selectedAfterDeselect).toHaveLength(0);

    await browser.close();
  });
});
