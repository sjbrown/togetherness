/**
 * tests/e2e/attention.spec.js
 *
 * Triple-click is "attention": it drops the player's Player Marker (replacing
 * any earlier one) and broadcasts the pointer position until the pointer idles.
 */

import { test, expect, chromium } from '@playwright/test';
import { openCreatorAndJoiner, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test('triple-click drops one marker, replaces it, and broadcasts the pointer until idle', async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page1 = await (await browser.newContext()).newPage();
  const page2 = await (await browser.newContext()).newPage();

  await openCreatorAndJoiner(page1, page2, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page1, 1);
  await waitForPeerCount(page2, 1);

  const box = await page1.locator('#canvas').boundingBox();
  const markers = (page) => page.locator('[data-toy-type="player_marker"]');

  await page1.mouse.move(box.x + 200, box.y + 200);
  await page1.mouse.click(box.x + 200, box.y + 200, { clickCount: 3, delay: 20 });
  await expect(markers(page1)).toHaveCount(1, { timeout: 5000 });
  await expect(markers(page2)).toHaveCount(1, { timeout: 5000 });

  // Awareness carries the pointer position while it's moving.
  await page1.mouse.move(box.x + 260, box.y + 240);
  await expect(page2.locator('.attention-pointer')).toHaveCount(1, { timeout: 3000 });

  // ...and drops it after 3s of idleness.
  await expect(page2.locator('.attention-pointer')).toHaveCount(0, { timeout: 6000 });

  // A second triple-click replaces the first marker.
  await page1.mouse.click(box.x + 400, box.y + 300, { clickCount: 3, delay: 20 });
  await expect(markers(page1)).toHaveCount(1, { timeout: 5000 });
  await expect(markers(page2)).toHaveCount(1, { timeout: 5000 });

  await browser.close();
});
