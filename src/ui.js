
const ui = {

  justNonUiAttributes: (node) => {
    return node.getAttributeNames()
    .reduce((acc,n) => {
      if (n.indexOf('data-ui-') === -1) {
        acc[n] = g(node, n);
      }
      return acc
    }, {});
  },

  is_marked: (node) => {
    return (
      g(node.parentNode, 'data-app-class') === 'nest'
      &&
      g(node.parentNode.lastChild, 'data-app-class') === 'mark'
    )
  },

  make_nest: (attrs) => {
    //var nest = svg_table.nested()
    var nest = svg_table.element('svg', SVG.Container)
    nest.attr(Object.assign({
      'data-app-class': 'nest',
    }, attrs))
    nest.addClass('draggable-group')

    return nest;
  },

  make_mark: (target_id, attrs) => {
    // make the highlight rectangle
    target = SVG.get(target_id)
    //console.log("making mark on", target_id, target)

    var color = getUserColor()
    var rect = svg_table.rect()
    rect.addClass('mark-rect')
    rect.attr(
      Object.assign({
        'data-app-class': 'mark',
        x: 0,
        y: 0,
        rx: 4,
        ry: 4,
        'fill-opacity': 0.1,
        'stroke-opacity': 0.8,
        'stroke-width': 1,
        width: target.width() + 4,
        height: target.height() + 4,
        fill: color,
        stroke: color,
      }, attrs)
    )
    var nest = ui.make_nest({
      id: 'nest_' + rect.attr('id'), // special ID
      width: rect.width(),
      height: rect.height(),
      x: target.x() - 2,
      y: target.y() - 2,
      'data-nest-for': 'mark',
    })
    //console.log("nest node is now", nest.node)

    // Re-home the enveloped object inside the <svg>, and then
    // move that <svg> to the old x,y coords of the enveloped object
    oldXY = {
      x: target.x(),
      y: target.y(),
    }
    target.x(0)
    target.y(0)
    nest.node.appendChild(target.node)
    //target.toParent(nest)
    target.attr('data-enveloped', true)
    ui.un_hookup_ui(target.node)
    nest.attr( oldXY )
    nest.add(rect) // Add it last, so that it renders on top

    /*
    setNamespacesForElement(nest.node, ['mark'])
    window['mark'] = {
      makeMenu: (elem) => {
        console.log('in makeMenu')
      }
    }
    */

    ui.hookup_ui(nest.node)

    return {
      mark_rect: rect,
      mark_nest: nest,
    }
  },



  mark_by_id: (evt, target_id) => {
    //console.log('ui.mark_by_id target_id', evt, target_id)
    // unmark everything else, unless shift or ctrl is being held
    if (!evt.ctrlKey && !evt.shiftKey) {
      ui.unmark_all_but(target_id)
    }

    // am I already marked?
    // target = SVG.get(target_id)
    let targetEl = byId(target_id)
    if (g(targetEl, 'data-enveloped')) {
      console.log('ALREADY MARKED')
      return
    }

    var { mark_rect, mark_nest } = ui.make_mark(target_id)
    ui.fire({ type: 'createMark', data: mark_nest })
    synced.dirty_remove(targetEl)
    synced.dirty_add(mark_nest.node)
  },

  unmark: (evt) => {
    //console.log('ui.unmark', evt)
    //evt.stopPropagation()
    ui._unmark_nest(evt.target.closest('[data-nest-for=mark]'))
    ui.fire({type: 'dropMark', data: mark_rect.parentNode});
  },

  unmark_all_but: (exceptId) => {
    //console.log('unmark_all_but', exceptId)
    document.querySelectorAll('[data-nest-for=mark]').forEach(el => {
      //console.log('considering', exceptId, el, el.id === exceptId)
      if (
        exceptId
        &&
        (el.id === exceptId || el.querySelector('#' + exceptId))
      ) {
        return
      }
      //console.log("unmarking", el)
      ui._unmark_nest(el);
      ui.fire({type: 'dropMark', data: el});
    })
  },

  raw_unmark: (el) => {
    //console.log('raw unmark', el.id)
    if (!el.dataset.enveloped) {
      console.error('element', el, 'was not marked')
      return
    }
    nestSVG = SVG.adopt(el.parentElement)
    oldXY = {
      x: nestSVG.x(),
      y: nestSVG.y(),
    }
    SVG.adopt(el).attr(oldXY)
    s(el, 'data-enveloped', null)
    if (el.classList.contains('drag-open')) {
      el.classList.remove('drag-open')
    }
    synced.remove(nestSVG)
    ui.fire({type: 'dropMark', data: el.parentElement});
  },

  _unmark_nest: (nestEl) => {
    //console.log("_unmark_nest", nestEl.id)
    nestEl.querySelectorAll('.resize_handle').forEach(handle => {
      synced.remove(handle)
    })
    nestEl.querySelectorAll('.resize_dotted_rect').forEach(el => {
      synced.remove(el)
    })
    let nestSVG = SVG.adopt(nestEl)
    oldXY = {
      x: nestSVG.x(),
      y: nestSVG.y(),
    }
    //console.log('unmarking ', oldXY, )
    // re-parent all the enveloped ones back into the svg_table element
    nestEl.querySelectorAll('#' + nestEl.id + ' > [data-enveloped]').forEach(kid => {
      s(kid, 'data-enveloped', null)
      if (kid.classList.contains('drag-open')) {
        kid.classList.remove('drag-open')
      }
      kid.remove()
      kidObj = SVG.adopt(kid)
      kidObj.attr(oldXY)
      synced.add(kid)
      //console.log('back in the doc', kidObj)
      ui.hookup_ui(kid)
      ui.hookup_menu_actions(kid)
    })
    synced.remove(nestEl)
  },

  hookup_ui: (elem) => {
    //console.log("hookup_ui", elem.id)
    nest = SVG.adopt(elem)
    nest.on('svg_dragsafe_click', (evt) => {
      console.log('id', elem.id, 'got click', evt)
      if (elem.dataset.nestFor !== 'mark') {
        ui.mark_by_id(evt.detail.origEvent, elem.id)
      } else {
        if (evt.ctrlKey) {
          ui.unmark(evt)
        } else {
          ui.unmark_all_but(nest.node.id)
        }
      }
    })
    nest.on('svg_dragsafe_dblclick', (evt) => {
      console.log('nest ', nest.id, ' got dblclick')
      if (elem.dataset.nestFor === 'mark') {
        let triggerNode = nest.node.firstChild
        let detail = {elemId: nest.node.firstChild.id}
        console.log("document dbl", triggerNode.id, detail)
        triggerNode.dispatchEvent(new MouseEvent('dblclick', {
          view: window,
          bubbles: true,
          cancelable: true,
          detail: detail,
        }))
      }
    })
  },

  un_hookup_ui: (elem) => {
    //console.log("un_hookup_ui", elem.id)
    nest = SVG.adopt(elem)
    nest.off('svg_dragsafe_click')
    nest.off('svg_dragsafe_dblclick')
  },

  hookup_menu_actions: (svgEl) => {
    //console.log('hookup_menu_actions', svgEl)
    svgEl.addEventListener('node_delete', delete_marked)
    svgEl.addEventListener('mouseover', ui.mouseover)
    // Hookup any self-event handlers
    ui.hookup_self_event_handlers(svgEl)
  },

  hookup_self_event_handlers: (el) => {
    let actionMenu = getFullMenuForElement(el)
    Object.keys(actionMenu).map((title) => {
      let menuItem = actionMenu[title]
      if (!menuItem.handler) {
        return
      }
      console.log("hooking up", menuItem.eventName, menuItem.handler)
      let wrapper = function(evt) {
        // console.log("IN WRAPPER", evt, el)
        menuItem.handler.bind(el)(evt)
        synced.change(el)
      }
      el.addEventListener(menuItem.eventName, wrapper)
      if (menuItem.otherEvents) {
        menuItem.otherEvents.forEach(evName => {
          el.addEventListener(evName, wrapper)
        })
      }
    })
  },

  mouseover: function (evt) {
    // Add clickable (right-click) options onto the menu
    // Note: addEventListener must use this named, static, non-arrow function
    //       to prevent memory-leak bug:
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Memory_issues
    //console.log('ui.mouseover', evt, this)
    let hoveredEl = this

    deleteList = document.querySelectorAll('.cloned-menuitem')
    Array.prototype.forEach.call(deleteList, (el) => {
      el.remove();
    })

    let actionMenu = getFullMenuForElement(hoveredEl)
    var menu = byId('gamemenu')
    var template = byId('template_menuitem')
    Object.keys(actionMenu).map((title) => {
      if (!actionMenu[title].applicable(hoveredEl)) {
        return
      }
      var uiLabel = (
        actionMenu[title].uiLabel
        ?
        actionMenu[title].uiLabel(hoveredEl)
        :
        title
      )
      var clone = template.content.firstElementChild.cloneNode(true)
      s(clone, 'id', 'menuitem-' + hoveredEl.id)
      s(clone, 'label', uiLabel)
      clone.classList.add('cloned-menuitem')
      clone.addEventListener('click', (evt) => {
        //console.log('hoveredElement', hoveredEl)
        evt_fire(actionMenu[title].eventName, hoveredEl, evt)
      })
      menu.insertAdjacentElement('beforeend', clone)
    })
  },

  update_buttons: () => {
    //console.log("ui.update_buttons")
    var markedNodes = document.querySelectorAll('[data-ui-marked]')
    var numMarked = markedNodes.length

    submenu = byId('object_actions')
    header = byId('object_actions_header')
    submenu.querySelectorAll('.cloned-button').forEach((btn) => {
      btn.remove()
    })
    header.innerText = 'Select dice by clicking on them; roll by double-clicking; zoom with Ctrl-wheel'

    template = byId('template_object_actions')
    function makeButton(elemNode, actionMenu, title) {
      // actionMenu looks like this: {
      // 'Foo': {
      //   eventName: 'foo_event',
      //   applicable: (node) => { return !is_marked(node) },
      //   uiLabel: (node) => { return 'MyLabel' },
      //  },  ...}
      var btn = template.content.firstElementChild.cloneNode(true)
      btn.id = elemNode.id + title
      btn.innerText = title
      btn.classList.add('cloned-button')
      if (!actionMenu[title].applicable(elemNode)) {
        btn.disabled = 'disabled'
      }
      return btn
    }

    var buttons = {}
    var i = 0
    let actionMenu
    markedNodes.forEach((markNode) => {
      i++
      var elemNode = markNode.firstChild
      console.log("elemNode", elemNode.id)
      actionMenu = getFullMenuForElement(elemNode)
      if (numMarked === 1) {
        header.innerText = g(elemNode, 'data-orig-name')
        //#header.innerText = g(elemNode, 'data-name')

        Object.keys(actionMenu).map((title) => {
          buttons[title] = {
            btn: makeButton(elemNode, actionMenu, title),
            clickEvents: [
              (evt) => {
                evt_fire(actionMenu[title].eventName, elemNode, evt)
              }
            ],
          }
        })

      } else { // more than 1
        header.innerText = numMarked + ' objects selected'
        Object.keys(actionMenu).map((title) => {
          if (i === 1) { // the first one sets up the 'buttons' object
            buttons[title] = {
              btn: makeButton(elemNode, actionMenu, title),
              clickEvents: [
                (evt) => {
                  evt_fire(actionMenu[title].eventName, elemNode, evt)
                }
              ],
            }
          } else {
            if (title in buttons) {
              buttons[title].clickEvents.push(
                (evt) => {
                  evt_fire(actionMenu[title].eventName, elemNode, evt)
                }
              )
            }
          }
        })
        Object.keys(buttons).map((key) => {
          if (
            key in actionMenu === false
            ||
            !actionMenu[key].applicable(elemNode)
          ) {
            delete buttons[key]
          }
        })
      }
    })

    /*
     * Attach the created buttons onto the DOM
     */
    Object.keys(buttons).map((key) => {
      buttonRecord = buttons[key]
      buttonRecord.clickEvents.forEach((handler) => {
        buttonRecord.btn.addEventListener('click', handler)
      })
      template.parentElement.appendChild(buttonRecord.btn)
      // Hookup hotkeys
      accessKey = buttonRecord.btn.innerText[0].toLocaleLowerCase()
      if (document.querySelector('[accessKey=' + accessKey + ']') === null) {
        // TODO make better
        buttonRecord.btn.accessKey = accessKey
      }
    })

  },

  broadcast: (eventName, detail, dispatchEl) => {
    //console.log('broadcasting', eventName, detail)
    if (dispatchEl === undefined) {
      dispatchEl = byId('svg_table')
    }
    dispatchEl.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      detail: detail,
    }))
  },

  fire: function(msg) {
    //console.log('ui.fire', msg)
    ui.broadcast(msg.type, msg.data)
    var fn = {
      createMark: (msg) => {
        //console.log("createMark arrow")
        msg.data.attr({'data-ui-marked': true})
        ui.update_buttons()
      },
      dropMark: (msg) => {
        ui.update_buttons()
      },
      create: (msg) => {
        console.log('ui create', msg)
      },
      delete: (msg) => {
        //console.log('ui delete sel', msg)
        ui.update_buttons()
      },
    }[msg.type];

    if (fn) {
      fn(msg);
    } else {
      throw Error('Unknown msg type '+ msg.type);
    }
  },

  flatten_translation: (el) => {
    //console.log('flattn el', el)
    //console.log('flattn baseval', el.transform.baseVal)
    if (el.transform.baseVal.length === 0) {
      return;
    }
    var translate = el.transform.baseVal.getItem(0)
    if (el.tagName === 'g') {
      nodeMap(el, (kid) => {
        s(kid, 'x', translate.matrix.e)
        s(kid, 'y', translate.matrix.f)
      })
    } else {
      s(el, 'x', translate.matrix.e)
      s(el, 'y', translate.matrix.f)
    }
    el.transform.baseVal.removeItem(0)
  },

  popdown_dialog: (elem_id) => {
    elem = document.querySelector('#' + elem_id)
    instance = M.Modal.getInstance(elem)
    instance.close()
  },

  popup_dialog: (target) => {
    elem = byId(g(target, 'data-dialog-id'))
    instance = M.Modal.getInstance(elem)
    instance.open()
  },

  animated_ghost: (el, attrs) => {
    var { ms, animation, before_begin, on_done } = Object.assign({
      ms: 900,
      animation: 'slideInDown',
      before_begin: () => { return },
      on_done: () => { return },
    }, attrs)
    var animationClone = el.cloneNode(true)

    // Disable interactivity
    animationClone.id = 'clone' + Date.now()
    animationClone.classList.add('ghost')
    animationClone.getAttributeNames().map((n) => {
      if (n.indexOf('data-ui-') !== -1) {
        s(animationClone, n, null);
      }
    });
    s(animationClone, 'draggable-group', null);

    // Move to the start position
    ui.flatten_translation(animationClone)
    cc = SVG(animationClone)
    ee = SVG(el.id)
    cc.move(ee.x(), ee.y())

    el.parentNode.appendChild(animationClone, el)

    before_begin(animationClone)

    // Animate, then die
    ui.do_animate(animationClone, {animation: animation, ms: ms})
    var timedFn;
    timedFn = setInterval(() => {
      animationClone.remove()
      clearInterval(timedFn)
      on_done(el)
    }, ms);
  },

  do_animate: (node, attrs) => {
    let { ms, animation } = Object.assign({
      ms: 900,
      animation: 'slideInDown',
    }, attrs)
    node.classList.add('animated')
    node.classList.add(animation)
    if (!node.classList.contains('ghost')) {
      synced.change(node)
    }
    let timedFn = setInterval(() => {
      node.classList.remove('animated')
      node.classList.remove(animation)
      if (!node.classList.contains('ghost')) {
        synced.change(node)
      }
      clearInterval(timedFn);
    }, ms)
  },

}
