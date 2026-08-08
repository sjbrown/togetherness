// Tests for tables.js's playerOptions store — a per-player key-value map
// living on each table's own doc. See tables.js's "Player options" section.

import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import { tablesAPI } from '../../src/tables.js'

const { recordRecentToy, getRecentToys, ensurePlayerOptions } = tablesAPI

describe('recentToys', () => {
  test('starts empty for a player who has never gestured on this table', () => {
    const ydoc = new Y.Doc()
    expect(getRecentToys(ydoc, 'tt-p-v1-01-aaa')).toEqual([])
  })

  test('records a gesture, most-recent first', () => {
    const ydoc = new Y.Doc()
    recordRecentToy(ydoc, 'tt-p-v1-01-aaa', 'toy-1')
    recordRecentToy(ydoc, 'tt-p-v1-01-aaa', 'toy-2')
    recordRecentToy(ydoc, 'tt-p-v1-01-aaa', 'toy-3')
    expect(getRecentToys(ydoc, 'tt-p-v1-01-aaa')).toEqual(['toy-3', 'toy-2', 'toy-1'])
  })

  test('re-gesturing an already-present toy moves it to the front instead of duplicating', () => {
    const ydoc = new Y.Doc()
    recordRecentToy(ydoc, 'tt-p-v1-01-aaa', 'toy-1')
    recordRecentToy(ydoc, 'tt-p-v1-01-aaa', 'toy-2')
    recordRecentToy(ydoc, 'tt-p-v1-01-aaa', 'toy-1')
    expect(getRecentToys(ydoc, 'tt-p-v1-01-aaa')).toEqual(['toy-1', 'toy-2'])
  })

  test('recentToys can be different on two different tables for the SAME player', () => {
    const tableA = new Y.Doc()
    const tableB = new Y.Doc()
    const playerId = 'tt-p-v1-01-aaa'

    recordRecentToy(tableA, playerId, 'toy-map')
    recordRecentToy(tableA, playerId, 'toy-dice')

    recordRecentToy(tableB, playerId, 'toy-card')

    expect(getRecentToys(tableA, playerId)).toEqual(['toy-dice', 'toy-map'])
    expect(getRecentToys(tableB, playerId)).toEqual(['toy-card'])
  })

  test('different players on the same table have independent lists', () => {
    const ydoc = new Y.Doc()
    recordRecentToy(ydoc, 'player-A', 'toy-1')
    recordRecentToy(ydoc, 'player-B', 'toy-2')
    expect(getRecentToys(ydoc, 'player-A')).toEqual(['toy-1'])
    expect(getRecentToys(ydoc, 'player-B')).toEqual(['toy-2'])
  })

  test('caps the list at MAX_RECENT_TOYS, dropping the oldest', () => {
    const ydoc = new Y.Doc()
    const playerId = 'tt-p-v1-01-aaa'
    for (let i = 0; i < 15; i++) recordRecentToy(ydoc, playerId, `toy-${i}`)
    const recent = getRecentToys(ydoc, playerId)
    expect(recent.length).toBe(10)
    expect(recent[0]).toBe('toy-14')
    expect(recent).not.toContain('toy-0')
  })
})

describe('ensurePlayerOptions', () => {
  test('is idempotent — returns the same Y.Map on repeated calls', () => {
    const ydoc = new Y.Doc()
    const first  = ensurePlayerOptions(ydoc, 'tt-p-v1-01-aaa')
    const second = ensurePlayerOptions(ydoc, 'tt-p-v1-01-aaa')
    expect(first).toBe(second)
  })

  test('playerOptions lives under its own top-level Y.Map, keyed by player id', () => {
    const ydoc = new Y.Doc()
    ensurePlayerOptions(ydoc, 'tt-p-v1-01-aaa')
    const root = ydoc.getMap('playerOptions')
    expect(root.get('tt-p-v1-01-aaa')).toBeInstanceOf(Y.Map)
  })
})
