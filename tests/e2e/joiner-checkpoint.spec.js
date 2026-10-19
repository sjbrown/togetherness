import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, joinRoom, waitForPeerCount } from './helpers.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';
const opts = { appUrl: APP_URL, signalingUrl: SIGNALING_URL };

const launch = () => chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const toysHead = (page) => page.evaluate(() => window.App.getDebugState().layers.find(l => l.name === 'toys').head);
const netOf = (page) => page.evaluate(() => {
  const n = window.App.getDebugState().net;
  return { synced: n.synced, webrtcPeers: n.webrtcPeers, signalingConns: n.signalingConns };
});

async function creatorWithDie(page, moves) {
  await openAsCreator(page, opts);
  const box = await page.locator('#canvas').boundingBox();
  await page.evaluate(() => window.UI.pillTap('d6'));
  await page.waitForTimeout(100);
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.down();
  await page.mouse.up();
  const id = await page.locator('#toys-layer [data-toy-type]').first().getAttribute('data-id');
  const move = (p, x, y) => p.evaluate(([id, x, y]) => {
    window.App.startDrag(id);
    window.App.commitMove(id, x, y);
  }, [id, x, y]);
  for (let i = 0; i < moves; i++) await move(page, 50 + i * 5, 60);
  return { id, move };
}

// maybeCheckpoint moves the head but not the projection marker.
test.fail('a panel-open checkpoint leaves the projection marker on the new head', async () => {
  const browser = await launch();
  const page = await (await browser.newContext()).newPage();
  await creatorWithDie(page, 12);
  const ck = await page.evaluate(() => window.App.maybeCheckpoint('panel-open'));
  expect(ck.toys).toBeTruthy();
  const head = await toysHead(page);
  console.log('after checkpoint', JSON.stringify(head));
  expect(head.projected).toBe(head.head);
  await browser.close();
});

// A joiner's provider listeners attach after the join dialog, past the events.
test.fail("a joiner's net status reflects the connection it made during the join dialog", async () => {
  const browser = await launch();
  const page1 = await (await browser.newContext()).newPage();
  const page2 = await (await browser.newContext()).newPage();
  await openAsCreator(page1, opts);
  const room = await page1.evaluate(() => location.hash.slice(1));
  await joinRoom(page2, room, opts);
  await waitForPeerCount(page1, 1);
  await waitForPeerCount(page2, 1);
  await page2.waitForTimeout(500);
  const creator = await netOf(page1);
  const joiner  = await netOf(page2);
  console.log('creator net', JSON.stringify(creator));
  console.log('joiner net ', JSON.stringify(joiner));
  expect(joiner.webrtcPeers).toBe(1);
  expect(joiner.synced).toBe(true);
  await browser.close();
});

// getDebugState compares the head alone against a marker of every tip.
test.fail('concurrent joiner checkpoint and creator move: both converge, debug head agrees', async () => {
  const browser = await launch();
  const page1 = await (await browser.newContext()).newPage();
  const page2 = await (await browser.newContext()).newPage();
  const errors = [];
  page2.on('pageerror', e => errors.push(String(e)));
  const { id, move } = await creatorWithDie(page1, 12);
  const room = await page1.evaluate(() => location.hash.slice(1));
  await joinRoom(page2, room, opts);
  await waitForPeerCount(page1, 1);
  await waitForPeerCount(page2, 1);

  const [ck] = await Promise.all([
    page2.evaluate(() => window.App.maybeCheckpoint('panel-open')),
    move(page1, 333, 222),
  ]);
  expect(ck.toys).toBeTruthy();
  const outer = (p) => p.locator(`#toys-layer [data-id="${id}"]`).evaluate(el => el.outerHTML.slice(0, 300));
  await expect.poll(() => outer(page2), { timeout: 5000 }).toBe(await outer(page1));
  const h1 = await toysHead(page1), h2 = await toysHead(page2);
  console.log('creator', JSON.stringify(h1));
  console.log('joiner ', JSON.stringify(h2));
  expect(errors).toEqual([]);
  expect(h2.agrees).toBe(true);
  await browser.close();
});
