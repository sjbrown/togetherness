/**
 * tests/e2e/tool-switch-clears-selection.spec.js
 *
 * Bug: select an existing toy, open its Edit panel, click a placement tool
 * (e.g. d6) — the claim on the selected toy survived the tool switch, so
 * the pill kept rendering selection actions (Delete/Duplicate/Edit) instead
 * of the tool row. With no select button anywhere, the placement cursor
 * was stuck: there was no way back to the select tool short of reloading.
 *
 * Fix: App.setTool() clears all claims before switching, so choosing any
 * tool always drops the current selection first.
 *
 * Run via:  bin/test_e2e.sandbox.sh tests/e2e/tool-switch-clears-selection.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('switching tools abandons the current selection', () => {
  test('selecting a toy, then picking a placement tool, clears the claim and unsticks the pill', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const canvas = page.locator('#canvas');
    const box    = await canvas.boundingBox();

    // Place a die, then select it (mirrors layer-switch-clears-selection.spec.js).
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
    expect(await page.evaluate(() => window.App.getSelectedIds())).toHaveLength(1);

    // Simulate clicking a toy tool from the Edit panel — this is exactly
    // what its tool buttons invoke (see ui.js toolsBody: onclick="App.setTool(...)").
    await page.evaluate(() => window.App.setTool('d6'));
    await page.waitForTimeout(100);

    // The claim must be gone, and the pill must be back to showing tools
    // (with a select button) rather than being stuck on selection actions.
    expect(await page.evaluate(() => window.App.getSelectedIds())).toEqual([]);
    await expect(page.locator('.selRing')).toHaveCount(0);
    await expect(page.locator('#pill .ico[aria-label="Select"]')).toHaveCount(1);

    // The placement tool itself is still active and usable.
    await page.mouse.move(box.x + 300, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(100);

    await expect(page.locator('#toys-layer > [data-id]')).toHaveCount(2);

    await browser.close();
  });
});
