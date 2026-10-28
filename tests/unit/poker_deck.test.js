// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { ensureLayerId } from '../../src/op_layers.js'
import {
  TOYS_LAYER, TOY_TYPES, addToyDom, activateAllToyScriptsDom, reparentToyDom, deleteEl,
  findEl, getMenuActions, invokeMenuAction, runInitializers, getTtStateSchema, editEl, TOOLS, toolInitArgs,
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
  const decks = [place('deck1', 'poker_deck', DECK_SVG, 100), place('deck2', 'poker_deck', DECK_SVG, 400)]
  place('pile1', 'card_pile', PILE_SVG, 700, 100)
  activateAllToyScriptsDom(ydoc, layerEl)
  await new Promise(r => setTimeout(r, 0))
  deleteEl(layerEl, 'seed')
  decks.forEach(el => runInitializers(el, 'poker_deck'))
  return { ydoc, layerEl, place }
}

// A card made for no deck, lying on the table.
function loose(place, id, suit, rank) {
  const placed = place(id, 'single_poker_card', CARD_SVG)
  const el = placed.toyEl ?? placed
  runInitializers(el, 'single_poker_card', { suit, rank })
  return el
}

// The deck's own nested cards, bottom to top, as "suit.rank".
const inDeck = (layerEl, deckId) =>
  [...layerEl.querySelectorAll(`[data-id="${deckId}"] > svg > .tt_contents > svg.card`)]
const order = (layerEl, deckId) => inDeck(layerEl, deckId).map(c => `${c.getAttribute('data-suit')}.${c.getAttribute('data-rank')}`)
const onTable = (layerEl) => [...layerEl.querySelectorAll(':scope > [data-toy-type="single_poker_card"]')]
const key = (el) => `${el.dataset.suit}.${el.dataset.rank}`
const labels = (el) => getMenuActions(el).map(a => a.label)
const draw = (t, deckId, params) =>
  invokeMenuAction(t.ydoc, t.layerEl, findEl(t.layerEl, deckId), 'poker_deck', 'Draw', undefined, AUTHOR, TABLE, params)
const reshuffle = (t, deckId) =>
  invokeMenuAction(t.ydoc, t.layerEl, findEl(t.layerEl, deckId), 'poker_deck', 'Reshuffle', undefined, AUTHOR, TABLE)
const giveBack = (t, card) =>
  invokeMenuAction(t.ydoc, t.layerEl, card, 'single_poker_card', 'Return to deck', undefined, AUTHOR, TABLE)

describe('registration', () => {
  test('the deck is a palette tool and the pile a placeable toy type', () => {
    expect(TOY_TYPES.poker_deck.file).toBe('poker_deck.svg')
    expect(TOY_TYPES.card_pile.file).toBe('card_pile.svg')
  })
})

describe('poker_deck', () => {
  test('the file itself holds 52 distinct nested <svg> cards, in the deck\'s contents, backs up', async () => {
    const { layerEl } = await table()
    const cards = inDeck(layerEl, 'deck1')
    expect(cards).toHaveLength(52)
    expect(new Set(order(layerEl, 'deck1')).size).toBe(52)
    expect(cards.every(c => c.querySelector('.card_front + .card_back'))).toBe(true)
    expect(layerEl.querySelectorAll('[data-toy-type="single_poker_card"]')).toHaveLength(0)
    expect(labels(findEl(layerEl, 'deck1'))).toEqual(['Draw (52)', 'Reshuffle'])
  })

  test("the deck's colour reaches every card's back through the shared filter", async () => {
    const { layerEl } = await table()
    const deck = findEl(layerEl, 'deck1')
    const filterId = deck.querySelector('filter.tt_color_filter').id
    const backs = deck.querySelectorAll('.tt_contents svg.card .card_back .tt_colored')
    expect(backs).toHaveLength(52)
    expect([...backs].every(b => b.getAttribute('filter') === `url(#${filterId})`)).toBe(true)
  })

  test('placing a deck does not fire any toy:add', async () => {
    const adds = vi.fn()
    document.addEventListener('toy:add', adds)
    try { await table() } finally { document.removeEventListener('toy:add', adds) }
    expect(adds).not.toHaveBeenCalled()
  })

  test('Draw takes the top card (the last in the deck), the top one first, as toys', async () => {
    const t = await table()
    const before = order(t.layerEl, 'deck1')

    draw(t, 'deck1', { num: 3 })

    expect(order(t.layerEl, 'deck1')).toEqual(before.slice(0, 49))
    const out = onTable(t.layerEl)
    expect(out.map(key)).toEqual(before.slice(49).reverse())
    expect(out.every(c => c.getAttribute('data-home-deck') === 'deck1')).toBe(true)
    expect(labels(findEl(t.layerEl, 'deck1'))).toEqual(['Draw (49)', 'Reshuffle'])
  })

  test('drawing from one deck leaves the other alone', async () => {
    const t = await table()
    const other = order(t.layerEl, 'deck2')
    draw(t, 'deck1')
    expect(order(t.layerEl, 'deck2')).toEqual(other)
  })

  test('Reshuffle changes the order of the cards in the deck, keeping the same 52', async () => {
    const t = await table()
    const before = order(t.layerEl, 'deck1')

    reshuffle(t, 'deck1')

    const after = order(t.layerEl, 'deck1')
    expect(after).toHaveLength(52)
    expect([...after].sort()).toEqual([...before].sort())
    expect(after).not.toEqual(before)
  })

  test('Reshuffle does not touch cards outside the deck, or another deck', async () => {
    const t = await table()
    draw(t, 'deck1', { num: 2 })
    const [first, second] = onTable(t.layerEl)
    reparentToyDom(t.layerEl, first.getAttribute('data-id'), 'pile1')
    const otherDeck = order(t.layerEl, 'deck2')

    reshuffle(t, 'deck1')

    expect(order(t.layerEl, 'deck1')).toHaveLength(50)
    expect(order(t.layerEl, 'deck2')).toEqual(otherDeck)
    expect(onTable(t.layerEl).map(c => c.getAttribute('data-id'))).toEqual([second.getAttribute('data-id')])
    expect(t.layerEl.querySelectorAll('[data-id="pile1"] .tt_contents > .toy')).toHaveLength(1)
  })

  test('deleting a drawn card discards it; the deck does not take it back', async () => {
    const t = await table()
    draw(t, 'deck1')
    deleteEl(t.layerEl, onTable(t.layerEl)[0].getAttribute('data-id'))
    expect(order(t.layerEl, 'deck1')).toHaveLength(51)
    expect(labels(findEl(t.layerEl, 'deck1'))).toEqual(['Draw (51)', 'Reshuffle'])
  })
})

describe('poker_deck: deck_summary count', () => {
  const countOf = (layerEl, id) => findEl(layerEl, id).querySelector('.deck_summary .tspan_count').textContent

  test('the summary is a white pill inside tt_colored, like stack_summary', async () => {
    const { layerEl } = await table()
    const rect = findEl(layerEl, 'deck1').querySelector('.deck_summary > .tt_colored > .rect_deck_summary')
    expect(rect).not.toBeNull()
    expect(rect.getAttribute('fill')).toBe('#ffffff')
  })

  test('shows the number of cards remaining, following draws and returns', async () => {
    const t = await table()
    expect(countOf(t.layerEl, 'deck1')).toBe('52')
    draw(t, 'deck1', { num: 3 })
    expect(countOf(t.layerEl, 'deck1')).toBe('49')
    expect(countOf(t.layerEl, 'deck2')).toBe('52')
    giveBack(t, onTable(t.layerEl)[0])
    expect(countOf(t.layerEl, 'deck1')).toBe('50')
  })

  test('show_count: false from the tool option hides it; omitted shows it', async () => {
    const t = await table()
    // Off the toys layer, so these are not stocked.
    const scratch = document.createElementNS(SVG_NS, 'g')
    const make = (id, opts) => {
      const el = addToyDom(t.ydoc, scratch, { id, toyType: 'poker_deck', x: 0, y: 0, color: '#fa2020' }, DECK_SVG)
      runInitializers(el, 'poker_deck', opts)
      return el
    }
    const hidden = make('deck3', { show_count: false })
    const shown = make('deck4', {})
    expect(hidden.querySelector('.deck_summary').getAttribute('display')).toBe('none')
    expect(shown.querySelector('.deck_summary').hasAttribute('display')).toBe(false)
  })

  test('the Tools panel offers show_count (default on) and passes it through as an init arg', () => {
    const def = TOOLS.find(t => t.toyType === 'poker_deck')
    expect(def.defaults.show_count).toBe(true)
    expect(def.options.find(o => o.key === 'show_count')).toMatchObject({ kind: 'bool', show: ['add'] })
    expect(toolInitArgs(def, { fill: '#fff', show_count: false }, '#000').show_count).toBe(false)
  })

  test('the Edit panel can toggle it on a placed deck', async () => {
    const { layerEl } = await table()
    const deck = findEl(layerEl, 'deck1')
    const schema = getTtStateSchema(deck)
    expect(schema.show_count).toBe(true)
    expect(schema.types.show_count).toMatchObject({ kind: 'bool', show: ['edit'] })

    editEl(deck, { show_count: false })
    expect(getTtStateSchema(deck).show_count).toBe(false)
    editEl(deck, { show_count: true })
    expect(getTtStateSchema(deck).show_count).toBe(true)
  })
})

describe('single_poker_card: Return to deck', () => {
  test('is offered only to a drawn card whose own deck is on the table', async () => {
    const t = await table()
    draw(t, 'deck1')
    const drawn = onTable(t.layerEl)[0]
    const plain = loose(t.place, 'plain', 2, 2)

    expect(labels(drawn)).toContain('Return to deck')
    expect(labels(plain)).not.toContain('Return to deck')

    deleteEl(t.layerEl, 'deck1')
    expect(labels(drawn)).not.toContain('Return to deck')
  })

  test('puts the same card back on top of its own deck as a nested <svg>, and removes the toy', async () => {
    const t = await table()
    draw(t, 'deck2')
    const card = onTable(t.layerEl)[0]
    const k = key(card)
    const id = card.getAttribute('data-id')
    expect(order(t.layerEl, 'deck2')).toHaveLength(51)

    giveBack(t, card)

    expect(findEl(t.layerEl, id)).toBeNull()
    expect(order(t.layerEl, 'deck2')).toHaveLength(52)
    expect(order(t.layerEl, 'deck2').at(-1)).toBe(k)
    expect(order(t.layerEl, 'deck1')).toHaveLength(52)
  })

  test('the returned card is a complete, face-down card with the right face', async () => {
    const t = await table()
    draw(t, 'deck1')
    const card = onTable(t.layerEl)[0]
    const rank = card.querySelector('.tspan_rank').textContent
    const suit = card.querySelector('.tspan_suit').textContent

    giveBack(t, card)

    const back = inDeck(t.layerEl, 'deck1').at(-1)
    expect(back.querySelector('.tspan_rank').textContent).toBe(rank)
    expect(back.querySelector('.tspan_suit').textContent).toBe(suit)
    expect(back.querySelector('.card_front + .card_back')).not.toBeNull()
    expect(back.querySelector('.card_back .tt_colored')).not.toBeNull()
    expect(back.hasAttribute('display')).toBe(false)
    expect(back.hasAttribute('id')).toBe(false)
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
