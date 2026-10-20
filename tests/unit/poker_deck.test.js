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
// toy:add places and initializes the toy at once, as the app does once its
// template has loaded.
let removeListeners, ydocRef
function wirePlatform(ydoc, layerEl) {
  ydocRef = ydoc
  let n = 0
  const on = (name, fn) => {
    document.addEventListener(name, fn)
    return () => document.removeEventListener(name, fn)
  }
  removeListeners = [
    on('toy:add', (e) => {
      const { toyType, x, y, color, initArgs } = e.detail
      const svg = { single_poker_card: CARD_SVG, card_pile: PILE_SVG }[toyType]
      const toyEl = addToyDom(ydoc, layerEl, { id: `new${n++}`, toyType, x, y, color }, svg)
      runInitializers(toyEl, toyType, initArgs)
    }),
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
  wirePlatform(ydoc, layerEl)
  const place = (id, toyType, svg, x = 100, y = 100) =>
    addToyDom(ydoc, layerEl, { id, toyType, x, y, color: '#fa2020' }, svg)
  place('seed', 'single_poker_card', CARD_SVG)
  const deckEls = [place('deck1', 'poker_deck', DECK_SVG, 100), place('deck2', 'poker_deck', DECK_SVG, 400)]
  place('pile1', 'card_pile', PILE_SVG, 700, 100)
  activateAllToyScriptsDom(ydoc, layerEl)
  await new Promise(r => setTimeout(r, 0))
  deleteEl(layerEl, 'seed')
  // Decks are stocked on initialize, as when a user places one.
  deckEls.forEach(el => runInitializers(el, 'poker_deck'))
  return { ydoc, layerEl, place }
}

// A card made for no deck, lying on the table.
function loose(place, id, suit, rank) {
  const placed = place(id, 'single_poker_card', CARD_SVG)
  const el = placed.toyEl ?? placed
  runInitializers(el, 'single_poker_card', { suit, rank })
  return el
}

const inDeck = (layerEl, deckId) =>
  [...layerEl.querySelectorAll(`[data-id="${deckId}"] > svg > .tt_contents > [data-toy-type="single_poker_card"]`)]
const labels = (el) => getMenuActions(el).map(a => a.label)
const draw = (t, deckId, params) =>
  invokeMenuAction(t.ydoc, t.layerEl, findEl(t.layerEl, deckId), 'poker_deck', 'Draw', undefined, AUTHOR, TABLE, params)

describe('registration', () => {
  test('the deck is a palette tool and the pile a placeable toy type', () => {
    expect(TOY_TYPES.poker_deck.file).toBe('poker_deck.svg')
    expect(TOY_TYPES.card_pile.file).toBe('card_pile.svg')
  })
})

describe('poker_deck', () => {
  test('a placed deck holds all 52 distinct cards inside its own contents, face down', async () => {
    const { layerEl } = await table()
    const cards = inDeck(layerEl, 'deck1')
    expect(cards).toHaveLength(52)
    expect(new Set(cards.map(c => `${c.dataset.suit}.${c.dataset.rank}`)).size).toBe(52)
    expect(cards.every(c => c.getAttribute('data-home-deck') === 'deck1')).toBe(true)
    expect(labels(findEl(layerEl, 'deck1'))).toEqual(['Draw (52)'])
  })

  test('a detached preview does not stock itself, and a stocked deck is not restocked', async () => {
    const t = await table()
    const adds = vi.fn()
    document.addEventListener('toy:add', adds)
    const detached = document.createElementNS(SVG_NS, 'g')
    runInitializers(detached, 'poker_deck')
    runInitializers(findEl(t.layerEl, 'deck1'), 'poker_deck')
    document.removeEventListener('toy:add', adds)
    expect(adds).not.toHaveBeenCalled()
  })

  test('Draw moves a card out of the deck onto the table', async () => {
    const t = await table()
    draw(t, 'deck1')
    expect(inDeck(t.layerEl, 'deck1')).toHaveLength(51)
    const out = t.layerEl.querySelectorAll(':scope > [data-toy-type="single_poker_card"]')
    expect(out).toHaveLength(1)
    expect(out[0].getAttribute('data-home-deck')).toBe('deck1')
    expect(labels(findEl(t.layerEl, 'deck1'))).toEqual(['Draw (51)', 'Reshuffle'])
  })

  test('Draw with num deals that many distinct cards', async () => {
    const t = await table()
    draw(t, 'deck1', { num: 4 })
    const out = [...t.layerEl.querySelectorAll(':scope > [data-toy-type="single_poker_card"]')]
    expect(out).toHaveLength(4)
    expect(new Set(out.map(c => `${c.dataset.suit}.${c.dataset.rank}`)).size).toBe(4)
  })

  test('drawing from one deck leaves the other alone', async () => {
    const t = await table()
    draw(t, 'deck1')
    expect(inDeck(t.layerEl, 'deck2')).toHaveLength(52)
  })

  test('Reshuffle moves every card of this deck back in, from the table or a pile', async () => {
    const t = await table()
    draw(t, 'deck1', { num: 3 })
    draw(t, 'deck2')
    const [a] = t.layerEl.querySelectorAll(':scope > [data-home-deck="deck1"]')
    reparentToyDom(t.layerEl, a.getAttribute('data-id'), 'pile1')

    invokeMenuAction(t.ydoc, t.layerEl, findEl(t.layerEl, 'deck1'), 'poker_deck', 'Reshuffle', undefined, AUTHOR, TABLE)

    expect(inDeck(t.layerEl, 'deck1')).toHaveLength(52)
    expect(inDeck(t.layerEl, 'deck2')).toHaveLength(51) // the other deck's card stays out
    expect(t.layerEl.querySelectorAll(':scope > [data-home-deck="deck1"]')).toHaveLength(0)
  })

  test('deleting a drawn card discards it; the deck does not take it back', async () => {
    const t = await table()
    draw(t, 'deck1')
    const card = t.layerEl.querySelector(':scope > [data-home-deck="deck1"]')
    deleteEl(t.layerEl, card.getAttribute('data-id'))
    expect(inDeck(t.layerEl, 'deck1')).toHaveLength(51)
    expect(labels(findEl(t.layerEl, 'deck1'))).toEqual(['Draw (51)'])
  })
})

describe('single_poker_card: Return to deck', () => {
  test("is offered only to a drawn card whose own deck is on the table", async () => {
    const t = await table()
    draw(t, 'deck1')
    const drawn = t.layerEl.querySelector(':scope > [data-home-deck="deck1"]')
    const plain = loose(t.place, 'plain', 2, 2)

    expect(labels(drawn)).toContain('Return to deck')
    expect(labels(plain)).not.toContain('Return to deck')

    deleteEl(t.layerEl, 'deck1')
    expect(labels(drawn)).not.toContain('Return to deck')
  })

  test('moves the card, face down, into the deck it came from and not another', async () => {
    const t = await table()
    draw(t, 'deck2')
    const card = t.layerEl.querySelector(':scope > [data-home-deck="deck2"]')
    const id = card.getAttribute('data-id')
    const key = `${card.dataset.suit}.${card.dataset.rank}`
    globalThis.single_poker_card.flip_card(card)
    expect(card.querySelector('.card_front + .card_back')).toBeNull() // face up

    invokeMenuAction(t.ydoc, t.layerEl, card, 'single_poker_card', 'Return to deck', undefined, AUTHOR, TABLE)

    const inside = inDeck(t.layerEl, 'deck2').find(c => c.getAttribute('data-id') === id)
    expect(inside).toBeTruthy()
    expect(`${inside.dataset.suit}.${inside.dataset.rank}`).toBe(key)
    expect(inside.querySelector('.card_front + .card_back')).not.toBeNull() // face down again
    expect(inDeck(t.layerEl, 'deck2')).toHaveLength(52)
    expect(inDeck(t.layerEl, 'deck1')).toHaveLength(52)
  })

  test('a card with no deck option initializes as before', async () => {
    const t = await table()
    const el = loose(t.place, 'c1', 3, 11)
    expect(el.dataset.suit).toBe('3')
    expect(el.hasAttribute('data-home-deck')).toBe(false)
  })
})

describe('stacking cards into a card_pile and fanning it', () => {
  // Cards a, b, c stacked bottom to top, the way snapping links them.
  async function stackedCards() {
    const t = await table()
    const [a, b, c] = ['a', 'b', 'c'].map((id, i) => loose(t.place, id, 1, i + 1))
    a.setAttribute('data-below', 'b'); b.setAttribute('data-above', 'a')
    b.setAttribute('data-below', 'c'); c.setAttribute('data-above', 'b')
    return { ...t, a, b, c }
  }

  test('Stack is offered to any card in a chain, and not to a lone card', async () => {
    const { b, place } = await stackedCards()
    expect(labels(b)).toContain('Stack')
    expect(labels(loose(place, 'solo', 2, 2))).not.toContain('Stack')
  })

  test('Stack asks for one pile, at the bottom card, holding the whole chain in order', async () => {
    const { ydoc, layerEl, b } = await stackedCards()
    const adds = []
    const record = (e) => adds.push(e.detail)
    document.addEventListener('toy:add', record)
    try {
      invokeMenuAction(ydoc, layerEl, b, 'single_poker_card', 'Stack', undefined, AUTHOR, TABLE)
    } finally { document.removeEventListener('toy:add', record) }

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
