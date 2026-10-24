import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyAdminAssetsPlugin() {
  return {
    name: 'copy-admin-assets',
    closeBundle() {
      const adminDist = path.resolve(__dirname, '../dist/admin');
      const rootAssetsDist = path.resolve(__dirname, '../dist/assets');
      const adminAssetsDist = path.resolve(__dirname, '../dist/admin/assets');

      if (!fs.existsSync(rootAssetsDist)) {
        fs.mkdirSync(rootAssetsDist, { recursive: true });
      }
      if (!fs.existsSync(adminAssetsDist)) {
        fs.mkdirSync(adminAssetsDist, { recursive: true });
      }

      if (fs.existsSync(adminDist)) {
        const entries = fs.readdirSync(adminDist, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory() && entry.name.startsWith('admin-')) {
            const srcFile = path.join(adminDist, entry.name);
            fs.copyFileSync(srcFile, path.join(rootAssetsDist, entry.name));
            fs.copyFileSync(srcFile, path.join(adminAssetsDist, entry.name));
          }
        }
      }
    }
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/admin/' : '/assets/',
  plugins: [react(), copyAdminAssetsPlugin()],
  resolve: { alias: { '@': '/src' } },
  build: {
    outDir: '../dist/admin',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'admin-[name]-[hash].js',
        chunkFileNames: 'admin-[name]-[hash].js',
        assetFileNames: 'admin-[name]-[hash].[ext]'
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://api.getarenova.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}));

