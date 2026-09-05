/**
 * tests/e2e/join-dialog.spec.js
 *
 * isCreator used to be just `!location.hash` — too coarse. A typed/pasted
 * #tableId this browser has never seen before is genuinely ambiguous:
 * nobody knows without asking the network whether someone else already
 * created it. join_intent.js/ui_join_dialog.js/ui.js resolve that by probing
 * the WebRTC signaling handshake and showing a blocking dialog when (and
 * only when) it's actually ambiguous — see index.html's isCreator
 * derivation and its comment.
 *
 * Run via bin/test_e2e.sandbox.sh (no Docker) or bin/test.sh (Docker).
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, seedJoinTimeouts, joinDialogButton, waitForTableId, waitForPeerCount } from './helpers.js';

const APP_URL        = process.env.APP_URL       || 'http://localhost:3000';
const SIGNALING_URL  = process.env.SIGNALING_URL || 'ws://localhost:4444';

async function seedSignalingUrl(page, url) {
  await page.addInitScript((url) => localStorage.setItem('tt_signaling_server', url), url);
}

/**
 * Overrides BOTH signaling URLs. signaling.js's defaultFallbackSignalingServer()
 * only returns '' when location.hostname === 'localhost' — under Docker the
 * page is served from a container IP, so leaving the fallback at its
 * default resolves to a real public server, which a Docker test runner
 * with real network access can actually reach. Tests asserting a truly
 * unreachable signaling layer need both URLs broken, not just the primary.
 */
async function seedUnreachableSignaling(page) {
  await page.addInitScript(() => {
    localStorage.setItem('tt_signaling_server', 'ws://127.0.0.1:1');
    localStorage.setItem('tt_signaling_server_fallback', 'ws://127.0.0.1:1');
  });
}

test.describe('join-intent dialog', () => {
  test('no hash: creator, dialog never appears', async ({ page }) => {
    await seedSignalingUrl(page, SIGNALING_URL);
    await page.goto(`${APP_URL}/`);
    await page.waitForFunction(() => location.hash.length > 1);
    await page.waitForTimeout(300); // give a spurious dialog a chance to open
    await expect(page.locator('#joinDialogScrim')).not.toHaveClass(/open/);
  });

  test('home.html\'s "Start Here": creator, dialog never appears', async ({ page }) => {
    await seedSignalingUrl(page, SIGNALING_URL);
    await page.goto(`${APP_URL}/home.html`);

    // seedTable joins the authority ordering as part of seeding (see
    // home.html's launchRipple/seedTable) — index.html should never need
    // to ask anything about a table it just created.
    const row = page.locator('.sampler-row').first();
    await expect(row).not.toHaveClass(/loading/, { timeout: 10000 });
    await row.click();

    // Different static servers resolve "/" differently — some show a bare
    // "/#tableId", others "/index.html#tableId" — so match on the hash
    // alone rather than assuming what precedes it.
    await page.waitForURL(/#tt-T-v1-/, { timeout: 10000 });
    await expect.poll(() => page.evaluate(() => window.App.getTableId()), { timeout: 8000 }).toBeTruthy();
    await page.waitForTimeout(300); // give a spurious dialog a chance to open
    await expect(page.locator('#joinDialogScrim')).not.toHaveClass(/open/);

    await page.evaluate(() => window.UI.openSheet('debug'));
    const createdHere = page.locator('.dbg-kv:has(.dbg-k:text-is("created here")) .dbg-v');
    await expect(createdHere).toHaveText('yes');
  });

  test('returning visit (reload as creator): dialog never appears, and "created here" is still accurate', async ({ page }) => {
    const room = await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await page.reload();
    await waitForTableId(page, room);
    await page.waitForTimeout(300);
    await expect(page.locator('#joinDialogScrim')).not.toHaveClass(/open/);

    // isCreator for an already-known table is derived from joinSequence,
    // not hardcoded false — a returning creator should still see "yes".
    await page.evaluate(() => window.UI.openSheet('debug'));
    const createdHere = page.locator('.dbg-kv:has(.dbg-k:text-is("created here")) .dbg-v');
    await expect(createdHere).toHaveText('yes');
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

    await waitForPeerCount(page1, 1);
    await waitForPeerCount(page2, 1);

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
    // Port 1: nothing listens there, so the WebSocket fails fast. Both
    // primary and fallback need to be broken — see seedUnreachableSignaling.
    await seedUnreachableSignaling(page);
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
