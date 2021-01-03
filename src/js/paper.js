console.log('PAPER')
var paper = {
  initialize: function(elem, prototype) {
    // console.log('init', elem.id, elem)
    elem.addEventListener('label_change', this.label_change_handler)
    elem.addEventListener('svg_dragenter', () => {console.log('E')})
    elem.addEventListener('svg_dragleave', this.dragleave_handler.bind(elem))
    elem.addEventListener('svg_dragover', this.dragover_handler.bind(elem))
    elem.addEventListener('svg_drag', this.drag_handler.bind(elem))
    elem.addEventListener('svg_drop', this.drop_handler.bind(elem))

    elem.querySelectorAll('svg[id]').forEach(el => {
      // Rewrite the IDs of all the sub-SVGs
      // Because IDs should be unique!
      // (really this should be done for *every* element with an ID...)
      el.classList.add(el.id)
      el.id = el.id + '_' + elem.id
    })

    let label = elem.querySelector(`#${elem.id} > .label_container .tspan_label`)
    let tspanResult = elem.querySelector(`#${elem.id} > .result_container .tspan_result`)
    if (prototype) {

      elem.setAttribute('width', prototype.getAttribute('width'))
      elem.setAttribute('height', prototype.getAttribute('height'))

      let protoLabel = prototype.querySelector(`#${prototype.id} > .label_container .tspan_label`)
      label.textContent = protoLabel.textContent

      if (tspanResult !== null) {
        let protoTspan = prototype.querySelector(`#${prototype.id} > .result_container .tspan_result`)
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
    // console.log('L', this.id, evt)
    paper.unhover(evt.detail.dropElem)
    paper.contents_change(this)
  },

  drag_handler: function(evt) {
    // console.log("DH this", this, 'evt', evt)
    if (!this.contains(evt.target)) {
      return
    }
    // console.log('inner element being dragged', evt.target.id)
  },

  visit_contents_group: function(elem, visitFn) {
    let containedSVGs = elem.querySelectorAll(
      `#${elem.id} > .contents_group > svg`
    )
    containedSVGs.forEach(visitFn)
  },

  get_numeric_value(elem) {
    if(elem.classList.contains('paper')) {
      let num = parseInt(paper.getValue(elem))
      if (isNaN(num)) {
        return 0
      } else {
        return num
      }
    } else {
      let sum = 0
      elem.querySelectorAll('tspan').forEach((t) => {
        if (t.closest('svg').id !== elem.id) {
          // it's buried multiple levels deep in sub-SVGs
          // so skip it lest it be double-counted
          return
        }
        let c = t.textContent.trim()
        let num = parseInt(c)
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
    }
  },

  getValue: function(elem) {
    tspan = elem.querySelector(`#${elem.id} > .result_container .tspan_result`)
    return tspan.textContent.trim()
  },

  get_contents_values(elem) {
    let values = {}
    let containedSVGs = elem.querySelectorAll(
      `#${elem.id} > .contents_group > svg`
    )
    containedSVGs.forEach((subElem) => {
      nses = getNamespacesForElement(subElem)
      nses.forEach((ns) => {
        if (ns.getValue) {
          values[subElem.id] = ns.getValue(subElem)
          return
        }
      })
    })
    return values
  },

  roll_handler: function(elem, evt) {
    // console.log('paper', elem.id, 'hears roll event', evt)
    paper.visit_contents_group(elem, (s) => {
      let die_roll_handler = ui.augmented_handlers_for_element(s)['die_roll']
      if (die_roll_handler) {
        die_roll_handler()
      }
    })
    paper.contents_change(elem)
  },

  fix: function(evt, elem) {
    // console.log('paper hears fix event', elem, evt)
    lock_selection(evt, elem)
  },

  resize_handler: function(evt) {
    elem = this
    // console.log('paper', elem.id, ' got resize', evt.detail.width, evt.detail.height)
    let w = evt.detail.width
    let h = evt.detail.height

    let bg = elem.querySelector(`#${elem.id} > .resizable_bg`)
    bgbox = SVG.adopt(bg)
    bgbox.width(w)
    bgbox.height(h)
    elem_svg = SVG.adopt(elem)
    elem_svg.width(w)
    elem_svg.height(h)
    elem_svg.viewbox(0,0,w,h)
  },

  label_click_handler: function(elem) {
    // console.log('lbclick', elem)
    let label = elem.querySelector(`#${elem.id} > .label_container .tspan_label`)
    ui_popup_text_input(
      elem,
      'Label',
      label.textContent,
      'label_change'
    )
  },

  label_change_handler: function(evt) {
    elem = evt.target
    let label = elem.querySelector(`#${elem.id} > .label_container .tspan_label`)
    label.textContent = evt.detail.inputValue
  },

  hover: function(dropElem) {
    dropElem.querySelectorAll('.hover_indicator').forEach(el => {
      SVG.adopt(el).opacity(1)
    })
  },

  unhover: function(dropElem) {
    dropElem.querySelectorAll('.hover_indicator').forEach(el => {
      SVG.adopt(el).opacity(0)
    })
  },

  dragover_handler: function(evt) {
    // console.log('paper', 'dragover_handler', evt.detail)
    dragged = SVG.adopt(evt.detail.draggedElem)
    drop = SVG.adopt(evt.detail.dropElem)
    is_inside = isInside(dragged.node, drop.node)
    if (is_inside) {
      paper.hover(evt.detail.dropElem)
    }
  },

  drop_handler: function(evt) {
    draggedElem = evt.detail.draggedElem
    if (draggedElem === null) {
      return
    }

    paper.unhover(evt.detail.dropElem)

    let elem = this
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
            // console.log('consume it here', svgElem.id, parentElem.id)
            contentsGroup.appendChild(svgElem)
          }
        )
      }
    })
    paper.contents_change(elem)
  },

  contents_change: function(elem) {
    getNamespacesForElement(elem).forEach(ns => {
      if (ns.notify_contents_change) {
        ns.notify_contents_change(elem)
      }
    })
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

