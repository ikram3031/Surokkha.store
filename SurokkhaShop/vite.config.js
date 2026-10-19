import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
// Dedicated Surokkha.shop project — single entry, no multi-site mode switching.
export default defineConfig({
  root: path.resolve(__dirname, 'src/shop'),
  envDir: path.resolve(__dirname),
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [react()],
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, 'src/common'),
      '@shop': path.resolve(__dirname, 'src/shop'),
      '@': path.resolve(__dirname, 'src/common'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
