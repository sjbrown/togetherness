/**
 * tests/e2e/delight-skid.spec.js
 *
 * Moving a toy puffs a little dust ahead of it where it comes to rest, for
 * the moving player only, without touching the toy; the peer sees no puff.
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, joinRoom, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test('a moved toy puffs dust where it rests, locally', async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page1 = await (await browser.newContext()).newPage();
  const page2 = await (await browser.newContext()).newPage();

  await openAsCreator(page1, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page1, 0);
  const room = await page1.evaluate(() => location.hash.slice(1));
  await joinRoom(page2, room, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page1, 1);
  await waitForPeerCount(page2, 1);

  const box = await page1.locator('#canvas').boundingBox();
  const sc = (x, y) => ({ x: box.x + x, y: box.y + y });
  await page1.evaluate(() => window.UI.pillTap('d6'));
  await page1.mouse.move(sc(200, 200).x, sc(200, 200).y);
  await page1.mouse.down();
  await page1.mouse.up();
  const toy = page1.locator('#toys-layer [data-toy-type]');
  await expect(toy).toHaveCount(1, { timeout: 5000 });
  const toyId = await toy.getAttribute('data-id');
  await expect(page2.locator(`#toys-layer [data-id="${toyId}"]`)).toHaveCount(1, { timeout: 5000 });
  // Let the placement's own puff finish first.
  await expect(page1.locator('#delight-layer .delight-puff')).toHaveCount(0, { timeout: 3000 });

  await page2.evaluate(() => {
    window.__peerPuffs = 0;
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) if (n.classList?.contains('delight-puff')) window.__peerPuffs++;
    }).observe(document.querySelector('#delight-layer'), { childList: true });
  });

  await page1.evaluate(() => window.UI.pillTap('select'));
  await page1.mouse.move(sc(200, 200).x, sc(200, 200).y);
  await page1.mouse.down();
  await page1.mouse.move(sc(202, 200).x, sc(202, 200).y);
  await page1.mouse.move(sc(400, 260).x, sc(400, 260).y, { steps: 8 });
  await page1.mouse.up();

  const puffs = page1.locator('#delight-layer .delight-puff');
  await expect(puffs).toHaveCount(3);
  // Travel was right and a little down, so the puff leads on the right.
  for (const cx of await puffs.evaluateAll(cs => cs.map(c => +c.getAttribute('cx')))) {
    expect(cx).toBeGreaterThan(400);
    expect(cx).toBeLessThan(440);
  }
  expect(await toy.getAttribute('style')).toBeNull();
  await expect(puffs).toHaveCount(0, { timeout: 2000 });

  await expect.poll(() => page2.evaluate((id) =>
    window.App.getAnchor(document.querySelector(`#toys-layer [data-id="${id}"]`)), toyId)).toEqual({ x: 400, y: 260 });
  expect(await page2.evaluate(() => window.__peerPuffs)).toBe(0);

  await browser.close();
});
