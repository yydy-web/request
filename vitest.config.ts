import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@yydy-web/request/fetch',
        replacement: path.resolve(__dirname, './src/fetch.ts'),
      },
      {
        find: '@yydy-web/request',
        replacement: path.resolve(__dirname, './src/index.ts'),
      },
    ],
  },
  test: {
    globals: true,
    root: __dirname,
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 60 * 1000,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      exclude: ['/node_modules/', 'playground/', 'dist/', 'test/'],
      enabled: true,
      provider: 'istanbul',
    },
  },
})
