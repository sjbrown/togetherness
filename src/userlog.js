const userlog = {
  add: function({user, event, el}) {
    // userlog.add({ clientId: myClientId, event: evt, el: svgEl })
    console.log('LOG',
      'user', user,
      'does', event,
      'on', el.id, el.dataset.appUrl,
    )
  },
}
