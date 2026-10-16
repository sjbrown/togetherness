/**
 * tests/e2e/attention.spec.js
 *
 * Attention mode across two peers: a triple-click with the select tool
 * enters it and both peers see the origin; moves draw a trail the other peer
 * sees; Escape exits but the origin stays; the other peer's click on it
 * dismisses it everywhere.
 */

import { test, expect, chromium } from '@playwright/test';
import { openCreatorAndJoiner, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

const origin = (page) => page.locator('#attention-layer .attention-fx circle[fill^="url"]');
const lines  = (page) => page.locator('#attention-layer .attention-fx line');

test('triple-click points, Escape exits, a peer click dismisses', async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page1 = await (await browser.newContext()).newPage();
  const page2 = await (await browser.newContext()).newPage();

  await openCreatorAndJoiner(page1, page2, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page1, 1);
  await waitForPeerCount(page2, 1);
  for (const p of [page1, page2]) await p.evaluate(() => window.App.setTool('select'));

  const box = await page1.locator('#stage').boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;

  await page1.mouse.click(x, y, { clickCount: 3, delay: 20 });
  await expect(page1.locator('#stage[data-attention]')).toHaveCount(1);
  await expect(origin(page1)).toHaveCount(1);
  await expect(page1.locator('#toasts', { hasText: 'Attention 3-Click' })).toHaveCount(1);
  await expect(origin(page2)).toHaveCount(1, { timeout: 5000 });

  // Moves draw a trail on the other peer.
  for (let i = 1; i <= 10; i++) await page1.mouse.move(x + i * 12, y + i * 6);
  await expect.poll(() => lines(page2).count(), { timeout: 5000 }).toBeGreaterThan(0);

  // Escape exits the mode; the origin stays on both, expired.
  await page1.keyboard.press('Escape');
  await expect(page1.locator('#stage[data-attention]')).toHaveCount(0);
  await page1.waitForTimeout(800);
  await expect(origin(page1)).toHaveCount(1);
  await expect(origin(page2)).toHaveCount(1);

  // Peer 2 clicks the circle (same default view, so same screen point).
  await page2.mouse.click(x, y);
  await expect(origin(page2)).toHaveCount(0, { timeout: 3000 });
  await expect(origin(page1)).toHaveCount(0, { timeout: 5000 });

  await browser.close();
});
