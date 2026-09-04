/**
 * tests/unit/toy-position-snap.test.js
 *
 * plus the four position-relationship handlers that fire through
 * Toys.runGesture when a toy is placed onto (or moves off of) another
 * toy's tt_positions snap point:
 *   on_position_occupied(elem, positionId, ownerId, movingId) — owner, gained an occupant
 *   on_position_vacated(elem, positionId, ownerId, movingId)  — owner, lost its occupant
 *   on_arrive_position(elem, positionId, ownerId, movingId)   — occupant, landed
 *   on_depart_position(elem, positionId, ownerId, movingId)   — occupant, left
 * elem is always self. ownerId is always the id of the toy the position
 * belongs to. movingId is always the id of the toy that's arriving/
 * departing. positionId is whatever raw `id` attribute ended up on the
 * <circle> in the live DOM — unmodified, including the toy instance's own
 * `${toyId}__` auto-minted prefix if the circle wasn't authored with one.
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
  getSnapPoints, departingPositionEvents, arrivingPositionEvents,
  promoteZOrder, moveToyAndStack, moveToysBatch,
  makeLayerAPI, listToysDom, _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { getOps } from '../../src/op_dag.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const TABLE   = 'test-table'
const AUTHOR  = 'tester'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const CHIP_SVG = fs.readFileSync(path.join(TOY_DIR, 'chip.svg'), 'utf8')

// chip.svg is an 80x80 toy whose tt_positions circle sits at local
// (40, 32) — 8px above its own geometric centre (40, 40), for a fanned
// poker-chip-stack look — not exactly at its own centre. A chip placed at
// canvas centre (x, y) therefore generates a snap point at (x, y - 8).
const CHIP_POINT_OFFSET_Y = 8
function chipPointFor(x, y) { return { x, y: y - CHIP_POINT_OFFSET_Y } }

// The live-DOM id of ownerId's own tt_positions circle — whatever
// positionId actually is, unmodified: the id the toy author wrote
// (prefixed with the toy instance's own `${ownerId}__`, same as every
// other id on the toy), or the auto-minted `${ownerId}__N` sequence
// number if the author didn't write one. Read dynamically rather than
// predicted, so these tests don't hardcode an assumption about a fixed
// asset's internal structure.
function realPositionId(layerEl, ownerId) {
  const circle = layerEl.querySelector(`[data-id="${ownerId}"] .${ownerId}__tt_positions circle`)
  return circle?.getAttribute('id') ?? ''
}

// A fixture with a single tt_positions point at its own centre (id="pos",
// so its live-DOM positionId is predictably "${id}__pos") and all four
// handlers, each recording invocation count + the (positionId, ownerId,
// movingId) it was last called with, as a DOM attribute, so tests can
// assert on the signature without hooking into the namespace object.
function baseFixtureSvg({ id, className, size = 80 }) {
  const c = size / 2
  const record = name =>
    `${name}: function(elem, positionId, ownerId, movingId) {
        const n = Number(elem.getAttribute('data-${name}-count') || 0) + 1
        elem.setAttribute('data-${name}-count', String(n))
        elem.setAttribute('data-${name}-last', positionId + ':' + ownerId + ':' + movingId)
      },`
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${SVG_NS}" width="${size}" height="${size}" id="${id}" class="${className}">
  <script type="text/javascript" data-namespace="${id}_ns"><![CDATA[
    var ${id}_ns = {
      ${record('on_position_occupied')}
      ${record('on_position_vacated')}
      ${record('on_arrive_position')}
      ${record('on_depart_position')}
    }
  ]]></script>
  <g class="tt_positions" data-bounpos-type="pos-set" name="${className}">
    <circle id="pos" cx="${c}" cy="${c}" r="10"></circle>
  </g>
</svg>`
}

// A fixture with no tt_positions at all — a plain stacker with no
// reaction, used to confirm nothing errors when there's no handler to
// call, and as an occupant that doesn't need to react to being carried.
function plainFixtureSvg({ id, className, size = 80 }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${SVG_NS}" width="${size}" height="${size}" id="${id}" class="${className}"></svg>`
}

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  return layerEl
}

// Reuses the player_marker / dice_d6 / bag / tray_sum TOY_TYPES slots
// (addToy requires a registered TOY_TYPES entry) with custom fetch-stubbed
// SVG — same technique tests/unit/tray.test.js's cross-tray-cycle test
// uses.
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

describe('Toys.getSnapPoints', () => {
  test('converts a tt_positions circle to canvas space via the owner\u2019s geom origin', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    const pts = getSnapPoints(layerEl, new Set(['chip']))
    expect(pts).toHaveLength(1)
    // chip's own point sits 8px above its own centre (see CHIP_POINT_OFFSET_Y).
    const expected = chipPointFor(300, 200)
    expect(pts[0]).toMatchObject({ cx: expected.x, cy: expected.y, ownerId: 'chipA' })
  })

})

describe('on_position_* / on_*_position cascade (via runGesture)', () => {
  test('arriving on an owner\u2019s position fires on_position_occupied on the owner AND on_arrive_position on the occupant, as part of the same operation', async () => {
    const BASE_SVG    = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    const STACKER_SVG = baseFixtureSvg({ id: 'stacker_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       STACKER_SVG,
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
    }, {
      gesture: 'move', authorId: AUTHOR, tableId: TABLE,
      positionEvents: [
        { fnName: 'on_position_occupied', elemId: 'base1',    positionId: 'p0', ownerId: 'base1', movingId: 'stacker1' },
        { fnName: 'on_arrive_position',   elemId: 'stacker1', positionId: 'p0', ownerId: 'base1', movingId: 'stacker1' },
      ],
    })

    // One atomic operation — the move and both reactions together.
    expect(getOps(ydoc).size - before).toBe(1)
    const baseEl = layerEl.querySelector('[data-id="base1"]')
    expect(baseEl.getAttribute('data-on_position_occupied-count')).toBe('1')
    expect(baseEl.getAttribute('data-on_position_occupied-last')).toBe('p0:base1:stacker1')
    expect(baseEl.getAttribute('data-on_position_vacated-count')).toBeNull()
    expect(stackerEl.getAttribute('data-on_arrive_position-count')).toBe('1')
    expect(stackerEl.getAttribute('data-on_arrive_position-last')).toBe('p0:base1:stacker1')
    expect(stackerEl.getAttribute('data-on_depart_position-count')).toBeNull()
  })

  test('departing an owner\u2019s position fires on_position_vacated on the owner AND on_depart_position on the occupant', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       baseFixtureSvg({ id: 'stacker_fixture', className: 'stacker_class' }),
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'owner', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'mover', toyType: 'dice_d6',       x: 100, y: 100, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    runGesture(ydoc, layerEl, () => {}, {
      gesture: 'move', authorId: AUTHOR, tableId: TABLE,
      positionEvents: [
        { fnName: 'on_position_vacated', elemId: 'owner', positionId: 'p0', ownerId: 'owner', movingId: 'mover' },
        { fnName: 'on_depart_position',  elemId: 'mover', positionId: 'p0', ownerId: 'owner', movingId: 'mover' },
      ],
    })

    const ownerEl = layerEl.querySelector('[data-id="owner"]')
    const moverEl = layerEl.querySelector('[data-id="mover"]')
    expect(ownerEl.getAttribute('data-on_position_vacated-count')).toBe('1')
    expect(ownerEl.getAttribute('data-on_position_vacated-last')).toBe('p0:owner:mover')
    expect(ownerEl.getAttribute('data-on_position_occupied-count')).toBeNull()
    expect(moverEl.getAttribute('data-on_depart_position-count')).toBe('1')
    expect(moverEl.getAttribute('data-on_depart_position-last')).toBe('p0:owner:mover')
    expect(moverEl.getAttribute('data-on_arrive_position-count')).toBeNull()
  })

  test('a toy that both departs one owner and arrives at another gets both reactions in the same gesture', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       BASE_SVG.replace(/base_fixture/g, 'base_fixture2'),
      'toy/bag.svg':           baseFixtureSvg({ id: 'mover_fixture', className: 'stacker_class' }),
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'ownerA', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'ownerB', toyType: 'dice_d6',       x: 500, y: 500, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'mover',  toyType: 'bag',           x: 100, y: 100, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    runGesture(ydoc, layerEl, () => {}, {
      gesture: 'move', authorId: AUTHOR, tableId: TABLE,
      positionEvents: [
        { fnName: 'on_position_vacated',  elemId: 'ownerA', positionId: 'p0', ownerId: 'ownerA', movingId: 'mover' },
        { fnName: 'on_depart_position',   elemId: 'mover',  positionId: 'p0', ownerId: 'ownerA', movingId: 'mover' },
        { fnName: 'on_position_occupied', elemId: 'ownerB', positionId: 'p1', ownerId: 'ownerB', movingId: 'mover' },
        { fnName: 'on_arrive_position',   elemId: 'mover',  positionId: 'p1', ownerId: 'ownerB', movingId: 'mover' },
      ],
    })

    const moverEl = layerEl.querySelector('[data-id="mover"]')
    expect(moverEl.getAttribute('data-on_depart_position-last')).toBe('p0:ownerA:mover')
    expect(moverEl.getAttribute('data-on_arrive_position-last')).toBe('p1:ownerB:mover')
    expect(layerEl.querySelector('[data-id="ownerA"]').getAttribute('data-on_position_vacated-last')).toBe('p0:ownerA:mover')
    expect(layerEl.querySelector('[data-id="ownerB"]').getAttribute('data-on_position_occupied-last')).toBe('p1:ownerB:mover')
  })

  test('an identical duplicate event is deduped — the handler runs at most once', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({ 'toy/player_marker.svg': BASE_SVG }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'owner', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    runGesture(ydoc, layerEl, () => {}, {
      gesture: 'move', authorId: AUTHOR, tableId: TABLE,
      positionEvents: [
        { fnName: 'on_position_occupied', elemId: 'owner', positionId: 'p0', ownerId: 'owner', movingId: 'mover' },
        { fnName: 'on_position_occupied', elemId: 'owner', positionId: 'p0', ownerId: 'owner', movingId: 'mover' },
      ],
    })

    expect(layerEl.querySelector('[data-id="owner"]').getAttribute('data-on_position_occupied-count')).toBe('1')
  })

  test('a missing handler is a silent no-op — no error, no crash', async () => {
    const PLAIN_SVG = plainFixtureSvg({ id: 'plain_fixture', className: 'plain' })
    vi.stubGlobal('fetch', stubToyFetch({ 'toy/player_marker.svg': PLAIN_SVG }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'owner', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    expect(() => {
      runGesture(ydoc, layerEl, () => {}, {
        gesture: 'move', authorId: AUTHOR, tableId: TABLE,
        positionEvents: [
          { fnName: 'on_position_occupied', elemId: 'owner', positionId: 'p0', ownerId: 'owner', movingId: 'mover' },
        ],
      })
    }).not.toThrow()
  })

  test('the real chip.svg\u2019s own on_position_*/on_*_position handlers set data-above/data-below as documented', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 900, y: 900, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    // chipB lands exactly on chipA's point.
    const chipAPoint = chipPointFor(300, 200)
    api.applyMoveCommit(api.find('chipB'), chipAPoint.x, chipAPoint.y)

    const chipAEl = layerEl.querySelector('[data-id="chipA"]')
    const chipBEl = layerEl.querySelector('[data-id="chipB"]')
    expect(chipAEl.getAttribute('data-below')).toBe('chipB')
    expect(chipBEl.getAttribute('data-above')).toBe('chipA')

    // Pick chipB back up and move it away — the reverse should clear both.
    api.applyMoveCommit(chipBEl, 900, 900)
    expect(chipAEl.getAttribute('data-below')).toBe('')
    expect(chipBEl.getAttribute('data-above')).toBe('')
  })

  test('an unknown elemId (e.g. deleted mid-gesture) is skipped without error', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    expect(() => {
      runGesture(ydoc, layerEl, () => {}, {
        gesture: 'move', authorId: AUTHOR, tableId: TABLE,
        positionEvents: [
          { fnName: 'on_position_occupied', elemId: 'does-not-exist', positionId: 'p0', ownerId: 'does-not-exist', movingId: 'x' },
        ],
      })
    }).not.toThrow()
  })

  test('an event with no fnName is skipped without error', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({ 'toy/player_marker.svg': BASE_SVG }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'owner', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    expect(() => {
      runGesture(ydoc, layerEl, () => {}, {
        gesture: 'move', authorId: AUTHOR, tableId: TABLE,
        positionEvents: [{ elemId: 'owner', positionId: 'p0', ownerId: 'owner', movingId: 'x' }],
      })
    }).not.toThrow()
    expect(layerEl.querySelector('[data-id="owner"]').getAttribute('data-on_position_occupied-count')).toBeNull()
  })

  test('with no positionEvents, runGesture behaves exactly as before (backward compatible)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
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

describe('departingPositionEvents / arrivingPositionEvents', () => {
  test('departingPositionEvents: [] when el isn\u2019t sitting on anyone\u2019s point', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       plainFixtureSvg({ id: 'other_fixture', className: 'other' }),
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'owner', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'other', toyType: 'dice_d6',       x: 900, y: 900, color: '#fff' })

    const otherEl = layerEl.querySelector('[data-id="other"]')
    expect(departingPositionEvents(layerEl, otherEl)).toEqual([])
  })

  test('departingPositionEvents: an \'on_position_vacated\' event for the owner and an \'on_depart_position\' event for el, sharing the same positionId/ownerId', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       plainFixtureSvg({ id: 'mover_fixture', className: 'stacker_class' }),
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'owner', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    // mover starts stacked exactly on owner's point.
    await addToy(ydoc, layerEl, { id: 'mover', toyType: 'dice_d6',       x: 100, y: 100, color: '#fff' })

    const moverEl = layerEl.querySelector('[data-id="mover"]')
    const posId = realPositionId(layerEl, 'owner')
    expect(posId).toBe('owner__pos') // the fixture's authored id, prefixed — unstripped
    const events = departingPositionEvents(layerEl, moverEl)
    expect(events).toEqual([
      { fnName: 'on_position_vacated', elemId: 'owner', positionId: posId, ownerId: 'owner', movingId: 'mover' },
      { fnName: 'on_depart_position',  elemId: 'mover', positionId: posId, ownerId: 'owner', movingId: 'mover' },
    ])
  })

  test('arrivingPositionEvents: an \'on_position_occupied\' event for the owner and an \'on_arrive_position\' event for el', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       plainFixtureSvg({ id: 'mover_fixture', className: 'stacker_class' }),
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'owner', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'mover', toyType: 'dice_d6',       x: 900, y: 900, color: '#fff' })

    const moverEl = layerEl.querySelector('[data-id="mover"]')
    const posId = realPositionId(layerEl, 'owner')
    // mover about to land exactly on owner's own point.
    expect(arrivingPositionEvents(layerEl, moverEl, 100, 100)).toEqual([
      { fnName: 'on_position_occupied', elemId: 'owner', positionId: posId, ownerId: 'owner', movingId: 'mover' },
      { fnName: 'on_arrive_position',   elemId: 'mover', positionId: posId, ownerId: 'owner', movingId: 'mover' },
    ])
    // Nowhere special.
    expect(arrivingPositionEvents(layerEl, moverEl, 1234, 5678)).toEqual([])
  })

  test('arrivingPositionEvents excludes el itself even if the destination happens to equal one of its OWN points', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    const chipAEl = layerEl.querySelector('[data-id="chipA"]')
    const chipAPoint = chipPointFor(300, 200)
    // landing exactly "on itself" — its own point, own id excluded.
    expect(arrivingPositionEvents(layerEl, chipAEl, chipAPoint.x, chipAPoint.y)).toEqual([])
  })

  test('positionId is the raw, unstripped live-DOM id — including the toy instance\u2019s own auto-minted prefix when the circle wasn\u2019t authored with one', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 900, y: 900, color: '#fff' })

    const chipBEl = layerEl.querySelector('[data-id="chipB"]')
    const chipAPoint = chipPointFor(300, 200)
    const events = arrivingPositionEvents(layerEl, chipBEl, chipAPoint.x, chipAPoint.y)
    const posId = realPositionId(layerEl, 'chipA')
    // chip.svg's own circle has no authored id, so its live-DOM id is
    // whatever svgTextToDom auto-minted for it: "chipA__<sequence>".
    expect(posId).toMatch(/^chipA__/)
    expect(events).toEqual([
      { fnName: 'on_position_occupied', elemId: 'chipA', positionId: posId, ownerId: 'chipA', movingId: 'chipB' },
      { fnName: 'on_arrive_position',   elemId: 'chipB', positionId: posId, ownerId: 'chipA', movingId: 'chipB' },
    ])
  })

  test('null layerEl/el is handled without throwing', () => {
    expect(departingPositionEvents(null, null)).toEqual([])
    expect(arrivingPositionEvents(null, null, 0, 0)).toEqual([])
  })
})

describe('promoteZOrder — recursive', () => {
  function idsInOrder(layerEl) {
    return listToysDom(layerEl).map(el => el.getAttribute('data-id'))
  }

  test('el is promoted to the topmost (last) position among top-level toys', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    // chipA is added first (bottommost), then two more toys on top of it.
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 500, y: 500, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipC', toyType: 'chip', x: 700, y: 700, color: '#fff' })
    expect(idsInOrder(layerEl)).toEqual(['chipA', 'chipB', 'chipC'])

    promoteZOrder(layerEl, layerEl.querySelector('[data-id="chipA"]'))

    expect(idsInOrder(layerEl)).toEqual(['chipB', 'chipC', 'chipA'])
  })

  test('a toy with nothing stacked on it is simply promoted, no side effects on others', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
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
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       plainFixtureSvg({ id: 'y_fixture', className: 'y' }),
      'toy/tray_sum.svg':      plainFixtureSvg({ id: 'x_fixture', className: 'x' }),
      'toy/bag.svg':           plainFixtureSvg({ id: 'other_fixture', className: 'other' }),
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
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       MIDDLE_SVG,
      'toy/bag.svg':           plainFixtureSvg({ id: 'top_fixture', className: 'top' }),
      'toy/tray_sum.svg':      plainFixtureSvg({ id: 'other_fixture', className: 'other' }),
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
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       plainFixtureSvg({ id: 'occ_fixture', className: 'occ' }),
      'toy/bag.svg':           plainFixtureSvg({ id: 'other_fixture', className: 'other' }),
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
      if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
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
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       plainFixtureSvg({ id: 'occ_fixture', className: 'occ' }),
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
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       MIDDLE_SVG,
      'toy/bag.svg':           plainFixtureSvg({ id: 'top_fixture', className: 'top' }),
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

})

describe('makeLayerAPI().applyMoveCommit — the full 5-step sequence', () => {
  test('caller passes only (el, x, y) — everything else (ownership, promotion, the stack move, the cascade) is self-contained', async () => {
    const BASE_SVG    = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    const STACKER_SVG = baseFixtureSvg({ id: 'stacker_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      'toy/player_marker.svg': BASE_SVG,
      'toy/dice_d6.svg':       STACKER_SVG,
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'base1', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'stacker1', toyType: 'dice_d6', x: 500, y: 500, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    const before = getOps(ydoc).size
    const stackerEl = api.find('stacker1')
    const posId = realPositionId(layerEl, 'base1')
    api.applyMoveCommit(stackerEl, 100, 100) // land exactly on base1's point

    expect(getOps(ydoc).size - before).toBe(1) // still one atomic operation
    const baseEl = layerEl.querySelector('[data-id="base1"]')
    expect(baseEl.getAttribute('data-on_position_occupied-count')).toBe('1')
    expect(baseEl.getAttribute('data-on_position_occupied-last')).toBe(`${posId}:base1:stacker1`)
    expect(stackerEl.getAttribute('data-on_arrive_position-count')).toBe('1')
    expect(stackerEl.getAttribute('data-on_arrive_position-last')).toBe(`${posId}:base1:stacker1`)
  })

  test('moving a toy with no tt_positions relationship at all is a normal, unaffected move', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 300, y: 200, color: '#fff' })

    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    const before = getOps(ydoc).size
    api.applyMoveCommit(api.find('chipA'), 400, 400)

    expect(getOps(ydoc).size - before).toBe(1)
    expect(getGeom(layerEl.querySelector('[data-id="chipA"]')).x).toBe(360)
  })

  test('promotion happens even on a no-op move (same centre) — every commit brings the toy to front', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'chipA', toyType: 'chip', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'chipB', toyType: 'chip', x: 500, y: 500, color: '#fff' })

    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    api.applyMoveCommit(api.find('chipA'), 100, 100) // same centre — a no-op move

    const idsInOrder = listToysDom(layerEl).map(el => el.getAttribute('data-id'))
    expect(idsInOrder).toEqual(['chipB', 'chipA'])
  })

  test('end-to-end: picking up a base carries its whole stack, promotes it all to front, and fires both departing and arriving reactions', async () => {
    const BASE_SVG = baseFixtureSvg({ id: 'base_fixture', className: 'stacker_class' })
    const OTHER_BASE_SVG = baseFixtureSvg({ id: 'other_base_fixture', className: 'stacker_class' })
    vi.stubGlobal('fetch', stubToyFetch({
      'toy/player_marker.svg': BASE_SVG,       // moving base
      'toy/dice_d6.svg':       plainFixtureSvg({ id: 'occ_fixture', className: 'occ' }), // its occupant
      'toy/bag.svg':           OTHER_BASE_SVG, // the destination owner
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'movingBase', toyType: 'player_marker', x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'occupant',   toyType: 'dice_d6',       x: 100, y: 100, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'destBase',   toyType: 'bag',           x: 900, y: 900, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    const api = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)
    const before = getOps(ydoc).size
    const movingBaseEl = api.find('movingBase')
    const posId = realPositionId(layerEl, 'destBase')
    api.applyMoveCommit(movingBaseEl, 900, 900) // land exactly on destBase's point

    expect(getOps(ydoc).size - before).toBe(1) // everything — move, stack, cascade — one operation

    // The occupant followed movingBase to the new location (no position
    // event fires for it — only the top-level moved toy's own arrival
    // triggers a reaction).
    const occGeom = getGeom(layerEl.querySelector('[data-id="occupant"]'))
    expect(occGeom.x + occGeom.width / 2).toBe(900)
    expect(occGeom.y + occGeom.height / 2).toBe(900)

    // movingBase (and its occupant) promoted above destBase.
    const idsInOrder = listToysDom(layerEl).map(el => el.getAttribute('data-id'))
    expect(idsInOrder).toEqual(['destBase', 'movingBase', 'occupant'])

    // destBase reacted to the arrival, movingBase reacted to its own arrival.
    const destBaseEl = layerEl.querySelector('[data-id="destBase"]')
    expect(destBaseEl.getAttribute('data-on_position_occupied-count')).toBe('1')
    expect(destBaseEl.getAttribute('data-on_position_occupied-last')).toBe(`${posId}:destBase:movingBase`)
    expect(movingBaseEl.getAttribute('data-on_arrive_position-count')).toBe('1')
    expect(movingBaseEl.getAttribute('data-on_arrive_position-last')).toBe(`${posId}:destBase:movingBase`)
    // movingBase wasn't sitting on anyone's position before, so no departure.
    expect(destBaseEl.getAttribute('data-on_position_vacated-count')).toBeNull()
    expect(movingBaseEl.getAttribute('data-on_depart_position-count')).toBeNull()
  })
})

