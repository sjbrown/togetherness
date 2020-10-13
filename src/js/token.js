
var token = {

  initialize: function(elem, prototype) {
    console.log('initialize with proto', prototype)
    if (!prototype) {
      return
    }
    pFront = prototype.querySelector('#token_front').cloneNode(true)
    pBack = prototype.querySelector('#token_back').cloneNode(true)
    selfFront = elem.querySelector('#token_front')
    selfBack = elem.querySelector('#token_back')
    selfFront.replaceWith(pFront)
    selfBack.replaceWith(pBack)
  },

  flip_handler: function(elem) {
    console.log('flip handle!', elem)
    //var tspan = valueTspan || elem.querySelector('tspan')
    back = elem.lastElementChild.previousElementSibling
    SVG.adopt(elem.lastElementChild).opacity(0.1)
    SVG.adopt(back).opacity(1.0)
    elem.appendChild(back)
    ui.do_animate(elem, {animation: 'rollOut'})
  },

}

