/**
 * tests/e2e/attention-touch.spec.js
 *
 * On touch, the click that follows a tap lands on the element under the
 * finger, not on the stage. In attention mode that click must not select a
 * toy, and neither must the tap that dismisses an expired origin.
 */

import { test, expect, chromium, devices } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

async function touchPage(browser) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  return page;
}

async function placeToy(page, x, y) {
  const box = await page.locator('#canvas').boundingBox();
  await page.evaluate(() => window.UI.pillTap('d6'));
  await page.waitForTimeout(100);
  await page.touchscreen.tap(box.x + x, box.y + y);
  await expect(page.locator('[data-toy-type]')).toHaveCount(1, { timeout: 5000 });
  await page.evaluate(() => window.UI.pillTap('select'));
  await page.waitForTimeout(400);                      // past any tap sequence
  return page.locator('[data-toy-type]').first().boundingBox();
}

async function tripleTap(page, x, y) {
  for (let i = 0; i < 3; i++) { await page.touchscreen.tap(x, y); await page.waitForTimeout(40); }
}

const selRing = (page) => page.locator('#overlay-layer .selRing');
const origin  = (page) => page.locator('#attention-layer .attention-fx circle[fill^="url"]');

test('tapping a toy in attention mode does not select it', async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await touchPage(browser);
  const toy = await placeToy(page, 150, 150);

  await tripleTap(page, toy.x + toy.width / 2 + 160, toy.y + toy.height / 2);
  await expect(page.locator('#stage[data-attention]')).toHaveCount(1);

  await page.touchscreen.tap(toy.x + toy.width / 2, toy.y + toy.height / 2);
  await page.waitForTimeout(300);
  await expect(selRing(page)).toHaveCount(0);

  await browser.close();
});

test('the tap that dismisses an expired origin does not select the toy under it', async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await touchPage(browser);
  const toy = await placeToy(page, 150, 150);
  const cx = toy.x + toy.width / 2, cy = toy.y + toy.height / 2;

  // The triple-tap's first two taps select the toy as ordinary taps; the
  // first Escape exits attention mode, the second clears that selection.
  await tripleTap(page, cx, cy);                       // origin centred on the toy
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  await expect(origin(page)).toHaveCount(1);
  await expect(selRing(page)).toHaveCount(0);

  await page.touchscreen.tap(cx, cy);
  await expect(origin(page)).toHaveCount(0, { timeout: 2000 });
  await expect(selRing(page)).toHaveCount(0);

  await browser.close();
});
