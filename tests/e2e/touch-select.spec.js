/**
 * tests/e2e/touch-select.spec.js
 *
 * Selection by touch. On touch the click that follows a tap is dispatched on
 * the element under the finger, so anything that selects from click events
 * runs in addition to the pointer handlers here, where it never does with a
 * mouse. These pin down that a tap selects exactly as a click does.
 */

import { test, expect, chromium, devices } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

async function touchPageWithToy(browser, tool = 'd6') {
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  const box = await page.locator('#canvas').boundingBox();
  await page.evaluate((t) => window.UI.pillTap(t), tool);
  await page.waitForTimeout(100);
  await page.touchscreen.tap(box.x + 150, box.y + 150);
  await expect(page.locator('[data-toy-type]')).toHaveCount(1, { timeout: 5000 });
  await page.evaluate(() => window.UI.pillTap('select'));
  await page.waitForTimeout(400);                      // past any tap sequence
  const toy = await page.locator('[data-toy-type]').first().boundingBox();
  return { page, x: toy.x + toy.width / 2, y: toy.y + toy.height / 2, box };
}

const selRing = (page) => page.locator('#overlay-layer .selRing');
const handles = (page) => page.locator('#overlay-layer .handle');

const launch = () => chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

test('a tap selects a toy, and a tap on empty canvas deselects it', async () => {
  const browser = await launch();
  const { page, x, y, box } = await touchPageWithToy(browser);

  await page.touchscreen.tap(x, y);
  await expect(selRing(page)).toHaveCount(1);

  await page.waitForTimeout(400);
  await page.touchscreen.tap(box.x + 400, box.y + 400);
  await expect(selRing(page)).toHaveCount(0);

  await browser.close();
});

test('tapping the selected toy again steps it into its next selection mode', async () => {
  const browser = await launch();
  const { page, x, y } = await touchPageWithToy(browser, 'meeple');   // meeples can rotate

  await page.touchscreen.tap(x, y);
  await expect(selRing(page)).toHaveCount(1);
  await expect(handles(page)).toHaveCount(0);

  await page.waitForTimeout(400);
  await page.touchscreen.tap(x, y);
  await expect(handles(page)).not.toHaveCount(0);

  await browser.close();
});

test('a tap on a toy while another layer is active does not select it', async () => {
  const browser = await launch();
  const { page, x, y } = await touchPageWithToy(browser);

  await page.evaluate(() => window.App.setLayer('drawing'));
  await page.waitForTimeout(100);
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(300);
  await expect(selRing(page)).toHaveCount(0);

  await browser.close();
});
