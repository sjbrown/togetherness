/**
 * tests/e2e/group-action.spec.js
 *
 * A multi-selection of toys sharing a default action shows one action
 * square at its south-east-most corner; clicking it runs the action on
 * every member as a single undoable step.
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

const launch = () => chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function placeDice(page, spots) {
  const box = await page.locator('#canvas').boundingBox();
  for (const [x, y] of spots) {
    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    await page.mouse.click(box.x + x, box.y + y);
  }
  await expect(page.locator('#toys-layer > [data-toy-type]')).toHaveCount(spots.length, { timeout: 5000 });
  return page.evaluate(() =>
    [...document.querySelectorAll('#toys-layer > [data-toy-type]')].map(el => el.dataset.id));
}

const faces = (page, ids) => page.evaluate(
  (ids) => ids.map(id => document.querySelector(`[data-id="${id}"] tspan`).textContent), ids);

async function selectAll(page, ids) {
  await page.evaluate(() => window.UI.pillTap('select'));
  await page.evaluate((ids) => {
    window.App.select(ids[0]);
    ids.slice(1).forEach(id => window.App.toggleSelection(id));
  }, ids);
}

test('one square for three dice sits at the south-east-most corner; clicking it rolls all three', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);

  const ids = await placeDice(page, [[150, 150], [450, 250], [250, 450]]);
  await selectAll(page, ids);

  await expect(page.locator('#overlay-layer .groupAction .actionSquare')).toHaveCount(1, { timeout: 3000 });
  await expect(page.locator('#overlay-layer .bowstring')).toHaveCount(0);


  const sq = await page.locator('#overlay-layer .groupAction .actionSquare').boundingBox();
  const sqc = { x: sq.x + sq.width / 2, y: sq.y + sq.height / 2 };

  // South-east-most: no die's box reaches further along the SE diagonal.
  const boxes = await Promise.all(ids.map(id => page.locator(`[data-id="${id}"]`).boundingBox()));
  const farthest = Math.max(...boxes.map(b => b.x + b.width + b.y + b.height));
  expect(sqc.x + sqc.y).toBeGreaterThan(farthest - 20);

  await page.evaluate(() => { Math.random = () => 0; });
  expect(await faces(page, ids)).toEqual(['6', '6', '6']);
  await page.mouse.click(sqc.x, sqc.y);
  await expect.poll(() => faces(page, ids)).toEqual(['1', '1', '1']);
  await browser.close();
});

test('rolling the group undoes in one press', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);

  const ids = await placeDice(page, [[150, 150], [450, 250], [250, 450]]);
  const before = await faces(page, ids);
  await selectAll(page, ids);

  // Math.random() === 0 rolls a 1, never the 6 a fresh die shows.
  await page.evaluate(() => { Math.random = () => 0; });
  const sq = await page.locator('#overlay-layer .groupAction .actionSquare').boundingBox();
  await page.mouse.click(sq.x + sq.width / 2, sq.y + sq.height / 2);
  await expect.poll(() => faces(page, ids)).toEqual(['1', '1', '1']);

  await page.evaluate(() => window.App.undo());
  await expect.poll(() => faces(page, ids)).toEqual(before);
  await browser.close();
});

test('no square when the selected toys have different default actions', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);

  const box = await page.locator('#canvas').boundingBox();
  const [die] = await placeDice(page, [[150, 150]]);
  await page.evaluate(() => window.UI.pillTap('chip'));
  await page.waitForTimeout(100);
  await page.mouse.click(box.x + 450, box.y + 250);
  await expect(page.locator('#toys-layer > [data-toy-type]')).toHaveCount(2, { timeout: 5000 });
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('#toys-layer > [data-toy-type]')].map(el => el.dataset.id));

  await selectAll(page, ids);
  await expect(page.locator('#overlay-layer .selRing')).toHaveCount(2, { timeout: 3000 });
  await expect(page.locator('#overlay-layer .groupAction')).toHaveCount(0);
  expect(die).toBeTruthy();
  await browser.close();
});
