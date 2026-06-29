import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '**/dist/**',
    '**/doc_build/**',
    '**/.rspress/**',
    '**/node_modules/**',
    '**/*.tsbuildinfo',
    '**/*.md',
  ],
})
