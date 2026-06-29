import path from 'node:path'

import { defineConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import { mockApiMiddleware } from './mock/api'

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
      '@yy-web/request-tools': path.resolve(__dirname, '../request-tools/src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
  dev: {
    setupMiddlewares: [
      (middlewares) => {
        middlewares.unshift((req, res, next) => {
          mockApiMiddleware(req, res, next).catch(next)
        })
      },
    ],
  },
})
