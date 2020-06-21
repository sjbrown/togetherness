function distance(v1, v2) {
  return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y)
}
function clamp(val, minVal, maxVal) {
  return Math.min(Math.max(val, minVal), maxVal);
}

function debug(s, evt) {
  if (true) { return }
  console.log(s, evt);
  r = new XMLHttpRequest()
  q = '/debug/' + s
  r.open('GET', q, true)
  r.send(JSON.stringify({
    s: s,
    evt: JSON.stringify(evt || null)
  }))
}

function isInside(el1, el2) {
  piece = SVG.adopt(el1).rbox()
  box = SVG.adopt(el2).rbox()
  //console.log("box", el2.id, box, el2.x)
  //console.log("piece", el1.id, piece, el1.x)
  return (
    piece.x > box.x
    &&
    piece.x + piece.width < box.x + box.width
    &&
    piece.y > box.y
    &&
    piece.y + piece.height < box.y + box.height
  )
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
  var currentDragovers = {};
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
  viewport.on('mouseleave', mouseLeave);
  // TOUCH
  viewport.on('touchstart', touchStartDrag);
  viewport.on('touchmove', touchDrag);
  viewport.on('touchend', touchEndDrag);
  viewport.on('touchleave', endDrag);
  viewport.on('touchcancel', endDrag);

  function broadcast(eventName, detail, dispatchEl) {
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

  function mouseLeave(evt) {
    debug('mouseLeave')
    if (selectedEl) {
      return endDrag(evt)
    }
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
    } else {
      console.log("viewport begin box boundary")
    }
  }

  function startDrag(evt) {
    debug("startDrag", evt)
    evt.preventDefault() // prevent, for example, text selection
    mode = evt.touches ? 0 : evt.button

    if (mode === 0) {
      let dragTarget = null

      // First, look for dragTargets as the direct children of "table"
      let q = `#${table.node.id} > .draggable-group`
      table.node.querySelectorAll(q).forEach(draggableGroup => {
        if (draggableGroup.contains(evt.target)) {
          dragTarget = draggableGroup
          // Make it the top-most element
          dragTarget.remove(); table.node.appendChild(dragTarget)
        }
      })
      // Otherwise, look for dragTargets as the direct children of .drag-opens
      if (!dragTarget) {
        let q = `#${table.node.id} .drag-open > .draggable-group`
        table.node.querySelectorAll(q).forEach(draggableGroup => {
          if (draggableGroup.contains(evt.target)) {
            dragTarget = draggableGroup
            pop_from_parent(dragTarget)
          }
        })
      }

      if (dragTarget) {
        //console.log('dragtaret: ', dragTarget.id)
        selectedEl = SVG.adopt(dragTarget)
        currentDragovers = {}
      }
    }
    initialiseDragging(evt);
  }

  function drag(evt) {
    debug("drag", evt)
    if (!origMouse) {
      return
    }
    mouse = getMousePosition(evt)
    mode = evt.touches ? 0 : evt.button
    evt.preventDefault() // prevent, for example, text selection
    if ( isJustAClick && distance(mouse, origMouse) > 20) {
      isJustAClick = null
    }
    //console.log("S", selectedEl, 'mode', mode)
    if (selectedEl && mode === 0) {
      selectedEl.x(
        clamp(
          origXY.x + (mouse.x - origMouse.x),
          tableBoundaries.minX,
          tableBoundaries.maxX - selectedEl.bbox().width,
        )
      )
      selectedEl.y(
        clamp(
          origXY.y + (mouse.y - origMouse.y),
          tableBoundaries.minY,
          tableBoundaries.maxY - selectedEl.bbox().height,
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
      notifyDropTargetsDrag(evt)
    } else if (!selectedEl && mode === 0) {
      //console.log('dragbox')
    } else if (!selectedEl && mode === 1) {
      console.log('wheeldown drag')
    }
  }

  function notifyDropTargetsDrag(evt) {
    table.node.querySelectorAll('.droptarget').forEach((el) => {
      if ( selectedEl.node.id === el.id ) {
        return // don't tell things they're being dropped into themselves
      }
      let inside = isInside(selectedEl.node, el)
      if (currentDragovers[el.id]) {
        if (!inside) {
          broadcast('svg_dragleave', {
            draggedElemId: selectedEl.node.id,
            dropElemId: el.id,
            mouse: mouse,
          }, el)
          currentDragovers[el.id] = undefined
        }
      } else {
        if (inside) {
          broadcast('svg_dragenter', {
            draggedElemId: selectedEl.node.id,
            dropElemId: el.id,
            mouse: mouse,
          }, el)
          currentDragovers[el.id] = 1
        }
      }
      if (inside) {
        broadcast('svg_dragover', {
          draggedElem: selectedEl.node,
          dropElem: el,
          mouse: mouse,
        }, el)
      }
    })
  }
  function notifyDropTargetsDrop(evt) {
    if (!selectedEl) {
      return
    }
    table.node.querySelectorAll('.droptarget').forEach((el) => {
      //console.log('broadcasting', newEventName, 'for', el.id, evt.currentTarget)
      if ( selectedEl.node.id === el.id ) {
        return // don't tell things they're being dropped into themselves
      }
      let inside = isInside(selectedEl.node, el)
      if (inside) {
        broadcast('svg_drop', {
          draggedElemId: selectedEl.node.id,
          dropElemId: el.id,
          mouse: mouse,
        }, el)
      }
    })
  }


  function endDrag(evt) {
    debug("endDrag", evt)
    //mouse = getMousePosition(evt)
    try {
      elemId = selectedEl ? selectedEl.node.id : viewport.node.id
      broadcast('svg_dragend', { elemId: elemId })
      //debug('inside try' + (selectedEl && selectedEl.id()))
      notifyDropTargetsDrop(evt)
      if ((evt.type === 'mouseup' || evt.type === 'touchend') && isJustAClick) {
        now = new Date()
        debug('isJustAClick' + (selectedEl && selectedEl.node.id))
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
      console.error('caught', err)
      debug('caught err' + err)
    }
    finally {
      if (broadcastTimer) {
        clearTimeout(broadcastTimer)
      }
      lockBroadcastTimer = false
      selectedEl = false
      origMouse = null
    }
  }
}


