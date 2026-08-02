/**
 * tests/e2e/undo-redo.spec.js
 *
 * C7: undo/redo routes between two mechanisms — Toys.undoToyGesture (the
 * op log) for toys, UndoRedo.undo (Y.UndoManager) for drawing/boundaries —
 * based on app.js's _lastActionScope. No existing spec exercised
 * App.undo/App.redo at all before this file.
 *
 * Redo has no wired UI button yet (see ui.js) — called directly via
 * window.App.redo(), the same way several existing specs already call
 * window.App.* methods that aren't fully wired to clickable UI.
 *
 * Run via:  bin/test_e2e.sandbox.sh tests/e2e/undo-redo.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('undo / redo', () => {
  test('undoing a toy move restores its position; redo brings the move back', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const canvas = page.locator('#canvas');
    const box    = await canvas.boundingBox();

    // Place a die at (100, 100).
    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();
    await expect(page.locator('[data-toy-id]')).toHaveCount(1, { timeout: 5000 });

    // Select and drag it to (400, 400).
    await page.evaluate(() => window.UI.pillTap('select'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 400, { steps: 10 });
    await page.mouse.up();

    const svgAttr = async (name) =>
      page.locator('[data-toy-id] > svg').getAttribute(name);

    const movedX = await svgAttr('x');
    expect(Number(movedX)).toBeGreaterThan(300); // moved, roughly, allowing for centring math

    await page.evaluate(() => window.App.undo());
    await page.waitForTimeout(200);
    const undoneX = await svgAttr('x');
    expect(undoneX).not.toBe(movedX);
    expect(Number(undoneX)).toBeLessThan(150); // back near its placed position

    await page.evaluate(() => window.App.redo());
    await page.waitForTimeout(200);
    const redoneX = await svgAttr('x');
    expect(redoneX).toBe(movedX);

    await browser.close();
  });

  test('undo with nothing to undo toasts rather than throwing', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.evaluate(() => window.App.undo());
    await page.waitForTimeout(200);

    expect(errors).toEqual([]);
    await expect(page.locator('.toast')).toContainText(/nothing to undo/i, { timeout: 3000 });

    await browser.close();
  });

  test('a toy action then a drawing action: undo reverses the drawing first, undo again reverses the toy', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const canvas = page.locator('#canvas');
    const box    = await canvas.boundingBox();

    // Toy action: place a die.
    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();
    await expect(page.locator('[data-toy-id]')).toHaveCount(1, { timeout: 5000 });

    // Switch layers (this itself proves layer-switch doesn't disturb
    // _lastActionScope's routing for what already happened) and add a rect.
    await page.evaluate(() => window.UI.selectLayer('drawing'));
    await page.waitForTimeout(100);
    await page.evaluate(() => window.App.commitDrawing({
      type: 'rect', x: 300, y: 100, width: 80, height: 80,
      fill: '#5a7ea8', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 0,
    }));
    await expect(page.locator('#drawing-layer rect')).toHaveCount(1, { timeout: 5000 });

    // First undo: the most recent action was the rect — reverses that,
    // the die must still be there.
    await page.evaluate(() => window.App.undo());
    await page.waitForTimeout(200);
    await expect(page.locator('#drawing-layer rect')).toHaveCount(0);
    await expect(page.locator('[data-toy-id]')).toHaveCount(1);

    // Second undo: routes to toys now, reverses the placement.
    await page.evaluate(() => window.App.undo());
    await page.waitForTimeout(200);
    await expect(page.locator('[data-toy-id]')).toHaveCount(0);

    await browser.close();
  });

  test('deleting two toys as a multi-select undoes both in one press', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const canvas = page.locator('#canvas');
    const box    = await canvas.boundingBox();

    for (const [x, y] of [[100, 100], [300, 100]]) {
      await page.evaluate(() => window.UI.pillTap('d6'));
      await page.waitForTimeout(100);
      await page.mouse.move(box.x + x, box.y + y);
      await page.mouse.down();
      await page.mouse.up();
    }
    await expect(page.locator('[data-toy-id]')).toHaveCount(2, { timeout: 5000 });

    const ids = await page.evaluate(() =>
      [...document.querySelectorAll('[data-toy-id]')].map(el => el.getAttribute('data-toy-id')));
    expect(ids.length).toBe(2);

    // Select both directly — this test is about batch-delete-undo, not
    // about rubber-band drag geometry.
    await page.evaluate((ids) => {
      window.App.select(ids[0]);
      window.App.toggleSelection(ids[1]);
    }, ids);
    await page.evaluate(() => window.App.deleteMultiSelected());
    await expect(page.locator('[data-toy-id]')).toHaveCount(0, { timeout: 5000 });

    // One undo press brings back both.
    await page.evaluate(() => window.App.undo());
    await page.waitForTimeout(200);
    await expect(page.locator('[data-toy-id]')).toHaveCount(2);

    await browser.close();
  });
});

test.describe('repeated undo walks back through multiple gestures, and the real Redo button now works', () => {
  test('three moves, three real Undo button clicks reach the original position', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const canvas = page.locator('#canvas');
    const box    = await canvas.boundingBox();

    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();
    await expect(page.locator('[data-toy-id]')).toHaveCount(1, { timeout: 5000 });

    await page.evaluate(() => window.UI.pillTap('select'));
    await page.waitForTimeout(100);

    // Three separate drags, each its own gesture.
    for (const [from, to] of [[[100, 100], [200, 200]], [[200, 200], [300, 300]], [[300, 300], [400, 400]]]) {
      await page.mouse.move(box.x + from[0], box.y + from[1]);
      await page.mouse.down();
      await page.mouse.move(box.x + to[0], box.y + to[1], { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(100);
    }

    const xAt = async () => Number(await page.locator('[data-toy-id] > svg').getAttribute('x'));
    const xAfter400 = await xAt();

    await page.evaluate(() => window.UI.openSheet('history'));
    await page.waitForTimeout(200);
    const undoBtn = page.locator('.action-btn', { hasText: 'Undo last action' });

    // Regression test for the actual bug report: three real clicks on the
    // real button must reach three DIFFERENT positions, not toggle
    // between the last two.
    await undoBtn.click();
    await page.waitForTimeout(200);
    const xAfterUndo1 = await xAt();
    expect(xAfterUndo1).not.toBe(xAfter400);

    await undoBtn.click();
    await page.waitForTimeout(200);
    const xAfterUndo2 = await xAt();
    expect(xAfterUndo2).not.toBe(xAfterUndo1);
    expect(xAfterUndo2).not.toBe(xAfter400);

    await undoBtn.click();
    await page.waitForTimeout(200);
    const xAfterUndo3 = await xAt();
    expect(xAfterUndo3).not.toBe(xAfterUndo2);
    expect(xAfterUndo3).toBeLessThan(150); // back near the original placed position

    await browser.close();
  });

  test('the real Redo button, clicked for the first time in this app’s history, actually works', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const canvas = page.locator('#canvas');
    const box    = await canvas.boundingBox();

    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();
    await page.evaluate(() => window.UI.pillTap('select'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 400, { steps: 10 });
    await page.mouse.up();

    const xAt = async () => Number(await page.locator('[data-toy-id] > svg').getAttribute('x'));
    const xMoved = await xAt();

    await page.evaluate(() => window.UI.openSheet('history'));
    await page.waitForTimeout(200);

    // Before this fix the Redo button had no onclick at all — a static,
    // permanently-disabled-looking placeholder.
    const redoBtnBefore = page.locator('.action-btn', { hasText: 'Redo last undone action' });
    expect(await redoBtnBefore.getAttribute('onclick')).toBeNull(); // nothing undone yet

    await page.locator('.action-btn', { hasText: 'Undo last action' }).click();
    await page.waitForTimeout(200);
    expect(await xAt()).not.toBe(xMoved);

    await page.evaluate(() => window.UI.openSheet('history'));
    await page.waitForTimeout(200);
    const redoBtnAfter = page.locator('.action-btn', { hasText: 'Redo last undone action' });
    expect(await redoBtnAfter.getAttribute('onclick')).toBe('App.redo()');

    await redoBtnAfter.click();
    await page.waitForTimeout(200);
    expect(await xAt()).toBe(xMoved);

    await browser.close();
  });
});
