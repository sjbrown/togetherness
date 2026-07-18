/**
 * user.js — persistent player-profile identity, backed by localStorage.
 *
 * Single JSON key `tt_player` (mirrors the `tt_tables` naming convention
 * used elsewhere) holding { name, grad, localId }:
 *   name    — display name string
 *   grad    — full entityGradient() output object, stored frozen so the
 *             gradient is immune to future changes in entityGradient's
 *             algorithm
 *   localId — persistent peer id, format tt-p-v1-DD-XXX
 *
 * localStorage is synchronous, so every export here is a plain sync
 * function — no promises, no await, unlike the IndexedDB store this
 * replaces. Both index.html and home.html import from here so the
 * identity logic exists in exactly one place.
 */

import { entityGradient } from './entity_gradient.js';

const STORAGE_KEY = 'tt_player';

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
 * Generates a fresh persistent peer id, format tt-p-v1-DD-XXX where DD is
 * the current day-of-month and XXX is 3 random lowercase letters.
 *
 * @returns {string}
 */
export function makeLocalId() {
  const dd    = String(new Date().getDate()).padStart(2, '0');
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand  = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `tt-p-v1-${dd}-${rand}`;
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
