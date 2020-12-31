function distance(v1, v2) {
  return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y)
}
function clamp(val, minVal, maxVal) {
  return Math.min(Math.max(val, minVal), maxVal);
}

function debug(s, evt) {
  if (!DEBUG) { return }
  /*
  r = new XMLHttpRequest()
  q = '/debug/' + s
  r.open('GET', q, true)
  r.send(JSON.stringify({
    s: s,
    evt: JSON.stringify(evt || null)
  }))
  */
}

function isInside(el1, el2) {
  // use rbox() here because it's all about the screen dimensions and positions
  let piece = SVG.adopt(el1).rbox()
  let box = SVG.adopt(el2).rbox()
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

function normalizeBox(box) {
  return {
    x: (box.width < 0) ? box.x + box.width : box.x,
    y: (box.height < 0) ? box.y + box.height: box.y,
    width: Math.abs(box.width),
    height: Math.abs(box.height),
  }
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
  var interactionMode = 'object'
  var dragSelectBox = null

  // MOUSE
  viewport.on('mousedown', startDrag);
  viewport.on('mousemove', drag);
  viewport.on('mouseup', endDrag);
  viewport.on('mouseleave', mouseLeave);
  viewport.on('mouseover', mouseOver);
  // TOUCH
  viewport.on('touchstart', touchStartDrag);
  viewport.on('touchmove', touchDrag);
  viewport.on('touchend', touchEndDrag);
  viewport.on('touchleave', endDrag);
  viewport.on('touchcancel', endDrag);

  document.querySelector('#gamearea').style.overflow = 'scroll'
  document.querySelector('#gamearea').addEventListener('wheel', (evt) => {
    if (!evt.ctrlKey) { // only zoom if the user holds down ctrl
      return
    }
    evt.preventDefault()
    evt.stopPropagation()
    if (evt.deltaY > 0) {
      zoom('out')
    } else if (evt.deltaY < 0) {
      zoom('in')
    }
  })

  function broadcast(eventName, detail, dispatchEl) {
    // console.log('broadcasting', eventName, detail, dispatchEl, selectedEl)
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

  function mouseOver(evt) {
    debug('mouseOver')
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

  function updateInteractionMode(evt) {
    // console.log("updateInteractionMode", evt.touches, evt.button)
    if (evt.touches) {
      interactionMode = 'object'
    } else if (evt.button === 0) {
      interactionMode = 'object'
    } else if (evt.button === 1) {
      interactionMode = 'panzoom'
    } else if (evt.button === 2) {
      interactionMode = 'rightclick'
    }
  }

  function startDrag(evt) {
    debug("startDrag", evt)
    evt.preventDefault() // prevent, for example, text selection
    updateInteractionMode(evt)

    if (interactionMode === 'object' || interactionMode === 'rightclick') {
      let dragTarget = null

      // First, look for dragTargets as the direct children of
      // the svg_table's "layers"
      let q = `#${table.node.id} > g > .draggable-group`
      table.node.querySelectorAll(q).forEach(draggableGroup => {
        if (draggableGroup.contains(evt.target)) {
          dragTarget = draggableGroup
          // Make it the top-most element
          p = dragTarget.parentElement
          p.appendChild(dragTarget)
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
        dragSelectBox = null
        if (interactionMode === 'rightclick') {
          ui.buildRightClickMenu(dragTarget)
        }
      }
    }
    initialiseDragging(evt);
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
    } else if (interactionMode === 'object') {
      // console.log("viewport begin select box")
      dragSelectBox = {
        x: mouse.x,
        y: mouse.y,
        width: 0,
        height: 0,
      }
      broadcast('svg_dragselect_start', { box: normalizeBox(dragSelectBox) })
    }
  }

  function drag(evt) {
    debug("drag", evt)
    if (!origMouse) {
      return
    }
    mouse = getMousePosition(evt)
    evt.preventDefault() // prevent, for example, text selection
    if ( isJustAClick && distance(mouse, origMouse) > 20) {
      isJustAClick = null
    }
    if (interactionMode === 'object') {
      if (selectedEl) {
        var tableBoundaries = {
          minX: table.x(),
          minY: table.y(),
          maxX: table.width(),
          maxY: table.height(),
        }
        let newX = clamp(
          origXY.x + (mouse.x - origMouse.x),
          tableBoundaries.minX,
          tableBoundaries.maxX - selectedEl.bbox().width,
        )
        let newY = clamp(
          origXY.y + (mouse.y - origMouse.y),
          tableBoundaries.minY,
          tableBoundaries.maxY - selectedEl.bbox().height,
        )
        selectedEl.x(newX)
        selectedEl.y(newY)
        if (selectedEl.node.classList.contains('select_box')) {
          // Special case for select boxes: we tell them to move their
          // surrounded elements here, before the broadcast() so that
          // we don't get a render between the movement of the select
          // box and the movement of the surrounded elements
          select_box.svg_drag(selectedEl.node, newX, newY)
        }
        // Don't spam - throttle to roughly every 200 miliseconds
        if (lockBroadcastTimer) { return }
        lockBroadcastTimer = true
        broadcastTimer = setTimeout(() => { lockBroadcastTimer = false }, 400)//200)
          broadcast('svg_drag', {
          elemId: selectedEl.node.id,
          mouse: mouse,
        })
        notifyDropTargetsDrag(evt)
      } else if (dragSelectBox) {
        dragSelectBox.width = mouse.x - dragSelectBox.x
        dragSelectBox.height = mouse.y - dragSelectBox.y
        // Don't spam - throttle to roughly every 100 miliseconds
        if (lockBroadcastTimer) { return }
        lockBroadcastTimer = true
        broadcastTimer = setTimeout(() => { lockBroadcastTimer = false }, 100)
        // console.log("dragselect_drag", dragSelectBox)
        broadcast('svg_dragselect_drag', { box: normalizeBox(dragSelectBox) })
      }
    } else if (interactionMode === 'panzoom') {
      console.log('wheeldown drag - panzoom time!')
    }
  }

  function notifyDropTargetsDrag(evt) {
    table.node.querySelectorAll('.droptarget').forEach((el) => {
      if ( selectedEl.node.id === el.id ) {
        return // don't tell things they're being dropped into themselves
      }
      if (el.ownerSVGElement && el.ownerSVGElement.id === selectedEl.node.id) {
        return // don't drop things into their own children
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
    console.timeStamp('notifyDropTargetsDrop')
    if (!selectedEl) {
      return
    }
    table.node.querySelectorAll('.droptarget').forEach((el) => {
      // console.log('broadcasting', 'svg_drop', 'for', el.id, selectedEl.node.id)
      if ( selectedEl.node.id === el.id ) {
        return // don't tell things they're being dropped into themselves
      }
      let inside = isInside(selectedEl.node, el)
      if (inside) {
        let draggedSVGs = (
          selectedEl.node.classList.contains('select_box')
          ?
          ui.getSelectBoxSelectedElements(selectedEl.node)
          :
          [selectedEl.node]
        )
        broadcast('svg_drop', {
          draggedElemId: selectedEl.node.id,
          draggedSVGs: draggedSVGs,
          dropElemId: el.id,
          mouse: mouse,
        }, el)
      }
    })
  }


  function endDrag(evt) {
    console.timeStamp('endDrag')
    debug("endDrag", evt)
    //mouse = getMousePosition(evt)
    try {
      elemId = selectedEl ? selectedEl.node.id : viewport.node.id
      if (!isJustAClick) {
        broadcast('svg_dragend', { elemId: elemId })
        if (interactionMode === 'object') {
          if (selectedEl) {
            notifyDropTargetsDrop(evt)
          } else if (dragSelectBox) {
            broadcast(
              'svg_dragselect_end', { box: normalizeBox(dragSelectBox) }
            )
          }
        }
      }
      if ((evt.type === 'mouseup' || evt.type === 'touchend') && isJustAClick) {
        if (interactionMode === 'object') {
          if (selectedEl) {
            // Put it back where we found it
            // (this prevents the need for noisy network spam)
            selectedEl.x(origXY.x)
            selectedEl.y(origXY.y)
          }
          if (dragSelectBox) {
            // TODO
            console.log("just a click, do something with dragSelectBox")
          }
        }
        now = new Date()
        debug('isJustAClick' + (selectedEl && selectedEl.node.id))
        console.time('broadcast(svg_dragsafe_click) - outer')
        broadcast('svg_dragsafe_click', {
          elemId: elemId,
          origEvent: isJustAClick,
        })
        console.timeEnd('broadcast(svg_dragsafe_click) - outer')
        if ((now - lastClickTime) < 350) {
          broadcast('svg_dragsafe_dblclick', {
            elemId: elemId,
            origEvent: evt,
            svgPos: mouse,
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
      dragSelectBox = null
    }
  }
}


