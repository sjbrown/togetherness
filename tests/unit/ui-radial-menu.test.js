// @vitest-environment jsdom
import { describe, test, expect, vi, beforeAll, beforeEach } from 'vitest'
import { init, onRadialMenu, UIData } from '../../src/ui.js'

const closeRadialMenu = vi.fn()

// ui.init adds a document listener each call, so it runs once; the elements
// are looked up fresh on every press.
beforeAll(() => {
  document.body.innerHTML = '<div id="pill"></div>'
  init({
    getSelectedIds: () => [],
    getTools:       () => [],
    getActiveLayer: () => 'drawing',
    closeRadialMenu,
  })
})

beforeEach(() => {
  document.body.innerHTML = `
    <div id="pill"></div>
    <button id="menuBtn"></button><div id="menuItems"><button id="item"></button></div>
    <div id="panel"><button id="panelBtn"></button><div id="tool"></div></div>
    <div id="stage"></div>`
  onRadialMenu(false)
  closeRadialMenu.mockClear()
})

const press = (sel) =>
  document.querySelector(sel).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))

describe('radial menu and the chrome', () => {
  test('hides the pill while open and restores it on close', () => {
    onRadialMenu(true)
    expect(document.getElementById('pill').classList.contains('radial-open')).toBe(true)
    expect(UIData.radialOpen).toBe(true)
    onRadialMenu(false)
    expect(document.getElementById('pill').classList.contains('radial-open')).toBe(false)
  })

  test.each(['#menuBtn', '#item', '#panelBtn', '#tool'])('a press on %s closes it', (sel) => {
    onRadialMenu(true)
    press(sel)
    expect(closeRadialMenu).toHaveBeenCalledTimes(1)
  })

  test('a press on the stage leaves it to the canvas', () => {
    onRadialMenu(true)
    press('#stage')
    expect(closeRadialMenu).not.toHaveBeenCalled()
  })

  test('presses on the chrome do nothing while no menu is open', () => {
    press('#panelBtn')
    expect(closeRadialMenu).not.toHaveBeenCalled()
  })
})
