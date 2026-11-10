import { defineConfig } from 'vitest/config';

// Node's process, without pulling in all of @types/node for one variable.
declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  // GitHub Pages serves the game from /<repo>/; the deploy workflow sets BASE_PATH. Locally it is /.
  base: process.env.BASE_PATH ?? '/',
  // The icon set lives in assets/icons and is served as /icons/...
  publicDir: 'assets',
  // three.js is the game's stage and is loaded at start. Pre-bundling it keeps the
  // dev server from reloading the page (and losing the game) on first use.
  optimizeDeps: {
    include: [
      'three', 'three/examples/jsm/controls/OrbitControls.js', 'three/examples/jsm/environments/RoomEnvironment.js',
      'three/examples/jsm/postprocessing/EffectComposer.js', 'three/examples/jsm/postprocessing/RenderPass.js',
      'three/examples/jsm/postprocessing/UnrealBloomPass.js', 'three/examples/jsm/postprocessing/OutputPass.js',
    ],
  },
  // three.js alone is about 600 kB; the game is one screen, so one chunk is fine.
  build: { chunkSizeWarningLimit: 900 },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
