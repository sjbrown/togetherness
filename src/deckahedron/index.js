
function centerMarkerPos(svgEl, selector) {
  cmarker = svgEl.findOne(selector)
  const pt = cmarker.node.ownerSVGElement.createSVGPoint();
  const bbox = cmarker.bbox();
  pt.x = bbox.cx
  pt.y = bbox.cy
  const globalCenter = pt.matrixTransform(cmarker.node.getCTM());
  return globalCenter
}

var discard = {
  init: async function() {
  },

  build_view_wrapper: function() {
    rotation = -15 + Math.floor(Math.random() * 31)
    pos = centerMarkerPos(table_lines, '#g_discard .centermarker')
    vWrapper = SVG().size(300,300)
    vWrapper.attr({
      id: `discard_card_vwrapper${num}`,
      class: 'discard_vwrapper',
      viewBox: '0 0 420 420',
      transform: (rotation ? `rotate(${rotation} ${pos.x} ${pos.y})` : ''),
    })
    vWrapper.center(pos.x, pos.y)
    svg_table.add(vWrapper)
    vWrapper.node.addEventListener('click', (evt) => {
      discard.events.click(evt)
    })
    return vWrapper
  },

  addCard: function(card) {
    vWrapper = discard.build_view_wrapper()
    vWrapper.add(card)
  },

  events: {
    click: function(evt) {
      //console.log('discard_events.click')
      const lastOccupiedVWrapper = Array.from(qsa('.discard_vwrapper'))
        .reverse()
        .find(el => el.children.length > 0);
      buildModal('discard_modal', 'Discard Actions', discard.actions,
        lastOccupiedVWrapper,
      )
    },
  },

  actions: {
    'Shuffle In': {
      hotkey: 's',
      applicable: function() { return true },
      handler: function() {
        const vWrapperNodes = document.querySelectorAll('.discard_vwrapper')
        if (vWrapperNodes.length === 0) {
          throw new Error('No cards in the discard to reshuffle!');
        }
        const deck = svg_table.findOne('.deckahedron_deck');

        vWrapperNodes.forEach(vWrapperEl => {
          const card = SVG.adopt(vWrapperEl.querySelector('.card'));
          deckahedron_deck.endeck(deck.node, card.node)
          vWrapperEl.remove()
        });
        deckahedron_deck.reshuffle_handler({}, svg_table.node)
      },
    },
    'Re-Deck Top Card': {
      hotkey: 'r',
      applicable: function() { return true },
      handler: function() {
        const lastOccupiedVWrapper = Array.from(qsa('.discard_vwrapper'))
          .reverse()
          .find(el => el.children.length > 0);
        if (lastOccupiedVWrapper === undefined) {
          throw new Error('No cards in the discard!')
          return
        }
        vWrapper = SVG.adopt(lastOccupiedVWrapper)
        card = vWrapper.findOne('.card')
        deck = svg_table.findOne('.deckahedron_deck')
        deckahedron_deck.endeck(deck.node, card.node)
        vWrapper.remove()
      },
    },
  },

}

var deckahedron = {
  init: async function(svg_table) {
    d = await import_foreign_svg('deckahedron_deck.svg')
    centerPos = centerMarkerPos(table_lines, '#g_deckahedron .centermarker')
    d.center(centerPos.x, centerPos.y)
    d.node.classList.add('table_deck')
    init_with_namespaces(d.node, {})
    svg_table.add(d)

    d.node.addEventListener('click', (evt) => {
      deckahedron.events.click(evt)
    })
  },

  events: {
    click: function(evt) {
      buildModal('deckahedron_modal', 'Deckahedron Actions', deckahedron.actions,
      qs('.table_deck'))
    },
  },

  actions: {
    'Flip': {
      hotkey: 'f',
      applicable: function() { return true },
      handler: function() {
        const emptyPlaceholder = Array.from(qsa('.play_area_placeholder'))
          .find(el => el.children.length === 0);
        if (emptyPlaceholder === undefined) {
          throw new Error('Play area is full! Discard, Exhaust, or Re-Deck.')
        }
        placeholder = SVG.adopt(emptyPlaceholder)
        top_card = deckahedron_deck.draw(svg_table.findOne('.deckahedron_deck').node)
        placeholder.add(top_card)
        results.stateChanged()
      },
    }
  },
}

var results = {
  placeholder: null,

  init: function(svg_table) {
  },

  clear: function() {
    if (results.placeholder) {
      results.placeholder.remove()
      results.placeholder = null
    }
    results.placeholder = SVG().size(200,120)
    results.placeholder.attr({
      id: `results_placeholder`,
      class: 'results_placeholder',
      viewBox: '0 0 240 120',
    })
    pos = centerMarkerPos(table_lines, '#g_results .centermarker')
    results.placeholder.center(pos.x, pos.y)
    svg_table.add(results.placeholder)
  },

  displayPlayareaResults: function() {
    const cardNodes = qsa('.play_area_placeholder .card')
    if (cardNodes.length === 0) {
      return
    }
    const suit = suit_chooser.activeSuit()
    let bestResult = null
    let bestNum = 0
    let bestSecondaries = null
    let worstResult = null
    let worstNum = 100
    let worstSecondaries = null
    cardNodes.forEach(cardEl => {
      primary_result = cardEl.querySelector(`#${suit}_result .primary_result`)
      secondary_results = cardEl.querySelectorAll('.flip_secondary_result')
      numValue = parseInt(primary_result.dataset.num)
      if (numValue > bestNum || (numValue === bestNum && secondary_results.length > bestSecondaries.length)) {
        bestResult = primary_result
        bestNum = numValue
        bestSecondaries = secondary_results
      }
      if (numValue < worstNum || (numValue === worstNum && secondary_results.length > worstSecondaries.length)) {
        worstResult = primary_result
        worstNum = numValue
        worstSecondaries = secondary_results
      }
    });
    //console.log('best', bestNum, bestResult, bestSecondaries)
    //console.log('worst', worstNum, worstResult, worstSecondaries)

    resultIcon = SVG.adopt(iconify(bestResult, [100,100]))
    resultIcon.center(120,60)
    results.placeholder.add(resultIcon)
    let offsetX = 0
    bestSecondaries.forEach(el => {
      icon = SVG.adopt(iconify(el, [50,50]))
      icon.center(210 + offsetX, 100)
      results.placeholder.add(icon)
      offsetX += 30
    })
  },

  stateChanged: function() {
    results.clear()
    results.displayPlayareaResults()
  },
}

var suit_chooser = {
  state: ['dragon', 'crown', 'anvil', 'blades'],
  rotations: {dragon: 0, crown:90, anvil:180, blades:270},
  clockwiseButton: null,
  anticlockwiseButton: null,

  init: async function(svg_table) {
    function buttonize(arrow) {
      let svgButton = SVG().size(200,100)
      svgButton.attr({
        id: `suit_chooser_button_${arrow.id}`,
        class: 'suit_chooser_button',
        viewBox: '0 0 200 100',
      })
      const pt = arrow.ownerSVGElement.createSVGPoint();
      const bbox = SVG.adopt(arrow).bbox()
      pt.x = bbox.cx
      pt.y = bbox.cy
      const pos = pt.matrixTransform(cmarker.node.getCTM());
      svgButton.center(pos.x, pos.y)
      if (arrow.id == 'arrow_clockwise') {
        svgButton.x( svgButton.x() - 90)
        arrowIcon = SVG.adopt(iconify(arrow, [50,80]))
        arrowIcon.center(170,50)
      } else {
        svgButton.x( svgButton.x() + 90)
        arrowIcon = SVG.adopt(iconify(arrow, [50,80]))
        arrowIcon.center(30,50)
      }

      r = SVG().rect().size(200,100)
      r.attr({
        class: 'chooser-btn-outline',
        rx: 10,
        ry: 10,
      })

      svgButton.add(arrowIcon)
      svgButton.add(r)
      svg_table.add(svgButton)
      arrow.remove()
      return svgButton
    }

    suit_chooser.updateActive()

    clockwiseArrow = qs('#arrow_clockwise')
    suit_chooser.clockwiseButton = buttonize(clockwiseArrow)
    suit_chooser.clockwiseButton.node.addEventListener('click', suit_chooser.events.clockwise_click)

    anticlockwiseArrow = qs('#arrow_anticlockwise')
    suit_chooser.anticlockwiseButton = buttonize(anticlockwiseArrow)
    suit_chooser.anticlockwiseButton.node.addEventListener('click', suit_chooser.events.anticlockwise_click)

    suit_chooser.updateButtons()
  },
  
  updateActive: function() {
    table_lines.node.querySelectorAll('g .suit').forEach((el) => {
      if (el.classList.contains(`suit_${suit_chooser.state[0]}`)) {
        el.style.opacity = '1'
      } else {
        el.style.opacity = '0'
      }
    })
    results.stateChanged()
  },

  updateButtons: function() {
    oldIconEls = qsa('.suit_chooser_button_icon')
    oldIconEls.forEach((el) => {
      el.remove()
    })

    function makeChooserIcon(suit, button, center) {
      prototype = qs(`#suit_chooser_${suit}`)
      icon = SVG.adopt(iconify(prototype, [50,50]))
      icon.node.firstChild.style.opacity = 0.6
      button.add(icon)
      icon.back() // or else it interfere's with the rect's :hover
      icon.addClass('suit_chooser_button_icon') // so it can be removed later
      icon.center(center[0], center[1])
    }

    makeChooserIcon(
      suit_chooser.state[1],
      suit_chooser.anticlockwiseButton,
      [90,60]
    )
    makeChooserIcon(
      suit_chooser.state[suit_chooser.state.length - 1],
      suit_chooser.clockwiseButton,
      [110,60]
    )
  },

  activeSuit: function() {
    const visibleSuit = Array.from(qsa('#g_suit_chooser .suit'))
      .find(el => getComputedStyle(el).opacity !== '0')

    const suits = ['dragon', 'anvil', 'blades', 'crown']

    for (const cls of visibleSuit.classList) {
      for (const s of suits) {
        if (cls === `suit_${s}`) {
          return s
        }
      }
    }
  },

  updateCards: function() {
    qsa('.card').forEach((el, idx) => {
      card = SVG.adopt(el)
      amount = suit_chooser.rotations[suit_chooser.state[0]]
      card.attr({
        transform: `rotate(${amount}, 210, 210)`,
      })
    })
  },

  events: {
    clockwise_click: function(evt) {
      console.log('clockwise click')
      sneg1 = suit_chooser.state[suit_chooser.state.length-1]
      suit_chooser.state = suit_chooser.state.slice(0, suit_chooser.state.length-1)
      suit_chooser.state.unshift(sneg1)
      suit_chooser.updateActive()
      suit_chooser.updateButtons()
      suit_chooser.updateCards()
    },
    anticlockwise_click: function(evt) {
      s0 = suit_chooser.state[0]
      suit_chooser.state = suit_chooser.state.slice(1, suit_chooser.state.length)
      suit_chooser.state.push(s0)
      suit_chooser.updateActive()
      suit_chooser.updateButtons()
      suit_chooser.updateCards()
    },
  },
}

var playarea = {
  init: async function(svg_table) {
    addPlaceholder = (num, rotation) => {
      let placeholder = SVG().size(300,300)
      placeholder.attr({
        id: `play_area_card_placeholder${num}`,
        class: 'play_area_placeholder',
        viewBox: '0 0 420 420',
        transform: (rotation ? `rotate(${rotation} ${pos.x} ${pos.y})` : ''),
      })
      pos = centerMarkerPos(table_lines, `.center_card${num}`)
      placeholder.center(pos.x, pos.y)
      svg_table.add(placeholder)
      placeholder.node.addEventListener('click', (evt) => {
        playarea.events.click(evt)
      })
    }
    addPlaceholder(1)
    addPlaceholder(2, 15)
    addPlaceholder(3, -15)
  },

  actions: {
    'Re-Deck': {
      hotkey: 'r',
      applicable: function() { return true },
      handler: function() {
        const lastOccupiedPlaceholder = Array.from(qsa('.play_area_placeholder'))
          .reverse()
          .find(el => el.children.length > 0);
        //console.log('lop', lastOccupiedPlaceholder)
        if (lastOccupiedPlaceholder === undefined) {
          throw new Error('No cards in the play area!')
          return
        }
        placeholder = SVG.adopt(lastOccupiedPlaceholder)
        card = placeholder.findOne('.card')
        deck = svg_table.findOne('.deckahedron_deck')
        //console.log(card, deck)
        deckahedron_deck.endeck(deck.node, card.node)
        results.stateChanged()
      },
    },
    'Discard': {
      hotkey: 'd',
      applicable: function() { return true },
      handler: function() {
        const cardNodes = document.querySelectorAll('.play_area_placeholder .card');
        if (cardNodes.length === 0) {
          throw new Error('No cards in the play area to discard!');
        }
        const deck = svg_table.findOne('.deckahedron_deck');
      
        cardNodes.forEach(cardEl => {
          const card = SVG.adopt(cardEl);
          discard.addCard(card)
        });
        results.stateChanged()

      },
    },
  },

  events: {
    click: function(evt) {
      const lastOccupiedPlaceholder = Array.from(qsa('.play_area_placeholder'))
        .reverse()
        .find(el => el.children.length > 0);
      buildModal('playarea_modal', 'Play Area Actions', playarea.actions,
        lastOccupiedPlaceholder,
      )
    },
  },
}

function setButtonLabelWithHotkey(btn, label, hotkey) {
  if (!hotkey) {
    btn.textContent = label;
    return;
  }

  const lowerHotkey = hotkey.toLowerCase();
  const index = label.toLowerCase().indexOf(lowerHotkey);

  if (index === -1) {
    // If the hotkey isn't found in the label, just append it visually
    btn.innerHTML = `${label} (<span class="hotkey">${hotkey.toUpperCase()}</span>)`;
    return;
  }

  const before = label.slice(0, index);
  const match = label.charAt(index);
  const after = label.slice(index + 1);

  btn.innerHTML = `${before}<span class="hotkey">${match}</span>${after}`;
}

function wrap_action_function(fn, closeModal) {
  return function (...args) {
    try {
      fn.apply(this, args)
      closeModal()
    } catch (err) {
      closeModal()
      const msg = err instanceof Error ? err.message : String(err)
      errorModal(msg)
    }
  }
}

function errorModal(msg) {
  let eModal = byId('error_modal')
  eModal.classList.add('is-active')

  eModal.querySelector('.msg').textContent = msg

  closeModal = () => {
    modal.classList.remove('is-active')
  }
}

function handle_modal_keydown(hotkeys) {
  return function(e) {
    const key = e.key.toLowerCase();
    if (hotkeys[key]) {
      e.preventDefault()
      hotkeys[key]()
    }
  }
}

function iconify(el, size) {
  function stripAllClasses(root) {
    // strip all classes so it doesn't get selected by other code
    root.setAttribute('class', '')
    root.setAttribute('id', `icon_of_${root.id}`)
    for (const child of root.children) {
      stripAllClasses(child);
    }
  }
  let svgIcon
  let clone = el.cloneNode(true)
  if (el.tagName === 'svg') {
    svgIcon = SVG.adopt(clone)
    svgIcon.attr({
      id: 'icon_clone_' + el.id,
      viewBox: '0 0 420 420',
      transform: '',
    })
  } else {
    svgIcon = SVG()
    svgClone = SVG.adopt(clone)
    svgClone.attr({
      transform: '',
    })
    bb = svgClone.bbox()
    svgIcon.add(clone)
    svgIcon.attr({
      id: 'icon_clone_' + el.id,
      viewBox: `${bb.x} ${bb.y} ${bb.width} ${bb.height}`,
    })
  }
  svgIcon.attr({
    width: size[0],
    height: size[1],
  })
  stripAllClasses(clone)
  svgIcon.css({
    'vertical-align': 'middle',
    'margin-right': '0.5em',
  })
  return svgIcon.node
}

function buildModal(id, title, actions, icon) {
  let mTemplate = qs('#modal_template')
  let modal = mTemplate.cloneNode(true);
  let keydownHandler

  mTemplate.parentNode.appendChild(modal)
  modal.setAttribute('id', id)
  modal.classList.add('is-active');

  tNode = modal.querySelector('.modal-card-title')
  tNode.textContent = '' // first empty it
  if (icon) {
    tNode.appendChild(iconify(icon, [26,26]))
  }
  const textNode = document.createTextNode(title);
  tNode.appendChild(textNode);

  closeModal = () => {
    modal.classList.remove('is-active')
    modal.remove()
    document.removeEventListener('keydown', keydownHandler)
  }
  modal.querySelector('.closeButton').onclick = closeModal
  bTemplate = modal.querySelector('.modal_button_template')
  hotkeys = {}
  Object.entries(actions).forEach(([actionName, actionDict]) => {
    let wrappedHandler = wrap_action_function(actionDict['handler'], closeModal)
    let btn = bTemplate.cloneNode(true);
    btn.classList.remove('modal_button_template'); // So it's not hidden or excluded by style
    btn.addEventListener('click', wrappedHandler)
    bTemplate.parentNode.appendChild(btn)
    if (actionDict['hotkey']) {
      hotkeys[actionDict['hotkey'].toLowerCase()] = wrappedHandler
    }
    setButtonLabelWithHotkey(btn, actionName, actionDict['hotkey'])
  })
  bTemplate.remove()
  //console.log('hotkeys', hotkeys)
  if (Object.keys(hotkeys).length) {
      keydownHandler = handle_modal_keydown(hotkeys)
      document.addEventListener('keydown', keydownHandler)
  }
}
