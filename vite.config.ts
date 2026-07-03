import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/main.ts', 'src/Hinge.vue'],
      outDir: 'dist',
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'Hinge',
      formats: ['es', 'umd'],
      fileName: (format) => `hinge.${format}.js`,
      cssFileName: 'hinge',
    },
    rollupOptions: {
      // server.ts is only used at runtime by the plugin — not bundled in the component
      external: [/\/server$/],
      output: {
        globals: {},
      },
    },
    cssCodeSplit: false,
  },
})
