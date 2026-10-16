import { describe, test, expect } from 'vitest'
import { gradientVector } from '../../src/entity_gradient.js'

describe('gradientVector', () => {
  test('90° runs left to right across the box', () => {
    expect(gradientVector(90)).toEqual({ x1: 0, y1: 0.5, x2: 1, y2: 0.5 })
  })

  test('45° runs from the bottom-left corner to the top-right', () => {
    const v = gradientVector(45)
    expect(v.x1).toBeLessThan(v.x2)
    expect(v.y1).toBeGreaterThan(v.y2)
    expect(v.x1 + v.x2).toBeCloseTo(1, 5)
    expect(v.y1 + v.y2).toBeCloseTo(1, 5)
  })
})
