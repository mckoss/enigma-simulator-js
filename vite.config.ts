import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/enigma-simulator-js/',
  test: { include: ['tests/unit/**/*.test.ts'] },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        solver: resolve(import.meta.dirname, 'enigma-solver.html'),
      },
    },
  },
});
