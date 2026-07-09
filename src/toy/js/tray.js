var tray = {
  initialize: function(elem, prototype) {
    // console.log('tray.initialize', elem.id, elem)
    tray.addListeners(elem)
    elem.querySelectorAll('svg[id]').forEach(el => {
      // Rewrite the IDs of all the sub-SVGs
      // Because IDs should be unique!
      // (really this should be done for *every* element with an ID...)
      if (el.id.indexOf('o_') === -1) {
        el.classList.add(el.id)
        el.id = el.id + '_' + elem.id
      }
    })

    let label = elem.querySelector(`#${elem.id} > .label_container .tspan_label`)
    if (prototype) {

      elem.setAttribute('width', prototype.getAttribute('width'))
      elem.setAttribute('height', prototype.getAttribute('height'))

      let protoLabel = prototype.querySelector(`#${prototype.id} > .label_container .tspan_label`)
      label.textContent = protoLabel.textContent

      let tspanResult = elem.querySelector(`#${elem.id} > .result_container .tspan_result`)
      if (tspanResult !== null) {
        let protoTspan = prototype.querySelector(`#${prototype.id} > .result_container .tspan_result`)
        tspanResult.textContent = protoTspan.textContent
      }

      let contentsGroup = elem.querySelector(`#${elem.id} > .contents_group`)
      tray.visit_contents_group(elem, (child) => {
        child.remove()
      })
      tray.visit_contents_group(prototype, (child) => {
        contentsGroup.appendChild(child)
      })

    } else {
      label.textContent = ''
    }

  },

  addListeners: function(elem) {
    elem.addEventListener('label_change', this.label_change_handler)
    elem.addEventListener('svg_dragenter', () => {console.log('E')})
    elem.addEventListener('svg_dragleave', this.dragleave_handler.bind(elem))
    elem.addEventListener('svg_dragover', this.dragover_handler.bind(elem))
    elem.addEventListener('svg_drag', this.drag_handler.bind(elem))
    elem.addEventListener('svg_drop', this.drop_handler.bind(elem))
  },

  dragleave_handler: function(evt) {
    elem = this
    // console.log('L', this.id, evt)
    tray.unhover(evt.detail.dropElem)
    fireHandlerForEvent(elem, 'contents_change_handler')
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
    if(elem.classList.contains('tray')) {
      let num = tray.getUnderstoodNumber(tray.getValue(elem))
      if (num !== null) {
        return num
      } else {
        return 0
      }
    }

    let evaluated = tray.evaluate_sub_element(elem)
    if (evaluated !== null) {
      let num = tray.getUnderstoodNumber(evaluated)
      if (num !== null) {
        return num
      } else {
        return 0
      }
    }

    let topmostNumber = null
    elem.querySelectorAll('tspan').forEach((t) => {
      if (t.closest('svg').id !== elem.id) {
        // it's buried multiple levels deep in sub-SVGs
        // so skip it lest it be double-counted
        return
      }
      let trimmed = t.textContent.trim()
      let num = tray.getUnderstoodNumber(trimmed)
      if (num !== null) {
        topmostNumber = num
      }
    })
    return topmostNumber || 0
  },

  getUnderstoodNumber: function(val) {
    //FATE / FUDGE dice have "-" and "+" which mean -1 and +1
    let num = parseFloat(val)
    if (!isNaN(num)) {
      return num
    }
    if (val == '+') {
      return 1
    }
    if (val == '-') {
      return -1
    }
    return null
  },

  getValue: function(elem) {
    tspan = elem.querySelector(`#${elem.id} > .result_container .tspan_result`)
    return tspan.textContent.trim()
  },

  evaluate_sub_element(subElem) {
    let retval = null
    nses = getNamespacesForElement(subElem)
    nses.forEach((ns) => {
      if (ns.getValue) {
        retval = ns.getValue(subElem)
        return
      }
    })
    return retval
  },

  get_contents_values(elem) {
    let values = {}
    let containedSVGs = elem.querySelectorAll(
      `#${elem.id} > .contents_group > svg`
    )
    containedSVGs.forEach((subElem) => {
      values[subElem.id] = tray.evaluate_sub_element(subElem)
      if (values[subElem.id] === null) {
        delete values[subElem.id]
      }
    })
    return values
  },

  roll_handler: function(elem, evt) {
    // console.log('tray', elem.id, 'hears roll event', evt)
    tray.visit_contents_group(elem, (s) => {
      let die_roll_handler = ui.augmented_handlers_for_element(s)['die_roll']
      if (die_roll_handler) {
        die_roll_handler()
      }
    })
    fireHandlerForEvent(elem, 'contents_change_handler')
  },

  fix: function(evt, elem) {
    // console.log('tray hears fix event', elem, evt)
    lock_selection(evt, elem)
  },

  resize_handler: function(elem, evt) {
    // console.log('tray', elem.id, ' got resize', evt.detail.width, evt.detail.height)
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
    // console.log('tray', 'dragover_handler', evt.detail)
    dragged = SVG.adopt(evt.detail.draggedElem)
    drop = SVG.adopt(evt.detail.dropElem)
    is_inside = isInside(dragged.node, drop.node)
    if (is_inside) {
      tray.hover(evt.detail.dropElem)
    }
  },

  drop_handler: function(evt) {
    draggedElem = evt.detail.draggedElem
    if (draggedElem === null) {
      return
    }

    tray.unhover(evt.detail.dropElem)

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
      // console.log('dragged', draggedEl.id, 'box is inside drop',
      //  dropElem,
      //  '?', is_inside
      //)

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
    fireHandlerForEvent(elem, 'contents_change_handler')
  },


  menu: {
    'Label': {
      eventName: 'label_click',
      applicable: (node) => { return true },
      handler: function() {
        tray.label_click_handler(this)
      },
    },
    'Fix': {
      eventName: 'tray_fix',
      otherEvents: ['dblclick'],
      applicable: (node) => { return true },
      handler: function(evt) {
        tray.fix(evt, this)
      },
    },
  },

}

