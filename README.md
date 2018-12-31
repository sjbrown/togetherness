
# Making your own "objects" for the table

Any interactive objects (dice, decks of cards, etc) are simply SVG files.

## Interactivity Interface

To make your object interactive, you need to include just script. Inside
the script, there must be one javascript object with three potential
keys (though you can add more).

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
<rect x="1" y="1" width="50" height="50" style="fill:#ff0000" />
</svg>
```
