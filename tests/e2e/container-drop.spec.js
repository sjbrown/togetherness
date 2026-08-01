/**
 * tests/e2e/container-drop.spec.js
 *
 * Regression test for a real bug: commitMove's drop-into-container branch
 * called Toys.runGestureSync without a tableId, so the reparent never
 * appended an operation to the op log — only the dual-write to Yjs
 * happened. Peer A's own screen looked correct (its DOM was mutated
 * directly by the gesture); a joining peer, whose render path is driven
 * entirely by the op log, never received the reparent at all and stayed
 * at the pre-drop position.
 *
 * Run via:  bin/test_e2e.sandbox.sh tests/e2e/container-drop.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openCreatorAndJoiner } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('two-peer container drop sync', () => {
  test('dropping a die into a tray on peer A reparents it on peer B too', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    await openCreatorAndJoiner(page1, page2, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });
    await expect(page2.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();

    // Place a tray, well away from where the die will start.
    await page1.evaluate(() => window.UI.pillTap('tray_sum'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 300, box.y + 300);
    await page1.mouse.down();
    await page1.mouse.up();

    // Place a die somewhere clearly outside the tray's bounds.
    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 80, box.y + 80);
    await page1.mouse.down();
    await page1.mouse.up();

    await expect(page1.locator('[data-toy-id]')).toHaveCount(2, { timeout: 5000 });
    await expect(page2.locator('[data-toy-id]')).toHaveCount(2, { timeout: 5000 });

    const trayId = await page1.locator('[data-toy-type="tray_sum"]').getAttribute('data-toy-id');
    const dieId  = await page1.locator('[data-toy-type="dice_d6"]').getAttribute('data-toy-id');

    // Select the die and drag it onto the tray.
    await page1.evaluate(() => window.UI.pillTap('select'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 80, box.y + 80);
    await page1.mouse.down();
    await page1.mouse.move(box.x + 150, box.y + 200, { steps: 10 });
    await page1.mouse.move(box.x + 300, box.y + 300, { steps: 10 });
    await page1.mouse.up();

    // On peer A: the die is now nested inside the tray's contents group,
    // not a sibling of it at the top level of #toys-layer.
    await expect(
      page1.locator(`#toys-layer > [data-toy-id="${trayId}"] .tt_contents [data-toy-id="${dieId}"]`)
    ).toHaveCount(1, { timeout: 5000 });
    await expect(
      page1.locator(`#toys-layer > [data-toy-id="${dieId}"]`)
    ).toHaveCount(0);

    // The bug: without this, peer B's die stays a top-level sibling,
    // never reparented, because the gesture never became an operation.
    await expect(
      page2.locator(`#toys-layer > [data-toy-id="${trayId}"] .tt_contents [data-toy-id="${dieId}"]`)
    ).toHaveCount(1, { timeout: 5000 });
    await expect(
      page2.locator(`#toys-layer > [data-toy-id="${dieId}"]`)
    ).toHaveCount(0);

    await browser.close();
  });
});
