/**
 * tests/e2e/history-panel.spec.js
 *
 * The History panel is a projection of the op log: one row per gesture, an
 * Undo or Redo button on the selected row, and no button while later work on
 * the same element blocks it.
 *
 * Run via:  bin/test_e2e.sandbox.sh tests/e2e/history-panel.spec.js
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, openCreatorAndJoiner, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

const launch = () => chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const row = (page, gesture) => page.locator('.hist-op').filter({ has: page.locator('.hist-op-title', { hasText: new RegExp(`^${gesture} `) }) });

test.describe('history panel', () => {
  test('select a row, see before and after, undo and redo it; later work blocks an earlier row', async () => {
    const browser = await launch();
    const page = await (await browser.newContext()).newPage();
    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const box = await page.locator('#canvas').boundingBox();
    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();
    await expect(page.locator('#toys-layer [data-toy-type]')).toHaveCount(1, { timeout: 5000 });
    await page.evaluate(() => window.UI.pillTap('select'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 400, { steps: 10 });
    await page.mouse.up();

    const toy = page.locator('#toys-layer [data-toy-type]');
    const toyId = await toy.getAttribute('data-id');
    const xAt = async () => Number(await toy.locator('> svg').getAttribute('x'));
    const xMoved = await xAt();
    expect(xMoved).toBeGreaterThan(300);

    await page.evaluate(() => window.UI.openSheet('history'));

    // Raw gesture, then the toy's type and id.
    await expect(row(page, 'move').locator('.hist-op-title')).toHaveText(new RegExp(`^move \\S+ ${toyId}$`));
    await expect(row(page, 'place').locator('.hist-op-title')).toHaveText(new RegExp(`^place \\S+ ${toyId}$`));

    // The placement is blocked by the move that came after it.
    await row(page, 'place').locator('.hist-op-head').click();
    await expect(page.locator('.hist-op-note')).toHaveText('Undo recent work on this element first.');
    await expect(page.locator('.hist-op-go')).toHaveCount(0);

    // The move can be undone, and previews its two sides.
    await row(page, 'move').locator('.hist-op-head').click();
    await expect(page.locator('.hist-pv > svg')).toHaveCount(2);
    await expect(page.locator('.hist-op-go')).toHaveText('Undo');
    await page.locator('.hist-op-go').click();
    await expect.poll(xAt).toBeLessThan(150);
    await expect(row(page, 'move')).toHaveClass(/undone/);

    // Its row now offers Redo, which puts the move back.
    await expect(page.locator('.hist-op-go')).toHaveText('Redo');
    await page.locator('.hist-op-go').click();
    await expect.poll(xAt).toBe(xMoved);
    await expect(row(page, 'move')).not.toHaveClass(/undone/);

    // Previews are copies and must not look like toys to the rest of the page.
    await expect(page.locator('[data-toy-type]')).toHaveCount(1);

    await browser.close();
  });

  test('two rolls of one die each preview as the face they replaced and the face they wrote', async () => {
    const browser = await launch();
    const page = await (await browser.newContext()).newPage();
    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const box = await page.locator('#canvas').boundingBox();
    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();
    const toy = page.locator('#toys-layer [data-toy-type]');
    await expect(toy).toHaveCount(1, { timeout: 5000 });
    const toyId = await toy.getAttribute('data-id');

    for (let i = 0; i < 2; i++) {
      await page.evaluate((id) => window.App.invokeToyMenuAction(id, 'd6', 'Roll'), toyId);
      await page.waitForTimeout(100);
    }
    await page.evaluate(() => window.UI.openSheet('history'));
    const rolls = page.locator('.hist-op').filter({ has: page.locator('.hist-op-title', { hasText: /^menu:d6\.Roll / }) });
    await expect(rolls).toHaveCount(2);

    const faces = async (rollRow) => {
      await rollRow.locator('.hist-op-head').click();
      const sides = page.locator('.hist-op.sel .hist-pv');
      await expect(sides).toHaveCount(2);
      return [(await sides.nth(0).locator('tspan').textContent()).trim(), (await sides.nth(1).locator('tspan').textContent()).trim()];
    };
    const [olderBefore, olderAfter] = await faces(rolls.nth(1));
    const [newerBefore, newerAfter] = await faces(rolls.nth(0));

    for (const face of [olderBefore, olderAfter, newerBefore, newerAfter]) expect(face).toMatch(/^[1-6]$/);
    expect(olderAfter).toBe(newerBefore);
    expect(newerAfter).toBe((await toy.locator('tspan').first().textContent()).trim());

    await browser.close();
  });

  test('an expanded row is projected once, however often the panel re-renders', async () => {
    const browser = await launch();
    const page = await (await browser.newContext()).newPage();
    await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });

    const box = await page.locator('#canvas').boundingBox();
    await page.evaluate(() => window.UI.pillTap('d6'));
    await page.waitForTimeout(100);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();
    const toy = page.locator('#toys-layer [data-toy-type]');
    await expect(toy).toHaveCount(1, { timeout: 5000 });
    const toyId = await toy.getAttribute('data-id');
    for (let i = 0; i < 2; i++) {
      await page.evaluate((id) => window.App.invokeToyMenuAction(id, 'd6', 'Roll'), toyId);
      await page.waitForTimeout(100);
    }

    await page.evaluate(() => window.UI.openSheet('history'));
    const projections = () => page.evaluate(async () => {
      const Trace = await import('/trace.js');
      return Trace.events().filter(e => e.ch === 'op' && e.evt === 'project').length;
    });
    const rolls = page.locator('.hist-op').filter({ has: page.locator('.hist-op-title', { hasText: /^menu:d6\.Roll / }) });

    const before = await projections();
    await rolls.nth(0).locator('.hist-op-head').click();
    await expect(page.locator('.hist-pv > svg')).toHaveCount(2);
    const afterOpen = await projections();
    expect(afterOpen).toBe(before + 1);

    // Re-renders while the row stays open reuse the result.
    for (let i = 0; i < 3; i++) await page.evaluate(() => window.UI.refreshFromDoc());
    await expect(page.locator('.hist-pv > svg')).toHaveCount(2);
    expect(await projections()).toBe(afterOpen);

    // A different row is a different preview.
    await rolls.nth(1).locator('.hist-op-head').click();
    await expect(page.locator('.hist-pv > svg')).toHaveCount(2);
    expect(await projections()).toBe(afterOpen + 1);

    await browser.close();
  });

  test('one peer undoes another’s action from the list; both lists show who did it', async () => {
    const browser = await launch();
    const pageA = await (await browser.newContext()).newPage();
    const pageB = await (await browser.newContext()).newPage();
    await openCreatorAndJoiner(pageA, pageB, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await waitForPeerCount(pageA, 1);
    await waitForPeerCount(pageB, 1);

    await pageA.evaluate(() => window.App.commitDrawing({
      type: 'rect', x: 100, y: 100, width: 80, height: 80,
      fill: '#5a7ea8', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 0,
    }));
    await expect(pageB.locator('#drawing-layer rect')).toHaveCount(1, { timeout: 5000 });
    const id = await pageA.locator('#drawing-layer rect').getAttribute('data-id');
    await pageA.evaluate(([id]) => { window.App.startDrag(id); window.App.commitMove(id, 300, 250); }, [id]);
    const rectB = pageB.locator(`#drawing-layer rect[data-id="${id}"]`);
    await expect(rectB).toHaveAttribute('x', '300', { timeout: 5000 });

    const nameA = await pageA.evaluate(() => window.App.user.name);
    const nameB = await pageB.evaluate(() => window.App.user.name);

    await pageB.evaluate(() => window.UI.openSheet('history'));
    const moveOnB = row(pageB, 'move');
    await expect(moveOnB.locator('.hist-op-head > svg title')).toHaveText(nameA);
    await moveOnB.locator('.hist-op-head').click();
    await moveOnB.locator('.hist-op-go').click();

    await expect(rectB).toHaveAttribute('x', '100', { timeout: 5000 });
    await expect(pageA.locator(`#drawing-layer rect[data-id="${id}"]`)).toHaveAttribute('x', '100', { timeout: 5000 });

    await pageA.evaluate(() => window.UI.openSheet('history'));
    for (const page of [pageA, pageB]) {
      const undone = row(page, 'move');
      await expect(undone).toHaveClass(/undone/, { timeout: 5000 });
      await expect(undone.locator('.hist-op-head > svg title')).toHaveText(nameA);
      await expect(undone.locator('.hist-op-sub svg title')).toHaveText(nameB);
    }

    // Only the author of the undo may redo it.
    await pageA.locator('.hist-op').filter({ has: pageA.locator('.hist-op-title', { hasText: /^move / }) }).locator('.hist-op-head').click();
    await expect(pageA.locator('.hist-op-go')).toHaveCount(0);

    await browser.close();
  });
});
