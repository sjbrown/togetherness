/**
 * tests/e2e/sync.spec.js
 *
 * End-to-end tests using Playwright.
 * Requires the app + signaling server to be running (handled by docker-compose.test.yml).
 *
 * Run via:  bin/test.sh --e2e
 * or:       docker compose -f docker-compose.test.yml run --rm e2e
 */

import { test, expect, chromium } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://app:80';

test.describe('two-peer sync', () => {
  test('shapes drawn on peer A appear on peer B', async () => {
    const browser = await chromium.launch();
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    const room = `e2e-test-${Date.now()}`;
    await page1.goto(`${APP_URL}/#${room}`);
    await page2.goto(`${APP_URL}/#${room}`);

    // Wait for both peers to see each other
    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });
    await expect(page2.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    // Draw a rect on page1
    const canvas = page1.locator('#canvasWrap');
    const box    = await canvas.boundingBox();
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.move(box.x + 250, box.y + 200);
    await page1.mouse.up();

    // Shape should appear on page2
    await expect(page2.locator('[data-yid]')).toHaveCount(1, { timeout: 5000 });
    await expect(page1.locator('#shapeCount')).toHaveText('1');
    await expect(page2.locator('#shapeCount')).toHaveText('1');

    await browser.close();
  });

  test('shape deleted on peer A disappears on peer B', async () => {
    const browser = await chromium.launch();
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    const room = `e2e-del-${Date.now()}`;
    await page1.goto(`${APP_URL}/#${room}`);
    await page2.goto(`${APP_URL}/#${room}`);

    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    // Draw on page1
    const canvas = page1.locator('#canvasWrap');
    const box    = await canvas.boundingBox();
    await page1.mouse.move(box.x + 50, box.y + 50);
    await page1.mouse.down();
    await page1.mouse.move(box.x + 150, box.y + 150);
    await page1.mouse.up();

    await expect(page2.locator('[data-yid]')).toHaveCount(1, { timeout: 5000 });

    // Delete via sidebar on page1
    await page1.locator('.shape-del').first().click();
    await expect(page2.locator('[data-yid]')).toHaveCount(0, { timeout: 5000 });

    await browser.close();
  });
});
