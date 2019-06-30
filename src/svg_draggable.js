/*
  Peter's draggable library, with some modifications
*/
function makeDraggable(world) {
  // Source:
  // https://github.com/petercollingridge/code-for-blog/
  // Tutorial:
  // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
  var selectedEl, origMouse, origXY, isJustAClick;
  var longtouchTimer, lockLongtouchTimer;
  var broadcastTimer, lockBroadcastTimer;
  var mouse;
  var lastClickTime = 0;

  world.on('mousedown', startDrag);
  world.on('mousemove', drag);
  world.on('mouseup', endDrag);
  world.on('mouseleave', endDrag);
  world.on('touchstart', touchStart);
  world.on('touchmove', drag);
  world.on('touchend', endDrag);
  world.on('touchleave', endDrag);
  world.on('touchcancel', endDrag);

  function broadcast(event_name, detail) {
    selectedEl.node.dispatchEvent(new CustomEvent(event_name, {
      bubbles: true,
      detail: detail,
    }))
  }

  function distance(v1, v2) {
    return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y)
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
    var CTM = world.node.getScreenCTM();
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
  }

  function startDrag(evt) {
    //console.log("startdrag", evt)
    evt.preventDefault() // prevent, for example, text selection
    if (
      evt.target.classList.contains('draggable')
      ||
      evt.target.classList.contains('draggable-group')
    ) {
      selectedEl = SVG.get(evt.target.id);
      initialiseDragging(evt);
    } else if (evt.target.closest('.draggable-group')) {
      selectedEl = SVG.get(evt.target.closest('.draggable-group').id);
      console.log('closests draggable group', selectedEl)
      initialiseDragging(evt);
    }
  }

  function drag(evt) {
    evt.preventDefault() // prevent, for example, text selection
    if (!selectedEl) {
      return
    }
    mouse = getMousePosition(evt)
    selectedEl.x(origXY.x + (mouse.x - origMouse.x))
    selectedEl.y(origXY.y + (mouse.y - origMouse.y))
    if (isJustAClick && distance(selectedEl, origXY) > 20) {
      isJustAClick = null
    }

    // Don't spam - throttle to roughly every 400 miliseconds
    if (lockBroadcastTimer) { return }
    lockBroadcastTimer = true
    broadcastTimer = setTimeout(() => { lockBroadcastTimer = false }, 400)
    broadcast('svg_drag', {
      elem: selectedEl,
      elemId: selectedEl.node.id,
      mouse: mouse,
    })
  }

  function endDrag(evt) {
    try {
      if (selectedEl) {
        now = new Date()
        broadcast('svg_dragend', { elemId: selectedEl.node.id })
        if (isJustAClick) {
          console.log("click")
          broadcast('svg_dragsafe_click', {
            elemId: selectedEl.node.id,
            origEvent: isJustAClick,
          })
          if ((now - lastClickTime) < 200) {
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


