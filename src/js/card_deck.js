console.log('CARDDECK')

function pile_offset(index) {
  return {
    x: 0.2 * index,
    y: 0.66 * index,
  }
}

var card_deck = {
  visit_contents_group(elem, visitFn) {
    let containedSVGs = elem.querySelectorAll(
      `#${elem.id} > .contents_group > svg`
    )
    containedSVGs.forEach(visitFn)
  },

  dragover_handler: function(evt) {
    console.log('deck', 'dragover_handler', evt.detail)
    dragged = SVG.adopt(evt.detail.draggedElem)
    drop = SVG.adopt(evt.detail.dropElem)
    is_inside = isInside(dragged.node, drop.node)
    if (is_inside) {
      drop.opacity(0.4)
      return
    }
    drop.opacity(1.0)
  },

  drop_handler: function(elem, evt) {
    console.log('target should be ', elem)
    console.log('target is', evt.target)

    draggedElem = evt.detail.draggedElem
    dropElem = evt.target
    if (
      elem.id === draggedElem.id
      ||
      elem.contains(draggedElem)
      ||
      draggedElem.contains(elem)
      ||
      !elem.contains(dropElem)
    ) {
      return
    }

    let drop = SVG.adopt(dropElem)
    let contentsGroup = elem.querySelector(`#${elem.id} > .contents_group`)

    evt.detail.draggedSVGs.forEach(draggedEl => {
      let dragged = SVG.adopt(draggedEl)

      is_inside = isInside(draggedEl, drop.node)
      console.log('dragged', draggedEl.id, 'box is inside drop',
        dropElem,
        '?', is_inside
      )

      if (contentsGroup.querySelector('#' + draggedEl.id)) {
        // already inside the contents
        if (is_inside) {
          return
        }
        pop_from_parent(draggedEl)
      } else {
        if (!is_inside) {
          return
        }
        push_to_parent(
          draggedEl,
          elem,
          (svgElem, parentElem) => {
            console.log('consume it here', svgElem.id, parentElem.id)
            contentsGroup.appendChild(svgElem)
          }
        )
      }
    })
    elem.dispatchEvent(new CustomEvent('dom_change', {
      bubbles: true,
      detail: { 'ruleElemId': elem.id },
    }))
  },

  endeck: function(deck, card) {
    localDocEl = deck.node.closest('.draggable-group')
    deck_area = localDocEl.querySelector('#g_deck_area')
    deck_area = SVG.adopt(deck_area)

    card_deck.flip_card_to_back(card.node)

    let offset = pile_offset(
      deck.node.querySelectorAll('.card').length
    )
    card.cy(deck_area.cy() + offset.y)
    card.cx(deck_area.cx() + offset.x)
    deck.add(card)
  },

  flip_card_to_front: function(cardEl) {
    back = cardEl.querySelector('.card_back')
    back.remove()
    cardEl.insertBefore(back, cardEl.firstChild)
  },

  flip_card_to_back: function(cardEl) {
    back = cardEl.querySelector('.card_back')
    back.remove()
    cardEl.appendChild(back)
  },

  flip_card: function(cardEl) {
    if (cardEl.lastElementChild.classList.contains('card_back')) {
      card_deck.flip_card_to_front(cardEl)
    } else {
      card_deck.flip_card_to_back(cardEl)
    }
  },

  initialize: function(elem) {
    //elem.addEventListener('svg_drag', this.drag_handler)
    //elem.addEventListener('svg_drop', this.drop_handler)
    //elem.addEventListener('svg_dragover', this.dragover_handler)
    elem.addEventListener('svg_dragenter', () => {console.log('E')})
    elem.addEventListener('svg_dragleave', () => {console.log('L')})
  },

  menu: {
    'Fix': {
      eventName: 'deck_fix',
      otherEvents: ['dblclick'],
      applicable: (node) => { return true },
      handler: function(evt) {
        console.log('deck hears fix event', evt)
        lock_selection(evt, this)
      },
    },
  },

  card: {
    return_handler: function(elem) {
      push_to_parent(
        elem,
        byId(elem.dataset.homeDeckId),
        (cardEl, deckEl) => {
          cardEl.classList.add('draggable-group')
          card_deck.endeck(SVG.adopt(deckEl), SVG.adopt(cardEl))
        }
      )
    },

  },

}
