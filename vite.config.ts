/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs, so the same build works at jabberwock.invigoro.me, at
  // invigoro.github.io/dummy-text-generator/, or under `vite preview`.
  base: './',
  plugins: [react()],
  build: {
    rolldownOptions: {
      // The app and the copyright page. The lab (lab.html) stays out of the build.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        copyright: fileURLToPath(new URL('./copyright/index.html', import.meta.url)),
      },
    },
  },
  test: {
    // The generator is plain TypeScript. UI tests opt into a DOM with `// @vitest-environment jsdom`.
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
});
