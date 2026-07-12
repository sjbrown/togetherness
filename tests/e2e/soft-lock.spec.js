/**
 * tests/e2e/soft-lock.spec.js
 *
 * Two-browser end-to-end tests for the soft-lock ("bathroom handoff")
 * protocol, using the same harness conventions as sync.spec.js: two real
 * browser contexts joined to one room over a local y-webrtc signaling
 * server, driven by real pointer events.
 *
 * These five scenarios are chosen specifically to cover the layer the
 * Vitest suites structurally cannot see — real pointerdown gesture wiring
 * in canvas.js, real z-order rendering in #overlay-layer, and real
 * cross-browser awareness propagation. Three of the live bugs found during
 * development (the phantom drag ghost occluding the requested ring, the
 * multi-drag defending only the leader element, and the blank-instead-of-
 * remote-ring ordering bug) lived exactly here.
 *
 * NOTE: each scenario spends 3-4s of real wall-clock inside the request
 * window (REQUEST_WINDOW_MS = 3000), so this file adds roughly a minute to
 * the e2e tier. That's inherent to testing a real-time protocol at real
 * time; assertions use polling timeouts rather than fixed sleeps wherever
 * possible so passing runs finish as fast as the protocol allows.
 *
 * DRAFT STATUS: written against the soft_lock branch's selectors
 * (.selRing, .remote-sel, .requestedRing) and sync.spec.js's helpers, but
 * authored outside a browser environment — expect to shake out
 * coordinate/timing details on first run via `bin/test.sh --e2e`.
 *
 * Run via:  bin/test.sh --e2e
 * or:       docker compose -f docker-compose.test.yml run --rm e2e
 */

import { test, expect, chromium } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

// ── Helpers ──────────────────────────────────────────────────────────────────

// Boot two peers into a fresh room and wait until they see each other.
async function twoPeers(browser, roomPrefix) {
  const ctx1  = await browser.newContext();
  const ctx2  = await browser.newContext();
  const page1 = await ctx1.newPage();
  const page2 = await ctx2.newPage();

  const room = `${roomPrefix}-${Date.now()}`;
  await page1.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);
  await page2.goto(`${APP_URL}/?signaling=${SIGNALING_URL}#${room}`);

  await expect(page1.locator('#peerCount')).toHaveText('1', { timeout: 8000 });
  await expect(page2.locator('#peerCount')).toHaveText('1', { timeout: 8000 });

  return { page1, page2 };
}

// Place a d6 on `page` at canvas-relative (x, y); returns its data-id.
async function placeToy(page, x, y) {
  const before = await page.locator('[data-id]').count();
  const box = await page.locator('#canvas').boundingBox();
  await page.evaluate(() => window.UI.pillTap('d6'));
  await page.waitForTimeout(100);
  await page.mouse.move(box.x + x, box.y + y);
  await page.mouse.down();
  await page.mouse.up();
  await expect(page.locator('[data-id]')).toHaveCount(before + 1, { timeout: 5000 });
  const ids = await page.locator('[data-id]').evaluateAll(
    els => els.map(el => el.dataset.id));
  return ids[ids.length - 1];
}

// Click the center of the element with `id` on `page`, in select mode.
// (Located by data-id rather than remembered coordinates, so it works on
// whichever page regardless of where the toy was originally placed.)
async function clickToy(page, id, { shift = false } = {}) {
  await page.evaluate(() => window.UI.pillTap('select'));
  await page.waitForTimeout(100);
  const box = await page.locator(`[data-id="${id}"]`).boundingBox();
  if (shift) await page.keyboard.down('Shift');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  if (shift) await page.keyboard.up('Shift');
}

// ── Scenarios ────────────────────────────────────────────────────────────────

test.describe('soft-lock: two-peer element requests', () => {

  test('clicking a peer-held toy shows the amber requested ring on BOTH pages, and does not select', async () => {
    // The requester-side half of this assertion is the one that would have
    // caught the phantom-drag-ghost bug: it depends on the real
    // pointerdown → select() → (no startDrag) wiring and real z-order.
    const browser = await chromium.launch();
    const { page1, page2 } = await twoPeers(browser, 'e2e-softlock-req');

    const id = await placeToy(page1, 120, 120);
    await expect(page2.locator('[data-id]')).toHaveCount(1, { timeout: 5000 });

    await clickToy(page1, id);                     // A holds it
    await expect(page1.locator('#overlay-layer .selRing')).toHaveCount(1, { timeout: 3000 });

    await clickToy(page2, id);                     // B requests it

    // Amber ring appears on the requester's own page (no round-trip needed)
    // and on the holder's page (after propagation).
    await expect(page2.locator('#overlay-layer .requestedRing')).toHaveCount(1, { timeout: 2000 });
    await expect(page1.locator('#overlay-layer .requestedRing')).toHaveCount(1, { timeout: 2000 });

    // A request is not a selection: B must have no local ring of its own.
    await expect(page2.locator('#overlay-layer .selRing')).toHaveCount(0);

    await browser.close();
  });

  test('uncontested request completes after 3s: rings swap on both pages, loser sees remote ring (not nothing)', async () => {
    const browser = await chromium.launch();
    const { page1, page2 } = await twoPeers(browser, 'e2e-softlock-handoff');

    const id = await placeToy(page1, 120, 120);
    await expect(page2.locator('[data-id]')).toHaveCount(1, { timeout: 5000 });

    await clickToy(page1, id);                     // A holds
    await clickToy(page2, id);                     // B requests, A stays away

    // After the window elapses: B holds it locally...
    await expect(page2.locator('#overlay-layer .selRing')).toHaveCount(1, { timeout: 6000 });
    await expect(page2.locator('#overlay-layer .requestedRing')).toHaveCount(0, { timeout: 2000 });

    // ...and A — this is the ordering-bug regression at its visible layer —
    // must show B's dashed remote ring, not a blank.
    await expect(page1.locator('#overlay-layer .remote-sel')).toHaveCount(1, { timeout: 3000 });
    await expect(page1.locator('#overlay-layer .selRing')).toHaveCount(0);

    await browser.close();
  });

  test('holder re-clicking the toy within the window aborts the request', async () => {
    const browser = await chromium.launch();
    const { page1, page2 } = await twoPeers(browser, 'e2e-softlock-abort');

    const id = await placeToy(page1, 120, 120);
    await expect(page2.locator('[data-id]')).toHaveCount(1, { timeout: 5000 });

    await clickToy(page1, id);                     // A holds
    await clickToy(page2, id);                     // B requests
    await expect(page1.locator('#overlay-layer .requestedRing')).toHaveCount(1, { timeout: 2000 });

    await clickToy(page1, id);                     // A defends (the "bathroom" rebuttal)

    // The requested ring clears on both pages once B's client observes the
    // rebuttal and drops its own request...
    await expect(page1.locator('#overlay-layer .requestedRing')).toHaveCount(0, { timeout: 6000 });
    await expect(page2.locator('#overlay-layer .requestedRing')).toHaveCount(0, { timeout: 6000 });

    // ...and well past the original deadline, A still holds it.
    await page1.waitForTimeout(3500);
    await expect(page1.locator('#overlay-layer .selRing')).toHaveCount(1);
    await expect(page2.locator('#overlay-layer .selRing')).toHaveCount(0);
    await expect(page2.locator('#overlay-layer .remote-sel')).toHaveCount(1);

    await browser.close();
  });

  test('dragging a multi-selected group defends every member, even when the leader is not the requested toy', async () => {
    // The exact live trace: A holds two dice, B requests die 1, A drags the
    // group grabbing die 2. Only a real pointer drag exercises the
    // canvas.js multi-move branch → startMultiDrag group-claim refresh.
    const browser = await chromium.launch();
    const { page1, page2 } = await twoPeers(browser, 'e2e-softlock-group');

    const id1 = await placeToy(page1, 120, 120);
    const id2 = await placeToy(page1, 260, 120);
    await expect(page2.locator('[data-id]')).toHaveCount(2, { timeout: 5000 });

    await clickToy(page1, id1);                    // A selects die 1...
    await clickToy(page1, id2, { shift: true });   // ...and shift-adds die 2
    await expect(page1.locator('#overlay-layer .selRing')).toHaveCount(2, { timeout: 3000 });

    await clickToy(page2, id1);                    // B requests die 1

    // A drags the group by die 2 (leader ≠ requested element).
    const box2 = await page1.locator(`[data-id="${id2}"]`).boundingBox();
    await page1.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
    await page1.mouse.down();
    await page1.mouse.move(box2.x + 60, box2.y + 60, { steps: 8 });
    await page1.mouse.up();

    // Well past B's deadline, A must still hold BOTH dice.
    await page1.waitForTimeout(4000);
    await expect(page1.locator('#overlay-layer .selRing')).toHaveCount(2);
    await expect(page2.locator('#overlay-layer .selRing')).toHaveCount(0);

    await browser.close();
  });

  test('rubber-band sweep silently excludes a peer-held toy', async () => {
    // Replaces the deleted mirror-test coverage of getBoxCandidates
    // filtering, at the strongest possible layer: real shift-drag sweep.
    const browser = await chromium.launch();
    const { page1, page2 } = await twoPeers(browser, 'e2e-softlock-sweep');

    const id1 = await placeToy(page1, 120, 120);
    const id2 = await placeToy(page1, 260, 120);
    await expect(page2.locator('[data-id]')).toHaveCount(2, { timeout: 5000 });

    await clickToy(page2, id1);                    // B holds toy 1
    await expect(page1.locator('#overlay-layer .remote-sel')).toHaveCount(1, { timeout: 3000 });

    // A rubber-bands over both toys (shift-drag from empty canvas corner).
    await page1.evaluate(() => window.UI.pillTap('select'));
    await page1.waitForTimeout(100);
    const canvasBox = await page1.locator('#canvas').boundingBox();
    await page1.keyboard.down('Shift');
    await page1.mouse.move(canvasBox.x + 40, canvasBox.y + 40);
    await page1.mouse.down();
    await page1.mouse.move(canvasBox.x + 340, canvasBox.y + 220, { steps: 10 });
    await page1.mouse.up();
    await page1.keyboard.up('Shift');

    // A ends holding only toy 2 — the held toy was silently excluded, no
    // request was queued (no amber ring anywhere), B's holding untouched.
    await expect(page1.locator('#overlay-layer .selRing')).toHaveCount(1, { timeout: 3000 });
    await expect(page1.locator('#overlay-layer .requestedRing')).toHaveCount(0);
    await expect(page2.locator('#overlay-layer .selRing')).toHaveCount(1);

    await browser.close();
  });
});
