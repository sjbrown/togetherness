/**
 * tests/e2e/action-square-touch.spec.js
 *
 * The action square's grab area is 44px on a touchscreen and the drawn
 * 22px elsewhere. A press 16px along each axis from the square's centre
 * lies outside the drawn square and inside the larger area.
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

const launch = () => chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

const faces = (page) => page.evaluate(() =>
  [...document.querySelectorAll('#toys-layer > [data-toy-type]')].map(el => el.querySelector('tspan').textContent));

const selectBoth = (page) => page.evaluate(() => {
  window.UI.pillTap('select');
  const ids = [...document.querySelectorAll('#toys-layer > [data-toy-type]')].map(el => el.dataset.id);
  window.App.select(ids[0]);
  window.App.toggleSelection(ids[1]);
});

// Two dice, both selected, so the group action square is showing. Returns
// the centre of that square.
async function groupSquare(page) {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  const box = await page.locator('#canvas').boundingBox();
  for (const [x, y] of [[150, 150], [350, 250]]) {
    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    await page.mouse.click(box.x + x, box.y + y);
  }
  await expect(page.locator('#toys-layer > [data-toy-type]')).toHaveCount(2, { timeout: 5000 });
  await selectBoth(page);
  const sq = await page.locator('#selection_local .groupAction .actionSquare').boundingBox();
  await page.evaluate(() => { Math.random = () => 0; });
  return { x: sq.x + sq.width / 2, y: sq.y + sq.height / 2 };
}

test('a touch tap outside the drawn square but inside 44px fires the group action', async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ hasTouch: true, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const c = await groupSquare(page);
  expect(await page.evaluate(() => matchMedia('(any-pointer: coarse)').matches)).toBe(true);

  expect(await faces(page)).toEqual(['6', '6']);
  await page.touchscreen.tap(c.x + 16, c.y + 16);
  await expect.poll(() => faces(page)).toEqual(['1', '1']);
  await browser.close();
});

test('a mouse click there does not: the grab area stays the drawn 22px', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const c = await groupSquare(page);
  expect(await page.evaluate(() => matchMedia('(any-pointer: coarse)').matches)).toBe(false);

  await page.mouse.click(c.x + 16, c.y + 16);
  await page.waitForTimeout(300);
  expect(await faces(page)).toEqual(['6', '6']);

  // The miss landed on empty canvas and deselected; select again.
  await selectBoth(page);
  await page.mouse.click(c.x, c.y);
  await expect.poll(() => faces(page)).toEqual(['1', '1']);
  await browser.close();
});
