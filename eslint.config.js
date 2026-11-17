import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { architecture } from './scripts/lint/architecture-rules.mjs';

const nonImplementation = ['**/*.{test,spec}.{ts,tsx}', '**/{__tests__,test,generated}/**'];
const eventOrQuery =
  'Use an event handler, derived state, or TanStack Query. Put shared external synchronization in a provider.';
const reactEffects = ['useEffect', 'useLayoutEffect', 'useInsertionEffect'];
const timerNames = 'setTimeout|setInterval|requestAnimationFrame|requestIdleCallback';
const browserGlobal = '/^(window|globalThis|self)$/';
const timerProperty = `ObjectPattern > Property:matches([key.name=/^(${timerNames})$/], [key.value=/^(${timerNames})$/])`;

export default tseslint.config(
  {
    ignores: [
      '**/coverage/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/*wsl.localhost*/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{cjs,js,jsx,mjs,ts,tsx}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [['^\\u0000'], ['^node:'], ['^@?\\w'], ['^@/'], ['^'], ['^\\.']],
        },
      ],
    },
  },
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      sourceType: 'module',
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      sourceType: 'module',
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['buttonVariants'] },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/test/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['apps/{web,api}/src/**/*.{ts,tsx}', 'api/**/*.ts'],
    ignores: nonImplementation,
    linterOptions: { noInlineConfig: true },
    plugins: { architecture },
    rules: {
      'architecture/no-cross-app-imports': 'error',
      'architecture/no-implementation-comments': 'error',
    },
  },
  {
    files: ['apps/web/src/{features,pages,components}/**/*.{ts,tsx}'],
    ignores: nonImplementation,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['default', ...reactEffects],
              allowTypeImports: true,
              message: eventOrQuery,
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'ImportExpression[source.value="react"], ImportExpression > TemplateLiteral > TemplateElement[value.cooked="react"]',
          message: eventOrQuery,
        },
        {
          selector: `VariableDeclarator[init.name=${browserGlobal}] > ${timerProperty}, AssignmentExpression[right.name=${browserGlobal}] > ${timerProperty}`,
          message: eventOrQuery,
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          checkGlobalObject: true,
          globals: [
            { name: 'setTimeout', message: eventOrQuery },
            { name: 'setInterval', message: 'Use TanStack Query refetchInterval for polling.' },
            {
              name: 'requestAnimationFrame',
              message: 'Use CSS transitions or the shared animation component.',
            },
            {
              name: 'requestIdleCallback',
              message: 'Use React lazy loading or an existing shared scheduling boundary.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/routes/router.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  eslintConfigPrettier,
);
