import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include:     ['tests/unit/**/*.test.js'],
    environment: 'node',
    reporters:   ['verbose'],
    // jsdom-environment test files need SVGElement.getScreenCTM/getCTM,
    // which jsdom doesn't implement (no layout engine). No-op under the
    // default 'node' environment — see the file for details.
    setupFiles:  ['./tests/helpers/svg-ctm-polyfill.js'],
  },
});
