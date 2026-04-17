import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          // Split vendor by top-level package for better caching and chunking.
          const match = id.match(/node_modules\/([^\/]+)/);
          return match ? `vendor-${match[1]}` : 'vendor';
        }
      }
    }
  }
});