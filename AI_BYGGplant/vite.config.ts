import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { apiPlugin } from './server/http.ts';

export default defineConfig(({ mode }) => {
  // Reads ANTHROPIC_API_KEY, DEMO, DEMO_DIALOG and LEAD_WEBHOOK_URL from .env (or the shell).
  // '' loads every variable, not only VITE_*. The key stays on the server.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  return {
    base: process.env.BASE_PATH ?? '/',
    // The icons live in assets/icons and are served as /icons/...
    publicDir: 'assets',
    // three.js (~600 kB) is its own chunk, loaded only when the 3D view opens.
    build: { chunkSizeWarningLimit: 700 },
    plugins: [apiPlugin(env)],
    test: {
      include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    },
  };
});
