/**
 * tests/unit/assets.test.js
 *
 * The in-document binary store: content ids, chunking, reassembly, and
 * what a peer sees while chunks are still arriving.
 */

import * as Y from 'yjs'
import { describe, test, expect, vi } from 'vitest'
import {
  ASSET_SCHEME, CHUNK_BYTES, MAX_ASSET_BYTES,
  assetIdForBytes, assetUrl, isAssetUrl, assetIdFromUrl,
  bytesToDataUrl, dataUrlToBytes,
  assetPlan, writeAsset, writeAssetPaced, putManifest, putChunk,
  getManifest, listAssets, assetStatus, isComplete,
  readAssetBytes, readAssetDataUrl, resolveUrl, totalAssetBytes,
  deleteAsset, collectUnreferenced, observeAssets, resolveBackground,
} from '../../src/assets.js'

/** Deterministic pseudo-random bytes — compressible content is irrelevant here. */
function bytes(n, seed = 1) {
  const out = new Uint8Array(n)
  let x = seed
  for (let i = 0; i < n; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0
    out[i] = x & 0xff
  }
  return out
}

const png = () => bytes(5000, 7)

describe('content ids', () => {
  test('same bytes give the same id, different bytes do not', () => {
    expect(assetIdForBytes(png())).toBe(assetIdForBytes(png()))
    expect(assetIdForBytes(bytes(5000, 8))).not.toBe(assetIdForBytes(png()))
  })

  test('length is part of the id', () => {
    expect(assetIdForBytes(bytes(100, 3))).not.toBe(assetIdForBytes(bytes(101, 3)))
  })

  test('ids carry the versioned prefix', () => {
    expect(assetIdForBytes(png())).toMatch(/^tt-a-v1-[0-9a-f]{16}$/)
  })
})

describe('asset urls', () => {
  test('round-trip through the scheme', () => {
    const id = assetIdForBytes(png())
    expect(assetUrl(id)).toBe(`${ASSET_SCHEME}${id}`)
    expect(isAssetUrl(assetUrl(id))).toBe(true)
    expect(assetIdFromUrl(assetUrl(id))).toBe(id)
  })

  test('ordinary urls are not asset urls', () => {
    expect(isAssetUrl('img/bg_default.png')).toBe(false)
    expect(isAssetUrl('https://example.com/x.png')).toBe(false)
    expect(assetIdFromUrl('img/bg_default.png')).toBe(null)
    expect(isAssetUrl(undefined)).toBe(false)
  })
})

describe('data urls', () => {
  test('bytes round-trip', () => {
    const src = png()
    const parsed = dataUrlToBytes(bytesToDataUrl(src, 'image/png'))
    expect(parsed.mime).toBe('image/png')
    expect(parsed.bytes).toEqual(src)
  })

  test('non-data urls parse to null', () => {
    expect(dataUrlToBytes('img/bg_default.png')).toBe(null)
    expect(dataUrlToBytes('data:image/png,notbase64')).toBe(null)
    expect(dataUrlToBytes(null)).toBe(null)
  })
})

describe('assetPlan', () => {
  test('slices into chunks of chunkSize, last one short', () => {
    const { chunks, manifest } = assetPlan({ bytes: bytes(2500), chunkSize: 1000 })
    expect(chunks.map(c => c.length)).toEqual([1000, 1000, 500])
    expect(manifest.chunkCount).toBe(3)
    expect(manifest.bytes).toBe(2500)
  })

  test('carries the descriptive fields through', () => {
    const { manifest } = assetPlan({
      bytes: png(), mime: 'image/jpeg', width: 800, height: 600,
      name: 'map.jpg', authorId: 'tt-u-v1-aa-bbb', ts: 1234,
    })
    expect(manifest).toMatchObject({
      mime: 'image/jpeg', width: 800, height: 600,
      name: 'map.jpg', authorId: 'tt-u-v1-aa-bbb', ts: 1234,
    })
  })

  test('refuses an empty asset', () => {
    expect(() => assetPlan({ bytes: new Uint8Array(0) })).toThrow(/empty/)
  })

  test('refuses anything over the byte limit', () => {
    expect(() => assetPlan({ bytes: bytes(MAX_ASSET_BYTES + 1) })).toThrow(/exceeds/)
    expect(() => assetPlan({ bytes: bytes(50), maxBytes: 10 })).toThrow(/exceeds/)
  })

  test('the default chunk size stays under the data channel ceiling', () => {
    expect(CHUNK_BYTES).toBeLessThanOrEqual(64 * 1024)
  })
})

describe('write and read', () => {
  test('an asset written is an asset read back', () => {
    const ydoc = new Y.Doc()
    const src  = png()
    const id   = writeAsset(ydoc, { bytes: src, mime: 'image/png', width: 64, height: 64 })

    expect(id).toBe(assetIdForBytes(src))
    expect(isComplete(ydoc, id)).toBe(true)
    expect(readAssetBytes(ydoc, id)).toEqual(src)
    expect(readAssetDataUrl(ydoc, id)).toBe(bytesToDataUrl(src, 'image/png'))
  })

  test('each chunk is its own transaction, so each is its own update', () => {
    const ydoc    = new Y.Doc()
    const updates = []
    ydoc.on('update', u => updates.push(u))

    writeAsset(ydoc, { bytes: bytes(2500), chunkSize: 1000 })

    // One for the manifest, one per chunk.
    expect(updates.length).toBe(4)
    expect(Math.max(...updates.map(u => u.length))).toBeLessThan(2000)
  })

  test('chunks are copied, not stored as views onto the whole file', () => {
    const ydoc = new Y.Doc()
    const id   = writeAsset(ydoc, { bytes: bytes(2500), chunkSize: 1000 })
    const kept = ydoc.getMap('asset_chunks').get(`${id}:0`)
    expect(kept.length).toBe(1000)
    expect(kept.buffer.byteLength).toBe(1000)
  })

  test('writing the same bytes twice writes nothing the second time', () => {
    const ydoc = new Y.Doc()
    const src  = png()
    writeAsset(ydoc, { bytes: src })

    const updates = []
    ydoc.on('update', u => updates.push(u))
    const id = writeAsset(ydoc, { bytes: src })

    expect(updates.length).toBe(0)
    expect(isComplete(ydoc, id)).toBe(true)
  })

  test('listAssets and totalAssetBytes see every manifest', () => {
    const ydoc = new Y.Doc()
    writeAsset(ydoc, { bytes: bytes(1000, 1), name: 'a.png' })
    writeAsset(ydoc, { bytes: bytes(2000, 2), name: 'b.png' })
    expect(listAssets(ydoc).map(m => m.name).sort()).toEqual(['a.png', 'b.png'])
    expect(totalAssetBytes(ydoc)).toBe(3000)
  })
})

describe('an asset still in flight', () => {
  test('status counts what has landed', () => {
    const ydoc = new Y.Doc()
    const { id, manifest, chunks } = assetPlan({ bytes: bytes(2500), chunkSize: 1000 })

    expect(assetStatus(ydoc, id)).toMatchObject({ known: false, complete: false, have: 0 })

    putManifest(ydoc, manifest)
    expect(assetStatus(ydoc, id)).toMatchObject({ known: true, complete: false, have: 0, total: 3 })

    putChunk(ydoc, id, 0, chunks[0])
    putChunk(ydoc, id, 2, chunks[2])
    expect(assetStatus(ydoc, id)).toMatchObject({ complete: false, have: 2, total: 3 })

    putChunk(ydoc, id, 1, chunks[1])
    expect(assetStatus(ydoc, id)).toMatchObject({ complete: true, have: 3 })
  })

  test('reads are null until the last chunk arrives, whatever the order', () => {
    const ydoc = new Y.Doc()
    const src  = bytes(2500)
    const { id, manifest, chunks } = assetPlan({ bytes: src, chunkSize: 1000 })

    expect(readAssetBytes(ydoc, id)).toBe(null)
    putManifest(ydoc, manifest)
    putChunk(ydoc, id, 2, chunks[2])
    putChunk(ydoc, id, 0, chunks[0])
    expect(readAssetBytes(ydoc, id)).toBe(null)
    expect(readAssetDataUrl(ydoc, id)).toBe(null)

    putChunk(ydoc, id, 1, chunks[1])
    expect(readAssetBytes(ydoc, id)).toEqual(src)
  })
})

describe('resolveUrl', () => {
  test('passes ordinary urls straight through', () => {
    const ydoc = new Y.Doc()
    expect(resolveUrl(ydoc, 'img/bg_default.png')).toBe('img/bg_default.png')
    expect(resolveUrl(ydoc, '')).toBe('')
  })

  test('resolves a complete asset and reports an incomplete one as null', () => {
    const ydoc = new Y.Doc()
    const src  = png()
    const id   = writeAsset(ydoc, { bytes: src })
    expect(resolveUrl(ydoc, assetUrl(id))).toBe(bytesToDataUrl(src, 'image/png'))
    expect(resolveUrl(ydoc, assetUrl('tt-a-v1-0000000000000000'))).toBe(null)
  })
})

describe('replication', () => {
  test('a second document that applies the updates can read the image', () => {
    const a = new Y.Doc()
    const b = new Y.Doc()
    a.on('update', u => Y.applyUpdate(b, u))

    const src = png()
    const id  = writeAsset(a, { bytes: src, name: 'token.png' })

    expect(isComplete(b, id)).toBe(true)
    expect(readAssetBytes(b, id)).toEqual(src)
    expect(getManifest(b, id).name).toBe('token.png')
  })

  test('two peers sharing the same file converge on one copy', () => {
    const a = new Y.Doc()
    const b = new Y.Doc()
    const src = png()

    writeAsset(a, { bytes: src, authorId: 'alice' })
    writeAsset(b, { bytes: src, authorId: 'bob' })

    Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
    Y.applyUpdate(a, Y.encodeStateAsUpdate(b))

    expect(listAssets(a).length).toBe(1)
    expect(listAssets(b).length).toBe(1)
    expect(readAssetBytes(a, assetIdForBytes(src))).toEqual(src)
  })

  test('observeAssets fires for a chunk arriving from elsewhere, and stops when dropped', () => {
    const a = new Y.Doc()
    const b = new Y.Doc()
    const seen = vi.fn()
    const stop = observeAssets(b, seen)

    Y.applyUpdate(b, Y.encodeStateAsUpdate(a, undefined))
    const id = writeAsset(a, { bytes: bytes(2500), chunkSize: 1000 })
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
    expect(seen).toHaveBeenCalled()
    expect(isComplete(b, id)).toBe(true)

    stop()
    const before = seen.mock.calls.length
    writeAsset(a, { bytes: bytes(400, 9) })
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
    expect(seen.mock.calls.length).toBe(before)
  })
})

describe('writeAssetPaced', () => {
  test('yields between chunks and reports progress', async () => {
    const ydoc   = new Y.Doc()
    const yields = vi.fn(() => Promise.resolve())
    const seen   = []

    const id = await writeAssetPaced(ydoc, { bytes: bytes(2500), chunkSize: 1000 },
      { onProgress: (n, total) => seen.push([n, total]), yieldFn: yields })

    expect(seen).toEqual([[1, 3], [2, 3], [3, 3]])
    expect(yields).toHaveBeenCalledTimes(2)   // not after the last chunk
    expect(isComplete(ydoc, id)).toBe(true)
  })

  test('an asset already present reports done without writing', async () => {
    const ydoc = new Y.Doc()
    const src  = png()
    writeAsset(ydoc, { bytes: src })

    const updates = []
    ydoc.on('update', u => updates.push(u))
    await writeAssetPaced(ydoc, { bytes: src })
    expect(updates.length).toBe(0)
  })
})

describe('deleting', () => {
  test('deleteAsset removes the manifest and every chunk', () => {
    const ydoc = new Y.Doc()
    const id   = writeAsset(ydoc, { bytes: bytes(2500), chunkSize: 1000 })

    deleteAsset(ydoc, id)

    expect(getManifest(ydoc, id)).toBe(null)
    expect(ydoc.getMap('asset_chunks').size).toBe(0)
    expect(readAssetBytes(ydoc, id)).toBe(null)
  })

  test('chunks orphaned by a missing manifest are swept too', () => {
    const ydoc = new Y.Doc()
    const { id, chunks } = assetPlan({ bytes: bytes(2500), chunkSize: 1000 })
    chunks.forEach((c, i) => putChunk(ydoc, id, i, c))

    deleteAsset(ydoc, id)
    expect(ydoc.getMap('asset_chunks').size).toBe(0)
  })

  test('collectUnreferenced keeps what the caller names and drops the rest', () => {
    const ydoc = new Y.Doc()
    const keep = writeAsset(ydoc, { bytes: bytes(1000, 1) })
    const drop = writeAsset(ydoc, { bytes: bytes(1000, 2) })

    expect(collectUnreferenced(ydoc, [keep])).toEqual([drop])
    expect(listAssets(ydoc).map(m => m.id)).toEqual([keep])
    expect(isComplete(ydoc, keep)).toBe(true)
  })
})

describe('resolveBackground', () => {
  const FALLBACK = { url: 'img/bg_default.png', width: 120, height: 120 }

  test('a url background keeps its own dimensions', () => {
    const ydoc = new Y.Doc()
    expect(resolveBackground(ydoc, { url: 'img/bg_greenfelt.png', width: 800, height: 600 }, FALLBACK))
      .toEqual({ url: 'img/bg_greenfelt.png', width: 800, height: 600, pending: false })
  })

  test('an unset background falls back', () => {
    const ydoc = new Y.Doc()
    expect(resolveBackground(ydoc, { url: '' }, FALLBACK))
      .toEqual({ ...FALLBACK, pending: false })
  })

  test('a complete asset resolves to its bytes at the stored size', () => {
    const ydoc = new Y.Doc()
    const src  = png()
    const id   = writeAsset(ydoc, { bytes: src })
    expect(resolveBackground(ydoc, { url: assetUrl(id), width: 64, height: 48 }, FALLBACK))
      .toEqual({ url: bytesToDataUrl(src, 'image/png'), width: 64, height: 48, pending: false })
  })

  test('an asset still arriving reports pending, at the fallback tile size', () => {
    const ydoc = new Y.Doc()
    const { id, manifest } = assetPlan({ bytes: bytes(2500), chunkSize: 1000 })
    putManifest(ydoc, manifest)
    // The missing image's dimensions would tile the stand-in wrongly.
    expect(resolveBackground(ydoc, { url: assetUrl(id), width: 900, height: 700 }, FALLBACK))
      .toEqual({ ...FALLBACK, pending: true })
  })
})
