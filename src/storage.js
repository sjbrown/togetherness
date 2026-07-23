/**
 * storage.js — SVG document import/export: DOM ⇄ Yjs.
 *
 * This module works headless (no live room, no UI) and is
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
 * Toy contract: <g class="toy" data-toy-id data-toy-type> with ≥1 <svg>
 * child. Anything else found directly inside #toys-layer is invalid and
 * reported back to the caller.
 *
 * data-id, id=, data-module, and .$() are never read here and never
 * required — they're rendering/dispatch conveniences recomputed fresh by
 * the renderer at every depth, every time, not
 * part of the on-disk contract.
 */
export function isToyG(el) {
  return el.localName === 'g' &&
         el.classList.contains('toy') &&
         el.getAttribute('data-toy-id') &&
         el.getAttribute('data-toy-type') &&
         el.querySelector(':scope > svg');
}

/**
 * Populate a Yjs document (yMeta/yToys/yDrawing, all obtained directly off
 * ydoc) from a source <svg> root element — background pattern, #toys-layer,
 * #drawing-layer, and (as a fallback) any other top-level elements not
 * belonging to a known layer. Caller is responsible for wrapping this in a
 * ydoc.transact() if atomicity matters.
 *
 * opts.stripToyDecorative — drop each toy <g>'s `transform` attribute before
 * insertion. home.html's sampler templates carry a decorative rotation
 * (`transform="rotate(...)"`) for visual flair on the homepage that isn't
 * part of the canonical document a seeded room should start with.
 *
 * Returns { toyCount, drawCount, invalidToyEls }. invalidToyEls are DOM
 * elements found directly inside #toys-layer that don't satisfy isToyG();
 * the caller decides what to do with them
 */
export function populateFromSvgDoc(svgRootEl, ydoc, opts = {}) {
  const yMeta    = ydoc.getMap('meta');
  const yToys    = ydoc.getXmlFragment('toys');
  const yDrawing = ydoc.getXmlFragment('drawing');

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
 * canonical Yjs document (yToys/yDrawing, obtained directly off ydoc).
 * Clones the live element for the skeleton (defs, background, boundaries —
 * none of these can carry scripts) and strips overlay/UI-only bits, but
 * rebuilds #toys-layer and #drawing-layer directly from the Yjs fragments:
 * the live DOM is a mirror that never renders <script> nodes (so nothing
 * executes), so a DOM clone alone would silently export toys with their
 * scripts stripped.
 *
 * Also stamps the attributes an exported file needs to stand alone as a
 * real, re-importable, Inkscape-friendly SVG document: a viewBox (falling
 * back to the live element's rendered size if it doesn't already have
 * one), the xmlns/xmlns:xlink/xmlns:inkscape namespace declarations a
 * cloned fragment doesn't carry on its own, and `inkscape:groupmode="layer"`
 * on the toy/drawing layers so Inkscape treats them as real layers.
 */
export function buildExportSvg(liveSvgEl, ydoc) {
  const yToys    = ydoc.getXmlFragment('toys');
  const yDrawing = ydoc.getXmlFragment('drawing');

  const clone = liveSvgEl.cloneNode(true);
  clone.removeAttribute('id');
  ['#overlay-layer', '#draw-preview'].forEach(sel => {
    clone.querySelector(sel)?.remove();
  });

  const toysLayerEl = clone.querySelector('#toys-layer');
  if (toysLayerEl) {
    toysLayerEl.innerHTML = '';
    Toys.listToys(yToys, { includeScripts: true }).forEach(el => toysLayerEl.appendChild(el));
    toysLayerEl.setAttribute('inkscape:groupmode', 'layer');
  }
  const drawLayerEl = clone.querySelector('#drawing-layer');
  if (drawLayerEl) {
    drawLayerEl.innerHTML = '';
    Drawing.listDrawings(yDrawing, { includeScripts: true }).forEach(el => drawLayerEl.appendChild(el));
    drawLayerEl.setAttribute('inkscape:groupmode', 'layer');
  }

  clone.querySelectorAll('[pointer-events]').forEach(el => el.removeAttribute('pointer-events'));

  if (!clone.getAttribute('viewBox')) {
    const w = liveSvgEl.clientWidth  || 120;
    const h = liveSvgEl.clientHeight || 120;
    clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }
  clone.setAttribute('xmlns',          'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink',    'http://www.w3.org/1999/xlink');
  clone.setAttribute('xmlns:inkscape', 'http://www.inkscape.org/namespaces/inkscape');

  return clone;
}
