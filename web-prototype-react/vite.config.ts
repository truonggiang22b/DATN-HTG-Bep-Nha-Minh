import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET ?? process.env.VITE_PROXY_TARGET ?? 'http://localhost:3001';

  return {
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
  // SPA fallback: serve index.html cho mọi route (fix HTTP 404 trên refresh/direct URL)
  appType: 'spa',
  server: {
    port: 5174,          // Cố định port để không bị đổi mỗi lần restart
    strictPort: false,   // Dùng port khác nếu 5174 đã bận
    // Proxy API calls → backend để tránh CORS khi dev
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  };
})
