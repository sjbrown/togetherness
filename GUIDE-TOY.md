# Toy-Writing Guide

## SVG Files

Ultimately, toys are simply SVG files.  

### Visual constraints

 * 100x100px

### Registering a toy

For a toy to show up in the tools panel, it needs to be listed in the
registry. Today, that means it must be hard-coded into `toys.js`, though
a future dynamic registry is planned.

In `toys.js`, find the section that begins like this:

```
export const TOOLS = [
```

Add a new toy to this array following this structure:

```
  {
    name:    'token_glass',
    toyType: 'token_glass',
    file: 'token_glass.svg',
    label: 'Token',
    iconUrl: 'toy/token_glass.svg',
    layer:   'toys',
    defaults: { fill: '#fa2020', value: 0 },
    options: [
      { kind: 'color-hsl', key: 'fill', label: 'Token color', show: ['add', 'edit', 'addQuick'] },
      { kind: 'number', key: 'value', label: 'Token style', min: 0, max: 24, step: 1, show: ['add'] },
    ],
  },

```

The TOOLS array is followed by the TOY_TYPES registry.  Add the new toy there
as well.

### File size constraints

## `tt_*` Classes

## Javascript API

### Mandatory Toy JS Structures

### Table events

 * Return values
