const userlog = {
  add: function({user, event, title, el}) {
    // userlog.add({ clientId: myClientId, event: evt, el: svgEl })
    console.log('LOG',
      'user', user, localStorage.profile_name,
      'does', title, event,
      'on', el.id, el.dataset.appUrl,
    )
  },
}
