module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'airbnb-base',
  ],
  rules: {
    'max-len': [
      'error',
      {
        code: 300,
        ignoreUrls: true,
        ignoreTrailingComments: true,
      },
    ],
    'no-console': 'off',
    'no-loss-of-precision': 'off',
    'import/extensions': [
      'error',
      'never',
    ],
    'linebreak-style': [
      'error',
      'unix',
    ],
  },
};
