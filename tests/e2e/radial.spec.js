/**
 * tests/e2e/radial.spec.js
 *
 * The bowstring's radial menu, driven through real pointer events on the
 * real app: a supply with a chip on it, whose 'Take' action declares a
 * 'How many' integer spoke (1..5). Covers what the unit suites can't see —
 * canvas.js's pointer routing into delight.js, the menu's visibility
 * timing, and a pick reaching the toy's handler as params.
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

const launch = () => chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

// Keep in step with ui_radial.js.
const INNER_R = 53;
const OUTER_R = 260;

async function place(page, tool, x, y) {
  const before = await page.locator('#toys-layer > [data-toy-type]').count();
  const box = await page.locator('#canvas').boundingBox();
  await page.evaluate((t) => window.UI.pillTap(t), tool);
  await page.waitForTimeout(100);
  await page.mouse.click(box.x + x, box.y + y);
  await expect(page.locator('#toys-layer > [data-toy-type]')).toHaveCount(before + 1, { timeout: 5000 });
  const ids = await page.locator('#toys-layer > [data-toy-type]').evaluateAll(els => els.map(el => el.dataset.id));
  return ids[ids.length - 1];
}

async function center(page, id) {
  const b = await page.locator(`[data-id="${id}"]`).boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

// A supply with a chip sitting on it, selected, so its action square shows.
async function supplyWithChip(page) {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  const supplyId = await place(page, 'supply', 160, 140);
  const chipId = await place(page, 'chip', 600, 140);
  await page.evaluate(() => window.UI.pillTap('select'));
  await page.waitForTimeout(100);

  const from = await center(page, chipId);
  const target = await page.locator(`[data-id="${supplyId}"] .tt_positions circle`).boundingBox();
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator(`[data-id="${supplyId}"]`)).toHaveAttribute('data-below', chipId, { timeout: 3000 });

  // Click the supply's mouth, clear of the chip sitting in its dome.
  const s = await page.locator(`[data-id="${supplyId}"]`).boundingBox();
  await page.waitForTimeout(400);
  await page.mouse.click(s.x + s.width / 2, s.y + s.height * 0.7);
  await expect(page.locator('#overlay-layer .bowstring')).toHaveCount(1, { timeout: 3000 });
  const sq = await page.locator('#overlay-layer .bowstring .actionSquare').boundingBox();
  return { supplyId, chipId, square: { x: sq.x + sq.width / 2, y: sq.y + sq.height / 2 } };
}

const chips = (page) => page.locator('#toys-layer > [data-toy-type="chip"]');
const shownMenu = (page) => page.locator('#delight-layer .radial-menu.show');

// Screen offset at radius r along compass bearing deg (0 = north, clockwise).
function at(r, deg) {
  const a = (deg - 90) * Math.PI / 180;
  return { dx: r * Math.cos(a), dy: r * Math.sin(a) };
}

test('a tap fires the default action at its default, and never shows the menu', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const { square } = await supplyWithChip(page);
  const before = await chips(page).count();

  await page.mouse.move(square.x, square.y);
  await page.mouse.down();
  await page.waitForTimeout(300);
  await expect(shownMenu(page)).toHaveCount(0);
  await page.mouse.up();

  await expect(chips(page)).toHaveCount(before + 1, { timeout: 3000 });
  await browser.close();
});

test('dragging shows the menu; releasing on a segment fires with that value', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const { square } = await supplyWithChip(page);
  const before = await chips(page).count();

  // 'Take' is the only spoke, so it sits in spot 4 (SE to S). Third of five segments.
  const { dx, dy } = at(INNER_R + (OUTER_R - INNER_R) * 0.5, 157.5);
  await page.mouse.move(square.x, square.y);
  await page.mouse.down();
  await page.mouse.move(square.x + dx, square.y + dy, { steps: 12 });
  await expect(shownMenu(page)).toHaveCount(1);
  await expect(page.locator('#delight-layer .radial-menu .spoke.hover .spoke-seg.hover')).toHaveCount(1);
  await expect(page.locator('#delight-layer .radial-menu .spoke.hover .seg-text.chosen')).toHaveText('3');
  await page.mouse.up();

  await expect(chips(page)).toHaveCount(before + 3, { timeout: 3000 });
  await expect(page.locator('#delight-layer .radial')).toHaveCount(0, { timeout: 3000 });
  await browser.close();
});

test('releasing outside the menu fires the default action at its default', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const { square } = await supplyWithChip(page);
  const before = await chips(page).count();

  // Due east is spot 3: empty, since 'Take' is the only spoke.
  await page.mouse.move(square.x, square.y);
  await page.mouse.down();
  await page.mouse.move(square.x + 150, square.y - 30, { steps: 12 });
  await expect(shownMenu(page)).toHaveCount(1);
  await page.mouse.up();

  await expect(chips(page)).toHaveCount(before + 1, { timeout: 3000 });
  await browser.close();
});
