/**
 * tests/e2e/app-signals.spec.js
 *
 * App.on's local-only signals, which delight effects build on: what each
 * pointer gesture sends, independent of any effect that listens.
 */

import { test, expect } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test('moving toys sends move:placed with where each now rests', async ({ page }) => {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  const box = await page.locator('#canvas').boundingBox();
  const sc = (x, y) => ({ x: box.x + x, y: box.y + y });

  await page.evaluate(() => window.UI.pillTap('d6'));
  for (const p of [sc(200, 200), sc(400, 200)]) {
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.up();
  }
  await expect(page.locator('#toys-layer [data-toy-type]')).toHaveCount(2, { timeout: 5000 });
  const [idA, idB] = await page.evaluate(() =>
    [...document.querySelectorAll('#toys-layer [data-toy-type]')].map(el => el.getAttribute('data-id')));

  await page.evaluate(() => {
    window.__moves = [];
    window.App.on('move:placed', (d) => window.__moves.push(d));
  });
  await page.evaluate(() => window.UI.pillTap('select'));

  // A tap selects without moving: nothing is sent.
  await page.mouse.move(sc(200, 200).x, sc(200, 200).y);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__moves)).toEqual([]);

  // One toy, dragged 100 down.
  await page.mouse.down();
  await page.mouse.move(sc(200, 202).x, sc(200, 202).y);
  await page.mouse.move(sc(200, 300).x, sc(200, 300).y, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__moves.length)).toBe(1);
  const anchorOf = (id) => page.evaluate((id) =>
    window.App.getAnchor(document.querySelector(`#toys-layer [data-id="${id}"]`)), id);
  const single = await page.evaluate(() => window.__moves[0]);
  expect(single).toEqual({ layer: 'toys', moves: [{ id: idA, ...(await anchorOf(idA)) }] });
  expect(single.moves[0].y).toBe(300);

  // Both toys, shift-rubber-banded, dragged 50 right together.
  await page.mouse.move(sc(120, 120).x, sc(120, 120).y);
  await page.keyboard.down('Shift');
  await page.mouse.down();
  await page.mouse.move(sc(480, 380).x, sc(480, 380).y, { steps: 8 });
  await page.mouse.up();
  await page.keyboard.up('Shift');
  await expect(page.locator('#selection_local .selRing')).toHaveCount(2, { timeout: 3000 });
  await page.mouse.move(sc(400, 200).x, sc(400, 200).y);
  await page.mouse.down();
  await page.mouse.move(sc(402, 200).x, sc(402, 200).y);
  await page.mouse.move(sc(450, 200).x, sc(450, 200).y, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__moves.length)).toBe(2);
  const multi = await page.evaluate(() => window.__moves[1]);
  expect(multi.layer).toBe('toys');
  expect(multi.moves.map(m => m.id).sort()).toEqual([idA, idB].sort());
  for (const m of multi.moves) expect({ x: m.x, y: m.y }).toEqual(await anchorOf(m.id));
});
