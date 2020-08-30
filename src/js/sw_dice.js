var sw_dice = {

  roll_handler: function(elem, faces) {
    if (elem.isChanging) {
      return false
    }
    elem.isChanging = true
    var origOpacity = elem.style.opacity
    ui.animated_ghost(elem, { animation: 'rollOut' })
    faces.forEach((name) => {
      console.log("face", name)
      if (name === null) {
        return
      }
      let gEl = elem.getElementById(name)
      gEl.style.setProperty('display', 'none')
    })
    elem.style.opacity = 0.1
    ui.animated_ghost(elem, {
      animation: 'rollIn',
      before_begin: (ghost) => {
        ghost.querySelector('g').style.opacity = origOpacity
      },
      on_done: () => {
        let activeFace = faces[ randInt(1,faces.length) - 1 ]
        if (activeFace !== null) {
           let gEl = elem.getElementById(activeFace)
           console.log("on done", activeFace, gEl)
           gEl.removeAttribute('display')
           gEl.style.setProperty('display', '')
           console.log("here")
        }

        elem.style.opacity = origOpacity
        elem.isChanging = false
        synced.change(elem)
        evt_fire('change', elem, null, {})
      },
    })
  },

}

