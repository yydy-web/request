import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/fetch.ts'],
  external: ['axios'],
})
