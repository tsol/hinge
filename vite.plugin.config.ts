import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src/plugin.ts'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/plugin.ts'),
      formats: ['es'],
      fileName: 'plugin',
    },
    rollupOptions: {
      external: ['node:fs', 'node:path', 'vite'],
    },
    emptyOutDir: false,
  },
})
