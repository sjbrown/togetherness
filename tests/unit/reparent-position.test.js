/**
 * tests/unit/reparent-position.test.js
 *
 * Two things a die dropped into a tray needs, together, to actually be
 * visible: (1) the tray itself renders at something close to its real
 * size (not squashed to a fixed 64x64 — see the native-sizing fix in
 * addToySync), and (2) the moved toy's position gets converted into the
 * tray's own local coordinate space on drop, not left at its old
 * table-space x/y (which — once nested inside the tray's own <svg
 * viewBox> — would very likely fall outside the visible area entirely).
 *
 * The actual reposition-on-drop wiring lives in app.js's commitMove
 * (untestable directly — see the project's existing convention of not
 * unit-testing app.js). dropIntoTray() below is a literal, minimal
 * reimplementation of exactly what commitMove does for the reparent
 * branch: findDropTargetTray → reparentToy → getGeom the tray →
 * applyMoveCommit the moved toy at (dropX - trayGeom.x, dropY - trayGeom.y).
 * Same approach as wireCascade() in contents-change-cascade.test.js.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import {
  addToy, addToySync, render, findDropTargetTray, reparentToy, getGeom, applyMoveCommit,
  _clearSvgTextCache, clearYNodeMap, _resetToyScriptState,
} from '../../src/toys.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const TRAY_SUM_SVG  = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS        = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG         = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS  = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

const getToysLayer = (ydoc) => ({ yToys: ydoc.getXmlFragment('toys') })

function renderLayer(yToys) {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  render(yToys, layerEl)
  return layerEl
}

// Literal reimplementation of app.js commitMove's reparent branch — see
// module doc above.
function dropIntoTray(ydoc, yToys, layerEl, draggedId, dropX, dropY) {
  const dropTrayId = findDropTargetTray(layerEl, draggedId, dropX, dropY)
  if (!dropTrayId) return null
  const movedEl = reparentToy(ydoc, yToys, draggedId, dropTrayId)
  const trayEl  = layerEl.querySelector(`[data-id="${dropTrayId}"]`)
  const trayGeom = trayEl && getGeom(trayEl)
  if (trayGeom) applyMoveCommit(ydoc, movedEl, dropX - trayGeom.x, dropY - trayGeom.y)
  return { dropTrayId, movedEl, trayGeom }
}

describe('drop-position rebase — real tray_sum + dice_d6 assets', () => {
  beforeEach(() => {
    _clearSvgTextCache()
    clearYNodeMap()
    _resetToyScriptState()
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
      if (url === '/toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
      if (url === '/toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
      if (url === '/toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
      throw new Error(`unexpected fetch: ${url}`)
    }))
  })

  test('tray_sum places at its real 220x130 native size, not a forced square', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 'tray1', toyType: 'tray_sum', x: 300, y: 300, color: '#fff' })

    const layerEl = renderLayer(yToys)
    const trayGeom = getGeom(layerEl.querySelector('[data-id="tray1"]'))
    expect(trayGeom.width).toBe(220)
    expect(trayGeom.height).toBe(130)
  })

  test('dice_d6 places at its real 80x100 native size', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 'die1', toyType: 'dice_d6', x: 100, y: 100, color: '#fff' })

    const layerEl = renderLayer(yToys)
    const dieGeom = getGeom(layerEl.querySelector('[data-id="die1"]'))
    expect(dieGeom.width).toBe(80)
    expect(dieGeom.height).toBe(100)
  })

  test('dropa die into a tray converts position to the trays local space and inside the trays visible viewBox', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    // tray at table (300, 300); its own local viewBox is 0..220 x 0..130
    await addToy(ydoc, yToys, { id: 'tray1', toyType: 'tray_sum', x: 400, y: 375, color: '#fff' })
    // die dropped loose on the table, nowhere near the tray at first
    await addToy(ydoc, yToys, { id: 'die1', toyType: 'dice_d6', x: 50, y: 50, color: '#fff' })

    const layerEl = renderLayer(yToys)
    // drop it at table point (350, 340) — visually inside the tray's rendered box
    const { dropTrayId, movedEl } = dropIntoTray(ydoc, yToys, layerEl, 'die1', 350, 340)

    expect(dropTrayId).toBe('tray1')
    const movedSvg = movedEl.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
    const localX = Number(movedSvg.getAttribute('x'))
    const localY = Number(movedSvg.getAttribute('y'))
    const localW = Number(movedSvg.getAttribute('width'))
    const localH = Number(movedSvg.getAttribute('height'))

    // The die's local bbox must fall at least
    // partly within the tray's own 0..220 x 0..130 viewBox — this is what
    // "visible inside the tray" means structurally.
    expect(localX).toBeLessThan(220)
    expect(localX + localW).toBeGreaterThan(0)
    expect(localY).toBeLessThan(130)
    expect(localY + localH).toBeGreaterThan(0)
  })

  test('without the rebase, the die\u2019s stale table-space position would NOT be visible in the tray\u2019s local viewBox (regression guard)', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 'tray1', toyType: 'tray_sum', x: 400, y: 375, color: '#fff' })
    // die starts far out on the table — its own table-space position is
    // what would leak through as "local" coordinates without the rebase.
    await addToy(ydoc, yToys, { id: 'die1', toyType: 'dice_d6', x: 900, y: 900, color: '#fff' })

    const layerEl = renderLayer(yToys)
    const dropTrayId = findDropTargetTray(layerEl, 'die1', 350, 340)
    const movedEl = reparentToy(ydoc, yToys, 'die1', dropTrayId) // reparent only, no rebase

    const movedSvg = movedEl.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
    const staleX = Number(movedSvg.getAttribute('x')) // still the original table-space x (900 - 40)

    // Demonstrates the bug this fix addresses: without repositioning, the
    // die's stale x is nowhere near the tray's local 0..220 viewBox.
    expect(staleX).toBeGreaterThan(220)
  })

})
