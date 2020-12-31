console.log('PAPER')
var paper = {
  initialize: function(elem, prototype) {
    elem.addEventListener('label_change', this.label_change_handler)
    elem.addEventListener('svg_dragenter', () => {console.log('E')})
    elem.addEventListener('svg_dragleave', this.dragleave_handler.bind(elem))
    elem.addEventListener('svg_drag', this.drag_handler.bind(elem))
    elem.addEventListener('svg_drop', this.drop_handler.bind(elem))
    elem.addEventListener('svg_dragover', this.dragover_handler.bind(elem))

    let label = elem.querySelector(`#${elem.id} > text > #tspan_label`)
    let tspanResult = elem.querySelector(`#${elem.id} > text > #tspan_result`)
    if (prototype) {

      elem.setAttribute('width', prototype.getAttribute('width'))
      elem.setAttribute('height', prototype.getAttribute('height'))

      let protoLabel = prototype.querySelector('#tspan_label')
      label.textContent = protoLabel.textContent

      if (tspanResult !== null) {
        let protoTspan = prototype.querySelector('#tspan_result')
        tspanResult.textContent = protoTspan.textContent
      }

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

  dragleave_handler: function(evt) {
    console.log('L', this.id)
    evt_fire('dom_change', this, null, {})
  },

  drag_handler: function(evt) {
    console.log("DH this", this, 'evt', evt)
    if (!this.contains(evt.target)) {
      return
    }
    console.log('inner element being dragged', evt.target.id)
  },

  visit_contents_group(elem, visitFn) {
    let containedSVGs = elem.querySelectorAll(
      `#${elem.id} > .contents_group > svg`
    )
    containedSVGs.forEach(visitFn)
  },

  get_die_value(elem) {
    let sum = 0
    elem.querySelectorAll('tspan').forEach((t) => {
      if (t.closest('svg').id !== elem.id) {
        // it's buried multiple levels deep in sub-SVGs
        // so skip it lest it be double-counted
        return
      }
      c = t.textContent.trim()
      console.log("c", c)
      num = parseInt(c)
      if (!isNaN(num)) {
        sum += num
      }
      if (c == '+') {
        sum += 1
      }
      if (c == '-') {
        sum -= 1
      }
    })
    return sum
  },

  get_contents_values(elem) {
    let values = {}
    let containedSVGs = elem.querySelectorAll(
      `#${elem.id} > .contents_group > svg`
    )
    containedSVGs.forEach((subElem) => {
      nses = getNamespacesForElement(subElem)
      nses.forEach((nsName) => {
        let ns = window[nsName]
        if (ns.getValue) {
          values[subElem.id] = ns.getValue(subElem)
          return
        }
      })
    })
    return values
  },

  roll_handler: function(elem, evt) {
    console.log('paper', elem.id, 'hears roll event', evt)
    paper.visit_contents_group(elem, (s) => {
      let die_roll_handler = ui.augmented_handlers_for_element(s)['die_roll']
      if (die_roll_handler) {
        die_roll_handler()
      }
    })
    evt_fire('dom_change', elem, null, {})
  },

  fix: function(evt, elem) {
    // console.log('paper hears fix event', elem, evt)
    lock_selection(evt, elem)
  },

  resize_handler: function(evt) {
    elem = this
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

  label_change_handler: function(evt) {
    elem = evt.target
    let label = elem.querySelector(`#${elem.id} > text > #tspan_label`)
    label.textContent = evt.detail.inputValue
  },

  dragover_handler: function(evt) {
    console.log('paper', 'dragover_handler', evt.detail)
    dragged = SVG.adopt(evt.detail.draggedElem)
    drop = SVG.adopt(evt.detail.dropElem)
    is_inside = isInside(dragged.node, drop.node)
    if (is_inside) {
      drop.opacity(0.4)
      //SVG.adopt(this).opacity(0.4)
      return
    }
    drop.opacity(1.0)
    //SVG.adopt(this).opacity(1.0)
  },

  drop_handler: function(evt) {
    console.log('evt is', evt)
    console.log('this is', this)

    draggedElem = document.querySelector('#' + evt.detail.draggedElemId)
    if (draggedElem === null) {
      return
    }

    let elem = this
    console.log('target should be ', elem)
    console.log('target is', evt.target)
    console.log('paper drop_handler', elem.id, evt.detail.draggedElemId, evt.target)
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
  },

  menu: {
    'Label': {
      eventName: 'label_click',
      applicable: (node) => { return true },
      handler: function() {
        paper.label_click_handler(this)
      },
    },
    'Fix': {
      eventName: 'paper_fix',
      otherEvents: ['dblclick'],
      applicable: (node) => { return true },
      handler: function(evt) {
        paper.fix(evt, this)
      },
    },
  },



}

