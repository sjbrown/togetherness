
var spatial = {
  avoidTopLevelCollision: (nest, candidateCenter, depth) => {
    if (depth >= 5) {
      return candidateCenter
    }
    let collision = false
    toplevelSVGs = svg_table.node.querySelectorAll('.draggable-group')
    toplevelSVGs.forEach(el => {
      svg_el = SVG.adopt(el)
      let centerBox = {
        x: svg_el.cx() - 20,
        y: svg_el.cy() - 20,
        width: svg_el.cx() + 20,
        height: svg_el.cy() + 20,
      }
      if (
        centerBox.x < candidateCenter[0]
        &&
        centerBox.width > candidateCenter[0]
        &&
        centerBox.y < candidateCenter[1]
        &&
        centerBox.height > candidateCenter[1]
      ) {
        collision = true
      }
    })
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
