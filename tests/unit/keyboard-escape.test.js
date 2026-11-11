/**
 * tests/unit/keyboard-escape.test.js
 *
 * Escape cancels a pointer gesture in flight before it does anything else;
 * with nothing in flight it leaves attention mode, or deselects.
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest'
import { keyboardHandlers } from '../../src/events.js'

describe('Escape', () => {
  const app = {}
  beforeAll(() => keyboardHandlers(app))
  beforeEach(() => {
    Object.assign(app, {
      cancelGesture: vi.fn(() => false),
      attentionActive: vi.fn(() => false),
      attentionExit: vi.fn(),
      select: vi.fn(),
    })
  })
  const escape = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

  test('cancels a gesture in flight, and does nothing else', () => {
    app.cancelGesture.mockReturnValue(true)
    escape()
    expect(app.cancelGesture).toHaveBeenCalled()
    expect(app.select).not.toHaveBeenCalled()
    expect(app.attentionExit).not.toHaveBeenCalled()
  })

  test('with nothing in flight, deselects', () => {
    escape()
    expect(app.select).toHaveBeenCalledWith(null)
  })

  test('with nothing in flight, leaves attention mode first', () => {
    app.attentionActive.mockReturnValue(true)
    escape()
    expect(app.attentionExit).toHaveBeenCalled()
    expect(app.select).not.toHaveBeenCalled()
  })
})
