# Assets — images the document carries

How a PNG gets from one person's disk onto everyone else's table without
anything hosting it.

This document is the design record for the asset layer (`assets.js`,
`image_intake.js`).

---

## 1. The problem

A background was a URL. Which meant: to share your own map, first find a
server willing to keep it, and hope it is still there next session. For a
project whose whole claim is "no accounts, no servers storing your data",
that is a hole in the middle of the floor.

The document already reaches every peer. Images should travel the same
road.

---

## 2. The model

```
  File the user picked
        │
        ▼
  image_intake:  decode → fit → re-encode        ← browser only
        │
        ▼
  { bytes, mime, width, height, name }
        │
        ▼
  assets.assetPlan → id = hash(bytes), chunks[]   ← pure
        │
        ▼
  Y.Map 'assets'        id → manifest             ← replication
  Y.Map 'asset_chunks'  `${id}:${n}` → Uint8Array
        │
        ▼
  yMeta.bg_url = "tt-asset:<id>"                  ← the reference
        │
        ▼
  render: resolveBackground → data: URL
        │
        ▼
  <image href="data:image/png;base64,…">
```

Three properties fall out of storing it this way:

1. **Content-addressed.** The id is a hash of the bytes. The same file
   shared twice is stored once, and two peers sharing the same file
   concurrently write the same key rather than fighting over two.

2. **Immutable.** A manifest is written once and never edited. Correcting
   an image means a new asset, which by definition has a new id.

3. **Ordinary Yjs.** No side channel, no separate provider, no server.
   Offline sharing works: the bytes sit in IndexedDB and go out when a
   peer reappears.

---

## 3. Why chunks

y-webrtc hands each Yjs update to the data channel as **one message**
(`simple-peer`'s `_channel.send` — no chunking anywhere beneath it). A
browser data channel refuses a message larger than the remote's
`max-message-size`, which is 256 KiB between Chromes, and Chrome does not
fail politely: the send throws and can take the channel down with it.

So:

* **One chunk per transaction.** `putChunk` opens its own transaction, so
  every update carrying image data is one `CHUNK_BYTES` slice plus
  framing. `writeAssetPaced` yields to the event loop between them, which
  keeps the UI responsive and lets the provider drain its queue.

* **`MAX_ASSET_BYTES` is a transport budget, not a storage one.** A peer
  *joining* receives the whole document as a single sync message. That
  message is the real ceiling, and it is why the limit is 192 KiB rather
  than something generous. It has room for the rest of a document beneath
  the 256 KiB line, and the e2e spec exercises exactly this: a peer
  joining after an image was shared.

* **A peer that has part of an image shows none of it.** `readAssetBytes`
  returns null until every chunk is present, and the background renderer
  falls back to the default tile. A half-drawn image is worse than a
  placeholder that says what it is waiting for.

---

## 4. Why images get resized

192 KiB is small for a photograph and generous for a background tile.
Rather than refuse what somebody picked, `image_intake` re-encodes:
progressively smaller draws until one fits, and it says so afterwards
("resized to 1024×768") rather than quietly changing their image.

An image with an alpha channel is only ever re-encoded as PNG. JPEG would
fill its transparency with black, which for a token is not a smaller
version of the same image — it is a different one.

---

## 5. Where an asset is referenced

Today: `yMeta.bg_url`. That is the only field that can name one, which is
why `App.shareBackgroundImage` can delete the previous background's asset
outright — nothing else could be pointing at it.

`collectUnreferenced(ydoc, ids)` exists for when that stops being true.
It takes the reference set from its caller on purpose: assets.js does not
and should not know which document fields can name an asset.

---

## 6. Import and export

Export serializes the live DOM, where the background is already a data:
URL — an exported file therefore stands alone and opens in Inkscape with
its background intact, with nothing extra to do.

Coming back in, those inline bytes must not land in `yMeta` as one
enormous value. `hoistInlineBackground` writes them to the asset store and
rewrites the `<image>` to reference it, **before** the import's
transaction, since folding every chunk into one transaction would undo
the chunking. `populateFromSvgDoc` does the same thing for any caller that
skips the hoist, at the cost of one larger update.

---

## 7. Invariants

1. An asset id is a hash of that asset's bytes. Nothing else names an
   asset.
2. A manifest and its chunks are written once and never edited.
3. No single transaction writes more than one chunk.
4. An incomplete asset resolves to null, never to partial bytes.
5. An asset reference in the document is a `tt-asset:` URL. Raw `data:`
   URLs are for rendering and for exported files, never for storage.

---

## 8. Dragons

* **The 256 KiB ceiling is the feature's real boundary.** A table wanting
  a full-resolution battle map cannot have one this way. Getting past it
  means an out-of-band transfer — the document holding manifests only,
  peers requesting bytes from whoever has them over a channel of our own
  — which is a real protocol with real failure modes (who has it, who
  asks, what happens when the only holder leaves) and is not designed.

* **Garbage collection is one reference deep.** Only the background can
  name an asset, so replacing it can delete the old bytes. The moment a
  second thing can reference an asset, `collectUnreferenced` needs a
  caller that actually walks the document, and deleting on replace has to
  stop being unconditional.

* **Deleting an asset is a shared-document edit.** One peer replacing the
  background removes those bytes for everyone, including a peer
  mid-transfer. Harmless today, because the same edit also repoints
  `bg_url`; it will not stay harmless once assets outlive one reference.

* **Nothing bounds the number of assets.** One background at a time keeps
  the total small by construction, not by rule. A per-document budget,
  and a UI that shows it, is the obvious next thing once more than one
  reference exists.

* **The id is a 64-bit non-cryptographic hash.** Fine as a dedupe key.
  It is not a defence against a peer who *wants* two different images to
  collide, and if assets ever carry anything but pictures, that matters.
