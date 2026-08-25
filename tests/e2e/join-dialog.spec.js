/**
 * tests/e2e/join-dialog.spec.js
 *
 * isCreator used to be just `!location.hash` — too coarse. A typed/pasted
 * #tableId this browser has never seen before is genuinely ambiguous:
 * nobody knows without asking the network whether someone else already
 * created it. join_intent.js/join_dialog.js/ui.js resolve that by probing
 * the WebRTC signaling handshake and showing a blocking dialog when (and
 * only when) it's actually ambiguous — see index.html's isCreator
 * derivation and its comment.
 *
 * Run via bin/test_e2e.sandbox.sh (no Docker) or bin/test.sh (Docker).
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, seedJoinTimeouts, joinDialogButton } from './helpers.js';

const APP_URL        = process.env.APP_URL       || 'http://localhost:3000';
const SIGNALING_URL  = process.env.SIGNALING_URL || 'ws://localhost:4444';

async function seedSignalingUrl(page, url) {
  await page.addInitScript((url) => localStorage.setItem('tt_signaling_server', url), url);
}

test.describe('join-intent dialog', () => {
  test('no hash: creator, dialog never appears', async ({ page }) => {
    await seedSignalingUrl(page, SIGNALING_URL);
    await page.goto(`${APP_URL}/`);
    await page.waitForFunction(() => location.hash.length > 1);
    await page.waitForTimeout(300); // give a spurious dialog a chance to open
    await expect(page.locator('#joinDialogScrim')).not.toHaveClass(/open/);
  });

  test('?mint=1 (home.html\'s Start Here): creator, dialog never appears', async ({ page }) => {
    await seedSignalingUrl(page, SIGNALING_URL);
    const tableId = 'tt-T-v1-mint-test-' + Date.now();
    await page.goto(`${APP_URL}/?mint=1#${tableId}`);
    await expect(page.locator('#tableLabel')).toHaveText(tableId);
    await page.waitForTimeout(300);
    await expect(page.locator('#joinDialogScrim')).not.toHaveClass(/open/);

    // The mint marker is scrubbed from the URL immediately.
    expect(await page.evaluate(() => location.search)).toBe('');

    await page.evaluate(() => window.UI.openSheet('debug'));
    const createdHere = page.locator('.dbg-kv:has(.dbg-k:text-is("created here")) .dbg-v');
    await expect(createdHere).toHaveText('yes');
  });

  test('returning visit (reload as creator): dialog never appears', async ({ page }) => {
    const room = await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await page.reload();
    await expect(page.locator('#tableLabel')).toHaveText(room);
    await page.waitForTimeout(300);
    await expect(page.locator('#joinDialogScrim')).not.toHaveClass(/open/);
  });

  test('a real joiner sees "Join this table?" listing the creator, and proceeds after confirming', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx1  = await browser.newContext();
    const ctx2  = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    const room = await openAsCreator(page1, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await page1.evaluate(() => window.UI.openSheet('debug'));
    const creatorId = await page1
      .locator('.dbg-kv:has(.dbg-k:text-is("my peer id")) .dbg-v code')
      .textContent();

    await seedSignalingUrl(page2, SIGNALING_URL);
    await page2.goto(`${APP_URL}/#${room}`);

    await expect(page2.locator('#joinDialogTitle')).toHaveText('Join this table?', { timeout: 15000 });
    await expect(page2.locator('#joinDialogBody')).toContainText(creatorId);

    await joinDialogButton(page2).click();

    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });
    await expect(page2.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    await browser.close();
  });

  test('nobody home: "Create this table?", proceeds as creator', async ({ page }) => {
    await seedSignalingUrl(page, SIGNALING_URL);
    await seedJoinTimeouts(page, { signalingTimeoutMs: 2000, peerTimeoutMs: 1500 });

    const tableId = 'tt-T-v1-nobody-home-' + Date.now();
    await page.goto(`${APP_URL}/#${tableId}`);

    await expect(page.locator('#joinDialogTitle')).toHaveText('Create this table?', { timeout: 8000 });
    await expect(page.locator('#joinDialogBody')).toContainText(tableId);

    await joinDialogButton(page).click();
    await expect(page.locator('#joinDialogScrim')).not.toHaveClass(/open/);

    await page.evaluate(() => window.UI.openSheet('debug'));
    const createdHere = page.locator('.dbg-kv:has(.dbg-k:text-is("created here")) .dbg-v');
    await expect(createdHere).toHaveText('yes');
  });

  test('signaling unreachable: offline prompt, "Proceed offline" proceeds as creator', async ({ page }) => {
    // Port 1: nothing listens there, so the WebSocket fails fast.
    await seedSignalingUrl(page, 'ws://127.0.0.1:1');
    await seedJoinTimeouts(page, { signalingTimeoutMs: 1500, peerTimeoutMs: 1500 });

    const tableId = 'tt-T-v1-unreachable-' + Date.now();
    await page.goto(`${APP_URL}/#${tableId}`);

    await expect(page.locator('#joinDialogTitle')).toHaveText("Can't reach the network", { timeout: 8000 });

    await joinDialogButton(page).click();
    await expect(page.locator('#joinDialogScrim')).not.toHaveClass(/open/);

    await page.evaluate(() => window.UI.openSheet('debug'));
    const createdHere = page.locator('.dbg-kv:has(.dbg-k:text-is("created here")) .dbg-v');
    await expect(createdHere).toHaveText('yes');
  });
});
