/**
 * tests/e2e/edit-services-link.spec.js
 *
 * The Debug panel's "Edit services…" link lands on home.html with the
 * Advanced panel already open.
 */

import { test, expect } from '@playwright/test';
import { openAsCreator } from './helpers.js';

const APP_URL       = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('edit services link', () => {
  test('opens home.html in a new tab with the Advanced panel open', async ({ page, context }) => {
    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await page.evaluate(() => window.UI.openSheet('debug'));

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('link', { name: 'Edit services…' }).click(),
    ]);
    await popup.waitForLoadState();

    // The static server may or may not strip ".html".
    expect(popup.url()).toMatch(new RegExp(`^${APP_URL}/home(\\.html)?#advanced$`));
    await expect(popup.locator('#advancedPanel')).toBeVisible();
    await expect(popup.locator('#signalingServer')).toHaveValue(SIGNALING_URL);
    // The table the link came from is still open.
    expect(page.url()).toContain('#tt-T-');
  });

  test('home.html without the hash leaves Advanced closed', async ({ page }) => {
    await page.goto(`${APP_URL}/home.html`);
    await expect(page.locator('#advancedLink')).toBeVisible();
    await expect(page.locator('#advancedPanel')).toBeHidden();
  });

  test('the Advanced link still toggles the panel', async ({ page }) => {
    await page.goto(`${APP_URL}/home.html`);
    await page.locator('#advancedLink').click();
    await expect(page.locator('#advancedPanel')).toBeVisible();
    await page.locator('#advancedLink').click();
    await expect(page.locator('#advancedPanel')).toBeHidden();
  });
});
