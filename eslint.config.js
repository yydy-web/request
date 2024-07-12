import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
}, {
  rules: {
    'ts/no-require-imports': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
})
