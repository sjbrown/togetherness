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
import { openAsCreator, joinRoom, openCreatorAndJoiner, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';


test.describe('two-peer sync', () => {
  test('toys added on peer A appear on peer B', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox','--disable-dev-shm-usage'] });
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    await openAsCreator(page1, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await waitForPeerCount(page1, 0);
    const room = await page1.evaluate(() => location.hash.slice(1));

    await joinRoom(page2, room, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    // Wait for both peers to see each other
    await waitForPeerCount(page1, 1);
    await waitForPeerCount(page2, 1);

    // Sanity check - initially no toys on page2
    await expect(page2.locator('[data-toy-type]')).toHaveCount(0, { timeout: 5000 });

    // Place a d6 on page1
    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();
    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100); // let the UI settle

    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();

    // Toy should appear on page2
    await expect(page2.locator('[data-toy-type]')).toHaveCount(1, { timeout: 5000 });

    await browser.close();
  });

  test('selecting a toy on peer A shows selection rings on both peers', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox','--disable-dev-shm-usage'] });
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    await openCreatorAndJoiner(page1, page2, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    await waitForPeerCount(page1, 1);
    await waitForPeerCount(page2, 1);

    // Sanity check - initially no toys on page2
    await expect(page2.locator('[data-toy-type]')).toHaveCount(0, { timeout: 5000 });

    // Place a d6 on page1
    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();
    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100);

    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();

    // Wait for toy to appear on both peers
    await expect(page1.locator('[data-toy-type]')).toHaveCount(1, { timeout: 5000 });
    await expect(page2.locator('[data-toy-type]')).toHaveCount(1, { timeout: 5000 });

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

    // page2 should show a remote selection ring — the dashed ring is now
    // wrapped in <g class="remote-sel"> (added during soft-lock work).
    await expect(
      page2.locator('#overlay-layer .remote-sel')
    ).toHaveCount(1, { timeout: 3000 });

    await browser.close();
  });

  test('toy deleted on peer A disappears on peer B', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox','--disable-dev-shm-usage'] });
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    await openCreatorAndJoiner(page1, page2, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    await waitForPeerCount(page1, 1);

    // Sanity check - initially no toys on page2
    await expect(page2.locator('[data-toy-type]')).toHaveCount(0, { timeout: 5000 });

    // Place a d6 on page1
    const canvas = page1.locator('#canvas');
    const box    = await canvas.boundingBox();

    await page1.evaluate(() => window.UI.pillTap('d6'));
    await page1.waitForTimeout(100); // let the UI settle

    await page1.mouse.move(box.x + 100, box.y + 100);
    await page1.mouse.down();
    await page1.mouse.up();

    await expect(page2.locator('[data-toy-type]')).toHaveCount(1, { timeout: 5000 });

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
    await expect(page1.locator('[data-toy-type]')).toHaveCount(0, { timeout: 5000 });

    // Other browser should show no more toy
    await expect(page2.locator('[data-toy-type]')).toHaveCount(0, { timeout: 5000 });

    await browser.close();
  });

  // This doesn't reproduce the actual race (the unit tests in
  // tests/unit/tables-authority.test.js do that deterministically, by
  // controlling the order updates are applied in) — a same-machine
  // WebRTC handshake is fast enough that page1's join entry is usually
  // already committed before page2's boot script even runs. What this
  // does check is the wiring: that index.html actually threads isCreator
  // through to ensureJoined, and that the Debug tab renders the resulting
  // joinSequence identically on both peers.
  test('the creator sorts before a joiner in the joinSequence, on both peers', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox','--disable-dev-shm-usage'] });
    const ctx1    = await browser.newContext();
    const ctx2    = await browser.newContext();
    const page1   = await ctx1.newPage();
    const page2   = await ctx2.newPage();

    await openCreatorAndJoiner(page1, page2, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    await waitForPeerCount(page1, 1);
    await waitForPeerCount(page2, 1);

    // Open the Debug tab on both peers, which renders the joinSequence as
    // an ordered ladder (debug_panel.js's joinSequenceHTML).
    await page1.evaluate(() => window.UI.openSheet('debug'));
    await page2.evaluate(() => window.UI.openSheet('debug'));

    const readJoinSequence = (page) =>
      page.$$eval('.dbg-join-row .dbg-id', els => els.map(el => el.textContent));

    // Both replicas must converge to the identical order, and the table's
    // creator (page1) — not the joiner (page2) — must be first: bug was
    // the joiner racing ahead of the creator's not-yet-synced entry.
    await expect.poll(() => readJoinSequence(page1)).toHaveLength(2);
    const seq1 = await readJoinSequence(page1);
    const seq2 = await readJoinSequence(page2);
    expect(seq1).toEqual(seq2);

    await expect(page1.locator('.dbg-join-row.me .dbg-join-i')).toHaveText('0');
    await expect(page2.locator('.dbg-join-row.me .dbg-join-i')).toHaveText('1');

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
