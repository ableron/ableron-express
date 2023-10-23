module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  parserOptions: {
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
    '@typescript-eslint/explicit-module-boundary-types': ['error', { allowArgumentsExplicitlyTypedAsAny: true }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
    '@typescript-eslint/quotes': ['error', 'single'],
    'comma-dangle': ['error', 'never'],
    'semi': ['error', 'always'],
    'sort-imports': ['error', { ignoreDeclarationSort: true }]
  }
};
