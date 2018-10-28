
var myClientId = null;
var togetherFunctions = {};

function getUserColor() {
  try {
    var el = document.getElementsByClassName('togetherjs-person-self')[0];
    return el.style.borderColor;
  }
  catch {
    return 'cyan';
  }
}

function fire(payload) {
  if (!myClientId) {
    console.log('TogetherJS not ready for send')
    return
  }
  try {
    TogetherJS.send(payload);
  }
  catch (err) {
    console.log('togetherjs error', err);
    // TODO: pop up a dialog?
  }
}

TogetherJS.on('ready', () => {
  session = TogetherJS.require('session')
  myClientId = session.clientId;
});

TogetherJS.hub.on('syncState', (msg) => {
  console.log('syncing', msg)
  if(togetherFunctions.on_sync) {
    togetherFunctions.on_sync(msg);
  }
});

TogetherJS.hub.on("togetherjs.hello", (msg) => {
  console.log('hello msg', msg);
  if(togetherFunctions.on_hello) {
    togetherFunctions.on_hello(msg);
  }
});

TogetherJS.hub.on("change", (msg) => {
  console.log('change msg', msg);
  if(togetherFunctions.on_change) {
    togetherFunctions.on_change(msg);
  }
});

TogetherJS.hub.on("create", (msg) => {
  console.log('create msg', msg);
  if(togetherFunctions.on_create) {
    togetherFunctions.on_create(msg);
  }
});

TogetherJS.hub.on("createSelect", (msg) => {
  console.log('create sel msg', msg);
  if(togetherFunctions.on_create_select) {
    togetherFunctions.on_create_select(msg);
  }
});

TogetherJS.hub.on('dropSelect', (msg) => {
  if(togetherFunctions.on_drop_select) {
    togetherFunctions.on_drop_select(msg);
  }
});

TogetherJS.hub.on('delete', (msg) => {
  console.log('delete msg', msg);
  if(togetherFunctions.on_delete) {
    togetherFunctions.on_delete(msg);
  }
});


