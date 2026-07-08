// @ts-check
// Configuración de ESLint (flat config) para Angular 20.
// Linter de TypeScript + reglas de Angular para componentes y templates HTML.
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    // Carpetas/archivos que el linter ignora.
    ignores: [
      'dist/**',
      '.angular/**',
      'node_modules/**',
      'coverage/**',
      'public/**',
    ],
  },
  {
    // ── Archivos TypeScript ────────────────────────────────────────
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      // Suavizamos algunas reglas para no romper el código existente:
      // se reportan como aviso, no como error.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // ── Templates HTML de Angular ──────────────────────────────────
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
);
