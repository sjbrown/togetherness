/**
 * tests/e2e/peers-panel.spec.js
 *
 * Regression test for a bug where the Peers & Sharing panel showed the
 * peer's/own player's raw persistent id (tt-p-v1-...) and its first
 * letter as the avatar initial, instead of the display name chosen at
 * home.html. Root cause: awareness broadcast `id: myId` (the localId)
 * rather than the display name — app.js has no unit coverage by
 * convention, so this pins the fix at the DOM/awareness boundary.
 *
 * Run via: bin/test_e2e.sandbox.sh tests/e2e/peers-panel.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, joinRoom } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

// Seeds a deterministic display name before any app script runs, so the
// assertions below aren't at the mercy of randomName()'s random pick.
async function seedIdentity(page, name) {
  await page.addInitScript(n => {
    localStorage.setItem('tt_player', JSON.stringify({ name: n }));
  }, name);
}

test.describe('Peers & Sharing panel — identity display', () => {
  test('shows chosen display names, not raw localIds, for both "Me" and peers', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    await seedIdentity(page1, 'Wily Frodo');
    await seedIdentity(page2, 'Baker Sam');

    await openAsCreator(page1, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    const room = await page1.evaluate(() => location.hash.slice(1));
    await joinRoom(page2, room, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });
    await expect(page2.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    await page1.evaluate(() => window.UI.openSheet('peers'));
    await page2.evaluate(() => window.UI.openSheet('peers'));

    // "Me" row: page1 shows its own chosen name, never its raw localId.
    const me1 = page1.locator('#meRow');
    await expect(me1).toContainText('Wily Frodo');
    await expect(me1).not.toContainText('tt-p-v1');

    // Peer row: page1 sees page2's chosen name for the remote peer, too.
    const peers1 = page1.locator('#peerRows');
    await expect(peers1).toContainText('Baker Sam', { timeout: 8000 });
    await expect(peers1).not.toContainText('tt-p-v1');

    // And symmetrically from page2's side.
    const me2 = page2.locator('#meRow');
    await expect(me2).toContainText('Baker Sam');
    await expect(me2).not.toContainText('tt-p-v1');

    const peers2 = page2.locator('#peerRows');
    await expect(peers2).toContainText('Wily Frodo', { timeout: 8000 });
    await expect(peers2).not.toContainText('tt-p-v1');

    await browser.close();
  });

  test('avatars fill from a real grad-{user.id} <linearGradient>, mine and a peer\'s alike', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    await seedIdentity(page1, 'Gravel Zuko');
    await seedIdentity(page2, 'Sable Wren');

    const room = await openAsCreator(page1, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await joinRoom(page2, room, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

    await page1.evaluate(() => window.UI.openSheet('peers'));

    // Every avatar's fill is `url(#grad-{id})`, and that id resolves to an
    // actual <linearGradient> with real color stops — not a dangling
    // reference to an element user.js never created.
    const fills = await page1.$$eval('#meRow .avatar circle, #peerRows .avatar circle',
      els => els.map(el => el.getAttribute('fill')));
    expect(fills.length).toBe(2); // me + the one joined peer
    for (const fill of fills) {
      const match = /^url\(#(grad-[^)]+)\)$/.exec(fill);
      expect(match).not.toBeNull();
      const gradId = match[1];
      const stopColor = await page1.evaluate(id => {
        const stop = document.querySelector(`#${CSS.escape(id)} stop`);
        return stop?.getAttribute('stop-color') ?? null;
      }, gradId);
      expect(stopColor).toBeTruthy();
    }

    await browser.close();
  });
});
