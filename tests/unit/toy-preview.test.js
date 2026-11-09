/**
 * tests/unit/toy-preview.test.js
 *
 * buildToyPreview: a toy as it would be placed, but inert, so delight and
 * UI modules can use copies freely without them reading as toys.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { describe, test, expect } from 'vitest'
import { buildToyPreview, colorMatrixValues } from '../../src/layer_toys.js'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const D6_SVG = fs.readFileSync(path.resolve(__dir, '../../src/toy/dice_d6.svg'), 'utf8')

describe('buildToyPreview', () => {
  test('is centred on (x, y) at the toy’s placed size', () => {
    const g = buildToyPreview('dice_d6', D6_SVG, { color: '#3060c0' }, { x: 200, y: 300 })
    const svg = g.firstElementChild
    expect(svg.getAttribute('x')).toBe('160')
    expect(svg.getAttribute('y')).toBe('250')
    expect(svg.getAttribute('width')).toBe('80')
    expect(svg.getAttribute('height')).toBe('100')
  })

  test('defaults to centring on the origin', () => {
    const svg = buildToyPreview('dice_d6', D6_SVG, { color: '#3060c0' }).firstElementChild
    expect(svg.getAttribute('x')).toBe('-40')
  })

  test('is inert: nothing marks it as a toy, and no scripts', () => {
    const g = buildToyPreview('dice_d6', D6_SVG, { color: '#3060c0' })
    for (const attr of ['id', 'data-id', 'data-module', 'data-toy-type', 'class']) expect(g.hasAttribute(attr)).toBe(false)
    expect(g.querySelector('[data-toy-type], .toy')).toBeNull()
    expect(g.querySelector('script')).toBeNull()
  })

  test('is tinted with initArgs.color', () => {
    const g = buildToyPreview('dice_d6', D6_SVG, { color: '#3060c0' })
    expect(g.querySelector('feColorMatrix').getAttribute('values')).toBe(colorMatrixValues('#3060c0'))
  })

  test('scopes internal ids freshly, so copies never collide', () => {
    const a = buildToyPreview('dice_d6', D6_SVG, { color: '#3060c0' })
    const b = buildToyPreview('dice_d6', D6_SVG, { color: '#3060c0' })
    const ids = (g) => [...g.querySelectorAll('[id]')].map(n => n.id)
    expect(ids(a).length).toBeGreaterThan(0)
    expect(ids(a).filter(id => ids(b).includes(id))).toEqual([])
    // and its url(#…) references point at its own ids
    const filterRef = a.querySelector('[filter]')?.getAttribute('filter')
    expect(ids(a)).toContain(filterRef.match(/url\(#(.+)\)/)[1])
  })
})
