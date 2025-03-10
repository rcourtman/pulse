import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: process.env.DOCKER_CONTAINER ? 7654 : 3000,
    strictPort: true,  // This will make Vite fail instead of trying another port
    proxy: {
      // Proxy WebSocket connections to the real backend
      '/socket.io': {
        target: process.env.VITE_API_URL || 'http://localhost:7654',  // Use VITE_API_URL if set, otherwise default to localhost
        ws: true,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        onError: (err, req, res) => {
          // Distinguish between normal disconnects and actual errors
          if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
            console.log(`WebSocket client disconnect (${err.code}) - normal during page navigation`);
          } else {
            console.error('WebSocket proxy error:', err);
          }
        },
        configure: (proxy, _options) => {
          // Increase timeout values for Docker environments
          proxy.options.timeout = 60000; // 60 seconds
          proxy.options.proxyTimeout = 60000; // 60 seconds
          
          // Handle WebSocket-specific errors
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            console.log('WebSocket proxy request:', req.url);
            socket.on('error', (err) => {
              if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
                console.log(`WebSocket socket error (${err.code}) - normal during page navigation`);
              } else {
                console.error('WebSocket socket error:', err);
              }
            });
          });
          
          proxy.on('error', (err, _req, _res) => {
            // Distinguish between normal disconnects and actual errors
            if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
              console.log(`WebSocket proxy disconnect (${err.code}) - normal during page navigation`);
            } else {
              console.error('Proxy error:', err);
            }
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      },
      // Proxy API requests to the real backend
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:7654',  // Use VITE_API_URL if set, otherwise default to localhost
        changeOrigin: true,
        configure: (proxy, _options) => {
          // Increase timeout values for Docker environments
          proxy.options.timeout = 60000; // 60 seconds
          proxy.options.proxyTimeout = 60000; // 60 seconds
        }
      }
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // Define environment variables that will be available in the frontend code
  define: {
    // Stringify the values to ensure they're treated as strings in the frontend
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
    'import.meta.env.DOCKER_CONTAINER': JSON.stringify(process.env.DOCKER_CONTAINER || ''),
    'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV === 'development' || true),
  }
}); 