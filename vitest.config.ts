import { configDefaults, defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    setupFiles: ['./src/tests/setup.ts'],
  },
});
