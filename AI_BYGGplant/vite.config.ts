import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { claudePlugin } from './server/claude.ts';

export default defineConfig(({ mode }) => {
  // Reads ANTHROPIC_API_KEY from .env (or the shell). '' loads every variable, not only VITE_*.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: process.env.BASE_PATH ?? '/',
    // The icons live in assets/icons and are served as /icons/...
    publicDir: 'assets',
    plugins: [claudePlugin(env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY)],
    test: {
      include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    },
  };
});
