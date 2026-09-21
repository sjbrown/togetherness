/**
 * tests/e2e/png-share.spec.js
 *
 * A PNG one person picks off their own disk has to arrive on everyone
 * else's screen, over the peer connection, with nothing hosting it. That
 * claim spans the file picker, the canvas re-encode, the chunked asset
 * store, Yjs, WebRTC and the background renderer, so it is only really
 * testable here.
 *
 * Run via:  bin/test_e2e.sandbox.sh tests/e2e/png-share.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, joinRoom, waitForPeerCount } from './helpers.js';

const APP_URL       = process.env.APP_URL       || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

/**
 * Paint a distinctive image in the page and hand it to the app exactly as
 * the file picker would. `size` is deliberately large enough that the
 * result needs more than one chunk on the wire.
 */
const shareGeneratedPng = (page, { size = 600, name = 'table-map.png' } = {}) =>
  page.evaluate(async ({ size, name }) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    // Noise, so it does not compress down to a handful of bytes.
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i]     = (i * 7)  % 255;
      img.data[i + 1] = (i * 13) % 255;
      img.data[i + 2] = (i * 29) % 255;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const file = new File([blob], name, { type: 'image/png' });
    return window.App.shareBackgroundImage(file);
  }, { size, name });

const backgroundHref = page =>
  page.evaluate(() => document.querySelector('#bg-pattern image')?.getAttribute('href') ?? null);

const storedBgUrl = page => page.evaluate(() => window.App.getBackground().url);

test.describe('peer-to-peer image sharing', () => {
  test('a PNG shared on peer A renders on peer B, and no URL is involved', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx1  = await browser.newContext();
    const ctx2  = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    await openAsCreator(page1, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    const room = await page1.evaluate(() => location.hash.slice(1));
    await joinRoom(page2, room, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await waitForPeerCount(page1, 1);
    await waitForPeerCount(page2, 1);

    // Neither peer starts with a shared background.
    expect(await storedBgUrl(page2)).not.toContain('tt-asset:');

    const assetId = await shareGeneratedPng(page1);
    expect(assetId).toMatch(/^tt-a-v1-/);

    // The document references the asset, not a location on the internet.
    expect(await storedBgUrl(page1)).toBe(`tt-asset:${assetId}`);
    await expect.poll(() => storedBgUrl(page2), { timeout: 10_000 })
      .toBe(`tt-asset:${assetId}`);

    // And peer B renders the bytes themselves.
    await expect.poll(() => backgroundHref(page2), { timeout: 10_000 })
      .toMatch(/^data:image\/(png|jpeg);base64,/);
    expect(await backgroundHref(page2)).toBe(await backgroundHref(page1));

    // It crossed in pieces: a single message of this size is exactly what
    // the data channel would refuse.
    const asset = await page2.evaluate(() => window.App.getBackground().asset);
    expect(asset.total).toBeGreaterThan(1);
    expect(asset.complete).toBe(true);
    expect(asset.name).toBe('table-map.png');

    await browser.close();
  });

  test('a peer joining later receives an image shared before it arrived', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx1  = await browser.newContext();
    const page1 = await ctx1.newPage();

    await openAsCreator(page1, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    const room = await page1.evaluate(() => location.hash.slice(1));
    const assetId = await shareGeneratedPng(page1, { name: 'tavern.png' });

    const ctx2  = await browser.newContext();
    const page2 = await ctx2.newPage();
    await joinRoom(page2, room, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await waitForPeerCount(page2, 1);

    await expect.poll(() => storedBgUrl(page2), { timeout: 15_000 }).toBe(`tt-asset:${assetId}`);
    await expect.poll(() => backgroundHref(page2), { timeout: 15_000 })
      .toMatch(/^data:image\/(png|jpeg);base64,/);

    // The manifest travels with the bytes: peer B can say what it got.
    const named = await page2.evaluate(() => window.App.getBackground().asset?.name);
    expect(named).toBe('tavern.png');

    await browser.close();
  });

  test('an image too big for the wire is resized rather than refused', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page = await (await browser.newContext()).newPage();
    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    await shareGeneratedPng(page, { size: 3000, name: 'huge.png' });

    const asset = await page.evaluate(() => window.App.getBackground().asset);
    expect(asset.complete).toBe(true);
    expect(asset.bytes).toBeLessThanOrEqual(192 * 1024);
    expect(await backgroundHref(page)).toMatch(/^data:image\/(png|jpeg);base64,/);

    await browser.close();
  });
});
