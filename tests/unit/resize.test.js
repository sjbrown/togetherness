// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, beforeEach } from 'vitest'
import {
  addToySync, render, findToy, isTrayEl, computeResizeRect, applyResizeCommit,
  RESIZE_CORNER_TL, RESIZE_CORNER_TR, RESIZE_CORNER_BL, RESIZE_CORNER_BR,
  _clearSvgTextCache, clearYNodeMap,
} from '../../src/toys.js'
import { resizeCorners, hitTestResizeCorner, PAD } from '../../src/overlay.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const getToysLayer = (ydoc) => ({ yToys: ydoc.getXmlFragment('toys') })

// A tray fixture matching every real tray_*.svg asset's convention: root
// <svg class="... tray"> + a nested <svg id="resizable_bg"> with matching
// width/height/viewBox (see src/toy/tray_sum.svg and siblings).
const TRAY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" id="tray_fixture" class="tray_fixture tray">
  <svg id="resizable_bg" x="0" y="0" width="200" height="150" viewBox="0 0 200 150">
    <rect id="bg_rect" width="200" height="150" />
  </svg>
  <g id="contents_group" class="contents_group"></g>
</svg>`

const NON_TRAY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" id="board_fixture" class="board_fixture">
</svg>`

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

describe('isTrayEl', () => {
  test('true for a rendered toy whose own embedded <svg> carries the tray class', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'tray1', 'tray_fixture', TRAY_SVG, 100, 100)
    const layerEl = renderLayer(yToys)
    expect(isTrayEl(layerEl.querySelector('[data-id="tray1"]'))).toBe(true)
  })

  test('false for a toy without the tray class', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'board1', 'board_fixture', NON_TRAY_SVG, 100, 100)
    const layerEl = renderLayer(yToys)
    expect(isTrayEl(layerEl.querySelector('[data-id="board1"]'))).toBe(false)
  })

  test('false for null/missing element (never throws)', () => {
    expect(isTrayEl(null)).toBe(false)
  })
})

describe('computeResizeRect — corner-drag geometry', () => {
  const startRect = { x: 100, y: 100, width: 200, height: 150 } // right=300, bottom=250

  test('BR drag: top-left corner (100,100) stays fixed, size follows the pointer', () => {
    const rect = computeResizeRect(startRect, RESIZE_CORNER_BR, 340, 260)
    expect(rect).toEqual({ x: 100, y: 100, width: 240, height: 160 })
  })

  test('TL drag: bottom-right corner (300,250) stays fixed', () => {
    const rect = computeResizeRect(startRect, RESIZE_CORNER_TL, 80, 90)
    expect(rect).toEqual({ x: 80, y: 90, width: 220, height: 160 })
  })

  test('TR drag: bottom-left corner (100,250) stays fixed — x never moves, only width/y/height', () => {
    const rect = computeResizeRect(startRect, RESIZE_CORNER_TR, 360, 80)
    expect(rect).toEqual({ x: 100, y: 80, width: 260, height: 170 })
  })

  test('BL drag: top-right corner (300,100) stays fixed — y never moves, only x/width/height', () => {
    const rect = computeResizeRect(startRect, RESIZE_CORNER_BL, 60, 300)
    expect(rect).toEqual({ x: 60, y: 100, width: 240, height: 200 })
  })

  test('BR drag past the fixed corner clamps to the minimum size, never inverts', () => {
    const rect = computeResizeRect(startRect, RESIZE_CORNER_BR, 50, 50)
    expect(rect.x).toBe(100)
    expect(rect.y).toBe(100)
    expect(rect.width).toBeGreaterThanOrEqual(30) // MIN_TOY_SIZE
    expect(rect.height).toBeGreaterThanOrEqual(30)
  })

  test('TL drag past the fixed corner clamps to the minimum size, fixed corner (300,250) never moves', () => {
    const rect = computeResizeRect(startRect, RESIZE_CORNER_TL, 500, 500)
    expect(rect.x + rect.width).toBe(300)
    expect(rect.y + rect.height).toBe(250)
    expect(rect.width).toBeGreaterThanOrEqual(30)
    expect(rect.height).toBeGreaterThanOrEqual(30)
  })
})

describe('applyResizeCommit', () => {
  test('writes x/y/width/height/viewBox to the toy\u2019s own root <svg>', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'tray1', 'tray_fixture', TRAY_SVG, 100, 100)

    applyResizeCommit(ydoc, findToy(yToys, 'tray1'), 40, 50, 300, 220)

    const layerEl = renderLayer(yToys)
    const svg = layerEl.querySelector('[data-id="tray1"] svg')
    expect(svg.getAttribute('x')).toBe('40')
    expect(svg.getAttribute('y')).toBe('50')
    expect(svg.getAttribute('width')).toBe('300')
    expect(svg.getAttribute('height')).toBe('220')
    expect(svg.getAttribute('viewBox')).toBe('0 0 300 220')
  })

  test('mirrors the new size onto #resizable_bg, matching tray convention', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'tray1', 'tray_fixture', TRAY_SVG, 100, 100)

    applyResizeCommit(ydoc, findToy(yToys, 'tray1'), 40, 50, 300, 220)

    const layerEl = renderLayer(yToys)
    const bg = layerEl.querySelector('[data-id="tray1"] [id="tray1__resizable_bg"]')
    expect(bg.getAttribute('width')).toBe('300')
    expect(bg.getAttribute('height')).toBe('220')
    expect(bg.getAttribute('viewBox')).toBe('0 0 200 150')
  })

  test('clamps below the minimum toy size rather than writing a degenerate rect', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'tray1', 'tray_fixture', TRAY_SVG, 100, 100)

    applyResizeCommit(ydoc, findToy(yToys, 'tray1'), 0, 0, 5, 5)

    const layerEl = renderLayer(yToys)
    const svg = layerEl.querySelector('[data-id="tray1"] svg')
    expect(Number(svg.getAttribute('width'))).toBeGreaterThanOrEqual(30)
    expect(Number(svg.getAttribute('height'))).toBeGreaterThanOrEqual(30)
  })

  test('is a no-op (never throws) when the toy has no #resizable_bg', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    place(ydoc, yToys, 'board1', 'board_fixture', NON_TRAY_SVG, 100, 100)

    expect(() => applyResizeCommit(ydoc, findToy(yToys, 'board1'), 0, 0, 100, 100)).not.toThrow()
    const layerEl = renderLayer(yToys)
    expect(layerEl.querySelector('[data-id="board1"] svg').getAttribute('width')).toBe('100')
  })

  test('is a no-op (never throws) for a null yToy', () => {
    const ydoc = new Y.Doc()
    expect(() => applyResizeCommit(ydoc, null, 0, 0, 100, 100)).not.toThrow()
  })
})

describe('overlay.js — resizeCorners / hitTestResizeCorner', () => {
  const geo = { x: 100, y: 100, width: 200, height: 150 }

  test('resizeCorners returns [TL, TR, BL, BR] padded out by PAD', () => {
    const corners = resizeCorners(geo)
    expect(corners).toEqual([
      { x: 100 - PAD,       y: 100 - PAD },
      { x: 300 + PAD,       y: 100 - PAD },
      { x: 100 - PAD,       y: 250 + PAD },
      { x: 300 + PAD,       y: 250 + PAD },
    ])
  })

  test('hitTestResizeCorner finds the nearest corner within its hit radius', () => {
    const corners = resizeCorners(geo)
    expect(hitTestResizeCorner(geo, corners[RESIZE_CORNER_TL].x, corners[RESIZE_CORNER_TL].y, 1)).toBe(RESIZE_CORNER_TL)
    expect(hitTestResizeCorner(geo, corners[RESIZE_CORNER_BR].x, corners[RESIZE_CORNER_BR].y, 1)).toBe(RESIZE_CORNER_BR)
  })

  test('hitTestResizeCorner returns null for a point in the middle of the tray', () => {
    expect(hitTestResizeCorner(geo, 200, 175, 1)).toBeNull()
  })

  test('hitTestResizeCorner returns null for a null geo (element not found)', () => {
    expect(hitTestResizeCorner(null, 0, 0, 1)).toBeNull()
  })

  test('hit radius scales down (screen-space stays constant) as the view zooms in', () => {
    const corners = resizeCorners(geo)
    const nearCorner = { x: corners[RESIZE_CORNER_BR].x + 5, y: corners[RESIZE_CORNER_BR].y }
    // At scale=1 a 5px canvas-space offset is within the default hit radius...
    expect(hitTestResizeCorner(geo, nearCorner.x, nearCorner.y, 1)).toBe(RESIZE_CORNER_BR)
    // ...but at scale=4 the same 5 CANVAS-space px is 20 SCREEN px away — outside it.
    expect(hitTestResizeCorner(geo, nearCorner.x, nearCorner.y, 4)).toBeNull()
  })
})
