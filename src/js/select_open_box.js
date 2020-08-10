console.log('SELECT OPEN BOX')
var select_open_box = {

  getOrigXY: function(elem) {
    if (!elem.dataset.origXY) {
      return {}
    }
    xy = elem.dataset.origXY.split(',')
    return { x: xy[0], y: xy[1] }
  },

  setOrigXY: function(elem, xyObj) {
    xy = [xyObj.x, xyObj.y]
    elem.dataset.origXY = xy
  },

  getOffsets: function(elem) {
    let offsets = []
    if (!elem.dataset.offsets) {
      return offsets
    }
    flattened = elem.dataset.offsets.split(',')
    for(let i=0; i<flattened.length; i += 2){
      offsets.push([
        parseInt(flattened[i]),
        parseInt(flattened[i+1]),
      ])
    }
    return offsets
  },

  selectElement: function(elem, elementToSelect) {
    nest = SVG.adopt(elem)
    let selRect = nest.node.querySelector('#select_rect')
    let sel_rect_svg = SVG.adopt(selRect)
    let handle = nest.node.querySelector('#resize_handle')
    let handle_svg = SVG.adopt(handle)

    let sbox = spatial.smallestSurroundingBox([elementToSelect])
    console.log('surr box', sbox)
    nest.attr(sbox)

    sel_rect_svg.width(sbox.width - 1)
    sel_rect_svg.height(sbox.height - 1)
    handle_svg.x(sbox.width - 20)
    handle_svg.y(sbox.height - 20)

    nest.node.dataset.for = elementToSelect.id
    svg_el = SVG.adopt(elementToSelect)
    let offsets = [svg_el.x() - nest.x(), svg_el.y() - nest.y()]
    nest.node.dataset.offsets = offsets
  },


  reshape: function(elem, box) {
    console.log("reshape", elem.id, box)
    nest = SVG.adopt(elem)
    let selRect = nest.node.querySelector('#select_rect')
    let sel_rect_svg = SVG.adopt(selRect)

    nest.attr(box)
    sel_rect_svg.width(box.width - 1)
    sel_rect_svg.height(box.height - 1)
  },

  svg_dragstart: function(elem) {
    console.log('select_open_box gets svg_dragstart', elem)
    nest = SVG.adopt(elem)
    let origXY = {
      x: nest.x(),
      y: nest.y(),
    }
    select_open_box.setOrigXY(origXY)
  },

  svg_drag_handle: function(elem, handle, evt) {
    console.log('select_open_box gets svg_drag', elem, handle, evt.detail)
    nest = SVG.adopt(elem)
    mouse = evt.detail.mouse
    select_open_box.reshape(elem, {
      x: nest.x(),
      y: nest.y(),
      width: mouse.x - nest.x(),
      height: mouse.y - nest.y(),
    })

    /*
    ui.getSelectBoxSelectedElements(elem).forEach(selectedEl => {
      console.log("selected el resize", selectedEl.id, evt.detail)
      let detail = {
        width: nest.width(),
        height: nest.height(),
      }
      selectedEl.dispatchEvent(new CustomEvent('resize', {
        view: window,
        bubbles: true,
        cancelable: true,
        detail: detail,
      }))
    })
    */
  },

  svg_dragend_handle: function(elem, handle, evt) {
    ui.getSelectBoxSelectedElements(elem).forEach(selectedEl => {
      console.log("selected el resize", selectedEl.id, evt.detail)
      let detail = {
        width: nest.width(),
        height: nest.height(),
      }
      selectedEl.dispatchEvent(new CustomEvent('resize', {
        view: window,
        bubbles: true,
        cancelable: true,
        detail: detail,
      }))
    })
    ui.unselectAll()
    synced.remove(handle)
  },

  initialize: function(elem, prototype) {
    let color = getUserColor()
    let nest = SVG.adopt(elem)
    let handle = nest.node.querySelector('#resize_handle')
    let handle_svg = SVG.adopt(handle)
    nest.node.dataset.for = []

    let innerRect = nest.node.querySelector('rect')
    let svg_rect = SVG.adopt(innerRect)
    nest.attr({ x: 0, y: 0, width: 0, height: 0 })
    svg_rect.attr({
      x: 0, y: 0,
      width: 0, height: 0,
      stroke: color,
    })

    handle.addEventListener('svg_drag', (evt) => {
      console.log("select_open_box handle svg_drag")
      this.svg_drag_handle(elem, handle, evt)
    })

    handle.addEventListener('svg_dragend', (evt) => {
      console.log("select_open_box handle svg_drag")
      this.svg_dragend_handle(elem, handle, evt)
    })

    elem.addEventListener('svg_dragsafe_dblclick', () => {
      console.log("select_open_box dbl")
      /*
      ui.getSelectBoxSelectedElements(elem).forEach(selectedEl => {
        let detail = {elemId: selectedEl.id}
        console.log("selected el dbl", selectedEl.id, detail)
        selectedEl.dispatchEvent(new MouseEvent('dblclick', {
          view: window,
          bubbles: true,
          cancelable: true,
          detail: detail,
        }))
      })
      */
    })
  },

}

