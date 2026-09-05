/**
 * tests/e2e/hashchange.spec.js
 *
 * index.html reads location.hash exactly once, at boot, to decide which
 * table to create/join (see helpers.js's doc comment). Anything that
 * changes the hash afterward — the user editing the URL bar, browser
 * back/forward, a same-page link to another #tableId — used to leave the
 * page showing the OLD table forever, per the comment on
 * ui.js's branchDialogKeepWorking. The hashchange listener added to
 * index.html closes that gap by reloading onto whatever table the hash
 * names now.
 */

import { test, expect, chromium } from '@playwright/test';
import { openAsCreator, waitForTableId } from './helpers.js';

const APP_URL       = process.env.APP_URL       || 'http://localhost:3000';
const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:4444';

test.describe('hashchange table navigation', () => {
  test('the creator\'s own initial hash-mint does not trigger a reload', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page    = await browser.newPage();

    // sessionStorage survives a same-page reload, so a counter bumped by
    // every fresh script execution tells reloads apart from the single
    // initial load.
    await page.addInitScript(() => {
      sessionStorage.setItem('__loads', String(Number(sessionStorage.getItem('__loads') || '0') + 1));
    });

    const room = await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await waitForTableId(page, room);
    await page.waitForTimeout(300); // give a spurious hashchange reload a chance to happen

    expect(await page.evaluate(() => sessionStorage.getItem('__loads'))).toBe('1');

    await browser.close();
  });

  test('changing the hash on an open page leaves the current table and joins the new one', async () => {
    const browser = await chromium.launch({ executablePath: process.env.PW_CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page    = await browser.newPage();

    await page.addInitScript(() => {
      sessionStorage.setItem('__loads', String(Number(sessionStorage.getItem('__loads') || '0') + 1));
    });

    const tableA = await openAsCreator(page, { appUrl: APP_URL, signalingUrl: SIGNALING_URL });
    await waitForTableId(page, tableA);
    expect(await page.evaluate(() => sessionStorage.getItem('__loads'))).toBe('1');

    const tableB = 'tt-T-v1-e2ehashtest';
    await page.evaluate((id) => { location.hash = id; }, tableB);

    // The listener reloads the page onto tableB. tableB is a table nobody
    // has seen before, so the reloaded page's isCreator resolution blocks
    // on the join-intent dialog — App.getTableId() wouldn't settle until
    // that's dismissed. location.hash lands on tableB immediately, and
    // waitForFunction (unlike a bare evaluate poll) survives the reload's
    // execution-context swap, so it's the signal that the reload landed.
    await page.waitForFunction((id) => location.hash.slice(1) === id, tableB, { timeout: 8000 });

    // Exactly one reload happened — not zero (the hash change was ignored)
    // and not more than one (no reload loop from the listener re-triggering
    // itself).
    expect(await page.evaluate(() => sessionStorage.getItem('__loads'))).toBe('2');

    await browser.close();
  });
});
