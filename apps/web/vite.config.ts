import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const webPort = Number(process.env.WEB_PORT ?? 3000);

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'vendor-mui';
          }

          if (id.includes('better-auth')) {
            return 'vendor-auth';
          }

          if (
            id.includes('@tanstack') ||
            id.includes('openapi-fetch') ||
            id.includes('openapi-react-query')
          ) {
            return 'vendor-data';
          }

          if (id.includes('react')) {
            return 'vendor-react';
          }

          return 'vendor';
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: webPort,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
    css: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
