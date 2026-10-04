/**
 * tests/e2e/debug-snapshot.spec.js
 *
 * The Debug panel redraws on every trace event and the app turns text
 * selection off globally. The snapshot dialog is the place to select and
 * copy from: frozen, and selectable.
 */

import { test, expect } from '@playwright/test';
import { openAsCreator } from './helpers.js';

const APP_URL       = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

async function openSnapshot(page) {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await page.evaluate(() => window.UI.openSheet('debug'));
  await page.locator('[data-dbg-action="snapshot"]').click();
  await expect(page.locator('.dialog-snapshot')).toBeVisible();
}

test.describe('debug snapshot', () => {
  test('text in the dialog can be selected, and a selection survives new trace events', async ({ page }) => {
    await openSnapshot(page);

    const msg = page.locator('.dbg-snapshot .dbg-ev-msg').first();
    await expect(msg).toBeVisible();
    await msg.dblclick();
    const picked = await page.evaluate(() => window.getSelection().toString());
    expect(picked.trim().length).toBeGreaterThan(0);

    await page.evaluate(async () => {
      const Trace = await import('/trace.js');
      for (let i = 0; i < 5; i++) Trace.net('later', `arrived after the snapshot ${i}`);
    });
    // Give the live panel time to redraw behind the dialog.
    await expect(page.locator('#panelBody')).toContainText('arrived after the snapshot 4');

    expect(await page.evaluate(() => window.getSelection().toString())).toBe(picked);
    await expect(page.locator('.dbg-snapshot')).not.toContainText('arrived after the snapshot');
  });

  test('Close and Escape dismiss it', async ({ page }) => {
    await openSnapshot(page);
    await page.locator('.dialog-snapshot .dialog-btn').click();
    await expect(page.locator('.dialog-snapshot')).toHaveCount(0);

    await page.locator('[data-dbg-action="snapshot"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.dialog-snapshot')).toHaveCount(0);
  });
});
