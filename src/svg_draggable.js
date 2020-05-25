function distance(v1, v2) {
  return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y)
}
function clamp(val, minVal, maxVal) {
  return Math.min(Math.max(val, minVal), maxVal);
}

function makeDraggable(viewport, table) {
  /*
    Peter's draggable library, with some modifications
  */
  // Source:
  // https://github.com/petercollingridge/code-for-blog/
  // Tutorial:
  // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
  //
  // 'viewport' is SVG.adopt(document.getElementById('#svg_viewport'))
  // 'table' is SVG.adopt(document.getElementById('#svg_table'))
  //
  var selectedEl, origMouse, origXY, isJustAClick;
  var longtouchTimer, lockLongtouchTimer;
  var broadcastTimer, lockBroadcastTimer;
  var mouse;
  var lastClickTime = 0;
  var tableBoundaries = {
    minX: table.x(),
    minY: table.y(),
    maxX: table.width(),
    maxY: table.height(),
  }

  // MOUSE
  viewport.on('mousedown', startDrag);
  viewport.on('mousemove', drag);
  viewport.on('mouseup', endDrag);
  viewport.on('mouseleave', endDrag);
  // TOUCH
  viewport.on('touchstart', touchStart);
  viewport.on('touchmove', drag);
  viewport.on('touchend', endDrag);
  viewport.on('touchleave', endDrag);
  viewport.on('touchcancel', endDrag);

  function broadcast(eventName, detail, dispatchEl) {
    //console.log('broadcasting', eventName)
    if (dispatchEl === undefined) {
      dispatchEl = selectedEl.node
    }
    dispatchEl.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      detail: detail,
    }))
  }

  function onLongTouch() {
    if (
      mouse && distance(mouse, origMouse) > 20
    ) {
      //console.log("drift - no fire", mouse, origMouse)
      return
    }
    broadcast('svg_longtouch', { elemId: selectedEl.node.id })
  }

  function touchStart(e) {
    // Chrome doesn't do long touch by default, so it must be done by force
    if (lockLongtouchTimer) { return }
    longtouchTimer = setTimeout(onLongTouch, 400) // miliseconds
    lockLongtouchTimer = true
    return startDrag(e)
  }

  function getMousePosition(evt) {
    //var CTM = viewport.node.getScreenCTM();
    var CTM = table.node.getScreenCTM();
    if (evt.touches) { evt = evt.touches[0]; }
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
  }

  function initialiseDragging(evt) {
    isJustAClick = evt
    origMouse = getMousePosition(evt)
    mouse = getMousePosition(evt)
    origXY = {
      x: selectedEl.x(),
      y: selectedEl.y(),
    }
    broadcast('svg_dragstart', { elemId: evt.target.id })
    notifyDropTargets(evt, 'svg_dragstart')
  }

  function startDrag(evt) {
    //console.log("startdrag evt", evt)
    evt.preventDefault() // prevent, for example, text selection
    dragTarget = evt.target.closest('.draggable-group')
    //console.log("got dragTarget", dragTarget)
    while (dragTarget) {
      // Highest priority goes to drag-open (these are immediate children of
      // locked selections)
      console.log("looking for drag open / closed", dragTarget.id, dragTarget.parentNode)
      openParent = dragTarget.parentNode.closest('.drag-open')
      console.log("openParent", openParent)

      // Disqualify drag targets if they are enclosed by a .drag-closed element
      closedParent = dragTarget.parentNode.closest('.drag-closed')
      console.log("closedParent", closedParent)

      if (!closedParent) {
        break
      }
      if (openParent) {
        if (openParent.closest('.drag-closed').id === closedParent.id) {
          // openParent is underneath or equal to closedParent
          // so, allow the dragTarget to be dragged
          break
        }
        // otherwise, ignore the openParent, as the closedParent is
        // more proximate to the dragTarget
      }
      dragTarget = closedParent.closest('.draggable-group')
    }
    if (!dragTarget) {
      return
    }
    selectedEl = SVG.adopt(dragTarget)
    console.log("selected el closest", selectedEl)
    initialiseDragging(evt);
  }

  function drag(evt) {
    if (!selectedEl) {
      return
    }
    //console.log("drag", evt)
    evt.preventDefault() // prevent, for example, text selection
    mouse = getMousePosition(evt)
    selectedEl.x(
      clamp(
        origXY.x + (mouse.x - origMouse.x),
        tableBoundaries.minX,
        (tableBoundaries.maxX - selectedEl.width())
      )
    )
    selectedEl.y(
      clamp(
        origXY.y + (mouse.y - origMouse.y),
        tableBoundaries.minY,
        tableBoundaries.maxY - selectedEl.height(),
      )
    )
    if (
      isJustAClick
      &&
      distance({x: selectedEl.x(), y: selectedEl.y()}, origXY) > 20
    ) {
      isJustAClick = null
    }

    // Don't spam - throttle to roughly every 200 miliseconds
    if (lockBroadcastTimer) { return }
    lockBroadcastTimer = true
    broadcastTimer = setTimeout(() => { lockBroadcastTimer = false }, 400)//200)
    broadcast('svg_drag', {
      elemId: selectedEl.node.id,
      mouse: mouse,
    })
    notifyDropTargets(evt, 'svg_drag')
  }

  function notifyDropTargets(evt, eventName) {
    mouse = getMousePosition(evt)
    table.node.querySelectorAll('.droptarget').forEach((el) => {
      newEventName = eventName + '_droptarget'
      console.log('broadcasting', newEventName, 'for', el.id, evt.currentTarget)
      broadcast(newEventName, {
        draggedElemId: selectedEl.node.id,
        dropElemId: el.id,
        mouse: mouse,
      }, el)
    })
  }

  function endDrag(evt) {
    //console.log("endDrag evt", evt)
    let mouse = getMousePosition(evt)
    // TODO: for some reason there are "spurious" mouseleave events
    // that trigger when the mouse leaves the element being dragged,
    // but doesn't leave the #svg_table, which is what we added the
    // event listener for.  So, until this mystery is solved, just
    // disqualify these events
    if (evt.type === 'mouseleave' && !(
      mouse.x < viewport.x()
      ||
      mouse.x > viewport.width()
      ||
      mouse.y < viewport.y()
      ||
      mouse.y > viewport.height()
    )) {
      // mouse is still inside viewport
      console.log("SHORT CIR")
      return;
    }
    try {
      if (selectedEl) {
        now = new Date()
        broadcast('svg_dragend', { elemId: selectedEl.node.id })
        notifyDropTargets(evt, 'svg_dragend')
        if (isJustAClick) {
          broadcast('svg_dragsafe_click', {
            elemId: selectedEl.node.id,
            origEvent: isJustAClick,
          })
          if ((now - lastClickTime) < 350) {
            broadcast('svg_dragsafe_dblclick', {
              elemId: selectedEl.node.id,
              origEvent: isJustAClick,
            })
            lastClickTime = 0
          } else {
            lastClickTime = now
          }
        }
      }
    }
    catch (err) {
      console.log(err)
    }
    finally {
      if (longtouchTimer) {
        clearTimeout(longtouchTimer)
      }
      if (broadcastTimer) {
        clearTimeout(broadcastTimer)
      }
      lockLongtouchTimer = false
      lockBroadcastTimer = false
      selectedEl = false
    }
  }
}


