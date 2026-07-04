import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3001,
    proxy: {
      '/api/media-proxy': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        // 视频流不设超时限制
      },
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        timeout: 120000,
        proxyTimeout: 120000,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.body && req.url.includes('/admin/login')) {
              console.log('[Proxy] Admin login body:', req.body);
            }
          });
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy Error]', err.message);
            if (res.writeHead) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: '后端服务连接失败，请确认后端已启动' }));
            }
          });
        }
      },
      '/uploads': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        timeout: 60000,
      }
    }
  }
})
