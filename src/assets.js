/**
 * assets.js — binary attachments (PNGs) carried by the document itself.
 *
 * A table's background used to be a URL, which meant anyone wanting to
 * share their own image first had to find a server to put it on. An asset
 * is the alternative: the bytes live in the Y.Doc, so they reach every
 * peer over the same WebRTC connection the rest of the document uses, and
 * they survive in IndexedDB and in an exported SVG.
 *
 * Content-addressed: the id is a hash of the bytes, so the same file
 * shared twice is stored once, and two peers who share the same file
 * concurrently write the same key rather than fighting over two.
 *
 * Two maps, not one:
 *   ydoc.getMap('assets')        id → manifest  (small, JSON, immutable)
 *   ydoc.getMap('asset_chunks')  `${id}:${n}` → Uint8Array
 *
 * Chunking is a transport requirement, not a storage preference. y-webrtc
 * hands each Yjs update to the data channel as ONE message (see
 * simple-peer's `_channel.send`), and a browser data channel refuses a
 * message larger than the remote's `max-message-size` — 256 KiB between
 * Chromes. One chunk per transaction keeps every update comfortably under
 * that. The same ceiling applies to the whole-document message a joining
 * peer receives, which is why MAX_ASSET_BYTES is as small as it is; see
 * ASSETS.md.
 *
 * Pure over Yjs — no DOM, unit-testable. Decoding and resizing an actual
 * image file needs a browser and lives in image_intake.js.
 */

const ASSET_MAP = 'assets';
const CHUNK_MAP = 'asset_chunks';

export const ASSET_SCHEME = 'tt-asset:';

// Per chunk, and therefore per Yjs update. Well under the 256 KiB data
// channel ceiling even after Yjs framing and base64 signalling relay.
export const CHUNK_BYTES = 32 * 1024;

// The largest image we will take into a document. Every joining peer
// receives the whole document as a single data channel message, so this
// is a transport budget, not a storage one.
export const MAX_ASSET_BYTES = 192 * 1024;

// ── ids ──────────────────────────────────────────────────────────────────────

function fnv1a(bytes, seed) {
  let h = seed >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const hex8 = n => (n >>> 0).toString(16).padStart(8, '0');

/**
 * Content id, format tt-a-v1-XXXXXXXXXXXXXXXX. Two independent 32-bit
 * FNV-1a passes, the second seeded with the byte length, which is cheap,
 * synchronous and dependency-free. It is a dedupe key, not a security
 * claim — nothing here is defended against a peer who wants a collision.
 */
export function assetIdForBytes(bytes) {
  const h1 = fnv1a(bytes, 0x811c9dc5);
  const h2 = fnv1a(bytes, (0x9dc5811c ^ bytes.length) >>> 0);
  return `tt-a-v1-${hex8(h1)}${hex8(h2)}`;
}

export function assetUrl(id)   { return `${ASSET_SCHEME}${id}`; }
export function isAssetUrl(url) {
  return typeof url === 'string' && url.startsWith(ASSET_SCHEME);
}
export function assetIdFromUrl(url) {
  return isAssetUrl(url) ? url.slice(ASSET_SCHEME.length) : null;
}

// ── base64 / data URLs ───────────────────────────────────────────────────────

// btoa chokes on very long argument lists via fromCharCode.apply, so the
// string is built in slices.
function bytesToBase64(bytes) {
  const SLICE = 8 * 1024;
  let str = '';
  for (let i = 0; i < bytes.length; i += SLICE) {
    str += String.fromCharCode.apply(null, bytes.subarray(i, i + SLICE));
  }
  return btoa(str);
}

function base64ToBytes(b64) {
  const str   = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

export function bytesToDataUrl(bytes, mime = 'image/png') {
  return `data:${mime};base64,${bytesToBase64(bytes)}`;
}

/**
 * Parse a base64 data: URL into { bytes, mime }, or null for anything
 * else (including the percent-encoded data: form, which we never write).
 */
export function dataUrlToBytes(url) {
  if (typeof url !== 'string') return null;
  const m = /^data:([^;,]*)(;[^,]*)?;base64,(.*)$/s.exec(url);
  if (!m) return null;
  try {
    return { bytes: base64ToBytes(m[3]), mime: m[1] || 'application/octet-stream' };
  } catch {
    return null;
  }
}

// ── planning a write ─────────────────────────────────────────────────────────

/**
 * Everything a write needs, computed without touching the document:
 * the id, the manifest, and the bytes already sliced into chunks.
 *
 * Throws on an over-budget image rather than letting a document grow past
 * what a joining peer can receive.
 */
export function assetPlan({ bytes, mime = 'image/png', width = 0, height = 0,
                            name = '', authorId = '', chunkSize = CHUNK_BYTES,
                            maxBytes = MAX_ASSET_BYTES, ts = Date.now() }) {
  if (!(bytes instanceof Uint8Array)) throw new Error('assetPlan: bytes must be a Uint8Array');
  if (bytes.length === 0)             throw new Error('assetPlan: refusing to store an empty asset');
  if (bytes.length > maxBytes) {
    throw new Error(`assetPlan: ${bytes.length} bytes exceeds the ${maxBytes}-byte limit`);
  }

  const id     = assetIdForBytes(bytes);
  const chunks = [];
  for (let start = 0; start < bytes.length; start += chunkSize) {
    chunks.push(bytes.subarray(start, Math.min(start + chunkSize, bytes.length)));
  }

  const manifest = {
    id, mime, name, authorId, ts,
    bytes:      bytes.length,
    width:      Number(width)  || 0,
    height:     Number(height) || 0,
    chunkSize,
    chunkCount: chunks.length,
  };
  return { id, manifest, chunks };
}

// ── writing ──────────────────────────────────────────────────────────────────

function chunkKey(id, index) { return `${id}:${index}`; }

export function putManifest(ydoc, manifest) {
  ydoc.getMap(ASSET_MAP).set(manifest.id, manifest);
}

/**
 * One chunk, one transaction, one Yjs update, one data channel message.
 * A chunk is copied out of its parent buffer: a subarray is a view, and
 * Yjs would otherwise encode the whole backing ArrayBuffer.
 */
export function putChunk(ydoc, id, index, chunkBytes) {
  const copy = new Uint8Array(chunkBytes.length);
  copy.set(chunkBytes);
  ydoc.transact(() => { ydoc.getMap(CHUNK_MAP).set(chunkKey(id, index), copy); });
}

/**
 * Write an asset synchronously. The manifest lands first so a receiving
 * peer can show progress against a known total while the chunks arrive.
 * Returns the asset id; an asset already present is left alone.
 */
export function writeAsset(ydoc, input) {
  const { id, manifest, chunks } = assetPlan(input);
  if (isComplete(ydoc, id)) return id;
  ydoc.transact(() => { putManifest(ydoc, manifest); });
  chunks.forEach((chunk, i) => putChunk(ydoc, id, i, chunk));
  return id;
}

const nextMacrotask = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * writeAsset, paced. Yields to the event loop between chunks so a
 * multi-chunk share neither blocks the UI thread nor dumps every update
 * into the provider's send queue at once.
 *
 * onProgress is called with (chunksWritten, chunkCount) after each chunk.
 */
export async function writeAssetPaced(ydoc, input, { onProgress = null, yieldFn = nextMacrotask } = {}) {
  const { id, manifest, chunks } = assetPlan(input);
  if (isComplete(ydoc, id)) {
    onProgress?.(chunks.length, chunks.length);
    return id;
  }
  ydoc.transact(() => { putManifest(ydoc, manifest); });
  for (let i = 0; i < chunks.length; i++) {
    putChunk(ydoc, id, i, chunks[i]);
    onProgress?.(i + 1, chunks.length);
    if (i < chunks.length - 1) await yieldFn();
  }
  return id;
}

// ── reading ──────────────────────────────────────────────────────────────────

export function getManifest(ydoc, id) {
  return ydoc.getMap(ASSET_MAP).get(id) ?? null;
}

export function listAssets(ydoc) {
  return [...ydoc.getMap(ASSET_MAP).values()];
}

/**
 * What we have of an asset right now:
 *   { known, complete, have, total, bytes, manifest }
 * `known: false` means not even the manifest has arrived — the caller
 * cannot tell "never heard of it" from "still in flight", and shouldn't
 * try to.
 */
export function assetStatus(ydoc, id) {
  const manifest = getManifest(ydoc, id);
  if (!manifest) return { known: false, complete: false, have: 0, total: 0, bytes: 0, manifest: null };
  const chunks = ydoc.getMap(CHUNK_MAP);
  let have = 0;
  for (let i = 0; i < manifest.chunkCount; i++) if (chunks.has(chunkKey(id, i))) have++;
  return {
    known:    true,
    complete: have === manifest.chunkCount,
    have,
    total:    manifest.chunkCount,
    bytes:    manifest.bytes,
    manifest,
  };
}

export function isComplete(ydoc, id) { return assetStatus(ydoc, id).complete; }

/** The reassembled bytes, or null while any chunk is missing. */
export function readAssetBytes(ydoc, id) {
  const manifest = getManifest(ydoc, id);
  if (!manifest) return null;
  const chunks = ydoc.getMap(CHUNK_MAP);
  const out    = new Uint8Array(manifest.bytes);
  let offset   = 0;
  for (let i = 0; i < manifest.chunkCount; i++) {
    const chunk = chunks.get(chunkKey(id, i));
    if (!chunk) return null;
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return offset === manifest.bytes ? out : null;
}

/** A data: URL any <image href> can use, or null while incomplete. */
export function readAssetDataUrl(ydoc, id) {
  const bytes = readAssetBytes(ydoc, id);
  if (!bytes) return null;
  return bytesToDataUrl(bytes, getManifest(ydoc, id)?.mime || 'image/png');
}

/**
 * Turn whatever is stored in a document field into something renderable.
 * An ordinary URL passes through untouched; a tt-asset: URL resolves to a
 * data: URL, or to null while its chunks are still arriving.
 */
export function resolveUrl(ydoc, url) {
  const id = assetIdFromUrl(url);
  if (id === null) return url;
  return readAssetDataUrl(ydoc, id);
}

export function totalAssetBytes(ydoc) {
  return listAssets(ydoc).reduce((sum, m) => sum + (m.bytes || 0), 0);
}

// ── deleting ─────────────────────────────────────────────────────────────────

export function deleteAsset(ydoc, id) {
  const manifest = getManifest(ydoc, id);
  ydoc.transact(() => {
    const chunks = ydoc.getMap(CHUNK_MAP);
    const count  = manifest?.chunkCount ?? 0;
    for (let i = 0; i < count; i++) chunks.delete(chunkKey(id, i));
    // Chunks whose manifest is already gone would otherwise be unreachable.
    if (!manifest) {
      for (const key of [...chunks.keys()]) {
        if (key.startsWith(`${id}:`)) chunks.delete(key);
      }
    }
    ydoc.getMap(ASSET_MAP).delete(id);
  });
}

/**
 * Drop every asset not in `referencedIds`. The caller owns the reference
 * set, because only the caller knows which document fields can name an
 * asset. Returns the ids removed.
 */
export function collectUnreferenced(ydoc, referencedIds) {
  const keep    = new Set(referencedIds);
  const removed = listAssets(ydoc).map(m => m.id).filter(id => !keep.has(id));
  removed.forEach(id => deleteAsset(ydoc, id));
  return removed;
}

// ── observing ────────────────────────────────────────────────────────────────

/**
 * Call `fn` whenever a manifest or a chunk lands, from any peer. Returns
 * the unsubscribe function.
 */
export function observeAssets(ydoc, fn) {
  const assets = ydoc.getMap(ASSET_MAP);
  const chunks = ydoc.getMap(CHUNK_MAP);
  assets.observe(fn);
  chunks.observe(fn);
  return () => { assets.unobserve(fn); chunks.unobserve(fn); };
}
