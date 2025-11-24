import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
  ...pluginVue.configs['flat/recommended'],

  {

    plugins: {
      'unused-imports': unusedImports,
    },

    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'no-debugger': 'error',
      'no-console': 'warn',
      'curly': ['error', 'all'],
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'vue/no-unused-components': 'error',
      'vue/no-mutating-props': 'error',
      'vue/require-default-prop': 'error',
    },

    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
  },
]