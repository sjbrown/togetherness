/**
 * tests/e2e/external-services-status.spec.js
 *
 * The Peers tab's four-light status bar in the real app: that it renders
 * with the connected signalling server reflected, that each light links to
 * its section of the troubleshooting page, and that the page has those
 * sections to land on. Status derivation itself is covered by
 * tests/unit/external_services_status.test.js.
 */

import { test, expect } from '@playwright/test';
import { openAsCreator } from './helpers.js';

const APP_URL       = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('network status bar', () => {
  test('Peers tab shows four lights; signalling goes green once connected', async ({ page }) => {
    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    // openSheet throws until boot has handed ui.js its App.
    await page.waitForFunction(() => {
      try { window.UI.openSheet('peers'); return true; } catch { return false; }
    });

    const items = page.locator('#netStatus a.net-status-item');
    await expect(items).toHaveText(['Signalling', 'STUN', 'TURN Creds', 'TURN']);
    await expect(items.first()).toHaveClass(/\bok\b/);
    expect(await items.evaluateAll(els => els.map(e => e.getAttribute('href')))).toEqual([
      'external_services_info.html#signalling',
      'external_services_info.html#stun',
      'external_services_info.html#turn-creds',
      'external_services_info.html#turn',
    ]);
  });

  test('every light lands on a section of the troubleshooting page', async ({ page }) => {
    await page.goto(`${APP_URL}/external_services_info.html`);
    for (const id of ['signalling', 'stun', 'turn-creds', 'turn', 'own-it']) {
      await expect(page.locator(`section#${id}`)).toHaveCount(1);
    }
    await expect(page.locator('a[href$="tt-signaling-cloudflare"]')).toHaveCount(1);
    await expect(page.locator('a[href$="tt-turn-cloudflare"]')).toHaveCount(1);
  });

  test('a stalled credentials service does not hold up boot', async ({ page }) => {
    await page.route('**/tt-turn-credentials.*/**', () => {});
    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    // The service request times out after 2s; the app must be usable well before.
    await page.waitForFunction(() => {
      try { window.UI.openSheet('peers'); return true; } catch { return false; }
    }, null, { timeout: 1500 });
  });
});
