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
const PILE_SVG = read('poker_card_pile.svg')
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
  removeListeners?.forEach(off => off())
  ydocRef = ydoc
  let n = 0
  const on = (name, fn) => {
    document.addEventListener(name, fn)
    return () => document.removeEventListener(name, fn)
  }
  removeListeners = [
    on('toy:add', (e) => {
      const { toyType, x, y, color, initArgs } = e.detail
      const svg = { single_poker_card: CARD_SVG, poker_card_pile: PILE_SVG }[toyType]
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
  for (const ns of ['poker_deck', 'single_poker_card', 'poker_card_pile', 'container']) delete globalThis[ns]
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === 'toy/poker_deck.svg')        return { ok: true, text: async () => DECK_SVG }
    if (url === 'toy/single_poker_card.svg') return { ok: true, text: async () => CARD_SVG }
    if (url === 'toy/poker_card_pile.svg')         return { ok: true, text: async () => PILE_SVG }
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
  place('pile1', 'poker_card_pile', PILE_SVG, 700, 100)
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
    expect(TOY_TYPES.poker_card_pile.file).toBe('poker_card_pile.svg')
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

describe('poker_deck: start_shuffled', () => {
  // Off the toys layer, so a deck is placed without a table around it.
  async function deckWith(options) {
    const t = await table()
    const el = addToyDom(t.ydoc, document.createElementNS(SVG_NS, 'g'),
      { id: 'd', toyType: 'poker_deck', x: 0, y: 0, color: '#fa2020' }, DECK_SVG)
    const pristine = [...el.querySelectorAll('.tt_contents > svg.card')].map(c => `${c.getAttribute('data-suit')}.${c.getAttribute('data-rank')}`)
    runInitializers(el, 'poker_deck', options)
    const after = [...el.querySelectorAll('.tt_contents > svg.card')].map(c => `${c.getAttribute('data-suit')}.${c.getAttribute('data-rank')}`)
    return { pristine, after, el }
  }

  test('the Tools panel offers it, on by default, and passes it through as an init arg', () => {
    const def = TOOLS.find(t => t.toyType === 'poker_deck')
    expect(def.defaults.start_shuffled).toBe(true)
    expect(def.options.find(o => o.key === 'start_shuffled')).toMatchObject({ kind: 'bool', show: ['add'] })
    expect(toolInitArgs(def, { fill: '#fff', start_shuffled: false }, '#000').start_shuffled).toBe(false)
    expect(toolInitArgs(def, { fill: '#fff', start_shuffled: true }, '#000').start_shuffled).toBe(true)
  })

  test('start_shuffled: true reorders the same 52 cards', async () => {
    const { pristine, after } = await deckWith({ start_shuffled: true })
    expect(after).toHaveLength(52)
    expect([...after].sort()).toEqual([...pristine].sort())
    expect(after).not.toEqual(pristine)
  })

  test('false or absent leaves the deck in the order the file has it', async () => {
    const off = await deckWith({ start_shuffled: false })
    expect(off.after).toEqual(off.pristine)
    const none = await deckWith(undefined)
    expect(none.after).toEqual(none.pristine)
  })

  test('a shuffled start still has every card at its own place in the stack', async () => {
    const { el } = await deckWith({ start_shuffled: true })
    const cards = [...el.querySelectorAll('.tt_contents > svg.card')]
    expect(cards.map(c => parseFloat(c.getAttribute('y')))).toEqual(stepsOf(52, 'y'))
    expect(cards.map(c => parseFloat(c.getAttribute('x')))).toEqual(stepsOf(52, 'x'))
  })
})

// Where the deck's own layout says card i sits and how big n cards make the
// deck, from its step constants, so retuning the look does not touch these.
const round2 = (v) => Math.round(v * 100) / 100
const stepsOf = (n, axis) => {
  const step = axis === 'x' ? globalThis.poker_deck.CARD_STEP_X : globalThis.poker_deck.CARD_STEP_Y
  return Array.from({ length: n }, (_, i) => (i === 0 ? 0 : round2(-step * i)))
}
const boxFor = (n) => {
  const { CARD_STEP_X, CARD_STEP_Y, CARD_WIDTH, CARD_HEIGHT } = globalThis.poker_deck
  const lean = round2(CARD_STEP_X * Math.max(0, n - 1))
  const rise = round2(CARD_STEP_Y * Math.max(0, n - 1))
  return { lean, rise, w: round2(CARD_WIDTH + lean), h: round2(CARD_HEIGHT + rise) }
}

describe('poker_deck: the cards fan up and to the left and the deck is as big as its stack', () => {
  const geom = (layerEl, id) => {
    const svg = findEl(layerEl, id).querySelector(':scope > svg')
    const [x, y, w, h] = ['x', 'y', 'width', 'height'].map(k => parseFloat(svg.getAttribute(k)))
    return { x, y, w, h, right: round2(x + w), bottom: round2(y + h), viewBox: svg.getAttribute('viewBox') }
  }
  const attr = (layerEl, id, k) => inDeck(layerEl, id).map(c => parseFloat(c.getAttribute(k)))

  test('the file ships laid out the way the deck would lay it out', async () => {
    const t = await table()
    const deck = findEl(t.layerEl, 'deck1')
    const before = { geom: geom(t.layerEl, 'deck1'), x: attr(t.layerEl, 'deck1', 'x'), y: attr(t.layerEl, 'deck1', 'y') }

    globalThis.poker_deck._place_cards(deck)
    globalThis.poker_deck._fit(deck)

    expect({ geom: geom(t.layerEl, 'deck1'), x: attr(t.layerEl, 'deck1', 'x'), y: attr(t.layerEl, 'deck1', 'y') }).toEqual(before)
    expect(attr(t.layerEl, 'deck1', 'y')).toEqual(stepsOf(52, 'y'))
    expect(attr(t.layerEl, 'deck1', 'x')).toEqual(stepsOf(52, 'x'))
  })

  test('drawing shrinks the deck from the top left; the bottom and right edges stay put', async () => {
    const t = await table()
    const before = geom(t.layerEl, 'deck1')

    draw(t, 'deck1', { num: 3 })

    const after = geom(t.layerEl, 'deck1')
    const want = boxFor(49)
    expect(after).toMatchObject({ w: want.w, h: want.h, viewBox: `${-want.lean} ${-want.rise} ${want.w} ${want.h}` })
    expect(after.bottom).toBe(before.bottom)
    expect(after.right).toBe(before.right)
    expect(Math.min(...attr(t.layerEl, 'deck1', 'y'))).toBe(-want.rise)
    expect(Math.min(...attr(t.layerEl, 'deck1', 'x'))).toBe(-want.lean)
  })

  test('returning a card grows it back', async () => {
    const t = await table()
    const before = geom(t.layerEl, 'deck1')
    draw(t, 'deck1', { num: 2 })
    giveBack(t, onTable(t.layerEl)[0])

    const after = geom(t.layerEl, 'deck1')
    const want = boxFor(51)
    expect(after).toMatchObject({ w: want.w, h: want.h })
    expect(after.bottom).toBe(before.bottom)
    expect(after.right).toBe(before.right)
    expect(attr(t.layerEl, 'deck1', 'y').at(-1)).toBe(-want.rise)
    expect(attr(t.layerEl, 'deck1', 'x').at(-1)).toBe(-want.lean)
  })

  test("Reshuffle keeps each position's place in the stack, and the deck the same size", async () => {
    const t = await table()
    const before = geom(t.layerEl, 'deck1')
    reshuffle(t, 'deck1')
    expect(attr(t.layerEl, 'deck1', 'y')).toEqual(stepsOf(52, 'y'))
    expect(attr(t.layerEl, 'deck1', 'x')).toEqual(stepsOf(52, 'x'))
    expect(geom(t.layerEl, 'deck1')).toEqual(before)
  })

  test('an emptied deck is one card in size; its outline stays at the base', async () => {
    const t = await table()
    const before = geom(t.layerEl, 'deck1')
    for (let i = 0; i < 11; i++) draw(t, 'deck1', { num: 5 }) // 10 x 5, then the last 2
    expect(inDeck(t.layerEl, 'deck1')).toHaveLength(0)
    const want = boxFor(0)
    expect(geom(t.layerEl, 'deck1')).toMatchObject({
      w: want.w, h: want.h, bottom: before.bottom, right: before.right, viewBox: `0 0 ${want.w} ${want.h}`,
    })
  })

  test('draws land level with the bottom card, not the middle of the tall deck', async () => {
    const t = await table()
    const { bottom } = geom(t.layerEl, 'deck1')
    const { CARD_HEIGHT } = globalThis.poker_deck
    draw(t, 'deck1')
    const svg = onTable(t.layerEl)[0].querySelector(':scope > svg')
    expect(parseFloat(svg.getAttribute('y')) + CARD_HEIGHT / 2).toBeCloseTo(bottom - CARD_HEIGHT / 2, 0)
  })
})

describe('poker_deck: deck_summary count', () => {
  const countOf = (layerEl, id) => findEl(layerEl, id).querySelector('.deck_summary .tspan_count').textContent

  test('the summary is a white circle inside tt_colored, like the pile', async () => {
    const { layerEl } = await table()
    const circle = findEl(layerEl, 'deck1').querySelector('.deck_summary > .tt_colored > .circle_deck_summary')
    expect(circle).not.toBeNull()
    expect(circle.getAttribute('fill')).toBe('#ffffff')
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

describe('stacking cards into a poker_card_pile and fanning it', () => {
  // Cards a, b, c stacked bottom to top, the way snapping links them.
  async function stackedCards() {
    const t = await table()
    const [a, b, c] = ['a', 'b', 'c'].map((id, i) => loose(t.place, id, 1, i + 1))
    a.setAttribute('data-below', 'b'); b.setAttribute('data-above', 'a')
    b.setAttribute('data-below', 'c'); c.setAttribute('data-above', 'b')
    return { ...t, a, b, c }
  }

  test('Pile is offered to any card in a chain, and not to a lone card', async () => {
    const { b, place } = await stackedCards()
    expect(labels(b)).toContain('Pile')
    expect(labels(loose(place, 'solo', 2, 2))).not.toContain('Pile')
  })

  test('Pile asks for one pile, at the bottom card, holding the whole chain in order', async () => {
    const { ydoc, layerEl, b } = await stackedCards()
    const adds = []
    const record = (e) => adds.push(e.detail)
    document.addEventListener('toy:add', record)
    try {
      invokeMenuAction(ydoc, layerEl, b, 'single_poker_card', 'Pile', undefined, AUTHOR, TABLE)
    } finally { document.removeEventListener('toy:add', record) }

    expect(adds).toHaveLength(1)
    expect(adds[0].toyType).toBe('poker_card_pile')
    expect(adds[0].initArgs).toEqual(['a', 'b', 'c'])
  })

  function fillPile(t) {
    runInitializers(findEl(t.layerEl, 'pile1'), 'poker_card_pile', ['a', 'b', 'c'])
    return findEl(t.layerEl, 'pile1')
  }

  test('a card entering the pile is cleared of its stacking links', async () => {
    const t = await stackedCards()
    expect(['a', 'b', 'c'].map(id => findEl(t.layerEl, id).getAttribute('data-below'))).toEqual(['b', 'c', ''])

    const pile = fillPile(t)

    for (const card of pile.querySelectorAll('.tt_contents > .toy')) {
      expect(card.getAttribute('data-above')).toBe('')
      expect(card.getAttribute('data-below')).toBe('')
    }
  })

  const cardXY = (el) => {
    const svg = el.querySelector(':scope > svg')
    return [parseFloat(svg.getAttribute('x')), parseFloat(svg.getAttribute('y'))]
  }

  test('cards in a pile lie off-centre by whole pixels, within JITTER either way', async () => {
    const t = await stackedCards()
    const J = globalThis.poker_card_pile.JITTER
    const pile = fillPile(t)
    for (const card of pile.querySelectorAll('.tt_contents > .toy')) {
      for (const v of cardXY(card)) {
        expect(Number.isInteger(v)).toBe(true)
        expect(Math.abs(v)).toBeLessThanOrEqual(J) // the card lands at 0, 0 before jitter
      }
    }
  })

  test('the random range reaches -JITTER and +JITTER and nothing past them', async () => {
    const J = (await stackedCards(), globalThis.poker_card_pile.JITTER)
    for (const [roll, want] of [[0, -J], [0.9999999, J]]) {
      const t = await stackedCards()
      const spy = vi.spyOn(Math, 'random').mockReturnValue(roll)
      try {
        const pile = fillPile(t)
        for (const card of pile.querySelectorAll('.tt_contents > .toy')) {
          expect(cardXY(card)).toEqual([want, want])
        }
      } finally { spy.mockRestore() }
    }
  })

  test('a card is never left exactly on the landing point, even on a (0, 0) roll', async () => {
    const t = await stackedCards()
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
    try {
      const pile = fillPile(t)
      for (const card of pile.querySelectorAll('.tt_contents > .toy')) {
        expect(cardXY(card)).toEqual([1, 0])
      }
    } finally { spy.mockRestore() }
  })

  test('a card dropped onto an existing pile is scattered too, and the others stay where they were', async () => {
    const t = await stackedCards()
    const pile = fillPile(t)
    const J = globalThis.poker_card_pile.JITTER
    const before = Object.fromEntries([...pile.querySelectorAll('.tt_contents > .toy')].map(c => [c.getAttribute('data-id'), cardXY(c)]))

    loose(t.place, 'dropped', 3, 3)
    reparentToyDom(t.layerEl, 'dropped', 'pile1')

    const dropped = pile.querySelector('.tt_contents > [data-id="dropped"]')
    const [x, y] = cardXY(dropped)
    expect([x, y]).not.toEqual([0, 0])
    expect(Number.isInteger(x) && Number.isInteger(y)).toBe(true)
    expect(Math.max(Math.abs(x), Math.abs(y))).toBeLessThanOrEqual(J)
    for (const [id, xy] of Object.entries(before)) {
      expect(cardXY(pile.querySelector(`.tt_contents > [data-id="${id}"]`))).toEqual(xy)
    }
  })

  test('different cards get different offsets', async () => {
    const t = await stackedCards()
    const pile = fillPile(t)
    const spots = [...pile.querySelectorAll('.tt_contents > .toy')].map(c => cardXY(c).join(','))
    expect(new Set(spots).size).toBeGreaterThan(1)
  })

  test("the pile leaves room around its cards for the jitter, and has no edge rectangles", async () => {
    const t = await stackedCards()
    const J = globalThis.poker_card_pile.JITTER
    const pile = fillPile(t)
    const [vx, vy, vw, vh] = pile.querySelector(':scope > svg').getAttribute('viewBox').split(/\s+/).map(Number)
    expect(vx).toBeLessThanOrEqual(-J)
    expect(vy).toBeLessThanOrEqual(-J)
    expect(vx + vw).toBeGreaterThanOrEqual(100 + J)
    expect(vy + vh).toBeGreaterThanOrEqual(150 + J)
    expect(pile.querySelector('.pile_edge_1, .pile_edge_2')).toBeNull()
  })

  test('Draw from a two-card pile deals both, since a pile of one makes no sense', async () => {
    const t = await stackedCards()
    runInitializers(findEl(t.layerEl, 'pile1'), 'poker_card_pile', ['a', 'b'])

    invokeMenuAction(t.ydoc, t.layerEl, findEl(t.layerEl, 'pile1'), 'poker_card_pile', 'Draw', undefined, AUTHOR, TABLE)

    expect(findEl(t.layerEl, 'pile1')).toBeNull()
    expect(findEl(t.layerEl, 'a')).not.toBeNull()
    expect(findEl(t.layerEl, 'b')).not.toBeNull()
  })

  test('the pile takes its cards in and shows how many', async () => {
    const t = await stackedCards()
    const pile = fillPile(t)
    const inside = [...pile.querySelectorAll('.tt_contents > .toy')]
    expect(inside.map(el => el.getAttribute('data-id'))).toEqual(['a', 'b', 'c'])
    expect(pile.querySelector('.tspan_count').textContent).toBe('3')
    expect(labels(inside[0])).not.toContain('Pile') // inside a pile, nothing to stack with
  })

  test('Draw takes the top card out of the pile', async () => {
    const t = await stackedCards()
    const pile = fillPile(t)

    invokeMenuAction(t.ydoc, t.layerEl, pile, 'poker_card_pile', 'Draw', undefined, AUTHOR, TABLE)

    const c = findEl(t.layerEl, 'c')
    expect(c).not.toBeNull()
    expect(c.getAttribute('data-above')).toBe('')
    expect(pile.querySelector('.tspan_count').textContent).toBe('2')
  })

  test('Fan lays every card out on the table, in order, and removes the pile', async () => {
    const t = await stackedCards()
    const pile = fillPile(t)

    invokeMenuAction(t.ydoc, t.layerEl, pile, 'poker_card_pile', 'Fan', undefined, AUTHOR, TABLE)

    expect(findEl(t.layerEl, 'pile1')).toBeNull()
    const xs = ['a', 'b', 'c'].map(id => {
      const el = findEl(t.layerEl, id)
      expect(el).not.toBeNull()
      return parseFloat(el.querySelector(':scope > svg').getAttribute('x'))
    })
    expect(xs[0]).toBeLessThan(xs[1])
    expect(xs[1]).toBeLessThan(xs[2])
  })

  test('Fan curves: the middle card stays highest and the ends drop symmetrically', async () => {
    const t = await stackedCards()
    const pile = fillPile(t)

    invokeMenuAction(t.ydoc, t.layerEl, pile, 'poker_card_pile', 'Fan', undefined, AUTHOR, TABLE)

    const [ya, yb, yc] = ['a', 'b', 'c'].map(id =>
      parseFloat(findEl(t.layerEl, id).querySelector(':scope > svg').getAttribute('y')))
    expect(ya).toBeGreaterThan(yb)  // y grows downward: the ends sit lower
    expect(yc).toBeGreaterThan(yb)
    expect(ya).toBeCloseTo(yc, 5)
    expect(ya - yb).toBeGreaterThan(1) // a visible curve, not a rounding-error one
  })
})

describe('card and deck markup', () => {
  test('a nested card writes its big rank and suit as one <text> with two positioned tspans', async () => {
    const { layerEl } = await table()
    const card = inDeck(layerEl, 'deck1')[0]
    const texts = card.querySelectorAll('.card_front > text')
    expect(texts).toHaveLength(2) // rank + suit together, then the corner index
    const [rank, suit] = texts[0].querySelectorAll('tspan')
    expect(rank.className.baseVal).toBe('tspan_rank')
    expect(suit.className.baseVal).toBe('tspan_suit')
    expect([rank, suit].every(t => t.hasAttribute('x') && t.hasAttribute('y'))).toBe(true)
  })

  test('a deck is a container with no landing point or snap points; a pile has a landing point', async () => {
    const t = await table()
    expect(findEl(t.layerEl, 'deck1').querySelector('[class*="tt_positions"]')).toBeNull()
    expect(findEl(t.layerEl, 'pile1').querySelector('[class*="tt_positions"] circle')).not.toBeNull()
  })
})
