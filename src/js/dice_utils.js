
console.info(' x dice_utils.js being read')

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
    if (elem.isChanging) {
      return false
    }
    elem.isChanging = true
    var tspan = valueTspan || elem.querySelector('tspan')
    var origOpacity = elem.style.opacity
    var origNum = parseInt(tspan.textContent)
    ui.animated_ghost(elem, {
      animation: 'thumb',
      on_done: () => {
        tspan.textContent = (origNum % maxFace) + 1
        elem.style.opacity = origOpacity
        elem.isChanging = false
        net_fire({type: "change", data: serialize(elem)});
        evt_fire('change', elem, null, {})
      },
    })
    tspan.textContent = " "
    elem.style.opacity = 0.1
  },

  roll_handler: function(elem, maxFace, valueTspan) {
    //console.log('roll handle!', elem.id, evt)
    if (elem.isChanging) {
      return false
    }
    elem.isChanging = true
    var tspan = valueTspan || elem.querySelector('tspan')
    var origOpacity = elem.style.opacity
    var newNum = randDiceString(1,maxFace)
    ui.animated_ghost(elem, { animation: 'rollOut' })
    tspan.textContent = ' '
    elem.style.opacity = 0.1
    ui.animated_ghost(elem, {
      animation: 'rollIn',
      before_begin: (ghost) => {
        ghost.querySelector('g').style.opacity = origOpacity
      },
      on_done: () => {
        tspan.textContent = newNum
        elem.style.opacity = origOpacity
        elem.isChanging = false
        net_fire({type: "change", data: serialize(elem)});
        evt_fire('change', elem, null, {})
      },
    })
  },

}

