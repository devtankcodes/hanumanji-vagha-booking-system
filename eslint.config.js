// @ts-check
/**
 * ESLint flat config for the Hanumanji Vagha Booking System.
 *
 * Project shape this config is written for:
 *   - frontend/js/**  -> vanilla browser ES modules (no bundler, no TypeScript)
 *   - backend/**      -> Node.js + Express, CommonJS (require / module.exports)
 *   - index.html / login.html load FullCalendar from a CDN as a global
 *   - Formatting is owned by Prettier (.prettierrc), so ESLint never fights it
 *
 * Setup:  npm i -D   (see package.json)  then  npm run lint
 */
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import importX from 'eslint-plugin-import-x';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default defineConfig([
  // ---------------------------------------------------------------------------
  // Ignores
  // ---------------------------------------------------------------------------
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/coverage/',
    '**/*.min.js',
    'email.html', // generated / template markup, not linted
    'database/', // SQL only
    'google-apps-script/', // .gs runs on Google's runtime (not Node/browser)
  ]),

  // ---------------------------------------------------------------------------
  // Global behaviour
  // ---------------------------------------------------------------------------
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  js.configs.recommended,

  // ---------------------------------------------------------------------------
  // Shared rules for every JS file in the project
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      'import-x': importX,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Bug prevention
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-throw-literal': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'no-return-assign': ['error', 'always'],
      'array-callback-return': ['error', { checkForEach: true }],
      'require-atomic-updates': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Readability
      curly: ['error', 'all'],
      'dot-notation': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-lonely-if': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-concat': 'error',
      'no-useless-rename': 'error',

      // Maintainability guard-rails (warnings, tune to taste)
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-params': ['warn', 4],
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
    },
  },

  // ---------------------------------------------------------------------------
  // Frontend: browser ES modules
  // ---------------------------------------------------------------------------
  {
    files: ['frontend/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Loaded via <script> from jsDelivr in index.html
        FullCalendar: 'readonly',
      },
    },
    rules: {
      // Imports (ES modules, relative paths must include ".js")
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-mutable-exports': 'error',
      'import-x/extensions': ['error', 'always', { ignorePackages: true }],

      // Browser-app hygiene
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-alert': 'warn', // prefer the custom confirmDialog / showToast in ui/notifications.js
      'no-restricted-properties': [
        'warn',
        {
          property: 'innerHTML',
          message:
            'innerHTML with user data (names, phones, emails) is an XSS risk. Use textContent, or escape the value first.',
        },
        {
          property: 'outerHTML',
          message: 'Avoid outerHTML with dynamic content (XSS risk).',
        },
        {
          property: 'insertAdjacentHTML',
          message: 'insertAdjacentHTML with user data is an XSS risk. Escape the value first.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='document'][callee.property.name='write']",
          message: 'document.write is not allowed.',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Backend: Node.js + Express (CommonJS)
  // ---------------------------------------------------------------------------
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off', // server logs are intentional
      'no-process-exit': 'error',
      'handle-callback-err': 'error',
      // Express route handlers commonly have unused (req, res, next)
      'no-unused-vars': [
        'error',
        { args: 'after-used', argsIgnorePattern: '^(_|req|res|next)', ignoreRestSiblings: true },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Tooling files (this file, future vite/vitest configs, scripts)
  // ---------------------------------------------------------------------------
  {
    files: ['*.config.{js,mjs}', 'scripts/**/*.{js,mjs}'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
      'max-lines-per-function': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Prettier MUST be last: turns off every rule that conflicts with formatting
  // ---------------------------------------------------------------------------
  prettier,
]);
