import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  define: {
    // Required for ArcGIS API for JavaScript
    global: 'globalThis',
  },
  server: {
    // Configure CORS for ArcGIS services
    proxy: {
      '/arcgis': {
        target: 'https://services.arcgis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/arcgis/, '')
      }
    }
  }
});
