import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isShop = mode === 'shop';
  const isStore = mode === 'store';

  // Choose root entry directory based on mode (default to src/store)
  const siteDir = isShop ? 'src/shop' : 'src/store';
  const outDir = isShop
    ? path.resolve(__dirname, 'shop')
    : isStore
      ? path.resolve(__dirname, 'store')
      : path.resolve(__dirname, 'dist');

  return {
    root: path.resolve(__dirname, siteDir),
    envDir: path.resolve(__dirname),
    publicDir: path.resolve(__dirname, 'public'),
    plugins: [react()],
    resolve: {
      alias: {
        '@common': path.resolve(__dirname, 'src/common'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@shop': path.resolve(__dirname, 'src/shop'),
        '@': path.resolve(__dirname, 'src/common'),
      },
    },
    build: {
      outDir,
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
  };
});
