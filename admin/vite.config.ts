import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  build: {
    outDir: '../dist/admin',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/admin-[name]-[hash].js',
        chunkFileNames: 'assets/admin-[name]-[hash].js',
        assetFileNames: 'assets/admin-[name]-[hash].[ext]'
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://16.112.182.86',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
