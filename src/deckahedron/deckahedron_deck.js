
function pile_offset(index) {
  return {
    x: 0.2 * index,
    y: 0.66 * index,
  }
}

var deckahedron_deck = {
  woundJSON: [
   {'id': 'w1', 'wound': true, 'exhaust_top': true, 'a': 1, 'b': 1, 'c': 1, 'd': 1,},
  ],

  blessingJSON: [
   {'id': 'b1', 'blessing': true, 'return_card': true, 'a': 4, 'b': 4, 'c': 3, 'd': 3,},
   {'id': 'b2', 'blessing': true, 'return_card': true, 'a': 4, 'b': 3, 'c': 4, 'd': 3,},
   {'id': 'b3', 'blessing': true, 'return_card': true, 'a': 4, 'b': 3, 'c': 3, 'd': 4,},
   {'id': 'b4', 'blessing': true, 'return_card': true, 'a': 3, 'b': 4, 'c': 4, 'd': 3,},
   {'id': 'b5', 'blessing': true, 'return_card': true, 'a': 3, 'b': 4, 'c': 3, 'd': 4,},
   {'id': 'b6', 'blessing': true, 'return_card': true, 'a': 3, 'b': 3, 'c': 4, 'd': 4,},
  ],

  deckJSON: [
   {'id': 1, 'xp': false, 'Stamina': false, 'a': 1, 'b': 1, 'c': 1, 'd': 1, 'crit': 'fail'},
   {'id': 2, 'xp': false, 'Stamina': false, 'a': 1, 'b': 2, 'c': 3, 'd': 2},
   {'id': 3, 'xp': false, 'Stamina': false, 'a': 1, 'b': 4, 'c': 3, 'd': 4},
   {'id': 4, 'xp': false, 'Stamina': false, 'a': 2, 'b': 2, 'c': 3, 'd': 4},
   {'id': 5, 'xp': false, 'Stamina': false, 'a': 2, 'b': 3, 'c': 2, 'd': 3},
   {'id': 6, 'xp': false, 'Stamina': false, 'a': 1, 'b': 2, 'c': 2, 'd': 3},
   {'id': 7, 'xp': false, 'Stamina': false, 'a': 2, 'b': 1, 'c': 2, 'd': 3},
   {'id': 8, 'xp': true,  'Stamina': false, 'a': 1, 'b': 1, 'c': 4, 'd': 1},
   {'id': 9, 'xp': true,  'Stamina': false, 'a': 2, 'b': 2, 'c': 1, 'd': 2},
   {'id': 10, 'xp': false, 'Stamina': false, 'a': 3, 'b': 1, 'c': 2, 'd': 2},
   {'id': 11, 'xp': false, 'Stamina': true, 'a': 3, 'b': 3, 'c': 4, 'd': 3},
   {'id': 12, 'xp': false, 'Stamina': true, 'a': 1, 'b': 3, 'c': 3, 'd': 4},
   {'id': 13, 'xp': false, 'Stamina': true, 'a': 3, 'b': 3, 'c': 4, 'd': 4},
   {'id': 14, 'xp': false, 'Stamina': true, 'a': 3, 'b': 4, 'c': 3, 'd': 4},
   {'id': 15, 'xp': true , 'Stamina': true, 'a': 1, 'b': 2, 'c': 2, 'd': 4},
   {'id': 16, 'xp': true,  'Stamina': true, 'a': 3, 'b': 2, 'c': 1, 'd': 2},
   {'id': 17, 'xp': true,  'Stamina': true, 'a': 4, 'b': 1, 'c': 1, 'd': 2},
   {'id': 18, 'xp': false, 'Stamina': true, 'a': 3, 'b': 4, 'c': 3, 'd': 4},
   {'id': 19, 'xp': false, 'Stamina': true, 'a': 1, 'b': 3, 'c': 4, 'd': 2},
   {'id': 20, 'xp': false, 'Stamina': true, 'a': 4, 'b': 4, 'c': 4, 'd': 4, 'crit': 'win'},
  ],

  generate_card: function(template, cardJSON, deckEl) {
    card = SVG().size(420, 420)
    card.attr({
      id: ( deckEl.id + '_card_' + cardJSON.id),
      class: `card draggable-group c${cardJSON.id} of_${deckEl.id}`,
    })
    card.node.dataset.cardId = cardJSON.id
    card.node.dataset.isWound = cardJSON.wound === true
    card.node.dataset.isBlessing = cardJSON.blessing === true

    let g_card = card.node.ownerDocument.importNode(template, true);
    g_card.classList.remove('card_template')
    g_card.removeAttribute('id')
    g_card.removeAttribute('display');

    card.node.appendChild(g_card)

    if (cardJSON.crit !== 'win') {
      g_card.querySelector('#g_crit_win').remove()
    }
    if (!cardJSON.xp) {
      g_card.querySelector('#g_xp').remove()
    }
    if (!cardJSON.return_card) {
      g_card.querySelector('#g_return_card').remove()
    }
    if (!cardJSON.exhaust_top) {
      g_card.querySelector('#g_exhaust_top').remove()
    }

    if (cardJSON.Stamina) {
      g_card.querySelector('#g_circle').remove()
    } else {
      g_card.querySelector('#g_stamina').remove()
    }
    if (!cardJSON.blessing) { 
      g_card.querySelector('#g_blessing_circle').remove()
    }
    if (!cardJSON.wound) {
      g_card.querySelector('#g_wound_circle').remove()
    }
    let anvils = [
      g_card.querySelector('#g_anvil_0'),
      g_card.querySelector('#g_anvil_1'),
      g_card.querySelector('#g_anvil_2'),
      g_card.querySelector('#g_anvil_3'),
    ]
    let blades = [
      g_card.querySelector('#g_blades_0'),
      g_card.querySelector('#g_blades_1'),
      g_card.querySelector('#g_blades_2'),
      g_card.querySelector('#g_blades_3'),
    ]
    let crowns = [
      g_card.querySelector('#g_crown_0'),
      g_card.querySelector('#g_crown_1'),
      g_card.querySelector('#g_crown_2'),
      g_card.querySelector('#g_crown_3'),
    ]
    let dragons = [
      g_card.querySelector('#g_dragon_0'),
      g_card.querySelector('#g_dragon_1'),
      g_card.querySelector('#g_dragon_2'),
      g_card.querySelector('#g_dragon_3'),
    ]
    for (var i = 0; i < 4; i++) {
      num = i+1
      if (num !== cardJSON.a) {
        g_card.querySelector('#g_anvil_' + num).remove()
      }
      if (num !== cardJSON.b) {
        g_card.querySelector('#g_blades_' + num).remove()
      }
      if (num !== cardJSON.c) {
        g_card.querySelector('#g_crown_' + num).remove()
      }
      if (num !== cardJSON.d) {
        g_card.querySelector('#g_dragon_' + num).remove()
      }
    }

    return card
  },

  reset_card_transformations: function(cardEl) {
    let backY = cardEl.querySelector('.card_back_y')
    let back = cardEl.querySelector('.card_back')
    let front = cardEl.querySelector('.card_front')
    let frontY = cardEl.querySelector('.card_front_y')

    frontY.style.backfaceVisibility = 'hidden'
    frontY.style.transition = '0.3s ease-in-out'
    frontY.style.transformOrigin = 'center'
    front.style.transition = '0.3s ease-in-out'
    front.style.transformOrigin= 'center'

    backY.style.backfaceVisibility = 'hidden'
    backY.style.transition = '0.3s ease-in-out'
    backY.style.transformOrigin = 'center'
    back.style.transition = '0.3s ease-in-out'
    back.style.transformOrigin= 'center'

    frontY.style.transform = 'rotateY(180deg)'
    front.style.transform = ''
    backY.style.transform = ''
    back.style.transform = ''

    parent = frontY.parentElement
    parent.insertBefore(frontY, backY)
  },

  generate_deck: function(elem) {
    local_doc = SVG.adopt(elem)
    deck = local_doc.findOne('#g_deck')
    deck.addClass('deck')
    deck_id = 'deck_' + base32.short_id()
    deck.id(deck_id)

    let template = elem.querySelector('#card_template')
    shuffle(this.deckJSON).map((cardJSON) => {
      card = this.generate_card(template, cardJSON, deck.node)
      this.endeck(deck.node, card.node)
    })
  },

  draw: function(deck) {
    let offset = pile_offset(
      deck.querySelectorAll('.card').length
    )

    //top_card = "last card"
    topVWrapper = deck.lastElementChild
    topCard = SVG.adopt(topVWrapper.querySelector('.card'))

    // Flip the card so that the front is facing the viewer
    front = topCard.findOne('.card_front_y')
    back = topCard.findOne('.card_back_y')
    front.parent().node.insertBefore(back.node, front.node)

    // Delete the vWrapper
    topVWrapper.remove()

    return topCard
  },

  buildViewWrapper: function(deck, card) {
    card_ = SVG.adopt(card)
    w = card_.width()
    h = card_.height()
    vWrapper = SVG().size(w, h)
    vWrapper.attr({
      id: `deckahedron_card_vwrapper${num}`,
      class: 'deckahedron_vwrapper',
      viewBox: `0 0 ${w} ${h}`,
    })
    let offset = pile_offset(
      deck.querySelectorAll('.card').length
    )
    vWrapper.center(w/2 + offset.x, h/2 + offset.y)
    vWrapper.add(card_)
    SVG.adopt(deck).add(vWrapper)
    return vWrapper
  },

  endeck: function(deck, card) {
    //console.log('endeck', deck.id, card.id)
    localDocEl = deck.closest('.deckahedron_deck')

    vWrapper = deckahedron_deck.buildViewWrapper(deck, card)

    deckahedron_deck.reset_reshuffle(deck)

    //Make sure the card goes into the deck FACE-DOWN
    front = card_.findOne('.card_front_y')
    back = card_.findOne('.card_back_y')
    front.parent().node.insertBefore(front.node, back.node)
  },

  reset_reshuffle: function(deck) {
    deck.style.transition = ''
    deck.style.transform = ''
  },

  reshuffle_handler: function(evt, elem) {
    let deck = elem.querySelector('.deck')
    local_doc = deck.closest('.deckahedron_deck')

    cardArray = []
    sDeck = SVG.adopt(deck)
    local_doc.querySelectorAll('.card').forEach((card) => {
      card.remove()
      cardArray.push(card)
    })
    shuffle(cardArray).map((card) => {
      deckahedron_deck.endeck(deck, card)
    })
    // Must go AFTER all the calls to endeck()
    deck.style.transition = '1s ease-in'
    deck.style.transformOrigin = 'center'
    deck.style.transform = 'rotate(360deg) rotateY(360deg)'
  },

}

