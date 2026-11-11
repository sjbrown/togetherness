/**
 * tests/helpers/toys.js
 *
 * addToy: place a toy straight onto a layer's DOM, outside any gesture, so
 * nothing is committed to the op log. For seeding a scratch layer (or a
 * table before its checkpoint) in tests; a live table places toys with
 * layer_toys.js's placeToy. Fetches the toy's SVG template on first use and
 * caches it. attrs: { id, toyType, x, y, color } (x, y is the centre point).
 */

import { fetchToySvgText, addToyEl } from '../../src/layer_toys.js'

export async function addToy(ydoc, layerEl, attrs) {
  return addToyEl(ydoc, layerEl, attrs, await fetchToySvgText(attrs.toyType))
}
