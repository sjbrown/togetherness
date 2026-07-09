
function randDiceString(min, max) {
  // get a random integer in the range, inclusive.
  // randInt(1,6) might return 1,2,3,4,5,6
  min = Math.ceil(min)
  max = Math.floor(max)
  return '' + (Math.floor(Math.random() * (max - min + 1)) + min)
}

var dice = {
  turn_handler: function(elem, maxFace, valueTspan) {
    var tspan = valueTspan || elem.querySelector('tspan')
    var origNum = parseInt(tspan.textContent)
    console.log("turn handler", elem.id, maxFace, "was", origNum)
    elem.classList.add('animating-turn')
    tspan.textContent = (origNum % maxFace) + 1
  },

  roll_handler: function(elem, maxFace, valueTspan) {
    //console.log('roll handle!', elem)
    var tspan = valueTspan || elem.querySelector('tspan')
    ui.do_animate(elem, {animation: 'rollOut'})
    tspan.textContent = randDiceString(1,maxFace)
  },

  multiface_roll_handler: function(elem) {
    let faceEls = elem.querySelectorAll('g.face')
    let faceArray = []
    faceEls.forEach((gEl) => {
      gEl.setAttribute('display', 'none')
      faceArray.push(gEl)
    })
    ui.do_animate(elem, {animation: 'rollOut'})
    let activeFace = faceArray[ randInt(1,faceEls.length) - 1 ]
    if (activeFace !== null) {
       activeFace.removeAttribute('display')
    }
  },

  multiface_turn_handler: function(elem) {
    let activeFace = elem.querySelector('g.face:not([display=none])')
    let nextFace = activeFace.nextElementSibling
    if (nextFace === null) {
      nextFace = activeFace.parentElement.querySelector('g.face')
    }
    activeFace.setAttribute('display', 'none')
    nextFace.removeAttribute('display')
    elem.classList.add('animating-turn')
  },

  getValue(elem) {
    let sum = 0
    elem.querySelectorAll('tspan').forEach((t) => {
      if (t.closest('svg').id !== elem.id) {
        // it's buried multiple levels deep in sub-SVGs
        // so skip it lest it be double-counted
        return
      }
      c = t.textContent.trim()
      num = parseInt(c)
      if (!isNaN(num)) {
        sum += num
      }
      // FATE dice are +, _, and -
      if (c == '+') {
        sum += 1
      }
      if (c == '-') {
        sum -= 1
      }
    })
    return sum
  },
}

