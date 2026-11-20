/**
 * tests/e2e/rummage-mode.spec.js
 *
 * Rummage mode's pointer behaviour, with real hit-testing: the dim over
 * everything outside the border, presses that fall through to the
 * container, and presses on the toys it contains.
 *
 * Run via:  bin/test_e2e.sandbox.sh tests/e2e/rummage-mode.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

const activeMode = (page) => page.evaluate(() => window.App.getRummageModeId() !== null);

// A tray in rummage mode with a die inside it. Returns the tray and die
// centres in page space.
async function trayInRummage(page) {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  const box = await page.locator('#canvas').boundingBox();

  await page.evaluate(() => window.UI.pillTap('tray_sum'));
  await page.waitForTimeout(100);
  await page.mouse.move(box.x + 400, box.y + 300);
  await page.mouse.down(); await page.mouse.up();
  await page.evaluate(() => window.UI.pillTap('d6'));
  await page.waitForTimeout(100);
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.down(); await page.mouse.up();
  await expect(page.locator('[data-toy-type]')).toHaveCount(2, { timeout: 5000 });

  const trayId = await page.locator('[data-toy-type="tray_sum"]').getAttribute('data-id');
  const dieId  = await page.locator('[data-toy-type="dice_d6"]').getAttribute('data-id');
  await page.evaluate(() => window.UI.pillTap('select'));
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 400, box.y + 300, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator(`[data-id="${trayId}"] .tt_contents [data-id="${dieId}"]`)).toHaveCount(1, { timeout: 5000 });

  await page.evaluate((id) => {
    window.App.select(id);
    window.App.nextSelectionMode(id);   // resize
    window.App.nextSelectionMode(id);   // rummage
  }, trayId);
  expect(await activeMode(page)).toBe(true);

  const centre = (sel) => page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  });
  return {
    trayId, box,
    tray: await centre(`[data-id="${trayId}"] > svg`),
    die:  await centre(`[data-id="${dieId}"]`),
  };
}

const click = async (page, x, y) => { await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.up(); };

test.describe('rummage mode pointer behaviour', () => {
  test('the pill is a single disabled Rummage button', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await trayInRummage(page);
    const btn = page.locator('#pill button');
    await expect(btn).toHaveCount(1);
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveText('Rummage');
    await browser.close();
  });

  test('a press on the dim outside the border leaves rummage mode', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const { box } = await trayInRummage(page);
    await expect(page.locator('#selection_local .rummageDim')).toHaveCount(1);
    await click(page, box.x + 900, box.y + 600);
    expect(await activeMode(page)).toBe(false);
    await browser.close();
  });

  test('a press on a contained toy stays in rummage mode', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const { die } = await trayInRummage(page);
    await click(page, die.x, die.y);
    expect(await activeMode(page)).toBe(true);
    await browser.close();
  });

  test('a press that falls through to the tray itself leaves rummage mode', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const { tray, die } = await trayInRummage(page);
    // Inside the tray, well clear of the die.
    await click(page, tray.right - 20, die.y);
    expect(await activeMode(page)).toBe(false);
    await browser.close();
  });

  test('the tray cannot be dragged while rummaging', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const { trayId, tray, die } = await trayInRummage(page);
    const before = await page.locator(`[data-id="${trayId}"] > svg`).evaluate((el) => [el.getAttribute('x'), el.getAttribute('y')]);
    await page.mouse.move(tray.right - 20, die.y);
    await page.mouse.down();
    await page.mouse.move(tray.right + 40, die.y + 60, { steps: 8 });
    await page.mouse.up();
    const after = await page.locator(`[data-id="${trayId}"] > svg`).evaluate((el) => [el.getAttribute('x'), el.getAttribute('y')]);
    expect(after).toEqual(before);
    await browser.close();
  });
});
