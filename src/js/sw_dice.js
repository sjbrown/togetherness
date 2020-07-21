var sw_dice = {

  roll_handler: function(elem, faces) {
    if (elem.isChanging) {
      return false
    }
    elem.isChanging = true
    var origOpacity = elem.style.opacity
    ui.animated_ghost(elem, { animation: 'rollOut' })
    faces.forEach((name) => {
      if (name === null) {
        return
      }
      gEl = elem.getElementById(name)
      gEl.style.setProperty('display', 'none')
    })
    elem.style.opacity = 0.1
    ui.animated_ghost(elem, {
      animation: 'rollIn',
      before_begin: (ghost) => {
        ghost.querySelector('g').style.opacity = origOpacity
      },
      on_done: () => {
        var activeFace = faces[ randInt(1,faces.length) - 1 ]
        if (activeFace !== null) {
           gEl = elem.getElementById(activeFace)
           gEl.setAttribute('display', '')
           gEl.style.setProperty('display', '')
        }

        elem.style.opacity = origOpacity
        elem.isChanging = false
        synced.change(elem)
        synced.run()
      },
    })
  },

}

