/**
 * home-utils.js — pure utility functions for home.html
 *
 * Extracted as a module so they can be unit-tested independently of the page.
 * home.html imports these; tests import them directly.
 */

export const THUMB_W = 150;
export const THUMB_H = 100;
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Mirrors a Y.XmlElement tree into SVG DOM nodes.
 *
 * Cannot use Y.XmlElement.toString() because it lowercases element names,
 * breaking camelCase SVG filter primitives like feColorMatrix.
 * Cannot use Y.XmlElement.toDOM() because it uses the HTML namespace.
 *
 * @param {import('yjs')} Y       - The Yjs module (passed in to avoid a hard
 *                                  import, keeping this module testable without
 *                                  a bundler).
 * @param {Y.XmlElement|Y.XmlText} yNode
 * @returns {Element|Text|null}
 */
export function mirrorYNode(Y, yNode) {
  if (yNode instanceof Y.XmlText) return document.createTextNode(yNode.toString());
  if (!(yNode instanceof Y.XmlElement)) return null;
  if (yNode.nodeName === 'script') return null;
  const el = document.createElementNS(SVG_NS, yNode.nodeName);
  const attrs = yNode.getAttributes();
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  yNode.toArray().forEach(child => {
    const dom = mirrorYNode(Y, child);
    if (dom) el.appendChild(dom);
  });
  return el;
}

/**
 * Build a 150×100 SVG thumbnail for a room.
 *
 * @param {string}       roomId  - Used to generate a unique pattern id.
 * @param {string}       bgUrl   - URL of the background image.
 * @param {number}       bgW     - Native width of the background image.
 * @param {number}       bgH     - Native height of the background image.
 * @param {Element|null} toyGEl  - A mirrored SVG <g class="toy"> element, or null.
 * @returns {SVGElement}
 */
export function buildThumbSVG(roomId, bgUrl, bgW, bgH, toyGEl) {
  const uid   = roomId.replace(/[^a-z0-9]/gi, '');
  const patId = `tp-${uid}`;
  const scale = Math.max(THUMB_W / bgW, THUMB_H / bgH);
  const pw    = Math.round(bgW * scale);
  const ph    = Math.round(bgH * scale);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width',   THUMB_W);
  svg.setAttribute('height',  THUMB_H);
  svg.setAttribute('viewBox', `0 0 ${THUMB_W} ${THUMB_H}`);
  svg.setAttribute('class',   'table-thumb');

  const defs    = document.createElementNS(SVG_NS, 'defs');
  const pattern = document.createElementNS(SVG_NS, 'pattern');
  pattern.setAttribute('id',           patId);
  pattern.setAttribute('x',            '0');
  pattern.setAttribute('y',            '0');
  pattern.setAttribute('width',        pw);
  pattern.setAttribute('height',       ph);
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  const img = document.createElementNS(SVG_NS, 'image');
  img.setAttribute('href',   bgUrl);
  img.setAttribute('width',  pw);
  img.setAttribute('height', ph);
  pattern.appendChild(img);
  defs.appendChild(pattern);
  svg.appendChild(defs);

  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('width',  '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill',   `url(#${patId})`);
  svg.appendChild(bg);

  if (toyGEl) {
    toyGEl.removeAttribute('transform');
    const innerSvg = toyGEl.querySelector('svg');
    if (innerSvg) {
      const dw = parseFloat(innerSvg.getAttribute('width'))  || 64;
      const dh = parseFloat(innerSvg.getAttribute('height')) || 80;
      innerSvg.setAttribute('x', Math.round((THUMB_W - dw) / 2));
      innerSvg.setAttribute('y', Math.round((THUMB_H - dh) / 2));
    }
    svg.appendChild(toyGEl);
  }

  return svg;
}
