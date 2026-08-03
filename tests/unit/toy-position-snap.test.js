/**
 * tests/unit/toy-position-snap.test.js
 *
 * Toys.computePositionSnapPoints — the toy-layer counterpart to
 * BounPos.computePositionSnapPoints (see tests/unit/boun_pos.test.js) —
 * plus the positions_change_handler cascade that fires through
 * Toys.runGesture when a toy is placed onto (or moves off of) another
 * toy's tt_positions snap point.
 *
 * app.js's startDrag/move/commitMove are the production callers (untested
 * directly here — see the project's existing convention, e.g.
 * reparent-position.test.js's header, of exercising app.js's logic via a
 * faithful reimplementation instead of importing app.js itself).
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import {
  addToy, getGeom, applyMoveDom, runGesture, activateAllToyScriptsDom,
  computePositionSnapPoints, departingPositionOwners, arrivingPositionOwners,
  promoteZOrder, moveToyAndStack,
  makeLayerAPI, listToysDom, _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { getOps } from '../../src/op_dag.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const TABLE   = 'test-table'
const AUTHOR  = 'tester'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const CHIP_SVG = fs.readFileSync(path.join(TOY_DIR, 'chip.svg'), 'utf8')

// A fixture with a single tt_positions point at its own centre (mirroring
// chip.svg's real layout: an 80x80 toy with one circle at cx=40 cy=40) and
// a positions_change_handler that just counts invocations.
function baseFixtureSvg({ id, className, size = 80 }) {
  const c = size / 2
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${SVG_NS}" width="${size}" height="${size}" id="${id}" class="${className}">
  <script type="text/javascript" data-namespace="${id}_ns"><![CDATA[
    var ${id}_ns = {
      positions_change_handler: function(elem) {
        elem.setAttribute('data-pos-recomputed', String(Number(elem.getAttribute('data-pos-recomputed') || 0) + 1))
      },
    }
  ]]></script>
  <g class="tt_positions" data-bounpos-type="pos-set" name="${className}">
    <circle cx="${c}" cy="${c}" r="10"></circle>
  </g>
</svg>`
}

// A fixture with no tt_positions at all — a plain stacker with no reaction,
// used to confirm nothing errors when there's no positions_change_handler
// to call (chip.svg's actual real-world case).
function plainFixtureSvg({ id, className, size = 80 }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${SVG_NS}" width="${size}" height="${size}" id="${id}" class="${className}"></svg>`
}

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  return layerEl
}

// Reuses the player_marker / dice_d6 / bag TOY_TYPES slots (addToy
// requires a registered TOY_TYPES entry) with custom fetch-stubbed SVG —
// same technique tests/unit/tray.test.js's cross-tray-cycle test uses.
function stubToyFetch(map) {
  return vi.fn(async (url) => {
    if (url in map) return { ok: true, text: async () => map[url] }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

beforeEach(() => {
  _clearSvgTextCache()
  _resetToyScriptState()
})

describe('Toys.computePositionSnapPoints', () => {
  test('returns empty array when toy has no classes', () => {
    const layerEl = freshLayer()
    expect(computePositionSnapPoints(layerEl, new Set())).toHaveLength(0)
  })

  test('returns empty array when layerEl is null', () => {
    expect(computePositionSnapPoints(null, new Set(['chip']))).toHaveLength(0)
  })

  test('converts a tt_positions circle to canvas space via the owner\u2019s geom origin', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    const pts = computePositionSnapPoints(layerEl, new Set(['chip']))
    expect(pts).toHaveLength(1)
    // chip's own point sits at its local centre (40,40 in an 80x80 doc),
    // which after placement at canvas centre (300,200) is exactly there.
    expect(pts[0]).toMatchObject({ cx: 300, cy: 200, ownerId: 'chipA' })
  })

  test('returns empty array when no toy\u2019s tt_positions name matches toyClasses', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    expect(computePositionSnapPoints(layerEl, new Set(['dungeon']))).toHaveLength(0)
  })

  test('excludeId omits that toy from both ownership and occupancy — a dragged toy doesn\u2019t block its own slot', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    // Excluding chipA itself: it owned the only point, so no points remain.
    expect(computePositionSnapPoints(layerEl, new Set(['chip']), 'chipA')).toHaveLength(0)
  })

  test('z-ordering: a point is NOT filtered out by a toy BELOW its owner (the owner\u2019s own base case)', async () => {
    // A single chip's point coincides with its own centre — the point
    // owner is always "at" its own point. That must never self-block.
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    const pts = computePositionSnapPoints(layerEl, new Set(['chip']))
    expect(pts).toHaveLength(1)
  })

  test('z-ordering: a point IS filtered out once a toy rendered ABOVE the owner sits exactly on it', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    // chipA placed first (below); chipB placed second (above, later in DOM
    // order) and stacked exactly on chipA's own point.
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    // chipA's point is now occupied from above (by chipB) — filtered out.
    // chipB's own point also coincides with (300,200) (same centre), and
    // nothing sits above chipB, so chipB's own point should still be
    // offered (that's the next chip in the stack's landing spot).
    const pts = computePositionSnapPoints(layerEl, new Set(['chip']))
    expect(pts).toHaveLength(1)
    expect(pts[0].ownerId).toBe('chipB')
  })

  test('excluding the top-of-stack toy (the one being dragged away) frees the base toy\u2019s point again', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    // chipB is about to be dragged (excluded) — chipA's point should
    // reappear as available, since its sole occupant is leaving.
    const pts = computePositionSnapPoints(layerEl, new Set(['chip']), 'chipB')
    expect(pts).toHaveLength(1)
    expect(pts[0].ownerId).toBe('chipA')
  })
})

describe('positions_change_handler cascade (via runGesture)', () => {
  test('invokes positions_change_handler on the owner id passed as positionOwnerIds, as part of the same operation', async () => {
    const BASE_SVG   = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    const STACKER_SVG = plainFixtureSvg({ id: 'stacker_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      '/toy/player_marker.svg': BASE_SVG,
      '/toy/dice_d6.svg':       STACKER_SVG,
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'base1', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'stacker1', toyType: 'dice_d6', x: 500, y: 500, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    const before = getOps(ydoc).size
    const stackerEl = layerEl.querySelector('[data-id="stacker1"]')
    runGesture(ydoc, layerEl, () => {
      applyMoveDom(stackerEl, 100, 100) // land exactly on base1's point
    }, { gesture: 'move', authorId: AUTHOR, tableId: TABLE, positionOwnerIds: ['base1'] })

    // One atomic operation — the move and the handler's reaction together.
    expect(getOps(ydoc).size - before).toBe(1)
    const baseEl = layerEl.querySelector('[data-id="base1"]')
    expect(baseEl.getAttribute('data-pos-recomputed')).toBe('1')
  })

  test('a missing positions_change_handler is a silent no-op — no error, no crash (chip.svg\u2019s real case)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 900, y: 900, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    const chipBEl = layerEl.querySelector('[data-id="chipB"]')
    expect(() => {
      runGesture(ydoc, layerEl, () => {
        applyMoveDom(chipBEl, 300, 200) // stack chipB onto chipA's own point
      }, { gesture: 'move', authorId: AUTHOR, tableId: TABLE, positionOwnerIds: ['chipA'] })
    }).not.toThrow()
  })

  test('an unknown owner id (e.g. deleted mid-gesture) is skipped without error', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    expect(() => {
      runGesture(ydoc, layerEl, () => {}, {
        gesture: 'move', authorId: AUTHOR, tableId: TABLE, positionOwnerIds: ['does-not-exist'],
      })
    }).not.toThrow()
  })

  test('with no positionOwnerIds, runGesture behaves exactly as before (backward compatible)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    const chipAEl = layerEl.querySelector('[data-id="chipA"]')
    const before = getOps(ydoc).size
    runGesture(ydoc, layerEl, () => {
      applyMoveDom(chipAEl, 350, 250)
    }, { gesture: 'move', authorId: AUTHOR, tableId: TABLE })

    expect(getOps(ydoc).size - before).toBe(1)
    expect(getGeom(chipAEl).x).toBe(310) // 350 - width/2
  })
})

describe('departingPositionOwners / arrivingPositionOwners', () => {
  test('departingPositionOwners: [] when el isn\u2019t sitting on anyone\u2019s point', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 900, y: 900, color: '#fff' })

    const chipBEl = layerEl.querySelector('[data-id="chipB"]')
    expect(departingPositionOwners(layerEl, chipBEl)).toEqual([])
  })

  test('departingPositionOwners: reports the owner el\u2019s current centre sits on', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })
    // chipB starts stacked exactly on chipA's point.
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    const chipBEl = layerEl.querySelector('[data-id="chipB"]')
    expect(departingPositionOwners(layerEl, chipBEl)).toEqual(['chipA'])
  })

  test('arrivingPositionOwners: reports the owner whose point sits exactly at the given (x, y)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 900, y: 900, color: '#fff' })

    const chipBEl = layerEl.querySelector('[data-id="chipB"]')
    // chipB about to land exactly on chipA's own point.
    expect(arrivingPositionOwners(layerEl, chipBEl, 300, 200)).toEqual(['chipA'])
    // Nowhere special.
    expect(arrivingPositionOwners(layerEl, chipBEl, 1234, 5678)).toEqual([])
  })

  test('arrivingPositionOwners excludes el itself even if the destination happens to equal one of its OWN points', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    const chipAEl = layerEl.querySelector('[data-id="chipA"]')
    // chip's own point coincides with its own centre — landing "on itself".
    expect(arrivingPositionOwners(layerEl, chipAEl, 300, 200)).toEqual([])
  })

  test('null layerEl/el is handled without throwing', () => {
    expect(departingPositionOwners(null, null)).toEqual([])
    expect(arrivingPositionOwners(null, null, 0, 0)).toEqual([])
  })
})

describe('promoteZOrder — recursive', () => {
  function idsInOrder(layerEl) {
    return listToysDom(layerEl).map(el => el.getAttribute('data-id'))
  }

  test('el is promoted to the topmost (last) position among top-level toys', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 500, y: 500, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipC', toyType: 'chip', x: 700, y: 700, color: '#fff' })
    expect(idsInOrder(layerEl)).toEqual(['chipA', 'chipB', 'chipC'])

    promoteZOrder(layerEl, layerEl.querySelector('[data-id="chipA"]'))

    expect(idsInOrder(layerEl)).toEqual(['chipB', 'chipC', 'chipA'])
  })

  test('a toy with nothing stacked on it is simply promoted, no side effects on others', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 500, y: 500, color: '#fff' })

    promoteZOrder(layerEl, layerEl.querySelector('[data-id="chipB"]')) // already topmost

    expect(idsInOrder(layerEl)).toEqual(['chipA', 'chipB'])
  })

  test('direct occupants are promoted above el, preserving their relative order to each other', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      '/toy/player_marker.svg': BASE_SVG,
      '/toy/dice_d6.svg':       plainFixtureSvg({ id: 'y_fixture', className: 'y' }),
      '/toy/tray_sum.svg':      plainFixtureSvg({ id: 'x_fixture', className: 'x' }),
      '/toy/bag.svg':           plainFixtureSvg({ id: 'other_fixture', className: 'other' }),
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    // base is added first (bottommost); occupantY and occupantX both sit
    // exactly on base's own point, in that relative order; other is
    // unrelated and sits elsewhere entirely.
    await addToy(ydoc, layerEl, { id: 'base',      toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'occupantY', toyType: 'dice_d6',       x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'occupantX', toyType: 'tray_sum',      x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'other',     toyType: 'bag',           x: 900, y: 900, color: '#fff' })
    expect(idsInOrder(layerEl)).toEqual(['base', 'occupantY', 'occupantX', 'other'])

    promoteZOrder(layerEl, layerEl.querySelector('[data-id="base"]'))

    // base promoted above 'other', and occupantY/occupantX promoted above
    // base in turn, preserving their original Y-before-X relative order.
    expect(idsInOrder(layerEl)).toEqual(['other', 'base', 'occupantY', 'occupantX'])
  })

  test('promotion is recursive: an occupant\u2019s own occupant rises above IT, above the base, above everything else', async () => {
    // base <- middle (sits on base's point) <- top (sits on middle's point)
    const BASE_SVG   = baseFixtureSvg({ id: 'base_fixture', className: 'onbase' })
    const MIDDLE_SVG = baseFixtureSvg({ id: 'middle_fixture', className: 'onmiddle' })
    vi.stubGlobal('fetch', stubToyFetch({
      '/toy/player_marker.svg': BASE_SVG,
      '/toy/dice_d6.svg':       MIDDLE_SVG,
      '/toy/bag.svg':           plainFixtureSvg({ id: 'top_fixture', className: 'top' }),
      '/toy/tray_sum.svg':      plainFixtureSvg({ id: 'other_fixture', className: 'other' }),
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'base',   toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'middle', toyType: 'dice_d6',       x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'top',    toyType: 'bag',           x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'other',  toyType: 'tray_sum',      x: 900, y: 900, color: '#fff' })
    expect(idsInOrder(layerEl)).toEqual(['base', 'middle', 'top', 'other'])

    promoteZOrder(layerEl, layerEl.querySelector('[data-id="base"]'))

    expect(idsInOrder(layerEl)).toEqual(['other', 'base', 'middle', 'top'])
  })

  test('only occupants (direct or transitive) are promoted — an unrelated toy is untouched', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      '/toy/player_marker.svg': BASE_SVG,
      '/toy/dice_d6.svg':       plainFixtureSvg({ id: 'occ_fixture', className: 'occ' }),
      '/toy/bag.svg':           plainFixtureSvg({ id: 'other_fixture', className: 'other' }),
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'base',      toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'occupant',  toyType: 'dice_d6',       x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'bystander', toyType: 'bag',           x: 900, y: 900, color: '#fff' })

    promoteZOrder(layerEl, layerEl.querySelector('[data-id="base"]'))

    expect(idsInOrder(layerEl)).toEqual(['bystander', 'base', 'occupant'])
  })

  test('null layerEl/el is handled without throwing', () => {
    expect(() => promoteZOrder(null, null)).not.toThrow()
  })
})

describe('moveToyAndStack — recursive move', () => {
  test('moves el alone when nothing is stacked on it', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    const chipAEl = layerEl.querySelector('[data-id="chipA"]')
    moveToyAndStack(layerEl, chipAEl, 500, 600)

    expect(getGeom(chipAEl).x).toBe(460) // 500 - width/2
    expect(getGeom(chipAEl).y).toBe(560) // 600 - height/2
  })

  test('carries a direct occupant along by the same delta, preserving its offset within the stack', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      '/toy/player_marker.svg': BASE_SVG,
      '/toy/dice_d6.svg':       plainFixtureSvg({ id: 'occ_fixture', className: 'occ' }),
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'base',     toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'occupant', toyType: 'dice_d6',       x: 100, y: 100, color: '#fff' })

    const baseEl     = layerEl.querySelector('[data-id="base"]')
    const occupantEl = layerEl.querySelector('[data-id="occupant"]')
    moveToyAndStack(layerEl, baseEl, 400, 500) // dx=300, dy=400

    const baseGeom = getGeom(baseEl), occGeom = getGeom(occupantEl)
    expect(baseGeom.x + baseGeom.width / 2).toBe(400)
    expect(baseGeom.y + baseGeom.height / 2).toBe(500)
    // occupant started at exactly base's old centre (100,100) — after the
    // same (dx, dy), it should land exactly on base's new centre (400,500).
    expect(occGeom.x + occGeom.width / 2).toBe(400)
    expect(occGeom.y + occGeom.height / 2).toBe(500)
  })

  test('carries a whole multi-level stack — occupant-of-an-occupant moves too', async () => {
    const BASE_SVG   = baseFixtureSvg({ id: 'base_fixture', className: 'onbase' })
    const MIDDLE_SVG = baseFixtureSvg({ id: 'middle_fixture', className: 'onmiddle' })
    vi.stubGlobal('fetch', stubToyFetch({
      '/toy/player_marker.svg': BASE_SVG,
      '/toy/dice_d6.svg':       MIDDLE_SVG,
      '/toy/bag.svg':           plainFixtureSvg({ id: 'top_fixture', className: 'top' }),
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'base',   toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'middle', toyType: 'dice_d6',       x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'top',    toyType: 'bag',           x: 100, y: 100, color: '#fff' })

    moveToyAndStack(layerEl, layerEl.querySelector('[data-id="base"]'), 700, 800)

    for (const id of ['base', 'middle', 'top']) {
      const g = getGeom(layerEl.querySelector(`[data-id="${id}"]`))
      expect(g.x + g.width / 2).toBe(700)
      expect(g.y + g.height / 2).toBe(800)
    }
  })

  test('an unrelated toy elsewhere is not moved', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      '/toy/player_marker.svg': BASE_SVG,
      '/toy/dice_d6.svg':       plainFixtureSvg({ id: 'other_fixture', className: 'other' }),
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'base',  toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'other', toyType: 'dice_d6',       x: 900, y: 900, color: '#fff' })

    moveToyAndStack(layerEl, layerEl.querySelector('[data-id="base"]'), 400, 400)

    const otherGeom = getGeom(layerEl.querySelector('[data-id="other"]'))
    expect(otherGeom.x + otherGeom.width / 2).toBe(900)
    expect(otherGeom.y + otherGeom.height / 2).toBe(900)
  })
})

describe('makeLayerAPI().applyMoveCommit — the full 5-step sequence', () => {
  test('caller passes only (el, x, y) — everything else (ownership, promotion, the stack move, the cascade) is self-contained', async () => {
    const BASE_SVG   = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    const STACKER_SVG = plainFixtureSvg({ id: 'stacker_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      '/toy/player_marker.svg': BASE_SVG,
      '/toy/dice_d6.svg':       STACKER_SVG,
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'base1', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'stacker1', toyType: 'dice_d6', x: 500, y: 500, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    const api = makeLayerAPI(ydoc, () => layerEl, AUTHOR, TABLE)
    const before = getOps(ydoc).size
    api.applyMoveCommit(api.find('stacker1'), 100, 100) // land exactly on base1's point

    expect(getOps(ydoc).size - before).toBe(1) // still one atomic operation
    const baseEl = layerEl.querySelector('[data-id="base1"]')
    expect(baseEl.getAttribute('data-pos-recomputed')).toBe('1') // arrivingPositionOwners cascade fired
  })

  test('moving a toy with no tt_positions relationship at all is a normal, unaffected move', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    const api = makeLayerAPI(ydoc, () => layerEl, AUTHOR, TABLE)
    const before = getOps(ydoc).size
    api.applyMoveCommit(api.find('chipA'), 400, 400)

    expect(getOps(ydoc).size - before).toBe(1)
    expect(getGeom(layerEl.querySelector('[data-id="chipA"]')).x).toBe(360)
  })

  test('promotion happens even on a no-op move (same centre) — every commit brings the toy to front', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 500, y: 500, color: '#fff' })

    const api = makeLayerAPI(ydoc, () => layerEl, AUTHOR, TABLE)
    api.applyMoveCommit(api.find('chipA'), 100, 100) // same centre — a no-op move

    const idsInOrder = listToysDom(layerEl).map(el => el.getAttribute('data-id'))
    expect(idsInOrder).toEqual(['chipB', 'chipA'])
  })

  test('end-to-end: picking up a base carries its whole stack, promotes it all to front, and fires both departing and arriving reactions', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    const OTHER_BASE_SVG = baseFixtureSvg({ id: 'other_base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      '/toy/player_marker.svg': BASE_SVG,       // moving base
      '/toy/dice_d6.svg':       plainFixtureSvg({ id: 'occ_fixture', className: 'occ' }), // its occupant
      '/toy/bag.svg':           OTHER_BASE_SVG, // the destination owner
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'movingBase', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'occupant',   toyType: 'dice_d6',       x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'destBase',   toyType: 'bag',           x: 900, y: 900, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    const api = makeLayerAPI(ydoc, () => layerEl, AUTHOR, TABLE)
    const before = getOps(ydoc).size
    api.applyMoveCommit(api.find('movingBase'), 900, 900) // land exactly on destBase's point

    expect(getOps(ydoc).size - before).toBe(1) // everything — move, stack, cascade — one operation

    // The occupant followed movingBase to the new location.
    const occGeom = getGeom(layerEl.querySelector('[data-id="occupant"]'))
    expect(occGeom.x + occGeom.width / 2).toBe(900)
    expect(occGeom.y + occGeom.height / 2).toBe(900)

    // movingBase (and its occupant) promoted above destBase.
    const idsInOrder = listToysDom(layerEl).map(el => el.getAttribute('data-id'))
    expect(idsInOrder).toEqual(['destBase', 'movingBase', 'occupant'])

    // destBase reacted to the arrival.
    expect(layerEl.querySelector('[data-id="destBase"]').getAttribute('data-pos-recomputed')).toBe('1')
  })
})
