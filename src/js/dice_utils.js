
function randDiceString(min, max) {
  // get a random integer in the range, inclusive.
  // randInt(1,6) might return 1,2,3,4,5,6
  min = Math.ceil(min)
  max = Math.floor(max)
  return '' + (Math.floor(Math.random() * (max - min + 1)) + min)
}

var dice = {
  turn_handler: function(elem, maxFace, valueTspan) {
    console.log("turn handler", elem.id, maxFace)
    var tspan = valueTspan || elem.querySelector('tspan')
    var origNum = parseInt(tspan.textContent)
    elem.classList.add('animating-turn')
    tspan.textContent = (origNum % maxFace) + 1
  },

  roll_handler: function(elem, maxFace, valueTspan) {
    //console.log('roll handle!', elem)
    var tspan = valueTspan || elem.querySelector('tspan')
    ui.do_animate(elem, {animation: 'rollOut'})
    tspan.textContent = randDiceString(1,maxFace)
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

