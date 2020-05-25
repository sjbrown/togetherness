function distance(v1, v2) {
  return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y)
}
function clamp(val, minVal, maxVal) {
  return Math.min(Math.max(val, minVal), maxVal);
}

DEBUG=false
function debug(s, evt) {
  if (!DEBUG) { return }
  console.log(s, evt);
  r = new XMLHttpRequest()
  q = '/debug/' + s
  r.open('GET', q, true)
  r.send(JSON.stringify({
    s: s,
    evt: JSON.stringify(evt || null)
  }))
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
  viewport.on('touchstart', touchStartDrag);
  viewport.on('touchmove', touchDrag);
  viewport.on('touchend', touchEndDrag);
  viewport.on('touchleave', endDrag);
  viewport.on('touchcancel', endDrag);

  function broadcast(eventName, detail, dispatchEl) {
    //console.log('broadcasting', eventName)
    if (dispatchEl === undefined) {
      dispatchEl = selectedEl ? selectedEl.node : viewport.node
    }
    dispatchEl.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      detail: detail,
    }))
  }

  function getMousePosition(evt) {
    //var CTM = viewport.node.getScreenCTM();
    var CTM = table.node.getScreenCTM();
    if (evt.touches) {
      if (evt.touches.length === 0) {
        return mouse
      }
      evtPos = evt.touches[0]
    } else {
      evtPos = evt
    }
    return {
      x: (evtPos.clientX - CTM.e) / CTM.a,
      y: (evtPos.clientY - CTM.f) / CTM.d
    };
  }

  function touchStartDrag(evt) {
    debug('touchStartDrag')
    // preventDefault to avoid both touch AND move events from being sent
    // https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent
    evt.preventDefault()
    return startDrag(evt)
  }
  function touchDrag(evt) {
    debug('touchDrag')
    // preventDefault to avoid both touch AND move events from being sent
    // https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent
    evt.preventDefault()
    return drag(evt)
  }
  function touchEndDrag(evt) {
    debug('touchEndDrag')
    // preventDefault to avoid both touch AND move events from being sent
    // https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent
    evt.preventDefault()
    return endDrag(evt)
  }

  function initialiseDragging(evt) {
    isJustAClick = evt
    origMouse = getMousePosition(evt)
    mouse = getMousePosition(evt)
    if (selectedEl) {
      origXY = {
        x: selectedEl.x(),
        y: selectedEl.y(),
      }
      broadcast('svg_dragstart', { elemId: evt.target.id })
      notifyDropTargets(evt, 'svg_dragstart')
    } else {
      console.log("viewport begin box boundary")
    }
  }

  function startDrag(evt) {
    debug("startDrag", evt)
    evt.preventDefault() // prevent, for example, text selection
    mode = evt.touches ? 0 : evt.button

    if (mode === 0) {

      dragTarget = evt.target.closest('.draggable-group')
      //console.log("got dragTarget", dragTarget)
      while (dragTarget) {
        // Highest priority goes to drag-open (these are immediate children of
        // locked selections)
        //console.log("looking for drag open / closed", dragTarget.id, dragTarget.parentNode)
        openParent = dragTarget.parentNode.closest('.drag-open')
        //console.log("openParent", openParent)
  
        // Disqualify drag targets if they are enclosed by a .drag-closed element
        closedParent = dragTarget.parentNode.closest('.drag-closed')
        //console.log("closedParent", closedParent)
  
        if (!closedParent) {
          //console.log("done dragTarget", dragTarget.id)
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
        //console.log("dragTarget moved up to ", dragTarget.id)
      }
      if (dragTarget) {
        selectedEl = SVG.adopt(dragTarget)
        //console.log("selected el closest", selectedEl)
      }
    }
    initialiseDragging(evt);
  }

  function drag(evt) {
    debug("drag", evt)
    mouse = getMousePosition(evt)
    mode = evt.touches ? 0 : evt.button
    evt.preventDefault() // prevent, for example, text selection
    if ( isJustAClick && distance(mouse, origMouse) > 20) {
      isJustAClick = null
    }
    if (selectedEl && mode === 0) {
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
      // Don't spam - throttle to roughly every 200 miliseconds
      if (lockBroadcastTimer) { return }
      lockBroadcastTimer = true
      broadcastTimer = setTimeout(() => { lockBroadcastTimer = false }, 400)//200)
      broadcast('svg_drag', {
        elemId: selectedEl.node.id,
        mouse: mouse,
      })
      notifyDropTargets(evt, 'svg_drag')
    } else if (!selectedEl && mode === 0) {
      console.log('dragbox')
    } else if (!selectedEl && mode === 1) {
      console.log('wheeldown drag')
    }
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
    debug("endDrag", evt)
    //mouse = getMousePosition(evt)
    try {
      elemId = selectedEl ? selectedEl.node.id : viewport.node.id
      //debug('inside try' + (selectedEl && selectedEl.id()))
      now = new Date()
      broadcast('svg_dragend', { elemId: elemId })
      notifyDropTargets(evt, 'svg_dragend')
      if (isJustAClick) {
        //debug('justclick' + (selectedEl && selectedEl.node.id))
        broadcast('svg_dragsafe_click', {
          elemId: elemId,
          origEvent: isJustAClick,
        })
        if ((now - lastClickTime) < 350) {
          broadcast('svg_dragsafe_dblclick', {
            elemId: elemId,
            origEvent: isJustAClick,
          })
          lastClickTime = 0
        } else {
          lastClickTime = now
        }
      }
    }
    catch (err) {
      debug('caught err' + err)
    }
    finally {
      if (broadcastTimer) {
        clearTimeout(broadcastTimer)
      }
      lockBroadcastTimer = false
      selectedEl = false
    }
  }
}


