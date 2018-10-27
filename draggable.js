/*
  Peter's draggable library, with some modifications
*/
function makeDraggable(target, callbacks) {
  // Source:
  // https://github.com/petercollingridge/code-for-blog/
  // Tutorial:
  // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
  var svg = target;
  var cbDict = callbacks;

  svg.addEventListener('mousedown', startDrag);
  svg.addEventListener('mousemove', drag);
  svg.addEventListener('mouseup', endDrag);
  svg.addEventListener('mouseleave', endDrag);
  svg.addEventListener('touchstart', startDrag);
  svg.addEventListener('touchmove', drag);
  svg.addEventListener('touchend', endDrag);
  svg.addEventListener('touchleave', endDrag);
  svg.addEventListener('touchcancel', endDrag);


  function getMousePosition(evt) {
    var CTM = svg.getScreenCTM();
    if (evt.touches) { evt = evt.touches[0]; }
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
  }

  var selectedElement, offset, transform;

  function initialiseDragging(evt) {
      offset = getMousePosition(evt);

      // Make sure the first transform on the element is a translate transform
      var transforms = selectedElement.transform.baseVal;

      if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
        // Create an transform that translates by (0, 0)
        var translate = svg.createSVGTransform();
        translate.setTranslate(0, 0);
        selectedElement.transform.baseVal.insertItemBefore(translate, 0);
      }

      // Get initial translation
      transform = transforms.getItem(0);
      offset.x -= transform.matrix.e;
      offset.y -= transform.matrix.f;
  }


  function startDrag(evt) {
    if (evt.target.classList.contains('draggable')) {
      selectedElement = evt.target;
      initialiseDragging(evt);
    } else if (evt.target.parentNode.classList.contains('draggable-group')) {
      selectedElement = evt.target.parentNode;
      initialiseDragging(evt);
    }
  }

  function drag(evt) {
    evt.preventDefault();
    //console.log('d')
    if (selectedElement) {
      var coord = getMousePosition(evt);
      transform.setTranslate(coord.x - offset.x, coord.y - offset.y);
    }
  }

  function endDrag(evt) {
    //console.log('END')
    try {
      if (selectedElement) {
        cbDict.endDragCb(selectedElement);
      }
    }
    catch (err) {
      console.log(err);
    }
    finally {
      selectedElement = false;
    }
  }
}

//module.exports.makeDraggable = makeDraggable;
//module.exports.makeDraggable = makeDraggable;

