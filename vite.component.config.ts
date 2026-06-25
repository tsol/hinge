import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/component.ts', 'src/Hinge.vue', 'src/host.ts', 'src/components/**/*.vue', 'src/composables/**/*.ts'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/component.ts'),
      formats: ['es'],
      fileName: 'component',
    },
    rollupOptions: {
      external: ['vue'],
    },
    emptyOutDir: false,
  },
})
