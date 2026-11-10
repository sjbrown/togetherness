/**
 * tests/e2e/delight-place.spec.js
 *
 * Placing a toy plays a squash and stretch for the placing player only, on
 * a <use> of the toy in #delight-layer. The real toy in #toys-layer is
 * hidden by a page stylesheet rule meanwhile, never modified, and the peer
 * sees no animation at all.
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, joinRoom, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test('the landing plays locally on a clone and leaves the toy untouched', async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page1 = await (await browser.newContext()).newPage();
  const page2 = await (await browser.newContext()).newPage();

  await openAsCreator(page1, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page1, 0);
  const room = await page1.evaluate(() => location.hash.slice(1));
  await joinRoom(page2, room, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page1, 1);
  await waitForPeerCount(page2, 1);

  // Let the peer record every landing it ever draws.
  await page2.evaluate(() => {
    window.__peerLandings = 0;
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) if (n.classList?.contains('landing')) window.__peerLandings++;
    }).observe(document.querySelector('#delight-layer'), { childList: true });
  });

  await page1.evaluate(() => window.UI.pillTap('d6'));
  const box = await page1.locator('#canvas').boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  // Hovering shows the add-cursor preview, which means the d6 SVG is cached
  // and the press can build its ghost.
  await page1.mouse.move(x, y);
  await expect(page1.locator('.add-cursor .addCursorClone')).toHaveCount(1, { timeout: 5000 });

  const landing = page1.locator('#delight-layer .landing');
  await page1.mouse.down();
  await expect(landing).toHaveCount(1);
  await page1.waitForTimeout(300);
  // Held: the ghost is squashed (spread past full size), nothing is placed yet.
  await expect(page1.locator('#toys-layer [data-toy-type]')).toHaveCount(0);
  const heldScale = await landing.locator(':scope > g').getAttribute('transform');
  expect(Number(heldScale.match(/scale\(([\d.]+)\)/)[1])).toBeGreaterThan(1.1);

  // Watch the toy and the hide rule from the moment of release.
  await page1.evaluate(() => {
    window.__landing = { useHref: null, hidden: false };
    const layer = document.querySelector('#toys-layer');
    const poll = () => {
      const use = document.querySelector('#delight-layer .landing use');
      if (use) window.__landing.useHref = use.getAttribute('href');
      const toy = layer.querySelector('[data-toy-type]');
      if (toy && getComputedStyle(toy).opacity === '0') window.__landing.hidden = true;
      if (document.querySelector('#delight-layer .landing')) requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  });
  await page1.mouse.up();

  const toy = page1.locator('#toys-layer [data-toy-type]');
  await expect(toy).toHaveCount(1, { timeout: 3000 });
  const toyId = await toy.getAttribute('data-id');
  await expect(landing).toHaveCount(0, { timeout: 3000 });

  const seen = await page1.evaluate(() => window.__landing);
  expect(seen.useHref).toBe(`#${toyId}`);
  expect(seen.hidden).toBe(true);
  // initialize() is a gesture of its own and may write to the toy; the
  // landing must not. Its hide rule is a page stylesheet, so the toy's own
  // attributes never carry it.
  expect(await toy.getAttribute('style')).toBeNull();
  expect(await toy.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  expect(await page1.locator('#landing-hide-rules').textContent()).toBe('');
  await expect(page1.locator('#delight-layer .delight-puff')).toHaveCount(0, { timeout: 2000 });

  // The peer got the toy, and never drew a landing for it.
  await expect(page2.locator(`#toys-layer [data-id="${toyId}"]`)).toHaveCount(1, { timeout: 5000 });
  expect(await page2.evaluate(() => window.__peerLandings)).toBe(0);
  expect(await page2.locator(`#toys-layer [data-id="${toyId}"]`).getAttribute('style')).toBeNull();

  await browser.close();
});
