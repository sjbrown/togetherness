/**
 * tests/e2e/boundary-resize.spec.js
 *
 * End-to-end test for resizing a Boundaries & Positions element via the
 * generic sel-resize mode: a plain reclick on an already-selected boundary
 * cycles it into resize mode (corner grab handles appear in the overlay),
 * dragging the SE handle live-updates the overlay's ghost preview, and
 * releasing commits the new extent to the real element.
 *
 * Same drag-gesture pattern as boundary-drag.spec.js (single continuous
 * pointer gesture; App.commitBoundary used to create deterministic
 * geometry instead of a fragile rubber-band draw).
 *
 * Run via:  bin/test_e2e.sandbox.sh tests/e2e/boundary-resize.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator } from './helpers.js';

const APP_URL       = process.env.APP_URL       || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('boundary resize via sel-resize mode', () => {
  test('reclick cycles to resize mode, dragging the SE handle grows the boundary and updates the overlay', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx     = await browser.newContext();
    const page    = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await expect(page.locator('#peerCount')).toHaveText('0', { timeout: 8000 });

    const canvas    = page.locator('#canvas');
    const canvasBox = await canvas.boundingBox();
    const sc = (svgX, svgY) => ({ x: canvasBox.x + svgX, y: canvasBox.y + svgY });

    // ── Create a boundary at x=100..300, y=100..250 ───────────────────────────
    // The Boundaries & Positions layer defaults to hidden (see app.js's
    // _layerVisibility) — invisible AND unclickable (its <path>s render
    // with pointer-events:none while hidden), so switch it visible first.
    await page.evaluate(() => window.App.setLayerVisible('boundaries-positions', true));
    await page.evaluate(() => window.App.setLayer('boundaries-positions'));
    await page.waitForTimeout(100);
    await page.evaluate(() => window.App.commitBoundary({ x: 100, y: 100, w: 200, h: 150 }));
    await page.waitForTimeout(100);

    const id = await page.evaluate(() => window.App.getSelectedIds()[0]);
    expect(id).toBeTruthy();
    // commitBoundary leaves it selected in the default 'sel-move' mode — no handles yet.
    expect(await page.evaluate(() => window.App.getResizeModeId())).toBeNull();
    await expect(page.locator('#overlay-layer rect.handle')).toHaveCount(0);

    // ── Reclick (tap, no movement) on the already-selected boundary ──────────
    // cycles it into 'sel-resize' — canvas.js's onPointerUp detects the tap
    // landed on the sole selection and calls App.nextSelectionMode. A
    // boundary's <path> has fill="none", so only its stroked outline is
    // actually hit-testable (SVG's default pointer-events: visiblePainted) —
    // click the top edge, not the interior.
    const boundaryPoint = sc(200, 100); // top edge midpoint
    await page.mouse.move(boundaryPoint.x, boundaryPoint.y);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(100);

    expect(await page.evaluate((elId) => window.App.getResizeModeId(), id)).toBe(id);

    // Four corner handles now show in the overlay.
    await expect(page.locator('#overlay-layer rect.handle')).toHaveCount(4);
    const corners = await page.locator('#overlay-layer rect.handle').evaluateAll(
      els => els.map(el => el.getAttribute('data-corner')).sort()
    );
    expect(corners).toEqual(['ne', 'nw', 'se', 'sw']);

    // ── Drag the SE handle ────────────────────────────────────────────────────
    // resizeCorners() pads the handle PAD(6) px outside the shape's own rect.
    const seHandle = sc(300 + 6, 250 + 6);
    await page.mouse.move(seHandle.x, seHandle.y);
    await page.mouse.down();
    await page.waitForTimeout(50);

    // Drag out to (400, 350) — mirrors boun_pos.js's own computeResize unit
    // test: SE drag keeps the NW corner fixed, so this should land on
    // {x:100, y:100, width:300, height:250}.
    await page.mouse.move(sc(400, 350).x, sc(400, 350).y);
    await page.waitForTimeout(100);

    // ── Overlay ghost preview reflects the live drag, before release ─────────
    const ghostRectDuringDrag = await page.evaluate(() => {
      const path = document.querySelector('#overlay-layer g[data-module="boun_pos"] path');
      if (!path) return null;
      const nums = (path.getAttribute('d').match(/[-\d.]+/g) ?? []).map(Number);
      const [x, y, x2, , , y2] = nums;
      return { x, y, w: x2 - x, h: y2 - y };
    });
    expect(ghostRectDuringDrag).toEqual({ x: 100, y: 100, w: 300, h: 250 });

    // Real element is untouched until release.
    const pathDBeforeRelease = await page.evaluate(
      (elId) => document.querySelector(`[data-id="${elId}"] path`)?.getAttribute('d'),
      id
    );
    expect(pathDBeforeRelease).toMatch(/M100.*300/);

    // ── Release — commits the resize ──────────────────────────────────────────
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Ghost is gone.
    await expect(page.locator('#overlay-layer g[data-module="boun_pos"][opacity]')).toHaveCount(0);

    const finalRect = await page.evaluate((elId) => {
      const d = document.querySelector(`[data-id="${elId}"] path`)?.getAttribute('d');
      const nums = (d.match(/[-\d.]+/g) ?? []).map(Number);
      const [x, y, x2, , , y2] = nums;
      return { x, y, w: x2 - x, h: y2 - y };
    }, id);
    expect(finalRect).toEqual({ x: 100, y: 100, w: 300, h: 250 });

    await browser.close();
  });
});
