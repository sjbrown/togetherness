/**
 * tests/e2e/delight-cloudburst.spec.js
 *
 * Deleting toys bursts a cloud of dust at each one's centre, for the
 * deleting player only; the peer sees no cloud.
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, joinRoom, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test('deleting multi-selected toys bursts a cloud at each, locally', async () => {
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
  for (const p of [sc(200, 200), sc(400, 300)]) {
    await page1.mouse.move(p.x, p.y);
    await page1.mouse.down();
    await page1.mouse.up();
  }
  await expect(page1.locator('#toys-layer [data-toy-type]')).toHaveCount(2, { timeout: 5000 });
  await expect(page2.locator('#toys-layer [data-toy-type]')).toHaveCount(2, { timeout: 5000 });
  const puffs = page1.locator('#delight-layer .delight-puff');
  await expect(puffs).toHaveCount(0, { timeout: 3000 });

  await page2.evaluate(() => {
    window.__peerPuffs = 0;
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) if (n.classList?.contains('delight-puff')) window.__peerPuffs++;
    }).observe(document.querySelector('#delight-layer'), { childList: true });
  });

  await page1.evaluate(() => window.UI.pillTap('select'));
  await page1.mouse.move(sc(120, 120).x, sc(120, 120).y);
  await page1.keyboard.down('Shift');
  await page1.mouse.down();
  await page1.mouse.move(sc(480, 380).x, sc(480, 380).y, { steps: 8 });
  await page1.mouse.up();
  await page1.keyboard.up('Shift');
  await expect(page1.locator('#selection_local .selRing')).toHaveCount(2, { timeout: 3000 });
  await page1.evaluate(() => window.UI.deleteSelected());

  await expect(puffs).toHaveCount(24);
  const starts = await puffs.evaluateAll(cs => cs.map(c => [+c.getAttribute('cx'), +c.getAttribute('cy')]));
  const near = (x, y) => starts.filter(([cx, cy]) => Math.hypot(cx - x, cy - y) <= 30).length;
  expect(near(200, 200)).toBe(12);
  expect(near(400, 300)).toBe(12);
  await expect(page1.locator('#toys-layer [data-toy-type]')).toHaveCount(0);
  await expect(puffs).toHaveCount(0, { timeout: 3000 });

  await expect(page2.locator('#toys-layer [data-toy-type]')).toHaveCount(0, { timeout: 5000 });
  expect(await page2.evaluate(() => window.__peerPuffs)).toBe(0);

  await browser.close();
});
