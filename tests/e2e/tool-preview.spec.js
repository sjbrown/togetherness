/**
 * tests/e2e/tool-preview.spec.js
 *
 * On the toys layer the Tools panel opens with a preview of the active toy,
 * tinted with the tool's current colour.
 */

import { test, expect } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test('tools panel shows a toy preview that follows the colour', async ({ page }) => {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);

  await page.evaluate(() => { window.UI.pillTap('d6'); window.UI.openSheet('tools'); });
  const preview = page.locator('#panelBody .tool-preview svg');
  await expect(preview).toHaveCount(1, { timeout: 5000 });

  const matrix = () => preview.locator('feColorMatrix').first().getAttribute('values');
  const before = await matrix();
  await page.evaluate(() => { window.App.setToolParam('d6', 'fill', '#2040e0'); window.UI.refreshFromDoc(); });
  await expect.poll(matrix).not.toBe(before);
});

test('add cursor preview is tinted with the tool colour', async ({ page }) => {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);

  await page.evaluate(() => { window.UI.pillTap('d6'); window.UI.openSheet('tools'); });
  await expect(page.locator('#panelBody .tool-preview svg')).toHaveCount(1, { timeout: 5000 });
  await page.evaluate(() => window.UI.closeSheet?.());

  const box = await page.locator('#canvas').boundingBox();
  const clone = page.locator('.add-cursor .addCursorClone feColorMatrix').first();
  await page.mouse.move(box.x + 200, box.y + 200);
  await expect(clone).toHaveCount(1, { timeout: 5000 });
  const before = await clone.getAttribute('values');

  await page.evaluate(() => window.App.setToolParam('d6', 'fill', '#2040e0'));
  await page.mouse.move(box.x + 220, box.y + 220);
  await expect.poll(() => clone.getAttribute('values')).not.toBe(before);
});
