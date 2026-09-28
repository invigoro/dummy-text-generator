/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs, so the same build works at invigoro.github.io/dummy-text-generator/,
  // under `vite preview`, or on a custom domain later.
  base: './',
  plugins: [react()],
  test: {
    // The generator is plain TypeScript. UI tests opt into a DOM with `// @vitest-environment jsdom`.
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
});
