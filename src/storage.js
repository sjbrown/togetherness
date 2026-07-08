/**
 * storage.js — SVG document import/export: DOM ⇄ Yjs.
 *
 * Shared by app.js (importing into / exporting out of a live room's
 * document) and home.html (seeding a new room's Yjs doc from a static
 * sampler template). Every function here takes its Yjs structures and DOM
 * elements as explicit parameters rather than closing over App's private
 * state, so this module works headless (no live room, no UI) and is
 * unit-testable on its own.
 */
import * as Y        from 'yjs';
import * as Toys     from './toys.js';
import * as Drawing  from './drawing.js';

// ── DOM → Yjs ────────────────────────────────────────────────────────────────

/**
 * Convert a DOM node into a detached Y.XmlElement (or Y.XmlText) tree.
 * <script> nodes are preserved as inert document citizens — the Yjs/SVG
 * tree is the canonical document, but nothing ever mirrors a <script> back
 * into a live DOM, so nothing executes.
 */
export function domToY(node) {
  if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
    const t = node.textContent.trim();
    return t ? new Y.XmlText(t) : null;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const yEl = new Y.XmlElement(node.localName);
  for (const at of node.attributes) yEl.setAttribute(at.name, at.value);
  const children = [...node.childNodes].map(domToY).filter(Boolean);
  if (children.length) yEl.insert(0, children);
  return yEl;
}

/**
 * Toy contract: <g class="toy" data-toy-id data-toy-type data-yid
 * data-module="toys"> with ≥1 <svg> child. Anything else found directly
 * inside #toys-layer is invalid and reported back to the caller.
 */
export function isToyG(el) {
  return el.localName === 'g' &&
         el.classList.contains('toy') &&
         el.getAttribute('data-toy-id') &&
         el.getAttribute('data-toy-type') &&
         el.getAttribute('data-yid') &&
         el.getAttribute('data-module') === 'toys' &&
         el.querySelector(':scope > svg');
}

/**
 * Populate { yMeta, yToys, yDrawing } from a source <svg> root element —
 * background pattern, #toys-layer, #drawing-layer, and (as a fallback) any
 * other top-level elements not belonging to a known layer. Caller is
 * responsible for wrapping this in a ydoc.transact() if atomicity matters.
 *
 * opts.stripToyDecorative — drop each toy <g>'s `transform` attribute before
 * insertion. home.html's sampler templates carry a decorative rotation
 * (`transform="rotate(...)"`) for visual flair on the homepage that isn't
 * part of the canonical document a seeded room should start with.
 *
 * Returns { toyCount, drawCount, invalidToyEls }. invalidToyEls are DOM
 * elements found directly inside #toys-layer that don't satisfy isToyG();
 * the caller decides what to do with them (app.js surfaces them in an
 * errors layer and a toast, home.html's fixed templates never produce any).
 */
export function populateFromSvgDoc(svgRootEl, { yMeta, yToys, yDrawing }, opts = {}) {
  const bgPattern   = svgRootEl.querySelector('defs pattern');
  const toysLayerEl = svgRootEl.querySelector('#toys-layer');
  const drawLayerEl = svgRootEl.querySelector('#drawing-layer');

  let toyCount = 0, drawCount = 0;
  const invalidToyEls = [];

  // Background: extract bg image url/dimensions from the <pattern> in
  // <defs> and write to yMeta so the background is restored on import.
  const bgImg = bgPattern?.querySelector('image');
  const bgUrl = bgImg?.getAttribute('href') || bgImg?.getAttribute('xlink:href') || '';
  if (bgUrl) {
    yMeta.set('bg_url', bgUrl);
    const w = Number(bgPattern.getAttribute('width'))  || 0;
    const h = Number(bgPattern.getAttribute('height')) || 0;
    if (w) yMeta.set('bg_width',  w);
    if (h) yMeta.set('bg_height', h);
  }

  // Toys layer
  if (toysLayerEl) {
    for (const child of toysLayerEl.children) {
      if (isToyG(child)) {
        const yG = domToY(child);
        if (yG) {
          if (opts.stripToyDecorative) yG.removeAttribute('transform');
          yToys.insert(yToys.length, [yG]);
          toyCount++;
        }
      } else {
        invalidToyEls.push(child);
      }
    }
  }

  // Drawing layer
  if (drawLayerEl) {
    for (const child of drawLayerEl.children) {
      const yEl = domToY(child);
      if (yEl) { yDrawing.insert(yDrawing.length, [yEl]); drawCount++; }
    }
  }

  // Everything else → drawing layer
  for (const el of svgRootEl.children) {
    const id = el.getAttribute('id') ?? '';
    if (el.localName === 'defs') continue;
    if (id === 'toys-layer' || id === 'drawing-layer') continue;
    if (id === 'background-layer') continue;
    // TODO: boundaries-positions import into its own Yjs fragment when implemented
    if (id === 'boundaries-positions-layer') continue;
    // overlay-layer is UI-only and is stripped on export
    if (id === 'overlay-layer') continue;
    const yEl = domToY(el);
    if (yEl) { yDrawing.insert(yDrawing.length, [yEl]); drawCount++; }
  }

  return { toyCount, drawCount, invalidToyEls };
}

// ── Yjs → DOM (export) ────────────────────────────────────────────────────────

/**
 * Build an export-ready SVG DOM tree from the live canvas element plus the
 * canonical Yjs fragments. Clones the live element for the skeleton (defs,
 * background, boundaries — none of these can carry scripts) and strips
 * overlay/UI-only bits, but rebuilds #toys-layer and #drawing-layer
 * directly from the Yjs fragments: the live DOM is a mirror that never
 * renders <script> nodes (so nothing executes), so a DOM clone alone would
 * silently export toys with their scripts stripped. The Yjs tree is the
 * canonical document — export should be honest about that.
 */
export function buildExportSvg(liveSvgEl, { yToys, yDrawing }) {
  const clone = liveSvgEl.cloneNode(true);
  clone.removeAttribute('id');
  ['#overlay-layer', '#draw-preview'].forEach(sel => {
    clone.querySelector(sel)?.remove();
  });

  const toysLayerEl = clone.querySelector('#toys-layer');
  if (toysLayerEl) {
    toysLayerEl.innerHTML = '';
    Toys.listToys(yToys, { includeScripts: true }).forEach(el => toysLayerEl.appendChild(el));
  }
  const drawLayerEl = clone.querySelector('#drawing-layer');
  if (drawLayerEl) {
    drawLayerEl.innerHTML = '';
    Drawing.listDrawings(yDrawing, { includeScripts: true }).forEach(el => drawLayerEl.appendChild(el));
  }

  clone.querySelectorAll('[pointer-events]').forEach(el => el.removeAttribute('pointer-events'));
  return clone;
}
