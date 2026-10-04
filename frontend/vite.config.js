import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const outDir = mode === 'store' ? 'store' : mode === 'shop' ? 'shop' : 'dist'

  return {
    plugins: [react()],
    build: {
      outDir,
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
  }
})
