/**
 * tests/e2e/double-click.spec.js
 *
 * Double-click on a toy: with a radial menu and no double-click action it
 * opens that menu (and the pill stands aside until the chrome is used);
 * with neither it centres the view and says so.
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

const launch = () => chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function pageWithToy(browser, tool, x = 300, y = 250) {
  const page = await (await browser.newContext()).newPage();
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  const box = await page.locator('#canvas').boundingBox();
  await page.evaluate((t) => window.UI.pillTap(t), tool);
  await page.waitForTimeout(100);
  await page.mouse.click(box.x + x, box.y + y);
  await expect(page.locator('#toys-layer > [data-toy-type]')).toHaveCount(1, { timeout: 5000 });
  await page.evaluate(() => window.UI.pillTap('select'));
  await page.waitForTimeout(400);
  const b = await page.locator('#toys-layer > [data-toy-type]').first().boundingBox();
  return { page, x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

test('double-click on a toy with a radial menu opens it, hides the pill, and the menu button closes it', async () => {
  const browser = await launch();
  const { page, x, y } = await pageWithToy(browser, 'supply');

  await page.mouse.dblclick(x, y);
  await expect(page.locator('#delight-layer .radial-menu.show')).toHaveCount(1, { timeout: 3000 });
  await expect(page.locator('#pill')).toHaveClass(/radial-open/);
  await expect(page.locator('#pill')).toBeHidden();

  // Centred on the action square (the selection ring's SE corner, plus its
  // padding), not on the toy.
  const origin = await page.locator('#delight-layer .radial-menu').evaluate(
    el => ({ x: +el.dataset.originX, y: +el.dataset.originY }));
  const canvas = await page.locator('#canvas').boundingBox();
  const ring = await page.locator('#selection_local .selRing').boundingBox();
  expect(Math.abs(canvas.x + origin.x - (ring.x + ring.width))).toBeLessThan(12);
  expect(Math.abs(canvas.y + origin.y - (ring.y + ring.height))).toBeLessThan(12);
  expect(Math.hypot(canvas.x + origin.x - x, canvas.y + origin.y - y)).toBeGreaterThan(20);

  await page.locator('#menuBtn').click();
  await expect(page.locator('#delight-layer .radial-menu')).toHaveCount(0, { timeout: 3000 });
  await expect(page.locator('#pill')).not.toHaveClass(/radial-open/);

  await browser.close();
});

test('a press on the canvas that misses every spoke closes the menu too', async () => {
  const browser = await launch();
  const { page, x, y } = await pageWithToy(browser, 'supply');

  await page.mouse.dblclick(x, y);
  await expect(page.locator('#delight-layer .radial-menu.show')).toHaveCount(1, { timeout: 3000 });

  await page.mouse.click(x, y);                      // the dead zone at the hub
  await expect(page.locator('#delight-layer .radial-menu')).toHaveCount(0, { timeout: 3000 });
  await expect(page.locator('#pill')).not.toHaveClass(/radial-open/);

  await browser.close();
});

test('double-click on a toy with no action and no radial centres the view and toasts', async () => {
  const browser = await launch();
  const { page, x, y } = await pageWithToy(browser, 'tray_sum', 200, 200);

  await page.mouse.dblclick(x, y);
  await expect(page.locator('#toasts')).toContainText('Double click - center view on toy', { timeout: 3000 });

  await browser.close();
});

test('double-click on a toy with a dblclick action runs it and toasts its label', async () => {
  const browser = await launch();
  const { page, x, y } = await pageWithToy(browser, 'd6', 200, 200);

  await page.mouse.dblclick(x, y);
  await expect(page.locator('#toasts')).toContainText(/Double click - \S/, { timeout: 3000 });
  await expect(page.locator('#toasts')).not.toContainText('center view');
  await expect(page.locator('#delight-layer .radial-menu')).toHaveCount(0);

  await browser.close();
});
