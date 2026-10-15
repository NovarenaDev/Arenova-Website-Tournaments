import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'admin-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/admin') {
            res.writeHead(302, { Location: '/admin/' });
            res.end();
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.getarenova.com',
        changeOrigin: true,
        secure: false,
      },
      '/admin': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})

