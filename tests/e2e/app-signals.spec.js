/**
 * tests/e2e/app-signals.spec.js
 *
 * App.on's local-only toy:<verb>:<phase> signals, which delight effects
 * build on: what each pointer gesture sends, independent of any effect
 * that listens.
 */

import { test, expect } from '@playwright/test';
import { openAsCreator, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

const SIGNALS = ['add', 'move'].flatMap(v => ['press', 'release', 'place', 'cancel'].map(p => `toy:${v}:${p}`));

test('pointer gestures on toys send toy:add:* and toy:move:* in order, paired by pressId', async ({ page }) => {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  const box = await page.locator('#canvas').boundingBox();
  const sc = (x, y) => ({ x: box.x + x, y: box.y + y });

  await page.evaluate((signals) => {
    window.__signals = [];
    for (const type of signals) {
      window.App.on(type, (d) => {
        const { preview, ...rest } = d;
        window.__signals.push({ type, ...rest, ...(preview ? { hasPreview: typeof preview === 'function' } : {}) });
      });
    }
  }, SIGNALS);
  const take = async (n) => {
    await expect.poll(() => page.evaluate(() => window.__signals.length)).toBe(n);
    return page.evaluate(() => window.__signals.splice(0));
  };
  const types = (sigs) => sigs.map(s => s.type);
  const onePress = (sigs) => expect(new Set(sigs.map(s => s.pressId)).size).toBe(1);

  // Adding two toys: press, release, place each.
  await page.evaluate(() => window.UI.pillTap('d6'));
  for (const p of [sc(200, 200), sc(400, 200)]) {
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.up();
  }
  const adds = await take(6);
  expect(types(adds)).toEqual(['toy:add:press', 'toy:add:release', 'toy:add:place', 'toy:add:press', 'toy:add:release', 'toy:add:place']);
  onePress(adds.slice(0, 3));
  onePress(adds.slice(3));
  expect(adds[0]).toMatchObject({ tool: 'd6', x: 200, y: 200, hasPreview: true });
  const [idA, idB] = [adds[2].id, adds[5].id];
  await expect(page.locator(`#toys-layer [data-id="${idA}"]`)).toHaveCount(1);
  await expect(page.locator(`#toys-layer [data-id="${idB}"]`)).toHaveCount(1);

  const anchorOf = (id) => page.evaluate((id) =>
    window.App.getAnchor(document.querySelector(`#toys-layer [data-id="${id}"]`)), id);
  await page.evaluate(() => window.UI.pillTap('select'));

  // A tap on a toy starts a move that is cancelled.
  await page.mouse.move(sc(200, 200).x, sc(200, 200).y);
  await page.mouse.down();
  await page.mouse.up();
  const tap = await take(2);
  expect(types(tap)).toEqual(['toy:move:press', 'toy:move:cancel']);
  onePress(tap);
  expect(tap[0].moves).toEqual([{ id: idA, from: { x: 200, y: 200 } }]);
  expect(tap[1].pointer).toBeNull();

  // One toy, dragged 100 down.
  await page.mouse.down();
  await page.mouse.move(sc(200, 202).x, sc(200, 202).y);
  await page.mouse.move(sc(200, 300).x, sc(200, 300).y, { steps: 8 });
  await page.mouse.up();
  const single = await take(3);
  expect(types(single)).toEqual(['toy:move:press', 'toy:move:release', 'toy:move:place']);
  onePress(single);
  expect(single[0].moves).toEqual([{ id: idA, from: { x: 200, y: 200 } }]);
  expect(single[2].moves).toEqual([{ id: idA, from: { x: 200, y: 200 }, ...(await anchorOf(idA)) }]);
  expect(single[2].moves[0].y).toBe(300);

  // Both toys, shift-rubber-banded (no signals), dragged 50 right together.
  await page.mouse.move(sc(120, 120).x, sc(120, 120).y);
  await page.keyboard.down('Shift');
  await page.mouse.down();
  await page.mouse.move(sc(480, 380).x, sc(480, 380).y, { steps: 8 });
  await page.mouse.up();
  await page.keyboard.up('Shift');
  await expect(page.locator('#selection_local .selRing')).toHaveCount(2, { timeout: 3000 });
  expect(await page.evaluate(() => window.__signals)).toEqual([]);
  const before = { [idA]: await anchorOf(idA), [idB]: await anchorOf(idB) };
  await page.mouse.move(sc(400, 200).x, sc(400, 200).y);
  await page.mouse.down();
  await page.mouse.move(sc(402, 200).x, sc(402, 200).y);
  await page.mouse.move(sc(450, 200).x, sc(450, 200).y, { steps: 8 });
  await page.mouse.up();
  const multi = await take(3);
  expect(types(multi)).toEqual(['toy:move:press', 'toy:move:release', 'toy:move:place']);
  onePress(multi);
  const byId = (ms) => Object.fromEntries(ms.map(m => [m.id, m]));
  expect(byId(multi[0].moves)).toEqual({
    [idA]: { id: idA, from: before[idA] },
    [idB]: { id: idB, from: before[idB] },
  });
  for (const id of [idA, idB]) {
    const after = await anchorOf(id);
    expect(byId(multi[2].moves)[id]).toEqual({ id, from: before[id], ...after });
    expect(after).toEqual({ x: before[id].x + 50, y: before[id].y });
  }
});

test('moving a drawing sends no toy:move:* signals', async ({ page }) => {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  const box = await page.locator('#canvas').boundingBox();
  const sc = (x, y) => ({ x: box.x + x, y: box.y + y });

  await page.evaluate(() => window.App.setLayer('drawing'));
  await page.evaluate(() => window.App.commitDrawing({
    type: 'rect', x: 100, y: 100, width: 80, height: 80,
    fill: '#c8941e', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 0,
  }));
  await expect(page.locator('#drawing-layer [data-id]')).toHaveCount(1, { timeout: 3000 });
  await page.evaluate((signals) => {
    window.__signals = [];
    for (const type of signals) window.App.on(type, () => window.__signals.push(type));
  }, SIGNALS);
  await page.evaluate(() => window.UI.pillTap('select'));
  await page.mouse.move(sc(140, 140).x, sc(140, 140).y);
  await page.mouse.down();
  await page.mouse.move(sc(142, 140).x, sc(142, 140).y);
  await page.mouse.move(sc(240, 140).x, sc(240, 140).y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const x = await page.evaluate(() =>
    window.App.getBBox(document.querySelector('#drawing-layer [data-id]').getAttribute('data-id')).x);
  expect(x).toBe(200);
  expect(await page.evaluate(() => window.__signals)).toEqual([]);
});

test('deleting toys sends toy:delete with each toy’s centre and size; deleting a drawing sends nothing', async ({ page }) => {
  await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
  await waitForPeerCount(page, 0);
  const box = await page.locator('#canvas').boundingBox();
  const sc = (x, y) => ({ x: box.x + x, y: box.y + y });

  await page.evaluate(() => window.UI.pillTap('d6'));
  for (const p of [sc(200, 200), sc(400, 200), sc(600, 200)]) {
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.up();
  }
  await expect(page.locator('#toys-layer [data-toy-type]')).toHaveCount(3, { timeout: 5000 });
  const [idA, idB, idC] = await page.evaluate(() =>
    [...document.querySelectorAll('#toys-layer [data-toy-type]')].map(el => el.getAttribute('data-id')));
  const sizeOf = (id) => page.evaluate((id) => {
    const g = window.App.getBBox(id);
    return { w: g.width, h: g.height };
  }, id);
  const size = await sizeOf(idA);

  await page.evaluate(() => {
    window.__deletes = [];
    window.App.on('toy:delete', (d) => window.__deletes.push(d));
  });
  await page.evaluate(() => window.UI.pillTap('select'));

  // One toy, with the Delete key.
  await page.mouse.move(sc(200, 200).x, sc(200, 200).y);
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.press('Delete');
  await expect.poll(() => page.evaluate(() => window.__deletes.length)).toBe(1);
  const [one] = await page.evaluate(() => window.__deletes.splice(0));
  expect(one.toys).toHaveLength(1);
  expect(one.toys[0].id).toBe(idA);
  expect(one.toys[0].x).toBeCloseTo(200, 5);
  expect(one.toys[0].y).toBeCloseTo(200, 5);
  expect({ w: one.toys[0].w, h: one.toys[0].h }).toEqual(size);

  // Two toys, multi-selected, with the Delete button.
  await page.mouse.move(sc(320, 120).x, sc(320, 120).y);
  await page.keyboard.down('Shift');
  await page.mouse.down();
  await page.mouse.move(sc(680, 280).x, sc(680, 280).y, { steps: 8 });
  await page.mouse.up();
  await page.keyboard.up('Shift');
  await expect(page.locator('#selection_local .selRing')).toHaveCount(2, { timeout: 3000 });
  await page.evaluate(() => window.UI.deleteSelected());
  await expect.poll(() => page.evaluate(() => window.__deletes.length)).toBe(1);
  const [two] = await page.evaluate(() => window.__deletes.splice(0));
  const byId = Object.fromEntries(two.toys.map(t => [t.id, t]));
  expect(Object.keys(byId).sort()).toEqual([idB, idC].sort());
  expect(byId[idB].x).toBeCloseTo(400, 5);
  expect(byId[idC].x).toBeCloseTo(600, 5);

  // A drawing.
  await page.evaluate(() => window.App.setLayer('drawing'));
  await page.evaluate(() => window.App.commitDrawing({
    type: 'rect', x: 100, y: 400, width: 80, height: 80,
    fill: '#c8941e', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 0,
  }));
  await expect(page.locator('#drawing-layer [data-id]')).toHaveCount(1, { timeout: 3000 });
  await page.evaluate(() => window.UI.pillTap('select'));
  await page.mouse.move(sc(140, 440).x, sc(140, 440).y);
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.press('Delete');
  await expect(page.locator('#drawing-layer [data-id]')).toHaveCount(0, { timeout: 3000 });
  expect(await page.evaluate(() => window.__deletes)).toEqual([]);
});
