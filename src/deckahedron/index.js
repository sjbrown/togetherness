
function centerMarkerPos(svgEl, selector) {
  cmarker = svgEl.findOne(selector)
  const pt = cmarker.node.ownerSVGElement.createSVGPoint();
  const bbox = cmarker.bbox();
  pt.x = bbox.cx
  pt.y = bbox.cy
  const globalCenter = pt.matrixTransform(cmarker.node.getCTM());
  return globalCenter
}

async function initDeckahedron(svg_table) {
  d = await import_foreign_svg('deckahedron_deck.svg')
  centerPos = centerMarkerPos(table_lines, '#g_deckahedron .centermarker')
  d.center(centerPos.x, centerPos.y)
  d.node.classList.add('table_deck')
  init_with_namespaces(d.node, {})
  svg_table.add(d)

  d.node.addEventListener('click', (evt) => {
    //console.log('deckahedron click')
    deckahedron_events['click'](evt)
  })

}

async function initPlayArea(svg_table) {
  addPlaceholder = (num, rotation) => {
    pos = centerMarkerPos(table_lines, `.center_card${num}`)
    placeholder = SVG().size(300,300)
    placeholder.attr({
      id: `play_area_card_placeholder${num}`,
      class: 'play_area_placeholder',
      viewBox: '0 0 420 420',
      transform: (rotation ? `rotate(${rotation} ${pos.x} ${pos.y})` : ''),
    })
    placeholder.center(pos.x, pos.y)
    svg_table.add(placeholder)
    placeholder.node.addEventListener('click', (evt) => {
      console.log(`${placeholder.node.id}  click`)
      playarea_events['click'](evt)
    })
  }
  addPlaceholder(1)
  addPlaceholder(2, 15)
  addPlaceholder(3, -15)
}

async function initDiscard(svg_table) {
  return
}

var discard = {
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
      console.log(`${vWrapper.node.id}  click`)
      discard_events['click'](evt)
    })
    return vWrapper
  },
  addCard: function(card) {
    vWrapper = discard.build_view_wrapper()
    vWrapper.add(card)
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


var deckahedron_events = {
  click: function(evt) {
    buildModal('deckahedron_modal', 'Deckahedron Actions', deckahedron_actions,
    qs('.table_deck'))
  },

}

var playarea_events = {
  click: function(evt) {
    console.log('playarea_events.click')
    const lastOccupiedPlaceholder = Array.from(qsa('.play_area_placeholder'))
      .reverse()
      .find(el => el.children.length > 0);
    console.log('occ', lastOccupiedPlaceholder)
    buildModal('playarea_modal', 'Play Area Actions', playarea_actions,
      lastOccupiedPlaceholder,
    )
  },
}

var discard_events = {
  click: function(evt) {
    console.log('discard_events.click')
    const lastOccupiedVWrapper = Array.from(qsa('.discard_vwrapper'))
      .reverse()
      .find(el => el.children.length > 0);
    buildModal('discard_modal', 'Discard Actions', discard_actions,
      lastOccupiedVWrapper,
    )
  },
}


var deckahedron_actions = {
  'Flip': {
    hotkey: 'f',
    applicable: function() { return true },
    handler: function() {
      const emptyPlaceholder = Array.from(document.querySelectorAll('.play_area_placeholder'))
        .find(el => el.children.length === 0);
      if (emptyPlaceholder === undefined) {
        throw new Error('Play area is full! Discard, Exhaust, or Re-Deck.')
      }
      placeholder = SVG.adopt(emptyPlaceholder)

      top_card = deckahedron_deck.draw(svg_table.findOne('.deckahedron_deck').node)

      placeholder.add(top_card)
      console.log('top card', top_card)
    },
  }
}

var playarea_actions = {
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

    },
  },
}

var discard_actions = {
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
}

function errorModal(msg) {
  let eModal = byId('error_modal')
  eModal.classList.add('is-active')

  eModal.querySelector('.msg').textContent = msg

  closeModal = () => {
    modal.classList.remove('is-active')
  }
  //eModal.querySelector('.closeButton').onclick = closeModal
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

function iconify(el) {
  function stripAllClasses(root) {
    // strip all classes so it doesn't get selected by other code
    root.setAttribute('class', '')
    for (const child of root.children) {
      stripAllClasses(child);
    }
  }
  let svgIcon = SVG.adopt(el.cloneNode(true))
  stripAllClasses(svgIcon.node)
  svgIcon.attr({
    id: 'icon_clone',
    width: 26,
    height: 26,
    viewBox: '0 0 420 420',
  })
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
    tNode.appendChild(iconify(icon))
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
  console.log('hotkeys', hotkeys)
  if (Object.keys(hotkeys).length) {
      keydownHandler = handle_modal_keydown(hotkeys)
      console.log('kd handler', keydownHandler)
      document.addEventListener('keydown', keydownHandler)
  }
}
