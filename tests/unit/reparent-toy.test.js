// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, beforeEach } from 'vitest'
import {
  addToySync, findToy, deleteToy, reparentToy, listToys, render, _clearSvgTextCache, clearYNodeMap,
} from '../../src/toys.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const getToysLayer = (ydoc) => ({ yToys: ydoc.getXmlFragment('toys') })

// Minimal tray-shaped fixture: has its own .contents_group, so it's a valid
// reparentToy target. toyType is arbitrary — reparentToy only cares about
// tree shape (a .contents_group inside the toy's embedded <svg>), not the
// TOY_TYPES registry.
const TRAY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" id="tray_fixture" class="tray_fixture tray">
  <g id="contents_group" class="contents_group"></g>
  <text id="result"><tspan id="tspan_result" class="tspan_result">0</tspan></text>
</svg>`

// Minimal non-tray fixture (no .contents_group) — a valid toy to move, and
// an invalid reparentToy *target* (used to test the "not a tray" error).
const DIE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="die_fixture" class="die_fixture">
  <text id="text_value"><tspan id="tspan_value">6</tspan></text>
</svg>`

function placeTray(ydoc, yToys, id) {
  addToySync(ydoc, yToys, { id, toyType: 'tray_fixture', x: 0, y: 0, color: '#fff' }, TRAY_SVG)
}
function placeDie(ydoc, yToys, id) {
  addToySync(ydoc, yToys, { id, toyType: 'die_fixture', x: 0, y: 0, color: '#fff' }, DIE_SVG)
}

// True if a toy with this id is a direct child of container (a
// Y.XmlFragment/Y.XmlElement), without descending into nested trays.
function isDirectChild(container, id) {
  return container.toArray().some(
    c => c instanceof Y.XmlElement && c.getAttribute('data-toy-id') === id
  )
}

function contentsGroupOf(yToys, trayId) {
  const tray = findToy(yToys, trayId)
  const svg = tray.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
  return svg.toArray().find(
    c => c instanceof Y.XmlElement && (c.getAttribute('class') || '').split(/\s+/).includes('contents_group')
  )
}

beforeEach(() => {
  _clearSvgTextCache()
  clearYNodeMap()
})

describe('reparentToy — top level into a tray', () => {
  test('moves a top-level toy into a tray\u2019s .contents_group', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')
    expect(isDirectChild(yToys, 'die1')).toBe(true)

    reparentToy(ydoc, yToys, 'die1', 'tray1')

    expect(isDirectChild(yToys, 'die1')).toBe(false) // no longer at top level
    expect(isDirectChild(contentsGroupOf(yToys, 'tray1'), 'die1')).toBe(true)
    expect(findToy(yToys, 'die1')).not.toBeNull() // deep lookup still finds it
    expect(isDirectChild(yToys, 'tray1')).toBe(true) // the tray itself untouched
  })

  test('preserves the moved toy\u2019s live state — not reset to a fresh template', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')

    // mutate the die's face value before moving it, the way rolling would
    const die = findToy(yToys, 'die1')
    const tspan = die.toArray()
      .find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
      .toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'text')
      .toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'tspan')
    tspan.insert(0, [new Y.XmlText('4')])

    reparentToy(ydoc, yToys, 'die1', 'tray1')

    const moved = findToy(yToys, 'die1')
    const movedText = moved.toArray()
      .find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
      .toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'text')
      .toString()
    expect(movedText).toContain('4')
  })

  test('the moved toy has fresh CRDT identity (a clone, not the original item)', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')
    const original = findToy(yToys, 'die1')

    const moved = reparentToy(ydoc, yToys, 'die1', 'tray1')

    expect(moved).not.toBe(original)
    expect(moved.getAttribute('data-toy-id')).toBe('die1')
  })

  test('the destination survives a full Yjs sync to another peer', () => {
    const ydocA = new Y.Doc()
    const { yToys: yToysA } = getToysLayer(ydocA)
    placeTray(ydocA, yToysA, 'tray1')
    placeDie(ydocA, yToysA, 'die1')
    reparentToy(ydocA, yToysA, 'die1', 'tray1')

    const ydocB = new Y.Doc()
    const { yToys: yToysB } = getToysLayer(ydocB)
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydocA))

    expect(isDirectChild(yToysB, 'die1')).toBe(false)
    expect(isDirectChild(contentsGroupOf(yToysB, 'tray1'), 'die1')).toBe(true)
  })
})

describe('reparentToy — back to the top level', () => {
  test('moves a nested toy back out to the top level when targetTrayId is null', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')
    reparentToy(ydoc, yToys, 'die1', 'tray1')
    expect(isDirectChild(yToys, 'die1')).toBe(false)

    reparentToy(ydoc, yToys, 'die1', null)

    expect(isDirectChild(yToys, 'die1')).toBe(true)
    expect(isDirectChild(contentsGroupOf(yToys, 'tray1'), 'die1')).toBe(false)
  })

  test('targetTrayId undefined behaves the same as null', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')
    reparentToy(ydoc, yToys, 'die1', 'tray1')

    reparentToy(ydoc, yToys, 'die1', undefined)

    expect(isDirectChild(yToys, 'die1')).toBe(true)
  })
})

describe('reparentToy — nested trays', () => {
  test('moving a toy into a tray that is itself nested inside another tray', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'outer')
    placeTray(ydoc, yToys, 'inner')
    placeDie(ydoc, yToys, 'die1')

    reparentToy(ydoc, yToys, 'inner', 'outer') // tray-in-tray
    reparentToy(ydoc, yToys, 'die1', 'inner')  // die into the nested tray

    const outerContents = contentsGroupOf(yToys, 'outer')
    expect(isDirectChild(outerContents, 'inner')).toBe(true)
    expect(isDirectChild(outerContents, 'die1')).toBe(false) // die is deeper, not here directly

    const innerLocation = findToy(yToys, 'inner')
    const innerContents = innerLocation.toArray()
      .find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
      .toArray().find(c => c instanceof Y.XmlElement && (c.getAttribute('class') || '').includes('contents_group'))
    expect(isDirectChild(innerContents, 'die1')).toBe(true)

    expect(findToy(yToys, 'die1')).not.toBeNull() // deep lookup finds it 2 levels down
  })

  test('moving an entire tray (with contents) moves everything inside it too', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'outer')
    placeTray(ydoc, yToys, 'inner')
    placeDie(ydoc, yToys, 'die1')
    reparentToy(ydoc, yToys, 'die1', 'inner') // die inside inner, both still top-level so far

    reparentToy(ydoc, yToys, 'inner', 'outer') // move inner (carrying die1) into outer

    const outerContents = contentsGroupOf(yToys, 'outer')
    expect(isDirectChild(outerContents, 'inner')).toBe(true)
    // die1 moved along with inner, as part of the same cloned subtree
    expect(findToy(yToys, 'die1')).not.toBeNull()
    expect(isDirectChild(yToys, 'die1')).toBe(false)
  })
})

describe('reparentToy — validation and loud failures', () => {
  test('throws when the toy id does not exist anywhere', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    expect(() => reparentToy(ydoc, yToys, 'nope', 'tray1')).toThrow(/not found/)
  })

  test('throws when the target tray id does not exist', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeDie(ydoc, yToys, 'die1')
    expect(() => reparentToy(ydoc, yToys, 'die1', 'nope')).toThrow(/target tray not found/)
  })

  test('throws when the target has no .contents_group (isn\u2019t tray-shaped)', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeDie(ydoc, yToys, 'die1')
    placeDie(ydoc, yToys, 'die2')
    expect(() => reparentToy(ydoc, yToys, 'die1', 'die2')).toThrow(/no \.contents_group/)
  })

  test('throws when moving a toy into itself', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    expect(() => reparentToy(ydoc, yToys, 'tray1', 'tray1')).toThrow(/itself/)
  })

  test('throws when moving a tray into its own (nested) descendant', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'outer')
    placeTray(ydoc, yToys, 'inner')
    reparentToy(ydoc, yToys, 'inner', 'outer') // inner now lives inside outer

    expect(() => reparentToy(ydoc, yToys, 'outer', 'inner')).toThrow(/itself|descendant|contained/)
  })

  test('a failed reparentToy call does not mutate the tree', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')

    expect(() => reparentToy(ydoc, yToys, 'die1', 'nope')).toThrow()

    expect(isDirectChild(yToys, 'die1')).toBe(true) // still exactly where it was
    expect(isDirectChild(yToys, 'tray1')).toBe(true)
  })
})

describe('deleteToy / findToy — now search nested toys too', () => {
  test('findToy locates a toy nested inside a tray', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')
    reparentToy(ydoc, yToys, 'die1', 'tray1')

    const found = findToy(yToys, 'die1')
    expect(found).not.toBeNull()
    expect(found.getAttribute('data-toy-id')).toBe('die1')
  })

  test('deleteToy removes a toy nested inside a tray', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')
    reparentToy(ydoc, yToys, 'die1', 'tray1')

    const deleted = deleteToy(ydoc, yToys, 'die1')

    expect(deleted).toBe(true)
    expect(findToy(yToys, 'die1')).toBeNull()
    expect(isDirectChild(contentsGroupOf(yToys, 'tray1'), 'die1')).toBe(false)
    expect(isDirectChild(yToys, 'tray1')).toBe(true) // the tray itself untouched
  })

  test('listToys still only lists top-level toys (nested toys render via mirror() recursion, not a second top-level entry)', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')
    reparentToy(ydoc, yToys, 'die1', 'tray1')

    const ids = listToys(yToys).map(el => el.getAttribute('data-yid'))
    expect(ids).toEqual(['tray1'])
  })

  test('render() mirrors the nested toy into the DOM inside the tray\u2019s .contents_group', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    placeTray(ydoc, yToys, 'tray1')
    placeDie(ydoc, yToys, 'die1')
    reparentToy(ydoc, yToys, 'die1', 'tray1')

    const layerEl = document.createElementNS(SVG_NS, 'g')
    render(yToys, layerEl)

    // Only the tray is a top-level layer child...
    expect(layerEl.children.length).toBe(1)
    expect(layerEl.querySelector('[data-yid="tray1"]')).not.toBeNull()
    // ...but the die is still findable in the DOM, nested inside it, via
    // mirror()'s ordinary recursive walk (no special-casing needed there).
    const dieInDom = layerEl.querySelector('.contents_group [data-toy-id="die1"]')
    expect(dieInDom).not.toBeNull()
  })
})
