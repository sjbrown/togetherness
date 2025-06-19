
function pile_offset(index) {
  return {
    x: 0.2 * index,
    y: 0.66 * index,
  }
}

let svgEl
function centerSvg(card, cx, cy) {
  console.log('cent', card, cx, cy)
  const w = card.width;
  const h = card.height;
  //svgEl.move(cx - w / 2, cy - h / 2);
  card.node.setAttribute('x', cx - w / 2);
  card.node.setAttribute('y', cy - h / 2);
}


var deckahedron_deck = {
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
      dataset: { deckId: deckEl.id },
      class: 'card draggable-group',
    })
    card.addClass('c' + cardJSON.id)
    card.addClass('of_' + deckEl.id)

    let g_card = card.node.ownerDocument.importNode(template, true);
    g_card.classList.remove('card_template')
    g_card.removeAttribute('display');
    g_card.dataset.appNamespaces = ['deckahedron_deck_card']

    card.node.appendChild(g_card)

    if (cardJSON.crit !== 'win') {
      g_card.querySelector('#g_crit_win').remove()
    }
    if (!cardJSON.xp) {
      g_card.querySelector('#g_xp').remove()
    }

    if (cardJSON.Stamina) {
      g_card.querySelector('#g_circle').remove()
    } else {
      g_card.querySelector('#g_stamina').remove()
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

    // get_active_group() must be called BEFORE the other transforms reset
    let active_group = deckahedron_deck_card.get_active_group(cardEl)
    deckahedron_deck_card.toggle_boost(active_group, true)

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
    console.log('elem', elem)
    local_doc = SVG.adopt(elem)
    deck = local_doc.findOne('#g_deck')
    deck.addClass('deck')
    deck.addClass('contents_group')
    deck_id = 'deck_' + base32.short_id()
    deck.id(deck_id)

    let template = elem.querySelector('#card_template')
    shuffle(this.deckJSON).map((cardJSON) => {
      card = this.generate_card(template, cardJSON, deck.node)
      this.endeck(deck.node, card.node)
    })
  },

  draw: function(deck) {
    console.log('draw', deck.id)
    
    let offset = pile_offset(
      deck.querySelectorAll('.card').length
    )

    //top_card = "last card"
    top_card = SVG.adopt(deck.lastElementChild)

    // Undo the offset of endeck()
    centerSvg(top_card, 210, 210)

    // Flip the card so that the front is facing the viewer
    front = top_card.findOne('.card_front_y')
    back = top_card.findOne('.card_back_y')
    front.parent().node.insertBefore(back.node, front.node)

    return top_card

  },

  endeck: function(deck, card) {
    //console.log('endeck', deck.id, card.id)
    localDocEl = deck.closest('.deckahedron_deck')
    //deck_area = localDocEl.querySelector('#g_deck_area')
    //deck_area = SVG.adopt(deck_area)

    let offset = pile_offset(
      deck.querySelectorAll('.card').length
    )
    card_ = SVG.adopt(card)
    card_.cy(210 + offset.y)
    card_.cx(210 + offset.x)
    deck.appendChild(card)
    deckahedron_deck.reset_reshuffle(deck)
  },

  reset_reshuffle: function(deck) {
    deck.style.transition = ''
    deck.style.transform = ''
  },

  initialize: function(elem) {
    this.generate_deck(elem)
  },

  dblclick_handler: function(evt, elem) {
    // console.log('elem', elem.id)
    let deck = elem.querySelector('.deck')
    deckahedron_deck.reset_reshuffle(deck)
    return lock_selection(evt, elem)
  },

  /*
  flip_handler: function(evt) {
    let topcard = this.querySelector('.deck .card:last-child')
    deckahedron_deck.flip_card(topcard)
  },
  */

  reshuffle_handler: function(evt, elem) {
    let deck = elem.querySelector('.deck')
    local_doc = deck.closest('.deckahedron_deck')

    cardArray = []
    sDeck = SVG.adopt(deck)
    local_doc.querySelectorAll('.of_' + deck.id).forEach((card) => {
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


deckahedron_deck_card = {
  initialize: function(elem) {
    deckahedron_deck_card.addListeners(elem)
  },

  addListeners: function(elem) {
    elem.addEventListener('deckahedron_deck_card_return', this.return_handler)
  },

  return_handler: function(evt, elem) {
    let deck = byId(elem.dataset.deckId)
    push_to_parent(
      elem,
      deck,
      (cardEl, deckEl) => {
        s(cardEl, 'data-app-class', null)
        cardEl.classList.add('draggable-group')
        deckahedron_deck.reset_card_transformations(cardEl)
        deckahedron_deck.endeck(deckEl, cardEl)
      }
    )
  },

  anvil_handler: function(evt, elem) {
    let active_group = deckahedron_deck_card.get_active_group(elem)
    if (active_group.id !== 'anvil_result') {
      deckahedron_deck_card.toggle_boost(active_group, true)
      elem.querySelector('.card_front').style.transform = 'rotate(180deg)'
      elem.querySelector('.card_back').style.transform = 'rotate(-180deg)'
    } else {
      deckahedron_deck_card.toggle_boost(active_group)
    }
  },
  blades_handler: function(evt, elem) {
    let active_group = deckahedron_deck_card.get_active_group(elem)
    if (active_group.id !== 'blades_result') {
      deckahedron_deck_card.toggle_boost(active_group, true)
      elem.querySelector('.card_front').style.transform = 'rotate(-90deg)'
      elem.querySelector('.card_back').style.transform = 'rotate(90deg)'
    } else {
      deckahedron_deck_card.toggle_boost(active_group)
    }
  },
  crown_handler: function(evt, elem) {
    let active_group = deckahedron_deck_card.get_active_group(elem)
    if (active_group.id !== 'crown_result') {
      deckahedron_deck_card.toggle_boost(active_group, true)
      elem.querySelector('.card_front').style.transform = 'rotate(90deg)'
      elem.querySelector('.card_back').style.transform = 'rotate(-90deg)'
    } else {
      deckahedron_deck_card.toggle_boost(active_group)
    }
  },
  dragon_handler: function(evt, elem) {
    let active_group = deckahedron_deck_card.get_active_group(elem)
    if (active_group.id !== 'dragon_result') {
      deckahedron_deck_card.toggle_boost(active_group, true)
      elem.querySelector('.card_front').style.transform = ''
      elem.querySelector('.card_back').style.transform = ''
    } else {
      deckahedron_deck_card.toggle_boost(active_group)
    }
  },

  get_active_group: function(card) {
    let frontTrans = card.querySelector('.card_front').style.transform
    if (frontTrans.includes('rotate(180deg)')) {
      return card.querySelector('#anvil_result')
    } else if (frontTrans.includes('rotate(-90deg)')) {
      return card.querySelector('#blades_result')
    } else if (frontTrans.includes('rotate(90deg)')) {
      return card.querySelector('#crown_result')
    } else {
      return card.querySelector('#dragon_result')
    }
  },

  toggle_boost: function(active_group, forceOff) {
    //console.log('toggling', forceOff ? "OFF" : '.', active_group.id)
    if (forceOff || active_group.style.transform) {
      active_group.style.transform = ''
    } else {
      let { cx, cy } = SVG.adopt(active_group).bbox()
      active_group.style.transformOrigin = `${cx}px ${cy}px`
      active_group.style.transform = 'scale(300%)'
      active_group.style.transition = '0.3s ease-in-out'
    }
  },

  flip_handler: function(evt, elem) {
    frontY = elem.querySelector('.card_front_y')
    backY = elem.querySelector('.card_back_y')
    parent = frontY.parentElement
    console.log('flip', frontY.id, backY.id, parent.id)

    if (frontY.style.transform && frontY.style.transform.includes('rotateY(180deg)')) {
      frontY.style.transform = 'rotateY(0deg)'
      backY.style.transform = 'rotateY(-180deg)'
      parent.insertBefore(backY, frontY)
    } else {
      // already flipped, so flip backY.
      frontY.style.transform = 'rotateY(180deg)'
      backY.style.transform = 'rotateY(0deg)'
      parent.insertBefore(frontY, backY)
    }

  },

  menu: {
    'Anvil': {
      eventName: 'deckahedron_deck_card_anvil',
      applicable: (dNode) => {
        return navigator.userAgent.toLowerCase().includes('firefox')
      },
      handler: function(evt) {
        deckahedron_deck_card.anvil_handler(evt, this)
      },
    },
    'Blades': {
      eventName: 'deckahedron_deck_card_blades',
      applicable: (dNode) => {
        return navigator.userAgent.toLowerCase().includes('firefox')
      },
      handler: function(evt) {
        deckahedron_deck_card.blades_handler(evt, this)
      },
    },
    'Crown': {
      eventName: 'deckahedron_deck_card_crown',
      applicable: (dNode) => {
        return navigator.userAgent.toLowerCase().includes('firefox')
      },
      handler: function(evt) {
        deckahedron_deck_card.crown_handler(evt, this)
      },
    },
    'Dragon': {
      eventName: 'deckahedron_deck_card_dragon',
      applicable: (dNode) => {
        return navigator.userAgent.toLowerCase().includes('firefox')
      },
      handler: function(evt) {
        deckahedron_deck_card.dragon_handler(evt, this)
      },
    },
    'Flip': {
      eventName: 'deckahedron_deck_card_flip',
      otherEvents: ['dblclick'],
      applicable: (node) => { return true },
      handler: function(evt) {
        deckahedron_deck_card.flip_handler(evt, this)
      },
    },
    'Return to deck': {
      eventName: 'deckahedron_deck_card_return',
      applicable: (dNode) => {
        if(document.querySelector('#' + dNode.dataset.deckId)) {
          return true
        } else {
          return false
        }
      },
      handler: function(evt) {
        deckahedron_deck_card.return_handler(evt, this)
      },
    },
  },
}
