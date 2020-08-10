console.log('PAPER')
var paper = {
  initialize: function(elem, prototype) {
    elem.addEventListener('paper_fix', this.fix)
    elem.addEventListener('dblclick', this.fix)
    elem.addEventListener('svg_dragover', this.dragover_handler)

    let label = elem.querySelector(`#${elem.id} > text > #tspan_label`)
    if (prototype) {

      elem.setAttribute('width', prototype.getAttribute('width'))
      elem.setAttribute('height', prototype.getAttribute('height'))

      let protoLabel = prototype.querySelector('#tspan_label')
      label.textContent = protoLabel.textContent

      let contentsGroup = elem.querySelector(`#${elem.id} > .contents_group`)
      paper.visit_contents_group(elem, (child) => {
        child.remove()
      })
      paper.visit_contents_group(prototype, (child) => {
        contentsGroup.appendChild(child)
      })

    } else {
      label.textContent = ''
    }
  },

  visit_contents_group(elem, visitFn) {
    let containedSVGs = elem.querySelectorAll(
      `#${elem.id} > .contents_group > svg`
    )
    containedSVGs.forEach(visitFn)
  },

  roll_handler: function(elem, evt) {
    console.log('paper', elem.id, 'hears roll event', evt)
    paper.visit_contents_group(elem, (s) => {
      evt_fire('die_roll', s, null, {})
    })
    synced.change(elem)
  },

  fix: function(evt) {
    console.log('paper hears fix event', evt)
    lock_selection(evt)
  },

  resize_handler: function(elem, evt) {
    console.log('paper', elem.id, ' got resize', evt.detail.width, evt.detail.height)
    let w = evt.detail.width
    let h = evt.detail.height

    let area_rect = elem.querySelector(
      `#${elem.id} > :not(.contents_group) #area_rect`
    )
    xbox = SVG.adopt(area_rect)
    xbox.node.classList.add('droptarget')
    xbox.style({ opacity: 1, 'stroke-opacity': 0.9 })
    xbox.width(w)
    xbox.height(h)
    elem_svg = SVG.adopt(elem)
    elem_svg.width(w)
    elem_svg.height(h)

    textRuleEl = elem.querySelector(`#${elem.id} > .text_rule`)
    text_rule  = SVG.adopt(textRuleEl)
    let offset = 20
    textResultEl = elem.querySelector(`#${elem.id} > .text_result`)
    if (textResultEl) {
      text_result  = SVG.adopt(textResultEl)
      offset += parseInt(text_result.bbox().width)
      text_result.x(w - offset)
      text_result.y(h - 50)
    }
    offset += parseInt(text_rule.bbox().width)
    text_rule.x(w - offset)
    text_rule.y(h - 50)
    synced.change(elem)
  },

  label_click_handler: function(elem) {
    console.log('lbclick', elem)
    let label = elem.querySelector(`#${elem.id} > text > #tspan_label`)
    ui_popup_text_input(
      elem,
      'Label',
      label.textContent,
      'label_change'
    )
  },

  label_change_handler: function(elem, evt) {
    let label = elem.querySelector(`#${elem.id} > text > #tspan_label`)
    label.textContent = evt.detail.inputValue
    synced.change(elem)
  },

  dragover_handler: function(evt) {
    console.log('paper', 'dragover_handler', evt.detail)
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
    console.log('paper_sum drop_handler', elem.id, evt.detail.draggedElemId, evt.target)

    draggedElem = document.querySelector('#' + evt.detail.draggedElemId)
    if (draggedElem === null) {
      return
    }

    let dropElem = evt.target
    let drop = SVG.adopt(dropElem)
    let contentsGroup = elem.querySelector(`#${elem.id} > .contents_group`)

    evt.detail.draggedSVGs.forEach(draggedEl => {
      if (
        draggedEl === null
        ||
        elem.id === draggedEl.id
        ||
        elem.contains(draggedEl)
        ||
        draggedEl.contains(elem)
        ||
        !elem.contains(dropElem)
      ) {
        return
      }
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
    synced.change(elem)
  },


}

