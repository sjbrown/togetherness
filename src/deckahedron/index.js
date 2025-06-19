
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
  init_with_namespaces(d.node, {})
  svg_table.add(d)

  d.node.addEventListener('click', (evt) => {
    console.log('deckahedron click')
    deckahedron_events['click'](evt)
  })
  d.node.addEventListener('dblclick', (evt) => {
    console.log('deckahedron dblclick')
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
  }
  addPlaceholder(1)
  addPlaceholder(2, 15)
  addPlaceholder(3, -15)
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


var deckahedron_events = {
  click: function(evt) {
    console.log('cl')
    buildModal('deckahedron_modal', 'Deckahedron Actions', deckahedron_actions)
  },

  handle_modal_keydown: function(hotkeys) {
    return function(e) {
      const key = e.key.toLowerCase();
      if (hotkeys[key]) {
        e.preventDefault()
        hotkeys[key]()
      }
    }
  },

  wrap_action_function: function(fn, closeModal) {
    return function (...args) {
      try {
        console.log('calling wrapped fn')
        fn.apply(this, args)
        closeModal()
      } catch (err) {
        console.log('caught err', err)
        closeModal()
        const msg = err instanceof Error ? err.message : String(err)
        errorModal(msg)
      }
    }
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
        throw new Error('Play area is full! Discard, Exhaust, or Undo.')
        console.error('undefined placeholder!  maxxxxed out!')
        return
      }
      placeholder = SVG.adopt(emptyPlaceholder)

      top_card = deckahedron_deck.draw(svg_table.findOne('.deckahedron_deck').node)

      placeholder.add(top_card)
      console.log('top card', top_card)
    },
  }
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

function buildModal(id, title, actions) {
  let mTemplate = qs('#modal_template')
  let modal = mTemplate.cloneNode(true);
  let keydownHandler

  mTemplate.parentNode.appendChild(modal)
  modal.setAttribute('id', id)
  modal.classList.add('is-active');

  console.log('m', modal)

  tNode = modal.querySelector('.modal-card-title')
  tNode.textContent = title

  closeModal = () => {
    modal.classList.remove('is-active')
    modal.remove()
    document.removeEventListener('keydown', keydownHandler)
  }
  modal.querySelector('.closeButton').onclick = closeModal
  bTemplate = modal.querySelector('.modal_button_template')
  hotkeys = {}
  Object.entries(actions).forEach(([actionName, actionDict]) => {
    let wrappedHandler = deckahedron_events.wrap_action_function(actionDict['handler'], closeModal)
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
      keydownHandler = deckahedron_events.handle_modal_keydown(hotkeys)
      console.log('kd handler', keydownHandler)
      document.addEventListener('keydown', keydownHandler)
  }
}
