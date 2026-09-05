/**
 * user.js — persistent player-profile identity, backed by localStorage.
 *
 * Single JSON key `tt_player` (mirrors the `tt_tables` naming convention
 * used elsewhere) holding { name, grad, localId, checkpointFrequency }:
 *   name    — display name string
 *   grad    — full entityGradient() output object, stored frozen so the
 *             gradient is immune to future changes in entityGradient's
 *             algorithm
 *   localId — persistent peer id, format tt-u-v1-DD-XXX
 *   checkpointFrequency — minutes between idle-triggered checkpoints, 0-10.
 *             any other player's client does.
 *
 * localStorage is synchronous, so every export here is a plain sync
 * function — no promises, no await, unlike the IndexedDB store this
 * replaces. Both index.html and home.html import from here so the
 * identity logic exists in exactly one place.
 *
 * getMyUser() derives the durable `user` shape — {id, name, color,
 * gradient} — that's passed around by shape (no getters) everywhere else
 * in the app: App.user, a peer's awareness state.user, App.getPeers().
 * This module also owns every user's <linearGradient> DOM element (see
 * upsertUserGradient/pruneUserGradients) — the one place gradient markup
 * is created or removed, by convention at id `grad-{user.id}`. Overlay
 * and ui.js only ever reference that id; they never create or mutate it.
 */

import { entityGradient } from './entity_gradient.js';

const STORAGE_KEY = 'tt_player';

export const MIN_CHECKPOINT_FREQUENCY     = 0;
export const MAX_CHECKPOINT_FREQUENCY     = 10;
export const DEFAULT_CHECKPOINT_FREQUENCY = 2;

const ADJS = ['Wily','Deadly','Gaunt','Sallow','Brazen','Vexed','Hollow','Sullen','Grim','Feral',
  'Ashen','Dread','Craven','Stout','Wroth','Sunken','Brash','Pallid','Sly','Gnarled',
  'Bleak','Rusted','Sworn','Cursed','Rabid','Silent','Haunted','Gravel','Ireful','Knave'];
const NAMES = ['Frodo','Xorn','Marda','Vex','Quill','Thane','Osric','Yeva','Drask','Noor',
  'Helgen','Zuko','Cavel','Brix','Ilsa','Morwen','Sable','Fenrick','Taza','Gorim',
  'Ulrik','Pell','Dagna','Wren','Jarrek','Chyst','Odra','Byren','Zasha','Rook'];

/**
 * Generates a random "Adjective Name" display name, e.g. "Wily Frodo".
 *
 * @returns {string}
 */
export function randomName() {
  const adj  = ADJS[Math.floor(Math.random() * ADJS.length)];
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  return `${adj} ${name}`;
}

/**
 * Generates a fresh persistent peer id, format tt-u-v1-DD-XXX where DD is
 * the current day-of-month and XXX is 3 random lowercase letters.
 *
 * @returns {string}
 */
export function makeLocalId() {
  const dd    = String(new Date().getDate()).padStart(2, '0');
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand  = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `tt-u-v1-${dd}-${rand}`;
}

/**
 * Reads the raw { name, grad, localId } record from localStorage.
 * Returns null if absent or if the stored JSON is corrupt.
 *
 * @returns {{name: string, grad: object, localId: string}|null}
 */
function readRecord() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Persists a { name, grad, localId } record to localStorage.
 *
 * @param {{name: string, grad: object, localId: string}} record
 */
function writeRecord(record) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage disabled or quota exceeded — profile just won't persist
    // across reloads; nothing else to do about it here.
  }
}

/**
 * Returns the player's identity, generating and persisting a fresh one
 * on first call (new name, gradient, and localId). Any missing or
 * malformed field is filled in and re-persisted, so this also heals a
 * partially-corrupt record.
 *
 * @returns {{name: string, grad: object, localId: string}}
 */
export function getIdentity() {
  let record = readRecord();
  let dirty  = false;

  if (!record || typeof record !== 'object') {
    record = {};
    dirty = true;
  }

  if (record.name == null) {
    // Only heal a genuinely missing name — an empty string is a valid,
    // if temporary, value (e.g. mid-edit in the profile name field) and
    // must not be silently overwritten with a random one.
    record.name = randomName();
    dirty = true;
  }

  if (!record.grad || !record.grad.c1) {
    record.grad = entityGradient(record.name);
    dirty = true;
  }

  if (!record.localId) {
    record.localId = makeLocalId();
    dirty = true;
  }

  if (!Number.isFinite(record.checkpointFrequency)) {
    record.checkpointFrequency = DEFAULT_CHECKPOINT_FREQUENCY;
    dirty = true;
  }

  if (dirty) writeRecord(record);

  return record;
}

/**
 * Updates the display name and persists it.
 *
 * @param {string} name
 */
export function setName(name) {
  const record = getIdentity();
  record.name = name;
  writeRecord(record);
}

/**
 * Updates the gradient and persists it.
 *
 * @param {object} grad - Full entityGradient() output object.
 */
export function setGrad(grad) {
  const record = getIdentity();
  record.grad = grad;
  writeRecord(record);
}

/**
 * Returns this player's durable identity as a `user` object — the same
 * {id, name, color, gradient} shape broadcast to peers over awareness
 * (see index.html) and read back via App.user / a peer's awareness
 * state.user. `id` is the persistent localId (tt-u-v1-...), stable
 * across reconnects and reloads, unlike the ephemeral Yjs clientID.
 *
 * @returns {{id: string, name: string, color: string, gradient: object}}
 */
export function getMyUser() {
  const { name, grad, localId } = getIdentity();
  return { id: localId, name, color: grad.c1, gradient: grad };
}

/**
 * Called once at boot, same convention as Overlay.init/Delight.init/etc.
 * Seeds the local player's own <linearGradient id="grad-{user.id}"> —
 * see upsertUserGradient.
 */
export function init(App, user) {
  upsertUserGradient(user);
}

const SVGNS = 'http://www.w3.org/2000/svg';
const GRADIENT_DEFS_ID = 'user-gradient-defs';
const GRADIENT_ID_PREFIX = 'grad-';

// Lazily creates the hidden, page-root <svg><defs> that holds every known
// user's <linearGradient> — the local player and every peer alike. Mirrors
// icons.js's initIcons(): injected once, prepended to <body>, never
// removed. Both index.html and home.html get one the first time any
// gradient is upserted; neither needs to declare it in markup.
function ensureGradientDefsRoot() {
  let defs = document.getElementById(GRADIENT_DEFS_ID);
  if (defs) return defs;
  const host = document.createElementNS(SVGNS, 'svg');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  defs = document.createElementNS(SVGNS, 'defs');
  defs.id = GRADIENT_DEFS_ID;
  host.appendChild(defs);
  document.body.prepend(host);
  return defs;
}

/**
 * Creates (or updates in place) the <linearGradient id="grad-{user.id}">
 * for `user` in the shared page-root defs (see ensureGradientDefsRoot) —
 * the one place in the app that owns a user's gradient DOM. Called once
 * for the local player at boot, and again for every peer whenever their
 * awareness-broadcast user record is (re)observed, so an existing
 * element's stops/angle are refreshed in place rather than recreated.
 * A user with no gradient data is a no-op.
 */
export function upsertUserGradient(user) {
  if (!user?.id || !user?.gradient?.c1) return;
  const gradId = `${GRADIENT_ID_PREFIX}${user.id}`;
  const defs   = ensureGradientDefsRoot();
  let lg = document.getElementById(gradId);
  if (!lg) {
    lg = document.createElementNS(SVGNS, 'linearGradient');
    lg.setAttribute('id', gradId);
    const stop0 = document.createElementNS(SVGNS, 'stop');
    stop0.setAttribute('id', `${gradId}-stop0`);
    stop0.setAttribute('offset', '0%');
    const stop1 = document.createElementNS(SVGNS, 'stop');
    stop1.setAttribute('id', `${gradId}-stop1`);
    stop1.setAttribute('offset', '100%');
    lg.appendChild(stop0);
    lg.appendChild(stop1);
    defs.appendChild(lg);
  }
  // Gradient direction: map CSS angle (0°=up, 90°=right) to SVG objectBoundingBox
  const rad = ((user.gradient.angle ?? 90) - 90) * Math.PI / 180;
  lg.setAttribute('x1', 0.5 - Math.cos(rad) / 2);
  lg.setAttribute('y1', 0.5 - Math.sin(rad) / 2);
  lg.setAttribute('x2', 0.5 + Math.cos(rad) / 2);
  lg.setAttribute('y2', 0.5 + Math.sin(rad) / 2);
  document.getElementById(`${gradId}-stop0`).setAttribute('stop-color', user.gradient.c1);
  document.getElementById(`${gradId}-stop1`).setAttribute('stop-color', user.gradient.c2 ?? user.gradient.c1);
}

/**
 * Removes the <linearGradient> for any known user NOT in `liveUserIds` —
 * called after each awareness sync so a departed peer's gradient doesn't
 * accumulate forever. Callers must include their own id in `liveUserIds`.
 */
export function pruneUserGradients(liveUserIds) {
  const defs = document.getElementById(GRADIENT_DEFS_ID);
  if (!defs) return;
  defs.querySelectorAll('linearGradient').forEach(lg => {
    const id = lg.getAttribute('id')?.slice(GRADIENT_ID_PREFIX.length);
    if (id && !liveUserIds.has(id)) lg.remove();
  });
}

const clampCheckpointFrequency = (n) =>
  Math.min(MAX_CHECKPOINT_FREQUENCY, Math.max(MIN_CHECKPOINT_FREQUENCY, n));

/**
 * Returns this player's idle-checkpoint frequency, in minutes (0-10).
 * 0 means idle checkpointing is off.
 */
export function getCheckpointFrequency() {
  return getIdentity().checkpointFrequency;
}

/**
 * Updates the idle-checkpoint frequency and persists it.
 */
export function setCheckpointFrequency(minutes) {
  const clamped = clampCheckpointFrequency(Math.round(Number(minutes) || 0));
  const record  = getIdentity();
  record.checkpointFrequency = clamped;
  writeRecord(record);
  return clamped;
}
