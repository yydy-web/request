import { URL, fileURLToPath } from 'node:url'

import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@yy-web/request': path.resolve(__dirname, '../src/index.ts'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://121.4.39.70',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\//, ''),
      },
    },
    fs: {
      strict: true,
    },
  },
  optimizeDeps: {
    exclude: [
      '@yy-web/request',
    ],
  },
})
