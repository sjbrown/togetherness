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

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';


test.describe('two-peer sync', () => {
  test('toys added on peer A appear on peer B', async () => {
    const browser = await chromium.launch();
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    const room = `e2e-test-${Date.now()}`;
    await page1.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);
    await expect(page1.locator('#peerCount')).toHaveText('0', { timeout: 8000 });

    await page2.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);

    // Wait for both peers to see each other
    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });
    await expect(page2.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    // Sanity check - initially no toys on page2
    await expect(page2.locator('[data-yid]')).toHaveCount(0, { timeout: 5000 });

    // Place a d6 on page1
    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();
    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100); // let the UI settle

    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();

    // Toy should appear on page2
    await expect(page2.locator('[data-yid]')).toHaveCount(1, { timeout: 5000 });

    await browser.close();
  });

  test('selecting a toy on peer A shows selection rings on both peers', async () => {
    const browser = await chromium.launch();
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    const room = `e2e-sel-${Date.now()}`;
    await page1.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);
    await page2.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);

    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });
    await expect(page2.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    // Sanity check - initially no toys on page2
    await expect(page2.locator('[data-yid]')).toHaveCount(0, { timeout: 5000 });

    // Place a d6 on page1
    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();
    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100);

    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();

    // Wait for toy to appear on both peers
    await expect(page1.locator('[data-yid]')).toHaveCount(1, { timeout: 5000 });
    await expect(page2.locator('[data-yid]')).toHaveCount(1, { timeout: 5000 });

    // Select the toy on page1
    await page1.evaluate(() => window.UI.pillTap('select'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();
    await page1.waitForTimeout(200); // let awareness propagate

    // page1 should show a local selection ring (solid, class="selRing")
    await expect(
      page1.locator('#overlay-layer .selRing')
    ).toHaveCount(1, { timeout: 3000 });

    // page2 should show a remote selection ring (dashed, no class,
    // identified by stroke-dasharray attribute)
    await expect(
      page2.locator('#overlay-layer rect[stroke-dasharray]')
    ).toHaveCount(1, { timeout: 3000 });

    await browser.close();
  });

  test('toy deleted on peer A disappears on peer B', async () => {
    const browser = await chromium.launch();
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    const room = `e2e-del-${Date.now()}`;
    await page1.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);
    await page2.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);

    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    // Sanity check - initially no toys on page2
    await expect(page2.locator('[data-yid]')).toHaveCount(0, { timeout: 5000 });

    // Place a d6 on page1
    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();

    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100); // let the UI settle

    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();

    await expect(page2.locator('[data-yid]')).toHaveCount(1, { timeout: 5000 });

    // Select the toy on page1
    await page1.evaluate(() => window.UI.pillTap('select'));
    await page1.waitForTimeout(100);
    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();
    await page1.waitForTimeout(200); // let awareness propagate

    // Call deleteSelected
    await page1.evaluate(() => window.UI.deleteSelected());
    await page1.waitForTimeout(100); // let the UI settle

    // This browser should show no more toy
    await expect(page1.locator('[data-yid]')).toHaveCount(0, { timeout: 5000 });

    // Other browser should show no more toy
    await expect(page2.locator('[data-yid]')).toHaveCount(0, { timeout: 5000 });

    await browser.close();
  });

  test('no console errors or warnings on load', async ({ page }) => {
    const messages = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const text = msg.text();
        // WebRTC signaling failures are expected when running isolated
        if (text.includes('WebSocket')) return;
        messages.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(messages).toEqual([]);
  });
});
