// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { describe, test, expect } from 'vitest'

const TOY_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/toy')
const load = (file, name) => new Function(`${fs.readFileSync(path.join(TOY_DIR, file), 'utf8')}\nreturn ${name}`)()

describe.each([['js/tray.js', 'tray'], ['js/container.js', 'container']])('%s set_text', (file, name) => {
  const ns = load(file, name)
  const tspan = (text) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    el.textContent = text
    return el
  }

  test('rewrites the existing text node in place', () => {
    const t = tspan('3')
    const node = t.firstChild
    ns.set_text(t, 7)
    expect(t.textContent).toBe('7')
    expect(t.firstChild).toBe(node)
  })

  test('creates the text when the tspan is empty', () => {
    const t = tspan('')
    ns.set_text(t, 0)
    expect(t.textContent).toBe('0')
    expect(t.childNodes.length).toBe(1)
  })

  test('collapses a tspan that already holds several nodes', () => {
    const t = tspan('5')
    t.appendChild(document.createTextNode('5'))
    ns.set_text(t, 5)
    expect(t.textContent).toBe('5')
    expect(t.childNodes.length).toBe(1)
  })
})
