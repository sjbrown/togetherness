// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, beforeEach } from 'vitest'
import {
  addToySync, render, findDropTargetTray, _clearSvgTextCache, clearYNodeMap,
} from '../../src/toys.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const getToysLayer = (ydoc) => ({ yToys: ydoc.getXmlFragment('toys') })

// A 200x150 tray at (0,0)-(200,150) in table space, class 'tray' on its own
// embedded <svg> — the same convention tray.js's get_numeric_value uses.
const TRAY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" id="tray_fixture" class="tray_fixture tray">
  <g id="contents_group" class="contents_group"></g>
</svg>`

// A non-tray toy of the same footprint, to prove class 'tray' really is
// what gates candidacy, not just "any other toy is a valid target".
const NON_TRAY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" id="board_fixture" class="board_fixture">
</svg>`

const DIE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="die_fixture" class="die_fixture">
</svg>`

// addToySync centers the toy's DISPLAY x DISPLAY box on (x, y) — but these
// fixtures set their own explicit width/height in the SVG source, and
// addToySync overwrites width/height to DISPLAY on import (see svgTextToYXml
// import + the x/y/width/height overwrite in addToySync). So place with
// (x, y) = the desired *center* and read back the actual placed geometry
// via render() rather than assuming the fixture's own width/height survives.
function place(ydoc, yToys, id, toyType, svgText, cx, cy) {
  addToySync(ydoc, yToys, { id, toyType, x: cx, y: cy, color: '#fff' }, svgText)
}

function renderLayer(yToys) {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  render(yToys, layerEl)
  return layerEl
}

beforeEach(() => {
  _clearSvgTextCache()
  clearYNodeMap()
})

describe('findDropTargetTray — drop inside/outside boundaries', () => {
  test('a drop centre inside a tray\u2019s bounds returns that tray\u2019s id', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'tray1', 'tray_fixture', TRAY_SVG, 300, 300)
    place(ydoc, yToys, 'die1',  'die_fixture',  DIE_SVG,  100, 100) // elsewhere, uninvolved
    const layerEl = renderLayer(yToys)

    // drop die1 right at the tray's own centre
    const found = findDropTargetTray(layerEl, 'die1', 300, 300)
    expect(found).toBe('tray1')
  })

  test('a drop centre far outside every tray\u2019s bounds returns null', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'tray1', 'tray_fixture', TRAY_SVG, 300, 300)
    place(ydoc, yToys, 'die1',  'die_fixture',  DIE_SVG,  100, 100)
    const layerEl = renderLayer(yToys)

    const found = findDropTargetTray(layerEl, 'die1', 5000, 5000)
    expect(found).toBeNull()
  })

  test('a drop that only partially overlaps a tray\u2019s edge still counts (overlap, not full containment)', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'tray1', 'tray_fixture', TRAY_SVG, 300, 300)
    place(ydoc, yToys, 'die1',  'die_fixture',  DIE_SVG,  100, 100)
    const layerEl = renderLayer(yToys)

    // die1's own footprint is 80x100 (DISPLAY-driven, symmetric) — drop its
    // centre just inside the tray's left edge, so most of the die's own
    // bbox actually sits outside the tray. Should still count as an overlap.
    const trayGeom = readTrayGeom(layerEl, 'tray1')
    const justInsideLeftEdge = { x: trayGeom.x + 2, y: trayGeom.y + trayGeom.height / 2 }
    const found = findDropTargetTray(layerEl, 'die1', justInsideLeftEdge.x, justInsideLeftEdge.y)
    expect(found).toBe('tray1')
  })

  test('a toy dropped on itself never matches (excludes the dragged id)', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'tray1', 'tray_fixture', TRAY_SVG, 300, 300)
    const layerEl = renderLayer(yToys)

    // "drag" tray1 and drop it centred on its own current position
    const found = findDropTargetTray(layerEl, 'tray1', 300, 300)
    expect(found).toBeNull()
  })

  test('a non-tray toy (no class "tray" on its own embedded <svg>) is never a valid target', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'board1', 'board_fixture', NON_TRAY_SVG, 300, 300)
    place(ydoc, yToys, 'die1',   'die_fixture',   DIE_SVG,      100, 100)
    const layerEl = renderLayer(yToys)

    const found = findDropTargetTray(layerEl, 'die1', 300, 300)
    expect(found).toBeNull()
  })

  test('when the drop overlaps more than one tray, returns one of them (first match) rather than throwing', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'tray1', 'tray_fixture', TRAY_SVG, 300, 300)
    place(ydoc, yToys, 'tray2', 'tray_fixture', TRAY_SVG, 320, 300) // overlapping tray1
    place(ydoc, yToys, 'die1',  'die_fixture',  DIE_SVG,  100, 100)
    const layerEl = renderLayer(yToys)

    const found = findDropTargetTray(layerEl, 'die1', 310, 300)
    expect(['tray1', 'tray2']).toContain(found)
  })

  test('returns null (rather than throwing) when the dragged id isn\u2019t currently rendered', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'tray1', 'tray_fixture', TRAY_SVG, 300, 300)
    const layerEl = renderLayer(yToys)

    expect(() => findDropTargetTray(layerEl, 'ghost-id', 300, 300)).not.toThrow()
    expect(findDropTargetTray(layerEl, 'ghost-id', 300, 300)).toBeNull()
  })

  test('returns null (rather than throwing) when layerEl is null', () => {
    expect(findDropTargetTray(null, 'die1', 300, 300)).toBeNull()
  })
})

// Small helper for the partial-overlap test: read a placed tray's actual
// rendered geometry rather than assuming the fixture's raw width/height,
// since addToySync overwrites width/height to DISPLAY on import.
function readTrayGeom(layerEl, id) {
  const el = layerEl.querySelector(`[data-yid="${id}"] svg`)
  return {
    x: parseFloat(el.getAttribute('x')),
    y: parseFloat(el.getAttribute('y')),
    width: parseFloat(el.getAttribute('width')),
    height: parseFloat(el.getAttribute('height')),
  }
}
