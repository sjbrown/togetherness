// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { ensureLayerId } from '../../src/op_layers.js'
import {
  TOYS_LAYER, TOY_TYPES, addToyDom, activateAllToyScriptsDom, reparentToyDom, deleteEl,
  findEl, getMenuActions, invokeMenuAction, runInitializers,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const TABLE   = 'test-table'
const AUTHOR  = 'tester'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const read = (f) => fs.readFileSync(path.join(TOY_DIR, f), 'utf8')
const DECK_SVG = read('poker_deck.svg')
const CARD_SVG = read('single_poker_card.svg')
const PILE_SVG = read('card_pile.svg')
const CONTAINER_JS = read('js/container.js')

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  ensureLayerId(layerEl, TOYS_LAYER)
  return layerEl
}

// The platform side of the toy:* events the deck, card and pile fire.
let adds, removeListeners
function wirePlatform(layerEl) {
  adds = []
  const on = (name, fn) => {
    document.addEventListener(name, fn)
    return () => document.removeEventListener(name, fn)
  }
  removeListeners = [
    on('toy:add', (e) => { adds.push(e.detail) }),
    on('toy:delete', (e) => { deleteEl(layerEl, e.detail.id) }),
    on('toy:reparent', (e) => { reparentToyDom(layerEl, e.detail.id, e.detail.containerId) }),
  ]
}

beforeEach(() => {
  _clearSvgTextCache()
  _resetToyScriptState()
  for (const ns of ['poker_deck', 'single_poker_card', 'card_pile', 'container']) delete globalThis[ns]
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === 'toy/poker_deck.svg')        return { ok: true, text: async () => DECK_SVG }
    if (url === 'toy/single_poker_card.svg') return { ok: true, text: async () => CARD_SVG }
    if (url === 'toy/card_pile.svg')         return { ok: true, text: async () => PILE_SVG }
    if (url === 'toy/js/container.js')       return { ok: true, text: async () => CONTAINER_JS }
    throw new Error(`unexpected fetch: ${url}`)
  }))
})
afterEach(() => {
  removeListeners?.forEach(off => off())
  vi.unstubAllGlobals()
})

async function table() {
  const ydoc = new Y.Doc()
  const layerEl = freshLayer()
  wirePlatform(layerEl)
  const place = (id, toyType, svg, x = 100, y = 100) =>
    addToyDom(ydoc, layerEl, { id, toyType, x, y, color: '#fa2020' }, svg)
  place('deck1', 'poker_deck', DECK_SVG)
  place('deck2', 'poker_deck', DECK_SVG, 400, 100)
  place('pile1', 'card_pile', PILE_SVG, 700, 100)
  place('seed', 'single_poker_card', CARD_SVG)
  activateAllToyScriptsDom(ydoc, layerEl)
  await new Promise(r => setTimeout(r, 0))
  deleteEl(layerEl, 'seed')
  return { ydoc, layerEl, place }
}

// A card dealt the way the deck deals one: initialized with its options.
function dealt(place, id, suit, rank, deck) {
  const placed = place(id, 'single_poker_card', CARD_SVG)
  const el = placed.toyEl ?? placed
  runInitializers(el, 'single_poker_card', { suit, rank, deck })
  return el
}

const labels = (el) => getMenuActions(el).map(a => a.label)

describe('registration', () => {
  test('the deck is a palette tool and the pile a placeable toy type', () => {
    expect(TOY_TYPES.poker_deck.file).toBe('poker_deck.svg')
    expect(TOY_TYPES.card_pile.file).toBe('card_pile.svg')
  })
})

describe('poker_deck', () => {
  test('a full deck offers Draw (52) and no Reshuffle', async () => {
    const { layerEl } = await table()
    expect(labels(findEl(layerEl, 'deck1'))).toEqual(['Draw (52)'])
  })

  test('Draw deals a card stamped with its deck, never one already out', async () => {
    const { ydoc, layerEl, place } = await table()
    const deck = findEl(layerEl, 'deck1')
    let i = 0
    for (let suit = 1; suit <= 4; suit++) for (let rank = 1; rank <= 13; rank++) {
      if (suit === 1 && rank === 1) continue // leave only the ace of hearts
      dealt(place, `c${i++}`, suit, rank, 'deck1')
    }
    expect(labels(deck)).toEqual(['Draw (1)', 'Reshuffle'])

    invokeMenuAction(ydoc, layerEl, deck, 'poker_deck', 'Draw', undefined, AUTHOR, TABLE)

    expect(adds).toHaveLength(1)
    expect(adds[0].toyType).toBe('single_poker_card')
    expect(adds[0].initArgs).toMatchObject({ suit: 1, rank: 1, deck: 'deck1' })
  })

  test('Draw with num deals that many distinct cards', async () => {
    const { ydoc, layerEl } = await table()
    invokeMenuAction(ydoc, layerEl, findEl(layerEl, 'deck1'), 'poker_deck', 'Draw', undefined, AUTHOR, TABLE, { num: 4 })
    expect(adds).toHaveLength(4)
    expect(new Set(adds.map(a => `${a.initArgs.suit}.${a.initArgs.rank}`)).size).toBe(4)
  })

  test('cards from another deck do not count against this one', async () => {
    const { layerEl, place } = await table()
    dealt(place, 'c1', 1, 1, 'deck2')
    expect(labels(findEl(layerEl, 'deck1'))).toEqual(['Draw (52)'])
    expect(labels(findEl(layerEl, 'deck2'))).toEqual(['Draw (51)', 'Reshuffle'])
  })

  test("Reshuffle takes this deck's cards off the table, wherever they are", async () => {
    const { ydoc, layerEl, place } = await table()
    dealt(place, 'c1', 1, 1, 'deck1')
    dealt(place, 'c2', 2, 2, 'deck1')
    dealt(place, 'other', 3, 3, 'deck2')
    reparentToyDom(layerEl, 'c2', 'pile1')

    invokeMenuAction(ydoc, layerEl, findEl(layerEl, 'deck1'), 'poker_deck', 'Reshuffle', undefined, AUTHOR, TABLE)

    expect(layerEl.querySelector('[data-id="c1"]')).toBeNull()
    expect(layerEl.querySelector('[data-id="c2"]')).toBeNull()
    expect(findEl(layerEl, 'other')).not.toBeNull()
  })
})

describe('single_poker_card: Return to deck', () => {
  test("is offered only while the card's own deck is on the table", async () => {
    const { layerEl, place } = await table()
    const mine = dealt(place, 'c1', 1, 1, 'deck2')
    const loose = dealt(place, 'c2', 2, 2, undefined)

    expect(labels(mine)).toContain('Return to deck')
    expect(labels(loose)).not.toContain('Return to deck')

    deleteEl(layerEl, 'deck2')
    expect(labels(mine)).not.toContain('Return to deck')
  })

  test('puts the card back in the deck it came from, not another', async () => {
    const { ydoc, layerEl, place } = await table()
    const card = dealt(place, 'c1', 1, 1, 'deck2')
    expect(labels(findEl(layerEl, 'deck2'))).toEqual(['Draw (51)', 'Reshuffle'])

    invokeMenuAction(ydoc, layerEl, card, 'single_poker_card', 'Return to deck', undefined, AUTHOR, TABLE)

    expect(findEl(layerEl, 'c1')).toBeNull()
    expect(labels(findEl(layerEl, 'deck2'))).toEqual(['Draw (52)'])
    expect(labels(findEl(layerEl, 'deck1'))).toEqual(['Draw (52)'])
  })

  test('a card with no deck option initializes as before', async () => {
    const { place } = await table()
    const el = dealt(place, 'c1', 3, 11, undefined)
    expect(el.dataset.suit).toBe('3')
    expect(el.hasAttribute('data-home-deck')).toBe(false)
  })
})

describe('stacking cards into a card_pile and fanning it', () => {
  // Cards a, b, c stacked bottom to top, the way snapping links them.
  async function stackedCards() {
    const t = await table()
    const [a, b, c] = ['a', 'b', 'c'].map((id, i) => dealt(t.place, id, 1, i + 1, 'deck1'))
    a.setAttribute('data-below', 'b'); b.setAttribute('data-above', 'a')
    b.setAttribute('data-below', 'c'); c.setAttribute('data-above', 'b')
    return { ...t, a, b, c }
  }

  test('Stack is offered to any card in a chain, and not to a lone card', async () => {
    const { b, place } = await stackedCards()
    expect(labels(b)).toContain('Stack')
    expect(labels(dealt(place, 'solo', 2, 2, 'deck1'))).not.toContain('Stack')
  })

  test('Stack asks for one pile, at the bottom card, holding the whole chain in order', async () => {
    const { ydoc, layerEl, b } = await stackedCards()

    invokeMenuAction(ydoc, layerEl, b, 'single_poker_card', 'Stack', undefined, AUTHOR, TABLE)

    expect(adds).toHaveLength(1)
    expect(adds[0].toyType).toBe('card_pile')
    expect(adds[0].initArgs).toEqual(['a', 'b', 'c'])
  })

  function fillPile(t) {
    runInitializers(findEl(t.layerEl, 'pile1'), 'card_pile', ['a', 'b', 'c'])
    return findEl(t.layerEl, 'pile1')
  }

  test('the pile takes its cards in and shows how many', async () => {
    const t = await stackedCards()
    const pile = fillPile(t)
    const inside = [...pile.querySelectorAll('.tt_contents > .toy')]
    expect(inside.map(el => el.getAttribute('data-id'))).toEqual(['a', 'b', 'c'])
    expect(pile.querySelector('.tspan_count').textContent).toBe('3')
    expect(labels(inside[0])).not.toContain('Stack') // inside a pile, nothing to stack with
  })

  test('Draw takes the top card out of the pile', async () => {
    const t = await stackedCards()
    const pile = fillPile(t)

    invokeMenuAction(t.ydoc, t.layerEl, pile, 'card_pile', 'Draw', undefined, AUTHOR, TABLE)

    const c = findEl(t.layerEl, 'c')
    expect(c).not.toBeNull()
    expect(c.getAttribute('data-above')).toBe('')
    expect(pile.querySelector('.tspan_count').textContent).toBe('2')
  })

  test('Fan lays every card out on the table, in order, and removes the pile', async () => {
    const t = await stackedCards()
    const pile = fillPile(t)

    invokeMenuAction(t.ydoc, t.layerEl, pile, 'card_pile', 'Fan', undefined, AUTHOR, TABLE)

    expect(findEl(t.layerEl, 'pile1')).toBeNull()
    const xs = ['a', 'b', 'c'].map(id => {
      const el = findEl(t.layerEl, id)
      expect(el).not.toBeNull()
      return parseFloat(el.querySelector(':scope > svg').getAttribute('x'))
    })
    expect(xs[0]).toBeLessThan(xs[1])
    expect(xs[1]).toBeLessThan(xs[2])
  })
})
