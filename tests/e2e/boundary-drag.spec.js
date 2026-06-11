/**
 * tests/e2e/boundary-drag.spec.js
 *
 * End-to-end test for boundary-constrained toy dragging with ghost rendering.
 *
 * Scenario:
 * 1. Create two separate boundary regions, both named "toy"
 * 2. Place a toy inside boundary A
 * 3. Drag from inside A, through the gap, into B, and past B's right edge:
 *    - While pointer is in the gap:  ghost stays at A's right edge
 *    - While pointer is inside B:    ghost follows freely
 *    - While pointer is past B:      ghost stays at B's right edge
 * 4. Release: toy lands inside B
 *
 * Run via:  bin/test.sh --e2e
 */

import { test, expect, chromium } from '@playwright/test';

const APP_URL      = process.env.APP_URL      || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('boundary-constrained toy dragging', () => {
  test('toy drag ghost respects boundaries and toy lands in second boundary', async () => {
    const browser = await chromium.launch();
    const ctx     = await browser.newContext();
    const page    = await ctx.newPage();

    const room = `e2e-bounds-${Date.now()}`;
    await page.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);

    // Wait for app to boot (same pattern as sync.spec.js)
    await expect(page.locator('#peerCount')).toHaveText('0', { timeout: 8000 });

    const canvas    = page.locator('#canvas');
    const canvasBox = await canvas.boundingBox();

    // ── SVG coordinate constants ──────────────────────────────────────────────
    // Boundary A: x=100..300, y=100..300
    // Boundary B: x=450..650, y=100..300  (gap: 300..450)
    // Toy placed at (150, 200) — inside A
    const bA       = { x: 100, y: 100, w: 200, h: 200 };
    const bB       = { x: 450, y: 100, w: 200, h: 200 };
    const toySvgX  = 150;
    const toySvgY  = 200;

    // Helper: SVG coords → screen coords (view starts at 0,0 scale 1)
    const sc = (svgX, svgY) => ({ x: canvasBox.x + svgX, y: canvasBox.y + svgY });

    // ── Create boundary A via App.commitBoundary directly ────────────────────
    // Using the public App API rather than mouse gestures avoids fragile
    // rubber-band draw interactions in the test environment.
    await page.evaluate(() => window.App.setLayer('boundaries-positions'));
    await page.waitForTimeout(100);
    await page.evaluate((b) => window.App.commitBoundary(b), bA);
    await page.waitForTimeout(100);

    const bAId = await page.evaluate(() => window.App.getSelectedId());
    expect(bAId).toBeTruthy();
    await page.evaluate((id) => window.App.commitEdit(id, { name: 'toy' }), bAId);

    // ── Create boundary B ─────────────────────────────────────────────────────
    await page.evaluate((b) => window.App.commitBoundary(b), bB);
    await page.waitForTimeout(100);

    const bBId = await page.evaluate(() => window.App.getSelectedId());
    expect(bBId).toBeTruthy();
    await page.evaluate((id) => window.App.commitEdit(id, { name: 'toy' }), bBId);

    // ── Sanity checks: both boundaries in DOM with correct geometry + name ────
    const boundarySanity = await page.evaluate((ids) => {
      const { bAId, bBId } = ids;
      const elA = document.querySelector(`[data-yid="${bAId}"]`);
      const elB = document.querySelector(`[data-yid="${bBId}"]`);
      const layerObjects = window.App.getLayerObjects('boundaries-positions');
      const metaA = layerObjects.find(o => o.id === bAId);
      const metaB = layerObjects.find(o => o.id === bBId);
      return {
        activeLayer:    window.App.getActiveLayer(),
        elAExists:      !!elA,
        elBExists:      !!elB,
        elAInBounPos:   elA?.closest('#boundaries-positions-layer') !== null,
        elBInBounPos:   elB?.closest('#boundaries-positions-layer') !== null,
        metaAName:      metaA?.label ?? null,
        metaBName:      metaB?.label ?? null,
        pathAD:         elA?.querySelector('path')?.getAttribute('d') ?? null,
        pathBD:         elB?.querySelector('path')?.getAttribute('d') ?? null,
        layerObjects:   layerObjects.map(o => ({ id: o.id, label: o.label })),
        bAIdEqualsBBId: bAId === bBId,
        elANameAttr:    elA?.getAttribute('name') ?? null,
        elBNameAttr:    elB?.getAttribute('name') ?? null,
      };
    }, { bAId, bBId });

    // console.log('SANITY:', JSON.stringify(boundarySanity, null, 2));
    expect(boundarySanity.elAExists,    'boundary A element in DOM').toBe(true);
    expect(boundarySanity.elBExists,    'boundary B element in DOM').toBe(true);
    expect(boundarySanity.elAInBounPos, 'boundary A in correct layer').toBe(true);
    expect(boundarySanity.elBInBounPos, 'boundary B in correct layer').toBe(true);
    expect(boundarySanity.metaAName,    'boundary A name').toBe('toy');
    expect(boundarySanity.metaBName,    'boundary B name').toBe('toy');
    // Verify geometry: A should span x=100..300, B should span x=450..650
    expect(boundarySanity.pathAD,  'boundary A path').toMatch(/M100.*300/);
    expect(boundarySanity.pathBD,  'boundary B path').toMatch(/M450.*650/);
    expect(boundarySanity.activeLayer, 'active layer after boundary creation').toBe('boundaries-positions');

    // ── Place a toy inside boundary A ─────────────────────────────────────────
    // Must explicitly switch to the toys layer — drawing boundaries leaves the
    // active layer on 'boundaries-positions', and hitForActiveLayer() will miss
    // the toy element until we switch back.
    await page.evaluate(() => window.App.setLayer('toys'));
    await page.waitForTimeout(100);
    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    const toyDrop = sc(toySvgX, toySvgY);
    await page.mouse.move(toyDrop.x, toyDrop.y);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(200);

    await expect(page.locator('#toys-layer [data-yid]')).toHaveCount(1, { timeout: 3000 });

    const toyId = await page.evaluate(() =>
      document.querySelector('#toys-layer [data-yid]')?.getAttribute('data-yid') ?? null
    );
    expect(toyId).toBeTruthy();

    // ── Switch to select tool and drag the toy ────────────────────────────────
    // canvas.js requires a single continuous pointer gesture starting on the toy
    // element itself. A separate click-to-select then drag does not work because
    // the second pointerdown lands on the background and starts a pan instead.
    // One press on the toy element triggers select + startDrag simultaneously.
    await page.evaluate(() => window.UI.pillTap('select'));
    await page.waitForTimeout(100);

    // Press down on the toy — this selects it AND starts the drag in one event
    const toyScreen = sc(toySvgX, toySvgY);
    await page.mouse.move(toyScreen.x, toyScreen.y);
    await page.mouse.down();
    await page.waitForTimeout(50);

    // Move slightly so canvas.js marks ref.moved = true and calls App.move
    await page.mouse.move(toyScreen.x + 2, toyScreen.y);
    await page.waitForTimeout(50);

    // ── Move 1: pointer into the gap (x=375), outside both boundaries ─────────
    // Ghost should be pinned at A's right edge: max dx = 300 - 150 = 150
    await page.mouse.move(sc(375, toySvgY).x, sc(375, toySvgY).y);
    await page.waitForTimeout(100);

    const dxInGap = await page.evaluate((id) => {
      const ghost = [...document.querySelectorAll(`#overlay-layer use[href="#yid-${id}"]`)].find(el => el.hasAttribute("transform"));
      const m = ghost?.getAttribute('transform')?.match(/translate\(([-\d.]+)/);
      return m ? Number(m[1]) : null;
    }, toyId);

    expect(dxInGap).not.toBeNull();
    expect(dxInGap).toBeLessThanOrEqual(152); // 150 + 2 rounding tolerance

    // ── Move 2: pointer into boundary B (x=500) ───────────────────────────────
    // Ghost should follow freely; dx should be ~350 (500 - 150)
    await page.mouse.move(sc(500, toySvgY).x, sc(500, toySvgY).y);
    await page.waitForTimeout(100);

    const dxInB = await page.evaluate((id) => {
      const ghost = [...document.querySelectorAll(`#overlay-layer use[href="#yid-${id}"]`)].find(el => el.hasAttribute("transform"));
      const m = ghost?.getAttribute('transform')?.match(/translate\(([-\d.]+)/);
      return m ? Number(m[1]) : null;
    }, toyId);

    expect(dxInB).not.toBeNull();
    expect(dxInB).toBeGreaterThan(152); // clearly past A's right edge

    // ── Move 3: pointer past B's right edge (x=800) ───────────────────────────
    // Ghost should be pinned at B's right edge: max dx = 650 - 150 = 500
    await page.mouse.move(sc(800, toySvgY).x, sc(800, toySvgY).y);
    await page.waitForTimeout(100);

    const dxPastB = await page.evaluate((id) => {
      const ghost = [...document.querySelectorAll(`#overlay-layer use[href="#yid-${id}"]`)].find(el => el.hasAttribute("transform"));
      const m = ghost?.getAttribute('transform')?.match(/translate\(([-\d.]+)/);
      return m ? Number(m[1]) : null;
    }, toyId);

    expect(dxPastB).not.toBeNull();
    expect(dxPastB).toBeLessThanOrEqual(502); // 500 + 2 rounding tolerance

    // ── Release — toy must land inside B ─────────────────────────────────────
    await page.mouse.up();
    await page.waitForTimeout(200);

    const ghostGone = await page.evaluate((id) =>
      ![...document.querySelectorAll(`#overlay-layer use[href="#yid-${id}"]`)].find(el => el.hasAttribute("transform")),
      toyId
    );
    expect(ghostGone).toBe(true);

    const finalPos = await page.evaluate((id) => {
      const wrapper = document.querySelector(`[data-yid="${id}"]`);
      const inner   = wrapper?.querySelector('svg');
      if (!inner) return null;
      const x = parseFloat(inner.getAttribute('x'));
      const y = parseFloat(inner.getAttribute('y'));
      const w = parseFloat(inner.getAttribute('width'));
      const h = parseFloat(inner.getAttribute('height'));
      // console.log('finalPos inner svg:', { x, y, w, h });
      return { cx: x + w / 2, cy: y + h / 2 };
    }, toyId);
    // console.log('FINAL POS:', JSON.stringify(finalPos));

    expect(finalPos).not.toBeNull();
    expect(finalPos.cx).toBeGreaterThanOrEqual(bB.x);
    expect(finalPos.cx).toBeLessThanOrEqual(bB.x + bB.w);
    expect(finalPos.cy).toBeGreaterThanOrEqual(bB.y);
    expect(finalPos.cy).toBeLessThanOrEqual(bB.y + bB.h);

    await browser.close();
  });
});
