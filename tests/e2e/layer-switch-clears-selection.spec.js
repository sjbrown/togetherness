/**
 * tests/e2e/layer-switch-clears-selection.spec.js
 *
 * Selection is never layer-scoped by construction — _myClaims is one flat
 * map, and toggleSelection doesn't check which layer an id belongs to.
 * Switching the active layer now clears the selection explicitly, which is
 * what makes a mixed toys+drawing selection actually impossible rather
 * than just unlikely — load-bearing for undo, which uses one mechanism
 * per action and has no way to invoke both for a single mixed gesture.
 *
 * Run via:  bin/test_e2e.sandbox.sh tests/e2e/layer-switch-clears-selection.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('switching layers abandons the current selection', () => {
  test('selecting a toy, then switching to the drawing layer, deselects it', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const canvas = page.locator('#canvas');
    const box    = await canvas.boundingBox();

    // Place and select a die.
    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();

    await page.evaluate(() => window.UI.pillTap('select'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();

    await expect(page.locator('.selRing')).toHaveCount(1, { timeout: 5000 });

    // Switching layers abandons the claim.
    await page.evaluate(() => window.UI.selectLayer('drawing'));
    await page.waitForTimeout(100);

    await expect(page.locator('.selRing')).toHaveCount(0);
    expect(await page.evaluate(() => window.App.getSelectedIds())).toEqual([]);

    await browser.close();
  });

  test('cannot end up with a mixed toys+drawing selection via layer switch and shift-click', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const canvas = page.locator('#canvas');
    const box    = await canvas.boundingBox();

    // Select a die on the toys layer.
    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();
    await page.evaluate(() => window.UI.pillTap('select'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();
    const toyId = await page.evaluate(() => window.App.getSelectedIds()[0]);
    expect(toyId).toBeTruthy();

    // Switch to the drawing layer and add a rect there directly (matching
    // multiselect.spec.js's pattern — more reliable than simulating a
    // click-drag for shape creation).
    await page.evaluate(() => window.UI.selectLayer('drawing'));
    await page.waitForTimeout(100);
    await page.evaluate(() => window.App.commitDrawing({
      type: 'rect', x: 300, y: 100, width: 80, height: 80,
      fill: '#5a7ea8', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 0,
    }));

    // Shift-click the new rect. If the toy's claim had survived the layer
    // switch, this would produce a 2-element, mixed-layer selection.
    await page.evaluate(() => window.UI.pillTap('select'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 340, box.y + 140);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.up();
    await page.keyboard.up('Shift');

    const selectedIds = await page.evaluate(() => window.App.getSelectedIds());
    expect(selectedIds).not.toContain(toyId);
    expect(selectedIds.length).toBe(1);

    await browser.close();
  });
});
