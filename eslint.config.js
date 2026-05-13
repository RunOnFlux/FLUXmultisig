import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import importPlugin from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';
import globals from 'globals';

const sharedRules = {
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
  'import-x/extensions': [
    'error',
    'ignorePackages',
    {
      js: 'never',
      ts: 'never',
      vue: 'always',
    },
  ],
  'linebreak-style': ['error', 'unix'],
  // TS handles unused-vars more accurately than the base rule.
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  'no-shadow': 'off',
  '@typescript-eslint/no-shadow': 'error',
};

export default [
  { ignores: ['dist/**', 'node_modules/**', 'src/fluxHashes/**', 'ui/dist/**', 'logs/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      'import-x': importPlugin,
    },
    settings: {
      'import-x/resolver': {
        node: {
          extensions: ['.js', '.ts', '.vue'],
        },
      },
    },
    rules: sharedRules,
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
  },
];
