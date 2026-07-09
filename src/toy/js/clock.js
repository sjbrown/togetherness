console.log('CLOOOOCK')
var clock = {
  tick_handler: function(elem) {
    for(let num=1; num<=parseInt(elem.dataset.pieNum); num++) {
      let sel = `#pie${num}`
      if(elem.querySelector(sel).style['opacity'] !== '1') {
        elem.querySelector(sel).style['opacity'] = 1
        break
      }
    }
  },

  untick_handler: function(elem) {
    //console.log('tpn', elem.dataset.pieNum)
    for(let num=parseInt(elem.dataset.pieNum); num>0; num--) {
      let sel = `#pie${num}`
      if(elem.querySelector(sel).style['opacity'] !== '0') {
        elem.querySelector(sel).style['opacity'] = 0
        break
      }
    }
  },

  initialize: function(elem, prototype) {
    let maxPies = parseInt(elem.dataset.pieNum)
    for(let num = 1; num <= maxPies; num++) {
      let sel = `#pie${num}`
      let val = (
        prototype
        ?
        prototype.querySelector(sel).style['opacity']
        :
        0
      )
      elem.querySelector(sel).style['opacity'] = val
    }
  },

}

