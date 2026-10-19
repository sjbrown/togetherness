/**
 * tests/unit/group-action-square.integration.test.js
 *
 * A multi-selection whose toys share a default menu action gets one action
 * square at the south-east-most member corner; clicking it runs that action
 * on every member. Mixed or action-less selections get no square.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as awarenessProtocol from 'y-protocols/awareness'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../src/ui.js', () => ({
  init: vi.fn(), onSelectionChanged: vi.fn(), onToolChanged: vi.fn(), refreshFromDoc: vi.fn(),
  setIdentity: vi.fn(), showPopover: vi.fn(), toast: vi.fn(), updatePeersPanel: vi.fn(),
  restorePanelState: vi.fn(), restoreLayerState: vi.fn(), saveLayerState: vi.fn(),
}))

vi.mock('../../src/canvas.js', () => ({
  init: vi.fn(), getView: vi.fn(() => ({ x: 0, y: 0, scale: 1 })), leaderId: vi.fn(),
  setParams: vi.fn(), setTool: vi.fn(), setBackground: vi.fn(), syncBackgroundTransform: vi.fn(),
}))

const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')
const read    = (f) => fs.readFileSync(path.join(TOY_DIR, f), 'utf8')

beforeEach(() => {
  delete globalThis.dice
  delete globalThis.d6
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === 'toy/dice_d6.svg')      return { ok: true, text: async () => read('dice_d6.svg') }
    if (url === 'toy/js/dice_utils.js') return { ok: true, text: async () => read('js/dice_utils.js') }
    if (url === 'toy/meeple.svg')       return { ok: true, text: async () => read('meeple.svg') }
    throw new Error(`unexpected fetch: ${url}`)
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

async function bootApp(toys) {
  document.body.innerHTML = `
    <div id="stage"><svg id="canvas" xmlns="http://www.w3.org/2000/svg"><defs></defs>
      <g id="background-layer"></g><g id="boun_pos-layer"></g><g id="toys-layer"></g>
      <g id="drawing-layer"></g><g id="overlay-layer"></g><g id="delight-layer"></g></svg></div>`
  const svgEl = document.getElementById('canvas')
  const { addToy, activateAllToyScriptsDom } = await import('../../src/toys.js')
  const { boot, App } = await import('../../src/app.js')
  const { tablesAPI } = await import('../../src/tables.js')
  const ydoc = tablesAPI.makeDoc()
  const layerEl = svgEl.querySelector('#toys-layer')
  const awareness = new awarenessProtocol.Awareness(ydoc)
  const user = { id: 'bailey', name: 'Bailey', color: '#0f0', gradient: { c1: '#0f0', c2: '#0a0', angle: 45 } }
  for (const t of toys) await addToy(ydoc, layerEl, { color: '#abc', ...t })
  activateAllToyScriptsDom(ydoc, layerEl)
  await new Promise(r => setTimeout(r, 0))
  awareness.setLocalState({ user, cursor: null, desired: {} })
  boot({ ydoc, awareness, provider: { on: vi.fn(), signalingConns: [] }, user,
         tableId: 'test-room', isCreator: true, svgElement: svgEl })
  return { App, svgEl }
}

const dice = () => [
  { id: 'a', toyType: 'dice_d6', x: 0,   y: 0 },
  { id: 'b', toyType: 'dice_d6', x: 200, y: 50 },
  { id: 'c', toyType: 'dice_d6', x: 100, y: 300 },
]

describe('group action square', () => {
  test('three dice share a default action; the square sits at the SE-most corner', async () => {
    const { App } = await bootApp(dice())
    App.select('a'); App.toggleSelection('b'); App.toggleSelection('c')
    const group = App.getGroupAction()
    expect(group.ids.sort()).toEqual(['a', 'b', 'c'])
    expect(group.key).toBe('Roll')

    const corners = ['a', 'b', 'c'].map(id => { const g = App.getBBox(id); return { x: g.x + g.width + 6, y: g.y + g.height + 6 } })
    const best = corners.reduce((m, p) => (p.x + p.y > m.x + m.y ? p : m))
    expect(group.origin).toEqual(best)
  })

  test('the overlay draws exactly one square for the group', async () => {
    const { App, svgEl } = await bootApp(dice())
    App.select('a'); App.toggleSelection('b'); App.toggleSelection('c')
    const { render } = await import('../../src/overlay.js')
    render()
    expect(svgEl.querySelectorAll('#overlay-layer .groupAction .actionSquare').length).toBe(1)
  })

  test('clicking the square invokes the action on every die', async () => {
    const { App } = await bootApp(dice())
    App.select('a'); App.toggleSelection('b'); App.toggleSelection('c')
    const spy = vi.spyOn(App, 'invokeToyMenuActions')
    const { origin } = App.getGroupAction()
    expect(App.fireGroupActionAt({ x: origin.x + 3, y: origin.y - 3 })).toBe(true)
    expect(spy).toHaveBeenCalledTimes(1)
    const [ids, , key] = spy.mock.calls[0]
    expect([...ids].sort()).toEqual(['a', 'b', 'c'])
    expect(key).toBe('Roll')
  })

  test('a click away from the square does nothing', async () => {
    const { App } = await bootApp(dice())
    App.select('a'); App.toggleSelection('b')
    const spy = vi.spyOn(App, 'invokeToyMenuActions')
    expect(App.fireGroupActionAt({ x: -500, y: -500 })).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })

  test('no square when a member has no menu action', async () => {
    const { App } = await bootApp([dice()[0], { id: 'p', toyType: 'meeple', x: 200, y: 0 }])
    App.select('a'); App.toggleSelection('p')
    expect(App.getGroupAction()).toBeNull()
  })

  test('no square for a single selection', async () => {
    const { App } = await bootApp(dice())
    App.select('a')
    expect(App.getGroupAction()).toBeNull()
  })
})
