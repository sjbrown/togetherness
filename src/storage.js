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
 * elements found directly inside #toys-layer that Toys.parseForeignToy
 * doesn't recognise as a toy; the caller decides what to do with them.
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

  // Document-root scripts — our own export format (buildExportSvg): one
  // <script> per hoisted namespace, sitting at document root, not inside
  // any toy. Restore into the doc's own `scripts` fragment. Handled before
  // the toys/drawing loops below so the later "everything else" fallback
  // never sees these and doesn't mistake them for an unrecognized drawing
  // shape.
  for (const el of svgRootEl.querySelectorAll(':scope > script')) {
    const namespace = el.getAttribute('data-namespace');
    if (!namespace) continue;
    Toys.hoistInlineScripts(ydoc, el.getAttribute('data-toy-type'),
      [{ namespace, src: null, code: el.textContent }]);
  }

  // Toys layer
  if (toysLayerEl) {
    for (const child of toysLayerEl.children) {
      const { parsedNode } = Toys.parseForeignToy(ydoc, child);
      if (!parsedNode) {
        invalidToyEls.push(child);
        continue;
      }

      if (opts.stripToyDecorative) parsedNode.removeAttribute('transform');

      const yG = domToY(parsedNode);
      if (yG) { yToys.insert(yToys.length, [yG]); toyCount++; }
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
    if (el.localName === 'script') continue; // handled above
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
 * canonical Yjs document (yToys/yDrawing/yScripts, obtained directly off
 * ydoc). Clones the live element for the skeleton (defs, background,
 * boundaries) and strips overlay/UI-only bits, but rebuilds #toys-layer and
 * #drawing-layer directly from the Yjs fragments, and appends one
 * consolidated <script> per hoisted namespace at document root — see
 * toys.js, "Script hoisting": a toy's own Yjs subtree never carries a
 * <script> at all anymore (hoisted to the document's own `scripts`
 * fragment at placement time), so there's nothing to lose by cloning the
 * live DOM for everything else; scripts just need their own explicit pass
 * since they don't live in any per-toy subtree to clone from.
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
  const yScripts = ydoc.getXmlFragment('scripts');

  const clone = liveSvgEl.cloneNode(true);
  clone.removeAttribute('id');
  ['#overlay-layer', '#draw-preview'].forEach(sel => {
    clone.querySelector(sel)?.remove();
  });

  const toysLayerEl = clone.querySelector('#toys-layer');
  if (toysLayerEl) {
    toysLayerEl.innerHTML = '';
    Toys.listToys(yToys).forEach(el => toysLayerEl.appendChild(el));
    toysLayerEl.setAttribute('inkscape:groupmode', 'layer');
  }
  const drawLayerEl = clone.querySelector('#drawing-layer');
  if (drawLayerEl) {
    drawLayerEl.innerHTML = '';
    Drawing.listDrawings(yDrawing).forEach(el => drawLayerEl.appendChild(el));
    drawLayerEl.setAttribute('inkscape:groupmode', 'layer');
  }

  // One consolidated <script> per namespace at document root — never one
  // copy re-embedded inside every toy instance. Only the doc's own hoisted
  // (inline, foreign-toyType) scripts are written; src-referenced ones
  // (dice_utils.js etc.) are deliberately never baked in — reopening an
  // export assumes the same source tree that would be needed to run the
  // app around it in the first place, so there's nothing to preserve them
  // against. See toys.js, "Script hoisting".
  yScripts.toArray().forEach(yScript => {
    const scriptEl = document.createElementNS('http://www.w3.org/2000/svg', 'script');
    scriptEl.setAttribute('type', 'text/javascript');
    const namespace = yScript.getAttribute('data-namespace');
    const toyType   = yScript.getAttribute('data-toy-type');
    if (namespace) scriptEl.setAttribute('data-namespace', namespace);
    if (toyType)   scriptEl.setAttribute('data-toy-type', toyType);
    scriptEl.textContent = yScript.toArray()
      .filter(c => typeof c.toString === 'function')
      .map(c => c.toString())
      .join('');
    clone.appendChild(scriptEl);
  });

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
