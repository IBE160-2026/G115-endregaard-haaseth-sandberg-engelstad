import { configDefaults, defineConfig } from 'vitest/config';

// Parked until adapted (story 1.6). These v0.5 files are kept for reuse but still import
// removed modules; the stories that adapt them take them off this list. Keep it in step
// with the `exclude` list in tsconfig.json (src/parked.test.ts checks it). Nothing outside this
// list may import these files, or tsc pulls them back in and fails on their broken imports.
export const parked = [
  'src/ui/view3d.ts',
  'src/ui/gantt.ts',
  'src/ui/scene/visuals.ts',
  'src/ui/scene/visuals.test.ts',
  'src/ui/scene/world.ts',
  'src/ui/scene/props.ts',
  'src/ui/scene/cast.ts',
];

export default defineConfig({
  // Vercel serves the app from the domain root.
  base: '/',
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
    exclude: [...configDefaults.exclude, ...parked],
  },
});
