import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { hingeApiPlugin } from './vite.api.plugin'

export default defineConfig({
  plugins: [vue(), hingeApiPlugin({ isMainApp: true })],
  root: resolve(__dirname, 'dev'),
  build: {
    outDir: resolve(__dirname, 'dist-dev'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    // Default only — project.sh passes --port; must match tunnel + browser URL
    port: 5174,
    strictPort: false,
    open: false,
    host: true,
    allowedHosts: true,
  },
})
