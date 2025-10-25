import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['tests/**/*.test.ts'],
    alias: {
      '@': resolve(__dirname, './'),
    },
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
