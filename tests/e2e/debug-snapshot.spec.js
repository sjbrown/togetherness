/**
 * tests/e2e/debug-snapshot.spec.js
 *
 * The one thing about the snapshot dialog that needs a real browser: that
 * text in it can actually be selected. The app turns selection off globally
 * in ui.css, which jsdom neither applies nor honours, so the unit tests
 * (tests/unit/debug-panel.test.js) cover everything else — contents,
 * closing, and not being redrawn.
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
});
