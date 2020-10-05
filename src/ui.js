const ui = {

  selectBoxPrototype: null,
  selectOpenBoxPrototype: null,

  initializeDragSelectBox: (viewportEl) => {
    return import_foreign_svg('svg/v1/select_box.svg')
    .then((nest) => {
      nest.id('select_box_prototype')
      this.selectBoxPrototype = nest
      dragSelBoxEl = nest.node.cloneNode(true)
      dragSelBox = SVG.adopt(dragSelBoxEl)
      dragSelBox.id('drag_select_box')
      dragSelBox.addClass('drag_select_box')

      viewportEl.addEventListener('dragselect_init', (evt) => {
        // console.log('viewport got svg_dragselect_init', evt)
      })
      viewportEl.addEventListener('svg_dragselect_start', (evt) => {
        // console.log('viewport got svg_dragselect_start', evt, evt.detail.box)
        ui.unselectAll()
        let selbox = svg_table.node.querySelector('#drag_select_box')
        if (!selbox) {
          dragSelBox.attr(evt.detail.box)
          synced.ui_add(dragSelBoxEl)
        }
        select_box.initialize(dragSelBoxEl)
      })
      viewportEl.addEventListener('svg_dragselect_drag', (evt) => {
        // console.log('viewport got svg_dragselect_drag', evt, evt.detail.box)
        select_box.reshape(dragSelBoxEl, evt.detail.box)
      })
      viewportEl.addEventListener('svg_dragselect_end', (evt) => {
        // console.log('viewport got svg_dragselect_end', evt)
        let surrounded = spatial.topLevelSurrounded(evt.detail.box)
        select_box.selectElements(dragSelBoxEl, surrounded)
      })
    })
    .then(() => {
      return import_foreign_svg('svg/v1/select_open_box.svg')
    })
    .then((nest) => {
      this.selectOpenBoxPrototype = nest
    })
  },

  getSelectOpenBox: () => {
    // console.log('getSelectOpenBox', this.selectOpenBoxPrototype.node)
    ui.unselectAll()
    let newSelOpenBox = this.selectOpenBoxPrototype.node.cloneNode(true)
    newSelOpenBox.classList.remove('draggable-group')
    synced.ui_add(newSelOpenBox)
    select_open_box.initialize(newSelOpenBox)
    return newSelOpenBox
  },

  getSelectBoxes: () => {
    let selBoxes = []
    layer_ui.node.querySelectorAll('.select_box').forEach(el => {
      selBoxes.push(el)
    })
    layer_ui.node.querySelectorAll('.select_open_box').forEach(el => {
      selBoxes.push(el)
    })
    return selBoxes
  },

  getSelectBoxSelectedElements: (selBoxElem) => {
    let selected = []
    let newIds = []
    let ids = []

    if (selBoxElem.dataset.for.includes(',')) {
      ids = selBoxElem.dataset.for.split(',')
    } else if (selBoxElem.dataset.for.length > 0) {
      ids = [selBoxElem.dataset.for]
    }

    ids.forEach(id => {
      el = layer_objects.node.querySelector('#' + id)
      if (el) {
        selected.push(el)
        newIds.push(id)
      }
    })
    if (newIds.length !== ids.length) { // If avoidable, don't change the DOM
      selBoxElem.dataset.for = newIds
    }
    return selected
  },

  getSelectedElements: () => {
    let selected = []
    layer_ui.node.querySelectorAll('.select_box').forEach(el => {
      let nodes = ui.getSelectBoxSelectedElements(el)
      selected = selected.concat(nodes)
    })
    return selected
  },

  selectElement: (elem, evt) => {
    // console.log('selectElement', elem.id, evt)

    ui.unselectAll()

    let svgSelBoxEl = this.selectBoxPrototype.node.cloneNode(true)
    // console.log("made select_box", svgSelBoxEl)
    svg_elem = SVG.adopt(elem)
    select_box.initialize(svgSelBoxEl)
    select_box.reshape(svgSelBoxEl, {
      x: svg_elem.x(),
      y: svg_elem.y(),
      width: svg_elem.width(),
      height: svg_elem.height(),
    })
    select_box.selectElements(svgSelBoxEl, [elem])
    synced.ui_add(svgSelBoxEl)
  },

  removeEmptySelectBoxes: () => {
    // console.log("remove empty boxes")
    ui.getSelectBoxes().forEach(sbox => {
      // console.log("box", sbox)
      if (ui.getSelectBoxSelectedElements(sbox).length < 1) {
        synced.remove(sbox)
      }
    })
  },

  unselectAll: () => {
    ui.getSelectBoxes().forEach(el => {
      // console.log("removing", el)
      if (el.classList.contains('drag-open')) {
        unlock_selection(el)
      }
      synced.remove(el)
    })
  },

  hookup_ui: (elem) => {
    //console.log("hookup_ui", elem.id)
    nest = SVG.adopt(elem)
    nest.on('svg_dragsafe_click', (evt) => {
      // console.log('id', elem.id, 'got click', evt)
      ui.selectElement(elem, evt)
    })
    elem.addEventListener('mouseover', ui.buildRightClickMenu)
  },

  un_hookup_ui: (elem) => {
    //console.log("un_hookup_ui", elem.id)
    nest = SVG.adopt(elem)
    nest.off('svg_dragsafe_click')
  },

  hookup_menu_actions: (svgEl) => {
    //console.log('hookup_menu_actions', svgEl)
    let actionMenu = ui.getFullMenuForElement(svgEl)
    Object.keys(actionMenu).map((title) => {
      let menuItem = actionMenu[title]
      if (!menuItem.handler) {
        return
      }
      // console.log("hooking up", menuItem.eventName, menuItem.handler)
      let wrapper = function(evt) {
        // console.log("IN WRAPPER", evt, svgEl)
        // TODO: I can probably put this back the way it was now that the MutationObserver is working
        menuItem.handler.bind(svgEl)(evt)
        //synced.change(svgEl)
      }
      svgEl.addEventListener(menuItem.eventName, wrapper)
      if (menuItem.otherEvents) {
        menuItem.otherEvents.forEach(evName => {
          svgEl.addEventListener(evName, wrapper)
        })
      }
    })
  },

  buildRightClickMenu: function (evt) {
    // Add clickable (right-click) options onto the menu
    // Note: addEventListener must use this named, static, non-arrow function
    //       to prevent memory-leak bug:
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Memory_issues
    //console.log('ui.buildRightClickMenu', evt, this)
    let hoveredEl = this

    deleteList = document.querySelectorAll('.cloned-menuitem')
    Array.prototype.forEach.call(deleteList, (el) => {
      el.remove();
    })

    let actionMenu = ui.getFullMenuForElement(hoveredEl)
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

  getFullMenuForElement: function(elem) {
    let actionMenu = {}
    getNamespacesForElement(elem).forEach((nsName) => {
      let ns = window[nsName]
      if (ns.menu) {
        actionMenu = Object.assign(actionMenu, ns.menu)
      }
      if (ns.makeMenu) {
        actionMenu = Object.assign(actionMenu, ns.makeMenu(elem))
      }
    })
    return actionMenu
  },

  updateButtons: () => {
     console.log("ui.updateButtons")
    let markedNodes = ui.getSelectedElements()
    let numMarked = markedNodes.length
    let buttons = {}
    let template = byId('template_object_actions')

    submenu = byId('object_actions')
    header = byId('object_actions_header')
    submenu.querySelectorAll('.cloned-button').forEach((btn) => {
      btn.remove()
    })
    header.innerText = 'Select dice by clicking on them; roll by double-clicking; zoom with Ctrl-wheel'

    function addNewButton(title, menu, elemNode) {
      // menu looks like this: {
      // 'Foo': {
      //   eventName: 'foo_event',
      //   applicable: (node) => { return node },
      //   uiLabel: (node) => { return 'MyLabel' },
      //  },  ...}
      let btn = template.content.firstElementChild.cloneNode(true)
      btn.id = elemNode.id + title
      btn.innerText = title
      btn.classList.add('cloned-button')
      if (!menu[title].applicable(elemNode)) {
        btn.disabled = 'disabled'
      }
      buttons[title] = {
        btn: btn,
        clickEvents: [
          (evt) => {
            evt_fire(menu[title].eventName, elemNode, evt)
          }
        ],
      }
    }

    var i = 0
    markedNodes.forEach((elemNode) => {
      i++
       console.log("elemNode", elemNode.id)
      actionMenu = ui.getFullMenuForElement(elemNode)
      if (numMarked === 1) {
        header.innerText = g(elemNode, 'data-orig-name')
        //#header.innerText = g(elemNode, 'data-name')

        Object.keys(actionMenu).map((title) => {
          addNewButton(title, actionMenu, elemNode)
        })

        ui.updateQuickButton(elemNode)

      } else { // more than 1
        header.innerText = numMarked + ' objects selected'
        Object.keys(actionMenu).map((title) => {
          if (i === 1) { // the first one sets up the 'buttons' object
            addNewButton(title, actionMenu, elemNode)
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

    let selectBoxes = ui.getSelectBoxes()
    if (markedNodes.length > 0 && selectBoxes.length > 0) {
      let selectionActionMenu = {
        'Delete': {
          eventName: 'delete_selected',
          applicable: (node) => { return true },
        },
      }
      Object.keys(selectionActionMenu).map((title) => {
        let elemNode = selectBoxes[0]
        addNewButton(title, selectionActionMenu, elemNode)
        console.log("btnstime", buttons[title])
        buttons[title].btn.accessKey = 'delete'
      })
    }

    /*
     * Attach the created buttons onto the DOM
     */
    Object.keys(buttons).map((key) => {
      buttonRecord = buttons[key]
      buttonRecord.clickEvents.forEach(evtSpawner => {
        buttonRecord.btn.addEventListener('click', evtSpawner)
      })
      template.parentElement.appendChild(buttonRecord.btn)
      // Hookup hotkeys (after we're attaching to DOM to avoid collisions)
      accessKey = buttonRecord.btn.innerText[0].toLocaleLowerCase()
      if (document.querySelector('[accessKey=' + accessKey + ']') === null) {
        console.log( 'a key', accessKey)
        // TODO make better
        buttonRecord.btn.accessKey = accessKey
      }
    })

  },

  updateQuickButton: (el) => {
    redDot = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
    newSrc = el.dataset.appUrl || redDot
    document.querySelector('#quick_die_button img').src = newSrc
  },

  broadcast: (eventName, detail, dispatchEl) => {
    //console.log('broadcasting', eventName, detail)
    if (dispatchEl === undefined) {
      dispatchEl = svg_table.node
    }
    dispatchEl.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      detail: detail,
    }))
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
    if (node.classList.contains('animated')) {
      // do not play 2 animations simultaneously
      return
    }
    let { ms, animation, from } = Object.assign({
      ms: 900,
      animation: 'slideInDown',
      from: {},
    }, attrs)
    node.classList.add('animated', animation)
    let timedFn = setTimeout(() => {
      node.classList.remove('animated', animation)
    }, ms)
  },

  popup_dialog: (target) => {
    elem = byId(g(target, 'data-dialog-id'))
    instance = M.Modal.getInstance(elem)
    instance.open()
  },

  popdown_dialog: (elem_id) => {
    elem = document.querySelector('#' + elem_id)
    instance = M.Modal.getInstance(elem)
    instance.close()
  },

}
