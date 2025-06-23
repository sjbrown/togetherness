
function centerMarkerPos(svgEl, selector) {
  cmarker = svgEl.findOne(selector)
  const pt = cmarker.node.ownerSVGElement.createSVGPoint();
  const bbox = cmarker.bbox();
  pt.x = bbox.cx
  pt.y = bbox.cy
  const globalCenter = pt.matrixTransform(cmarker.node.getCTM());
  return globalCenter
}

var exhaustion = {
  init: async function() {
  },

  build_view_wrapper: function() {
    rotation = -15 + Math.floor(Math.random() * 31)
    pos = centerMarkerPos(table_lines, '#g_exhaustion .centermarker')
    vWrapper = SVG().size(300,300)
    vWrapper.attr({
      id: `exhaustion_card_vwrapper${num}`,
      class: 'exhaustion_vwrapper',
      viewBox: '0 0 420 420',
      transform: (rotation ? `rotate(${rotation} ${pos.x} ${pos.y})` : ''),
    })
    vWrapper.center(pos.x, pos.y)
    svg_table.add(vWrapper)
    vWrapper.node.addEventListener('click', (evt) => {
      exhaustion.events.click(evt)
    })
    return vWrapper
  },

  addCard: function(card) {
    vWrapper = exhaustion.build_view_wrapper()
    vWrapper.add(card)
  },

  events: {
    click: function(evt) {
      //console.log('exhaustion_events.click')
      const lastOccupiedVWrapper = Array.from(qsa('.exhaustion_vwrapper'))
        .reverse()
        .find(el => el.children.length > 0);
      buildModal('exhaustion_modal', 'Exhaustion Actions', exhaustion.actions,
        lastOccupiedVWrapper,
      )
    },
  },

  actions: {
    'Select Card': {
      hotkey: 's',
      applicable: function() { return true },
      handler: function() {
        let cards = qsa('.exhaustion_vwrapper .card')
        if (cards.length === 0) {
          throw new Error('No cards in the exhaustion to select!');
        }
        selectActions = {
          'Discard': {
            applicable: function() { return true },
            handler: function() {
              console.log('select discard handler')
              selectedCards = qsa('.select-card.is-selected')
              console.log(selectedCards.length)
              selectedCards.forEach(cardIcon => {
                cardId = cardIcon.dataset.cardId
                card = qs(`.card[data-card-id="${cardId}"]`)
                discard.addCard(card)
              })
            }
          }
        }
        buildSelectModal('exhaustion_select', 'Select Card', selectActions, cards)
      },
    },
  },
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
        const vWrapperNodes = qsa('.discard_vwrapper')
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
        if (revealArea.getCards().length > 0) {
          throw new Error('Cannot flip while also revealing cards. Exhaust or Re-Deck.')
        }
        const emptyPlaceholder = playarea.getEmptyFlipPlaceholder()
        if (emptyPlaceholder === undefined) {
          throw new Error('Play area is full! Discard or Re-Deck.')
        }
        placeholder = SVG.adopt(emptyPlaceholder)
        top_card = deckahedron_deck.draw(svg_table.findOne('.deckahedron_deck').node)
        placeholder.add(top_card)
        results.stateChanged()
      },
    },
    'Reveal': {
      hotkey: 'r',
      applicable: function() { return true },
      handler: function() {
        if (playarea.getFlipCards().length > 0) {
          throw new Error('Cannot reveal while also flipping cards. Discard or Re-Deck.')
        }
        const emptyPlaceholder = revealArea.getEmptyPlaceholder()
        if (emptyPlaceholder === undefined) {
          throw new Error('Reveal area is full! Exhaust or Re-Deck.')
        }
        placeholder = SVG.adopt(emptyPlaceholder)
        top_card = deckahedron_deck.draw(svg_table.findOne('.deckahedron_deck').node)
        placeholder.add(top_card)
        results.stateChanged()
      },
    },
    'Shuffle (without discards)': {
      hotkey: 's',
      applicable: function() { return true },
      handler: function() {
        deckahedron_deck.reshuffle_handler({}, svg_table.node)
      },
    },
  },
}

var results = {
  placeholder: null,
  bestButton: null,
  worstButton: null,

  init: function(svg_table) {
    results.bestButton = SVG.adopt(qs('#g_best'))
    results.worstButton = SVG.adopt(qs('#g_worst'))
    results.bestButton.node.classList.add('is-selected')
  },

  clear: function() {
    results.bestButton.node.classList.add('is-hidden')
    results.worstButton.node.classList.add('is-hidden')
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

  displayResults: function() {
    cardNodes = playarea.getFlipCards()
    if (cardNodes.length > 1) {
      results.displayBestWorstButtons()
    }
    if (cardNodes.length > 0) {
      results.displayFlipResults(cardNodes)
    }
    cardNodes = revealArea.getCards()
    if (cardNodes.length > 0) {
      results.displayRevealResults(cardNodes)
    }
  },

  displayRevealResults: function(cardNodes) {
    function makeIcon(className, cx, cy) {
      revealed = qsa(`.reveal_area_placeholder .${className}`)
      numRevealed = revealed.length
      icon = SVG.adopt(iconify(qs(`.${className}`), [100,100]))
      icon.center(cx, cy)
      results.placeholder.add(icon)
      let svgText = results.placeholder.text(numRevealed).fill('#000').font({
        family: 'sans-serif',
        size: 32,
        anchor: 'middle',
      })
      svgText.center(icon.cx(), icon.cy())
    }
    makeIcon('center_circle', 60, 65)
    makeIcon('center_stamina', 180, 65)
  },

  displayBestWorstButtons: function() {
    results.bestButton.node.classList.remove('is-hidden')
    results.worstButton.node.classList.remove('is-hidden')
    results.bestButton.node.addEventListener('click', results.events.bestClick)
    results.worstButton.node.addEventListener('click', results.events.worstClick)
  },

  displayFlipResults: function(cardNodes) {
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

    function displayBestOrWorst(result, secondaries) {
      resultIcon = SVG.adopt(iconify(result, [130,100]))
      resultIcon.center(120,60)
      results.placeholder.add(resultIcon)
      let offsetX = 0
      secondaries.forEach(el => {
        icon = SVG.adopt(iconify(el, [50,50]))
        icon.center(210 + offsetX, 100)
        results.placeholder.add(icon)
        offsetX += 30
      })
    }

    if (results.bestButton.node.classList.contains('is-selected')) {
      displayBestOrWorst(bestResult, bestSecondaries)
    } else {
      displayBestOrWorst(worstResult, worstSecondaries)
    }
  },

  events: {
    bestClick: function(evt) {
      console.log('best click')
      results.bestButton.node.classList.add('is-selected')
      results.worstButton.node.classList.remove('is-selected')
      results.stateChanged()
    },
    worstClick: function(evt) {
      console.log('worst click')
      results.worstButton.node.classList.add('is-selected')
      results.bestButton.node.classList.remove('is-selected')
      results.stateChanged()
    },
  },

  stateChanged: function() {
    results.clear()
    results.displayResults()
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

var revealArea = {
  centerPos: null,

  init: async function(svg_table) {
    revealArea.centerPos = centerMarkerPos(table_lines, '#g_reveal_area .centermarker')
    rotations = [-30, -15, 0, 15, 30]
    addPlaceholder = (idx) => {
      num = idx + 1
      line = parseInt(idx/5)
      rotOffset = 550 + (line * 100)
      rotation = rotations[idx % 5]
      yOffset = line * 150
      rotCenterX = revealArea.centerPos.x
      rotCenterY = revealArea.centerPos.y + rotOffset
      let placeholder = SVG().size(200,200)
      placeholder.attr({
        id: `reveal_area_card_placeholder${num}`,
        class: 'reveal_area_placeholder',
        viewBox: '0 0 420 420',
        transform: (rotation ? `rotate(${rotation} ${rotCenterX} ${rotCenterY})` : ''),
      })
      placeholder.center(revealArea.centerPos.x, revealArea.centerPos.y + yOffset)
      svg_table.add(placeholder)
      placeholder.node.addEventListener('click', (evt) => {
        revealArea.events.click(evt)
      })
    }
    for (var i = 0; i < 20; i++) {
      addPlaceholder(i)
    }
  },

  getEmptyPlaceholder: function() {
    // Might return undefined if there is none
    return Array.from(qsa('.reveal_area_placeholder'))
      .find(el => el.children.length === 0);
  },

  getLastOccupiedPlaceholder: function() {
    // Might return undefined if there is none
    return Array.from(qsa('.reveal_area_placeholder'))
      .reverse()
      .find(el => el.children.length > 0);
  },

  getCards: function() {
    return qsa('.reveal_area_placeholder .card')
  },

  actions: {
    'Exhaust': {
      hotkey: 'e',
      applicable: function() { return true },
      handler: function() {
        const cardNodes = revealArea.getCards()
        if (cardNodes.length === 0) {
          throw new Error('No cards in the reveal area to discard!');
        }
        cardNodes.forEach(cardEl => {
          const card = SVG.adopt(cardEl);
          exhaustion.addCard(card)
        });
        results.stateChanged()
      },
    },
    'Re-Deck': {
      hotkey: 'r',
      applicable: function() { return true },
      handler: function() {
        const lastOccupiedPlaceholder = revealArea.getLastOccupiedPlaceholder()
        if (lastOccupiedPlaceholder === undefined) {
          throw new Error('No cards in the reveal area!')
        }
        placeholder = SVG.adopt(lastOccupiedPlaceholder)
        card = placeholder.findOne('.card')
        deck = svg_table.findOne('.deckahedron_deck')
        deckahedron_deck.endeck(deck.node, card.node)
        results.stateChanged()
      },
    },
  },

  events: {
    click: function(evt) {
      const lastOccupiedPlaceholder = revealArea.getLastOccupiedPlaceholder()
      buildModal('reveal_area_modal', 'Reveal Area Actions', revealArea.actions,
        lastOccupiedPlaceholder,
      )
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

  getEmptyFlipPlaceholder: function() {
    // Might return undefined if there is none
    return Array.from(qsa('.play_area_placeholder'))
      .find(el => el.children.length === 0);
  },

  getLastOccupiedFlipPlaceholder: function() {
    // Might return undefined if there is none
    return Array.from(qsa('.play_area_placeholder'))
      .reverse()
      .find(el => el.children.length > 0);
  },

  getFlipCards: function() {
    return qsa('.play_area_placeholder .card')
  },

  actions: {
    'Discard': {
      hotkey: 'd',
      applicable: function() { return true },
      handler: function() {
        const cardNodes = playarea.getFlipCards()
        if (cardNodes.length === 0) {
          throw new Error('No cards in the play area to discard!');
        }
        cardNodes.forEach(cardEl => {
          const card = SVG.adopt(cardEl);
          discard.addCard(card)
        });
        results.stateChanged()
      },
    },
    'Re-Deck': {
      hotkey: 'r',
      applicable: function() { return true },
      handler: function() {
        const lastOccupiedPlaceholder = playarea.getLastOccupiedFlipPlaceholder()
        if (lastOccupiedPlaceholder === undefined) {
          throw new Error('No cards in the play area!')
        }
        placeholder = SVG.adopt(lastOccupiedPlaceholder)
        card = placeholder.findOne('.card')
        deck = svg_table.findOne('.deckahedron_deck')
        deckahedron_deck.endeck(deck.node, card.node)
        results.stateChanged()
      },
    },
  },

  events: {
    click: function(evt) {
      const lastOccupiedPlaceholder = playarea.getLastOccupiedFlipPlaceholder()
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
    //console.log('actionname', actionName)
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
  if (Object.keys(hotkeys).length) {
      keydownHandler = handle_modal_keydown(hotkeys)
      document.addEventListener('keydown', keydownHandler)
  }
}

function buildSelectModal(id, title, actions, cards) {
  let mTemplate = qs('#modal_template')
  let modal = mTemplate.cloneNode(true);

  mTemplate.parentNode.appendChild(modal)
  modal.setAttribute('id', id)
  modal.classList.add('is-active');

  tNode = modal.querySelector('.modal-card-title')
  tNode.textContent = title

  closeModal = () => {
    modal.classList.remove('is-active')
    modal.remove()
  }
  modal.querySelector('.closeButton').onclick = closeModal

  function toggleCardSelect(e) {
    c = e.target.closest('.select-card')
    if (c.classList.contains('is-selected')) {
      c.classList.remove('is-selected')
    } else {
      c.classList.add('is-selected')
    }
  }

  cardBody = modal.querySelector('.modal-card-body')
  cards.forEach(card => {
    let selectCard = iconify(card, [80,80])
    selectCard.classList.add('select-card')
    selectCard.addEventListener('click', toggleCardSelect)
    cardBody.prepend(selectCard)
  })

  bTemplate = modal.querySelector('.modal_button_template')
  Object.entries(actions).forEach(([actionName, actionDict]) => {
    //console.log('actionname', actionName)
    let wrappedHandler = wrap_action_function(actionDict['handler'], closeModal)
    let btn = bTemplate.cloneNode(true);
    btn.classList.remove('modal_button_template'); // So it's not hidden or excluded by style
    btn.addEventListener('click', wrappedHandler)
    bTemplate.parentNode.appendChild(btn)
    setButtonLabelWithHotkey(btn, actionName)
  })
  bTemplate.remove()
}
