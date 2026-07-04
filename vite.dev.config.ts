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
    port: 5176,
    open: false,
    host: true,
    allowedHosts: true,
  },
})
