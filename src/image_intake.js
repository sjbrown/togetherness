/**
 * image_intake.js — turn a file a person picked into bytes a document can
 * carry.
 *
 * assets.js will refuse anything over MAX_ASSET_BYTES, because every peer
 * joining a table receives the whole document as one WebRTC message. A
 * person choosing a background does not know that and should not have to:
 * this module decodes what they picked, and if it is too big for the wire
 * it re-encodes a smaller version rather than handing them an error.
 *
 * Resizing is reported back to the caller (`resized`, `from`) so the UI
 * can say so out loud. Silently changing someone's image is worse than
 * refusing it; saying "shared at 1024×768" is better than both.
 *
 * Needs a browser (createImageBitmap, canvas). The arithmetic is separate
 * and pure so it can be tested without one.
 */

import { MAX_ASSET_BYTES } from './assets.js';

// Long edge, before the byte budget has any say. A background tile or a
// map photo past this is detail nobody sees on a table.
export const MAX_DIMENSION = 2048;

// Tried in order until one lands under the byte budget. Each step is
// ~0.75 of the last, so the last is about a fifth of the first.
export const SCALE_STEPS = [1, 0.75, 0.56, 0.42, 0.32, 0.24, 0.18];

export const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

/**
 * Scale dimensions down to fit a square of `maxDim`, preserving aspect
 * ratio. Images already inside it are returned untouched — we never scale
 * anything up.
 */
export function fitWithin({ width, height }, maxDim = MAX_DIMENSION) {
  const longest = Math.max(width, height);
  if (!longest || longest <= maxDim) return { width, height };
  const scale = maxDim / longest;
  return {
    width:  Math.max(1, Math.round(width  * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function scaleDims({ width, height }, factor) {
  return {
    width:  Math.max(1, Math.round(width  * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
}

/**
 * The encodings to try, in order, for an image we have to shrink.
 * Transparency decides it: a PNG with an alpha channel re-encoded as JPEG
 * comes back with a black background, so an image that has one only ever
 * gets PNG, however much better JPEG would compress it.
 */
export function encodingCandidates(hasAlpha) {
  return hasAlpha
    ? [{ mime: 'image/png' }]
    : [{ mime: 'image/jpeg', quality: 0.85 }, { mime: 'image/jpeg', quality: 0.7 }];
}

/** A short, human-meaningful name for the manifest. */
export function assetName(fileName) {
  const base = String(fileName || '').split(/[\\/]/).pop() || 'image';
  return base.length > 60 ? `${base.slice(0, 57)}…` : base;
}

// ── browser side ─────────────────────────────────────────────────────────────

function makeCanvas(width, height) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
  const canvas  = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  return canvas;
}

function canvasToBlob(canvas, mime, quality) {
  if (typeof canvas.convertToBlob === 'function') return canvas.convertToBlob({ type: mime, quality });
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('canvas.toBlob produced nothing'))),
      mime, quality);
  });
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file);
  // Safari without createImageBitmap for blobs, and jsdom.
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = () => reject(new Error('could not decode image'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawAt(source, { width, height }) {
  const canvas = makeCanvas(width, height);
  const ctx    = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, width, height);
  return { canvas, ctx };
}

/** True if any pixel is less than fully opaque. */
function hasTransparency(ctx, { width, height }) {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
  return false;
}

const blobBytes = async blob => new Uint8Array(await blob.arrayBuffer());

/**
 * Decode `file` and return what should go into the document:
 *
 *   { bytes, mime, width, height, name, resized, from }
 *
 * `from` is the original { bytes, width, height }, present only when the
 * image was resized. Throws if the file will not decode, or if no
 * encoding at any step fits within `maxBytes`.
 */
export async function prepareImageFile(file, { maxBytes = MAX_ASSET_BYTES,
                                               maxDimension = MAX_DIMENSION } = {}) {
  const source   = await decode(file);
  const natural  = { width: source.width, height: source.height };
  const original = new Uint8Array(await file.arrayBuffer());
  const name     = assetName(file.name);

  const fits = original.length <= maxBytes
    && Math.max(natural.width, natural.height) <= maxDimension;
  if (fits) {
    return {
      bytes:  original,
      mime:   file.type || 'image/png',
      width:  natural.width,
      height: natural.height,
      name,
      resized: false,
    };
  }

  const fitted      = fitWithin(natural, maxDimension);
  const probe       = drawAt(source, fitted);
  const candidates  = encodingCandidates(hasTransparency(probe.ctx, fitted));

  for (const step of SCALE_STEPS) {
    const dims   = step === 1 ? fitted : scaleDims(fitted, step);
    const { canvas } = step === 1 ? probe : drawAt(source, dims);
    for (const { mime, quality } of candidates) {
      const bytes = await blobBytes(await canvasToBlob(canvas, mime, quality));
      if (bytes.length <= maxBytes) {
        return {
          bytes, mime, name,
          width:   dims.width,
          height:  dims.height,
          resized: true,
          from:    { bytes: original.length, ...natural },
        };
      }
    }
  }

  throw new Error(`Could not get ${name} under ${Math.round(maxBytes / 1024)} KB`);
}
