/**
 * background.js — the background layer: one image tiled across the whole
 * canvas, chosen per table and kept in the doc's meta map (bg_url,
 * bg_width, bg_height). Not an op layer: a change is a plain Yjs write and
 * the last writer wins.
 */

const SVGNS = 'http://www.w3.org/2000/svg';

export const DEFAULT_BACKGROUNDS = [
  { label: 'Default',   url: 'img/bg_default.png',  width: 120, height: 120 },
  { label: 'Slate Hex',   url: 'img/bg_slatehex.png',  width: 1384, height: 998 },
  { label: 'Beige Hex',   url: 'img/bg_beigehex.png',  width: 815,  height: 718 },
  { label: 'Green Felt',  url: 'img/bg_greenfelt.png', width: 800,  height: 600 },
  { label: 'Iron Grid',   url: 'img/bg_irongrid.png',  width: 438,  height: 285 },
];

// The table's background as the UI shows it: url is '' until one is set.
export function read(yMeta) {
  return {
    url:    yMeta.get('bg_url')    ?? '',
    width:  yMeta.get('bg_width')  ?? 120,
    height: yMeta.get('bg_height') ?? 120,
  };
}

// Writes whichever of url / width / height `attrs` carries, in one transaction.
export function write(ydoc, yMeta, attrs) {
  ydoc.transact(() => {
    if (attrs.url    !== undefined) yMeta.set('bg_url',    attrs.url);
    if (attrs.width  !== undefined) yMeta.set('bg_width',  Number(attrs.width));
    if (attrs.height !== undefined) yMeta.set('bg_height', Number(attrs.height));
  });
}

/**
 * Redraws #background-layer: a full-viewport rect filled with
 * <pattern id="bg-pattern">, rebuilt in the svg's <defs>. The new pattern
 * has no patternTransform; the caller re-syncs it to the view
 * (canvas.js's syncBackgroundTransform).
 */
export function render(svgEl, yMeta) {
  const layer = svgEl.querySelector('#background-layer');
  if (!layer) throw new Error("Background.render: '#background-layer' not found in SVG document — malformed template?");
  layer.innerHTML = '';
  const url    = yMeta.get('bg_url')    || 'img/bg_default.png';
  const width  = yMeta.get('bg_width')  || 120;
  const height = yMeta.get('bg_height') || 120;
  // Tiling pattern so the image repeats across infinite canvas
  const defs    = svgEl.querySelector('defs');
  // Remove stale bg pattern if present
  defs.querySelector('#bg-pattern')?.remove();
  const pattern = document.createElementNS(SVGNS, 'pattern');
  pattern.setAttribute('id',           'bg-pattern');
  pattern.setAttribute('x',            '0');
  pattern.setAttribute('y',            '0');
  pattern.setAttribute('width',        width);
  pattern.setAttribute('height',       height);
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  const img = document.createElementNS(SVGNS, 'image');
  img.setAttribute('href',   url);
  img.setAttribute('x',      '0');
  img.setAttribute('y',      '0');
  img.setAttribute('width',  width);
  img.setAttribute('height', height);
  pattern.appendChild(img);
  defs.appendChild(pattern);
  const rect = document.createElementNS(SVGNS, 'rect');
  rect.setAttribute('x',              '0');
  rect.setAttribute('y',              '0');
  rect.setAttribute('width',          '100%');
  rect.setAttribute('height',         '100%');
  rect.setAttribute('fill',           'url(#bg-pattern)');
  rect.setAttribute('pointer-events', 'none');
  layer.appendChild(rect);
}
