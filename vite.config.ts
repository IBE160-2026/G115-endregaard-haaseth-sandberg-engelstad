import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The icon set lives in assets/icons and is served as /icons/...
  publicDir: 'assets',
  // three.js is the game's stage and is loaded at start. Pre-bundling it keeps the
  // dev server from reloading the page (and losing the game) on first use.
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/controls/OrbitControls.js'],
  },
  // three.js alone is about 600 kB; the game is one screen, so one chunk is fine.
  build: { chunkSizeWarningLimit: 900 },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
