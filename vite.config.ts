import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The icon set lives in assets/icons and is served as /icons/...
  publicDir: 'assets',
  // three.js is loaded lazily with the 3D window. Pre-bundling it stops the dev
  // server from reloading the page (and losing the game) the first time it opens.
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/controls/OrbitControls.js'],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
