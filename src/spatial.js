function pointInsideBox(point, box) {
  return (
    box.x < point[0]
    &&
    (box.x + box.width) > point[0]
    &&
    box.y < point[1]
    &&
    (box.y + box.height) > point[1]
  )
}

var spatial = {
  pointInsideBox: pointInsideBox,

  getTopLevelSVGNodeList: () => {
    return layer_objects.node.querySelectorAll(
      '#' + layer_objects.id() + ' > .draggable-group'
    )
  },

  topLevelSurrounded: (box) => {
    let captured = []
    let toplevelSVGs = spatial.getTopLevelSVGNodeList()
    toplevelSVGs.forEach(el => {
      let svgBox = elBox(el)
      if (
        pointInsideBox([svgBox.x, svgBox.y], box)
        &&
        pointInsideBox([svgBox.x2, svgBox.y], box)
        &&
        pointInsideBox([svgBox.x, svgBox.y2], box)
        &&
        pointInsideBox([svgBox.x2, svgBox.y2], box)
      ) {
        // console.log('box surrounds', el.id)
        captured.push(el)
      }
    })
    return captured
  },

  smallestSurroundingBox: (elements) => {
    let box = {x: Infinity, y: Infinity, width: 0, height: 0}
    let maxX = 0
    let maxY = 0
    elements.forEach(el => {
      console.log('id', el.id)
      let svgBox = elBox(el)
      console.log("svg", svgBox)
      box.x = Math.min(box.x, svgBox.x)
      box.y = Math.min(box.y, svgBox.y)
      maxX = Math.max(maxX, svgBox.x2)
      maxY = Math.max(maxY, svgBox.y2)
    })
    box.width = maxX - box.x
    box.height= maxY - box.y
    return box
  },

  isOffscreen: (nest, candidateCenter) => {
    return (
      (candidateCenter[0] - (nest.width()/2)) < 0
      ||
      (candidateCenter[1] - (nest.height()/2)) < 0
      ||
      (candidateCenter[0] + (nest.width()/2)) > svg_table.width()
      ||
      (candidateCenter[1] + (nest.height()/2)) > svg_table.height()
    )
  },

  avoidTopLevelCollision: (nest, candidateCenter, depth) => {
    if (depth >= 5) {
      return candidateCenter
    }
    let collision = spatial.isOffscreen(nest, candidateCenter)
    let toplevelSVGs = spatial.getTopLevelSVGNodeList()
    for (let i=0; i < Math.min(toplevelSVGs.length,20); i++) {
      let el = toplevelSVGs.item(i)
      svg_el = SVG.adopt(el)
      let centerBox = {
        x: svg_el.cx() - 20,
        y: svg_el.cy() - 20,
        width: 40,
        height: 40,
      }
      if (pointInsideBox(candidateCenter, centerBox)) {
        collision = true
        break
      }
    }
    if (collision) {
      v = spatial.getWellVector(nest, candidateCenter)
      let newCenter = [
        candidateCenter[0] + parseInt(v[0]),
        candidateCenter[1] + parseInt(v[1]),
      ]
      return spatial.avoidTopLevelCollision(nest, newCenter, depth+1)
    }
    return candidateCenter
  },

  getWellVector: (nest, candidateCenter) => {
    let unitLength = Math.min(nest.width(), nest.height())
    let nv = new Physics.vector(candidateCenter[0], candidateCenter[1])
    let tv = new Physics.vector(svg_table.cx(), svg_table.cy())
    tv.sub(nv.x, nv.y)
    let uv = new Physics.vector(unitLength, 0)
    let randomAngle = Math.random() - .5 // randomly adjust (-.5 <= x <= +.5) radians
    uv.rotate(tv.angle() + randomAngle)
    return [uv.x, uv.y]
  }
}
