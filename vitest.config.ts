import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'src/web']
  },
  resolve: {
    alias: {
      '@': '/src',
      '@engine': '/src/engine',
      '@models': '/src/models',
      '@ui': '/src/ui'
    }
  }
});