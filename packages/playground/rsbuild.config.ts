import path from 'node:path'

import { defineConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'

export default defineConfig({
  plugins: [pluginVue()],
  html: {
    template: './index.html',
  },
  source: {
    entry: {
      index: './src/main.ts',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@yy-web/request': path.resolve(__dirname, '../request/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://121.4.39.70',
        pathRewrite: {
          '^/api/': '/',
        },
      },
    },
  },
})
