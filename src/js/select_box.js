var select_box = {

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

  selectElements: function(elem, elementsToSelect) {
    nest = SVG.adopt(elem)
    let innerRect = nest.node.querySelector('rect')
    let svg_rect = SVG.adopt(innerRect)

    let sbox = spatial.smallestSurroundingBox(elementsToSelect)
    console.log('surr box', sbox)
    nest.attr(sbox)

    svg_rect.width(sbox.width - 1)
    svg_rect.height(sbox.height - 1)

    let surroundedIds = elementsToSelect.map(el => el.id)
    nest.node.dataset.for = surroundedIds
    let offsets = elementsToSelect.map(el => {
      svg_el = SVG.adopt(el)
      return [svg_el.x() - nest.x(), svg_el.y() - nest.y()]
    })
    nest.node.dataset.offsets = offsets // nested arrays will be flattened
  },

  reshape: function(elem, box) {
    nest = SVG.adopt(elem)
    let innerRect = nest.node.querySelector('rect')
    let svg_rect = SVG.adopt(innerRect)

    nest.attr(box)
    svg_rect.width(box.width - 1)
    svg_rect.height(box.height - 1)
  },

  svg_dragstart: function(elem) {
    // console.log('select_box gets svg_dragstart', elem)
    nest = SVG.adopt(elem)
    let origXY = {
      x: nest.x(),
      y: nest.y(),
    }
    select_box.setOrigXY(origXY)
  },

  svg_drag: function(elem, newX, newY) {
    // console.log('select_box gets svg_drag', elem, newX, newY)
    nest = SVG.adopt(elem)

    offsets = select_box.getOffsets(elem)
    // console.log("offsets", offsets)
    ids = elem.dataset.for.split(',')
    let i = 0
    ids.forEach(id => {
      // console.log('id', id)
      selectedEl = layer_objects.node.querySelector('#' + id)
      svg_el = SVG.adopt(selectedEl)
      // console.log('x', newX + offsets[i][0] )
      svg_el.x( newX + offsets[i][0] )
      svg_el.y( newY + offsets[i][1] )
      i += 1
    })
  },

  initialize: function(elem, prototype) {
    let color = getUserColor()
    nest = SVG.adopt(elem)
    nest.node.dataset.for = []
    let innerRect = nest.node.querySelector('rect')
    let svg_rect = SVG.adopt(innerRect)
    nest.attr({ x: 0, y: 0, width: 0, height: 0 })
    svg_rect.attr({
      x: 0, y: 0,
      width: 0, height: 0,
      fill: color,
      stroke: color,
    })
  },

}

