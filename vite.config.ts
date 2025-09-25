import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/diffbot': {
        target: 'https://api.diffbot.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/diffbot/, '')
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
