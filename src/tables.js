/**
 * tables.js — table registry + per-table Yjs document persistence.
 *
 * Owns the two pieces of local, this-device-only state that let someone
 * come back to a table across sessions:
 *   - the 'tt_tables' localStorage registry (recently-visited tables: id,
 *     name, lastVisit) that home.html lists and index.html keeps current;
 *   - the per-table IndexedDB database ('tt:<tableId>') holding the
 *     table's actual Yjs document updates, via y-indexeddb.
 *
 * Shared by home.html (creating / listing / deleting / forking tables) and
 * index.html (loading / persisting the live table a player is at). Every
 * function takes its table id / Y.Doc as an explicit parameter rather than
 * closing over page-specific state, so this works from either entry point
 * — and later, from *inside* a live table, for TODO #11's branch
 * escalation (see concurrency_branching.md), which needs to fork a live
 * table's doc from app.js, not just an at-rest one from home.html.
 */
import * as Y                   from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { resetJoinSequenceToSelf } from './authority.js';

const TABLES_KEY  = 'tt_tables';
const MAX_TABLES  = 20;

// ── IndexedDB database naming ───────────────────────────────────────────

/** The y-indexeddb database name for a given table id. */
function tableDbName(tableId) {
  return `tt:${tableId}`;
}

/**
 * Open (or create) a table's IndexedDB persistence for a live Y.Doc. This
 * is a live, syncing session (y-indexeddb keeps writing as ydoc changes) —
 * for a one-shot read of an at-rest table, use loadTableDoc() instead.
 */
function openTablePersistence(tableId, ydoc) {
  return new IndexeddbPersistence(tableDbName(tableId), ydoc);
}

// ── 'tt_tables' registry (recently-visited tables) ──────────────────────

function loadTables() {
  try { return JSON.parse(localStorage.getItem(TABLES_KEY)) || []; } catch { return []; }
}

function saveTables(tables) {
  try { localStorage.setItem(TABLES_KEY, JSON.stringify(tables)); } catch {}
}

/**
 * Upsert a table's registry entry: bump lastVisit if it already exists
 * (name left untouched — a revisit doesn't rename it), or insert a new
 * entry (name defaults to the id) if it doesn't. Caps the registry at
 * MAX_TABLES, dropping the oldest.
 */
function touchTableRecord(tableId, { name } = {}) {
  const tables   = loadTables();
  const existing = tables.findIndex(t => t.id === tableId);
  if (existing >= 0) {
    tables[existing].lastVisit = Date.now();
  } else {
    tables.push({ id: tableId, name: name ?? tableId, lastVisit: Date.now() });
    if (tables.length > MAX_TABLES) tables.splice(0, tables.length - MAX_TABLES);
  }
  saveTables(tables);
}

/**
 * Remove a table from the registry and delete its IndexedDB database.
 * Does not touch other peers' copies of the table — this only forgets it
 * on this device.
 */
function deleteTable(tableId) {
  saveTables(loadTables().filter(t => t.id !== tableId));
  indexedDB.deleteDatabase(tableDbName(tableId));
}

// ── Table document access ───────────────────────────────────────────────

/**
 * Load a table's persisted Yjs document into a fresh, detached Y.Doc by
 * replaying its IndexedDB update log directly (not via
 * IndexeddbPersistence/openTablePersistence — this is a one-shot read, not
 * a live-syncing session). Returns a Y.Doc with no updates applied if the
 * table's database doesn't exist yet.
 */
async function loadTableDoc(tableId) {
  const ydoc = new Y.Doc();
  await new Promise((resolve, reject) => {
    const req = indexedDB.open(tableDbName(tableId));
    req.onerror         = () => reject(req.error);
    req.onupgradeneeded = () => resolve(); // database doesn't exist yet
    req.onsuccess       = () => {
      const db  = req.result;
      const tx  = db.transaction('updates', 'readonly');
      const all = tx.objectStore('updates').getAll();
      all.onsuccess = () => {
        Y.transact(ydoc, () => {
          all.result.forEach(u => Y.applyUpdate(ydoc, u));
        });
        db.close();
        resolve();
      };
      all.onerror = () => { db.close(); reject(all.error); };
    };
  });
  return ydoc;
}

/**
 * Fork a table: copy its persisted Yjs state into a brand-new IndexedDB
 * database under forkedTableId. Does NOT touch the 'tt_tables' registry —
 * callers register the new entry themselves via touchTableRecord (naming
 * it is a caller decision, e.g. "<original name> (fork)").
 *
 * forkingUserId (the forking player's persistent user.js localId) is
 * required: the branch's joinSequence is reset to contain ONLY this id,
 * rather than carrying over the source table's whole roster. See
 * authority.js's resetJoinSequenceToSelf and concurrency_branching.md,
 * "The branch (fork) operation" — without this, every player who was ever
 * on the source table would outrank the forking user on their own new
 * branch, despite never having seen it.
 *
 * This forks a whole at-rest table.
 * TODO: support forking a *live* table's doc at a specific causal point,
 *       (extend this primitive)
 */
async function forkTable(sourceTableId, forkedTableId, forkingUserId) {
  if (!forkingUserId) {
    throw new Error('forkTable: forkingUserId is required (the branch\'s joinSequence must reset to the forking user — see authority.js)');
  }

  const sourceDoc = await loadTableDoc(sourceTableId);
  const update    = Y.encodeStateAsUpdate(sourceDoc);
  sourceDoc.destroy();

  // Write the copy via openTablePersistence — the same path a live table
  // uses
  const forkDoc = new Y.Doc();
  Y.applyUpdate(forkDoc, update);
  resetJoinSequenceToSelf(forkDoc, forkDoc.getArray('joinSequence'), forkingUserId);
  await new Promise((resolve, reject) => {
    const persistence = openTablePersistence(forkedTableId, forkDoc);
    persistence.on('synced', resolve);
    persistence.on('error',  reject);
  });
  forkDoc.destroy();
}

/**
 * Generate a fresh table id
 */
function generateTableId(sourceName) {
  const rslug = randSlug()
  const slug  = (sourceName || 'table')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 10)
    || 'table';
  return `tt-T-v1-${slug}-${rslug}`;
}

function randSlug() {
  const dd    = String(new Date().getDate()).padStart(2, '0')
  const chars = 'abcdefghijkmnopqrstuvwxyz23456789'
  const rand  = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${dd}${rand}`
}

export const tablesAPI = {
  tableDbName,
  openTablePersistence,
  loadTables,
  saveTables,
  touchTableRecord,
  deleteTable,
  loadTableDoc,
  forkTable,
  generateTableId,
  randSlug,
};
