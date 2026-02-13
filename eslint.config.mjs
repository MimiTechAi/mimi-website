// ESLint 9.x Flat Config for Next.js
// Direct flat config without FlatCompat to avoid circular reference bug
// in eslint-config-next + ESLint 9.x

import nextPlugin from '@next/eslint-plugin-next';
import storybook from "eslint-plugin-storybook";
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const eslintConfig = [
  // Ignore patterns
  {
    ignores: [
      '**/*.stories.tsx',
      '**/*.stories.ts',
      '**/node_modules/**',
      '.next/**',
      'out/**',
    ],
  },
  // TypeScript + React files config
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Next.js core rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',

      // Custom overrides
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  // Storybook
  ...storybook.configs["flat/recommended"],
];

export default eslintConfig;