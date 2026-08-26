/**
 * tests/e2e/helpers.js
 *
 * A table has exactly one creator: whoever's URL has no hash generates the
 * table id and sets it. Everyone else arrives at a URL that already has
 * one — the hash travels over a human channel (chat, a shared link), never
 * generated independently by more than one browser.
 *
 * The op log's genesis checkpoint is gated on this (see toys.js's
 * projectLayer / index.html's isCreator) — two sessions that both think
 * they're the creator fork the table's history before either places
 * anything. Two-peer specs have to model the real protocol, not just
 * hand both pages the same pre-minted room id, or they never exercise the
 * only sequencing the source actually relies on.
 */

/**
 * The app resolves its signaling server from localStorage (see
 * src/signaling.js: SIGNALING_KEY), falling back to a host-based default
 * that only points at localhost when the page is actually served from
 * "localhost". Tests are served from whatever host the harness picked —
 * a container name under Docker, a bare IP in CI — so we seed the
 * override before any script runs rather than relying on that default.
 */
async function seedSignaling(page, signalingUrl) {
  if (!signalingUrl) return;
  await page.addInitScript(url => {
    localStorage.setItem('tt_signaling_server', url);
  }, signalingUrl);
}

/**
 * Navigate page with no hash — it becomes the creator and mints a table
 * id. Returns the room id once the hash has actually been set, so callers
 * can assert on the creator-alone state before anyone joins.
 */
export async function openAsCreator(page, { appUrl, signalingUrl }) {
  await seedSignaling(page, signalingUrl);
  await page.goto(`${appUrl}/`);
  await page.waitForFunction(() => location.hash.length > 1);
  return page.evaluate(() => location.hash.slice(1));
}

/**
 * join_intent.js's network-probe timeouts, overridable the same way
 * seedSignaling overrides the signaling URL — via localStorage, seeded
 * before any script runs. Only needed by specs that deliberately exercise
 * the "nobody's here" / "can't reach the network" outcomes quickly;
 * joinRoom below leaves the real (generous) defaults in place, since a
 * real joiner's dialog should almost always resolve to "found" well
 * within them.
 */
export async function seedJoinTimeouts(page, { signalingTimeoutMs, peerTimeoutMs } = {}) {
  await page.addInitScript(({ signalingTimeoutMs, peerTimeoutMs }) => {
    if (signalingTimeoutMs) localStorage.setItem('tt_join_signaling_timeout_ms', String(signalingTimeoutMs));
    if (peerTimeoutMs)      localStorage.setItem('tt_join_peer_timeout_ms', String(peerTimeoutMs));
  }, { signalingTimeoutMs, peerTimeoutMs });
}

/**
 * The join-intent dialog's one action button (any of "Join this table" /
 * "Create this table" / "Proceed offline" — see ui.js's
 * showJoinDialogPrompt). Callers wait for it themselves (e.g.
 * `.click({ timeout })`), generously, since the real probe races network
 * timeouts (join_intent.js's SIGNALING_TIMEOUT_MS + PEER_TIMEOUT_MS).
 */
export function joinDialogButton(page) {
  return page.locator('#joinDialogActions button').first();
}

/**
 * Navigate page to an existing room — a real joiner, never a creator.
 * Always lands on the join-intent dialog first (a fresh browser context
 * has no local record of the room), so this waits for and confirms
 * whichever outcome the probe reaches — in practice always "Join this
 * table", since the creator (already open in another page) is normally
 * long since connected to signaling by the time this runs.
 */
export async function joinRoom(page, room, { appUrl, signalingUrl }) {
  await seedSignaling(page, signalingUrl);
  await page.goto(`${appUrl}/#${room}`);
  await joinDialogButton(page).click({ timeout: 15000 });
}

/** openAsCreator + joinRoom, for the common case with nothing in between. */
export async function openCreatorAndJoiner(page1, page2, opts) {
  const room = await openAsCreator(page1, opts);
  await joinRoom(page2, room, opts);
  return room;
}
