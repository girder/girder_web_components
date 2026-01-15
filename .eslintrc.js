// .eslintrc.js
module.exports = {
  root: true,

  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true,
  },

  parser: 'vue-eslint-parser',

  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 2021,
    sourceType: 'module',
    requireConfigFile: false,
  },

  extends: [
    'plugin:vue/recommended',
  ],

  rules: {
    'vue/multi-word-component-names': 'off',
    'no-param-reassign': ['error', { props: false }],
  },

  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
