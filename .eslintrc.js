module.exports = {
  extends: [
    'plugin:vue/recommended',
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
