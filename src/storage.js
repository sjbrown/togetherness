var storage = {

  getPreference: function(key) {
    return localStorage.getItem(key)
  },

  setPreference: function(key, val) {
    return localStorage.setItem(key, val)
  },

  setDefaultPreferences: function() {
    defaults = {
      'profile_color': '#ffffff',
      'profile_name': 'user_' + base32.chars(3),
    }
    for (key in defaults) {
      if (storage.getPreference(key) === null) {
        storage.setPreference(key, defaults[key])
      }
    }
  }
}


