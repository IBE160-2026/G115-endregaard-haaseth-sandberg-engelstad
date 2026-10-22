import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The icon set lives in assets/icons and is served as /icons/...
  publicDir: 'assets',
  test: {
    include: ['src/**/*.test.ts'],
  },
});
