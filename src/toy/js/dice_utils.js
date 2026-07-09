/**
 * dice_utils.js — shared helper namespace for die toy types.
 *
 */
var dice = {
  turn_handler: function (elem, maxFace, valueTspan) {
    const tspan = valueTspan || elem.querySelector('tspan')
    const current = parseInt(tspan.textContent, 10) || 0
    const value = (current % maxFace) + 1
    tspan.textContent = String(value)
    return value
  },

  roll_handler: function (elem, maxFace, valueTspan) {
    const tspan = valueTspan || elem.querySelector('tspan')
    const value = _randInt(1, maxFace)
    tspan.textContent = String(value)
    return value
  },


  // For dice rendered as a stack of <g class="face"> elements (one drawn
  // face per side, toggled via display)
  multiface_roll_handler: function (elem) {
    const faces = Array.from(elem.querySelectorAll('g.face'))
    if (!faces.length) return null
    faces.forEach(g => g.setAttribute('display', 'none'))
    const activeFace = faces[_randInt(1, faces.length) - 1]
    activeFace.removeAttribute('display')
    return faces.indexOf(activeFace) + 1
  },

  multiface_turn_handler: function (elem) {
    const faces      = Array.from(elem.querySelectorAll('g.face'))
    const activeFace = faces.find(g => g.getAttribute('display') !== 'none')
    if (!activeFace) return null
    const nextFace = faces[(faces.indexOf(activeFace) + 1) % faces.length]
    activeFace.setAttribute('display', 'none')
    nextFace.removeAttribute('display')
    return faces.indexOf(nextFace) + 1
  },

  getValue: function (elem) {
    // elem is expected to contain exactly one <svg> of its own
    const ownSvg = elem.tagName?.toLowerCase() === 'svg' ? elem : elem.querySelector('svg')
    let sum = 0
    elem.querySelectorAll('tspan').forEach(t => {
      // skipped so they're not double-counted once by their own getValue()
      // call and again by the container's.
      if (t.closest('svg') !== ownSvg) return
      const c   = t.textContent.trim()
      const num = parseInt(c, 10)
      if (!isNaN(num)) sum += num
      // FATE dice faces ('+' / '-') add/subtract 1.
      if (c === '+') sum += 1
      if (c === '-') sum -= 1
    })
    return sum
  },

}

function _randInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
