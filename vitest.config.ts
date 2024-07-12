import { defineConfig } from 'vitest/config'
import path from "node:path";

export default defineConfig({
  resolve: {
    alias:  {
      '@yy-web/request': path.resolve(__dirname, './src/index.ts'),
    }
  },
  test: {
    coverage: {
      exclude: ['/node_modules/', 'playground/'],
      enabled: true,
      provider: 'istanbul'
    }
  },
})
