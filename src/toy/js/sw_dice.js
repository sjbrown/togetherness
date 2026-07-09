var sw_dice = {

  roll_handler: function(elem, faces) {
    faces.forEach((name) => {
      console.log("face", name)
      if (name === null) {
        return
      }
      let gEl = elem.getElementById(name)
      gEl.style.setProperty('display', 'none')
    })
    ui.do_animate(elem, {animation: 'rollOut'})
    let activeFace = faces[ randInt(1,faces.length) - 1 ]
    if (activeFace !== null) {
       let gEl = elem.getElementById(activeFace)
       console.log("on done", activeFace, gEl)
       gEl.removeAttribute('display')
       gEl.style.setProperty('display', '')
       console.log("here")
    }

  },

}

