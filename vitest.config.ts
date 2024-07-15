import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@yy-web/request': path.resolve(__dirname, './src/index.ts'),
    },
  },
  test: {
    globals: true,
    root: __dirname,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      exclude: ['/node_modules/', 'playground/', 'dist/', 'test/'],
      enabled: true,
      provider: 'istanbul',
    },
  },
})
