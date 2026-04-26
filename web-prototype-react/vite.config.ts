import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Tối ưu chunk splitting cho production
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor';
          }
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('node_modules/axios')) return 'http';
          if (id.includes('node_modules/zustand')) return 'store';
        },
      },
    },
    // Cảnh báo nếu chunk > 500KB
    chunkSizeWarningLimit: 500,
    sourcemap: false,
  },
  server: {
    // Vite dev server — proxy API calls để tránh CORS khi dev
    proxy: {
      '/api': {
        target: 'https://datn-htg-bep-nha-minh-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
