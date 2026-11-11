/**
 * tests/e2e/escape-cancels-drag.spec.js
 *
 * Escape mid-drag cancels the drag: the toy goes back where it was, stays
 * selected, and the release commits nothing.
 */

import { test, expect } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test('Escape while dragging a toy cancels the move', async ({ page }) => {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  const box = await page.locator('#canvas').boundingBox();
  const sc = (x, y) => ({ x: box.x + x, y: box.y + y });

  await page.evaluate(() => window.UI.pillTap('d6'));
  await page.mouse.move(sc(200, 200).x, sc(200, 200).y);
  await page.mouse.down();
  await page.mouse.up();
  const toy = page.locator('#toys-layer [data-toy-type]');
  await expect(toy).toHaveCount(1, { timeout: 5000 });
  const id = await toy.getAttribute('data-id');
  const anchor = () => page.evaluate((id) =>
    window.App.getAnchor(document.querySelector(`#toys-layer [data-id="${id}"]`)), id);
  await page.evaluate(() => window.UI.pillTap('select'));
  await expect(page.locator('#delight-layer .delight-puff')).toHaveCount(0, { timeout: 3000 });

  await page.evaluate(() => {
    window.__signals = [];
    for (const p of ['press', 'release', 'place', 'cancel']) {
      window.App.on(`toy:move:${p}`, () => window.__signals.push(p));
    }
  });

  await page.mouse.move(sc(200, 200).x, sc(200, 200).y);
  await page.mouse.down();
  await page.mouse.move(sc(202, 200).x, sc(202, 200).y);
  await page.mouse.move(sc(300, 200).x, sc(300, 200).y, { steps: 8 });
  await page.keyboard.press('Escape');
  await page.mouse.move(sc(350, 200).x, sc(350, 200).y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  expect(await anchor()).toEqual({ x: 200, y: 200 });
  expect(await page.evaluate(() => window.App.getSelectedIds())).toEqual([id]);
  await expect(page.locator('#selection_local .selRing')).toHaveCount(1);
  expect(await page.evaluate(() => window.__signals)).toEqual(['press', 'cancel']);
  await expect(page.locator('#delight-layer .delight-puff')).toHaveCount(0);

  // With nothing in flight, Escape still deselects.
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.App.getSelectedIds())).toEqual([]);
});
