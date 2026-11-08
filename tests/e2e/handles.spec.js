/**
 * tests/e2e/handles.spec.js
 *
 * Selection handles driven by real mouse presses. canvas.js dispatches a
 * press by the [data-handle] element the browser hit-tests under the
 * pointer, so these are the tests that see a handle's real hit area —
 * including on a rotated shape.
 *
 * Run via:  bin/test_e2e.sandbox.sh tests/e2e/handles.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

const launch = () => chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

// A 200x200 rect at canvas (100, 100), selected and cycled `clicks` times
// through its selection modes (1: sel-resize, 2: sel-rotate-pivot).
async function rectInMode(page, clicks, { rotate = 0 } = {}) {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  await page.evaluate(() => window.UI.selectLayer('drawing'));
  await page.waitForTimeout(100);
  await page.evaluate(() => window.App.commitDrawing({
    type: 'rect', x: 100, y: 100, width: 200, height: 200,
    fill: '#5a7ea8', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 0,
  }));
  const rect = page.locator('#drawing-layer rect');
  await expect(rect).toHaveCount(1, { timeout: 5000 });
  const id = await rect.getAttribute('data-id');
  await page.evaluate(({ id, clicks, rotate }) => {
    window.UI.pillTap('select');
    if (rotate) {
      window.App.select(id);
      window.App.nextSelectionMode(id);
      window.App.nextSelectionMode(id);
      window.App.startRotate(id, 2);
      const r = rotate * Math.PI / 180;
      // SE corner (300, 300) turned about the centre (200, 200).
      const x = 200 + 100 * Math.cos(r) - 100 * Math.sin(r);
      const y = 200 + 100 * Math.sin(r) + 100 * Math.cos(r);
      window.App.commitRotate(id, 2, x, y);
      window.App.select(null);
    }
    window.App.select(id);
    for (let i = 0; i < clicks; i++) window.App.nextSelectionMode(id);
  }, { id, clicks, rotate });
  return { id, rect };
}

// Canvas space → page (client) space, through the live view transform.
const toScreen = (page, x, y) => page.evaluate(([x, y]) => {
  const m = document.getElementById('drawing-layer').getScreenCTM();
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
}, [x, y]);

async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 4 });
  await page.mouse.up();
}

test('dragging the pivot handle moves the pivot', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const { rect } = await rectInMode(page, 2);
  await expect(page.locator('#selection_local [data-handle="pivot"]')).toHaveCount(1, { timeout: 3000 });

  // Pivot starts at the centre (200, 200); drop it on the SW corner (100, 300).
  await drag(page, await toScreen(page, 200, 200), await toScreen(page, 102, 298));

  await expect(rect).toHaveAttribute('data-pivot-x', '0');
  await expect(rect).toHaveAttribute('data-pivot-y', '1');
  await browser.close();
});

test('a pivot parked on a rotate corner is the one a press there grabs', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const { rect } = await rectInMode(page, 2);

  // Park the pivot on the NW corner, then press there again and move it on.
  await drag(page, await toScreen(page, 200, 200), await toScreen(page, 100, 100));
  await expect(rect).toHaveAttribute('data-pivot-x', '0');
  await drag(page, await toScreen(page, 100, 100), await toScreen(page, 300, 100));

  await expect(rect).toHaveAttribute('data-pivot-x', '1');
  await expect(rect).toHaveAttribute('data-pivot-y', '0');
  await expect(rect).not.toHaveAttribute('data-rotate', /[1-9]/);
  await browser.close();
});

test('dragging a resize corner resizes, including from its grab margin outside the visible square', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const { rect } = await rectInMode(page, 1);
  await expect(page.locator('#selection_local [data-handle="resize"][data-corner="se"]')).not.toHaveCount(0, { timeout: 3000 });

  // The SE handle is centred on (306, 306) and 12px square; press 10px out
  // from its centre, past the square but inside its grab area. The corner
  // follows the pointer, so releasing at (366, 366) makes a 266px square.
  await drag(page, await toScreen(page, 316, 316), await toScreen(page, 366, 366));

  await expect(rect).toHaveAttribute('width', '266');
  await expect(rect).toHaveAttribute('height', '266');
  await browser.close();
});

test('dragging a rotate corner turns the shape', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const { rect } = await rectInMode(page, 2);
  await expect(page.locator('#selection_local [data-handle="rotate"]')).toHaveCount(4, { timeout: 3000 });

  // SE handle at (306, 306), 45° from the centre (200, 200); carry it to 135°.
  await drag(page, await toScreen(page, 306, 306), await toScreen(page, 94, 306));

  await expect(rect).toHaveAttribute('data-rotate', '90');
  await browser.close();
});

test('on a rotated shape the resize corners are pressed where they are drawn', async () => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const { rect } = await rectInMode(page, 1, { rotate: 90 });
  await expect(rect).toHaveAttribute('data-rotate', '90');

  // Turned 90°, the SE handle is drawn at (94, 306). The shape's own x axis
  // now runs down the screen, so dragging the handle down widens it: the
  // release point (94, 356) is local (356, 306).
  await drag(page, await toScreen(page, 94, 306), await toScreen(page, 94, 356));

  await expect(rect).toHaveAttribute('width', '256');
  await expect(rect).toHaveAttribute('height', '206');
  await browser.close();
});
