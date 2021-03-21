const userlog = {
  add: function({user, event, title, el}) {
    console.log('LOG',
      'user', user, localStorage.profile_name,
      'does', title, event,
      'on', el.id, el.dataset.appUrl,
    )
  },
}
