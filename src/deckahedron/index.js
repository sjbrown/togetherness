
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

  deckahedron_events.build_modal()
}

async function initPlayArea(svg_table) {
  card1_pos = centerMarkerPos(table_lines, '.center_card1')
  card1_placeholder = SVG().size(308,308)
  card1_placeholder.attr({
    id: 'play_area_card1_placeholder',
    class: 'play_area_placeholder',
    viewBox: '0 0 420 420',
  })
  card1_placeholder.center(card1_pos.x, card1_pos.y)

  svg_table.add(card1_placeholder)

  console.log(card1_placeholder)
}

var deckahedron_events = {
  click: function(evt) {
    console.log('clicking')
    deckahedronModal = byId('deckahedron_modal')
    deckahedronModal.classList.add('is-active');
  },
  build_modal: function() {
    deckahedronModal = byId('deckahedron_modal')
    closeModal = () => {
      deckahedronModal.classList.remove('is-active');
    }
    deckahedronModal.querySelector('.closeButton').onclick = closeModal
    bTemplate = deckahedronModal.querySelector('.modal_button_template')
    Object.entries(deckahedron_actions).forEach(([actionName, actionFn]) => {
      let btn = bTemplate.cloneNode(true);
      btn.classList.remove('modal_button_template'); // So it's not hidden or excluded by style
      btn.textContent = actionName
      btn.addEventListener('click', actionFn);
      btn.addEventListener('click', closeModal);
      bTemplate.parentNode.appendChild(btn);
    })
    bTemplate.remove()
  }
}

var deckahedron_actions = {
  'Flip': function() {
    g_deck = svg_table.findOne('.deckahedron_deck')
    top_card = svg_table.findOne('.deckahedron_deck > :last-child')
    front = top_card.findOne('.card_front_y')
    back = top_card.findOne('.card_back_y')
    front.parent().node.insertBefore(back.node, front.node)
    placeholder = svg_table.findOne('#play_area_card1_placeholder')
    placeholder.add(top_card)
    console.log('top card', top_card)
  }
}
