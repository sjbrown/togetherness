# Togetherness

After playing around with the awesome
[roller](https://github.com/shanel/roller),
I got the itch to create my own "dice-rolling" application.

Here are some goals for Togetherness:

 * Document-centric.  The state should all live in the document.
 * Use HTML5. Use SVG.
   * Don't reinvent wheels that already exist
   * Use the opportunity to deeply learn the standards
 * No server
   * No software to install
   * Easy for new developers to contribute / fork
 * Use [TogetherJS](https://togetherjs.com/)
   * Don't reinvent wheels
   * Meets above goals
   * Batteries included!
     * real time content sync
     * user focus
     * user presence
     * text chat

# Live Demo

I'm going to try to keep a demo up and running at
[https://www.1kfa.com/table](https://www.1kfa.com/table)

# Quick Start

```bash
cd /tmp
git clone <this repo>
cd togetherness/src
python2 -m SimpleHTTPServer 8000 # or, python3 -m http.server
```

Then open your browser to [localhost:8000](http://localhost:8000/)

That's it!

# Making your own "objects" for the table

Any interactive objects (dice, decks of cards, etc) are simply SVG files.

I'm planning to have the default interface support dynamically inserting
foreign SVGs, but for now, you'll have to fork this repo and add
a `+ My Thing` button to the `index.html` file.

```
<button class="btn" onclick="add_object('svg/v1/my_thing.svg')">
 + My Thing
</button>
```

Then just add the file `svg/v1/my_thing.svg`.

## Interactivity Interface

To make your object interactive, you need to include some JavaScript.

Your `<script>` element needs to have an attribute `data-namespace`
with a name that's unique to your object.

Inside the script, there must be one JavaScript object whose name
matches that `data-namespace` value. This object uses 3 specially-named
keys to integrate with the main web UI:
`menu`, `initialize`, and `serialize`.


```
<svg x="0" y="0" width="100" height="100">
<script
  type="text/javascript"
  data-namespace="myThing"
><![CDATA[

myThing = {

  menu: {
    'Do Something': {
      eventName: 'doAThing',
      applicable: (elem) => { return true },
      uiLabel: (elem) => { return 'Do A Thing' },
    },
  },

  initialize: function(elem) {
    elem.addEventListener( 'doAThing', (evt) => { console.log('Doing it!') } )
  },

  serialize: function(elem) {
    return { state: 'whatever you like' }
  },

}

]]></script>
<rect x="25" y="25" width="50" height="50" style="fill:#ff0000" />
</svg>
```
