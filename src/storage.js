var storage = {

  getPreference: function(key) {
    return localStorage.getItem(key)
  },

  setPreference: function(key, val) {
    return localStorage.setItem(key, val)
  }

  setDefaultPreferences: function() {
    defaults = {
      'profile_color': '#ffffff',
      'profile_name': base32.short_id(),
    }
    for (key in defaults) {
      if (storage.getPreference(key) === null) {
        storage.setPreference(key, defaults[key])
      }
    }
  }
}


