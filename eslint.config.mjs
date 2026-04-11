import js from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default [
  // 1. Базові рекомендовані правила ESLint
  js.configs.recommended,

  // 2. Інтеграція з Prettier (має бути в кінці)
  prettierRecommended,

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_|e' }],
      'no-empty': 'off',
      'no-console': 'off',
    },
  },

  // 3. Файли та папки, які потрібно ігнорувати
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '.env', 'package-lock.json'],
  },
];
