// ESLint for the TypeScript, the Angular templates and the Node scripts.
//   npm run lint
// Formatting is Prettier's job (npm run format); nothing here checks style.
import js from '@eslint/js';
import angular from 'angular-eslint';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      '.angular/',
      '.nx/',
      'libs/spartan-ui/', // stock spartan/ui output, never edited
      'docs/reference/', // design archive
      '**/storybook-static/',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'sn', style: 'kebab-case' }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'sn', style: 'camelCase' }],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // These attributes give a <button> its content: `label` is an input of snCommand, and
      // spartan's carousel and copy buttons render their own icon and accessible name.
      '@angular-eslint/template/elements-content': [
        'error',
        { allowList: ['label', 'hlmCarouselPrevious', 'hlmCarouselNext', 'hlmCodeBlockCopyButton'] },
      ],
      // spartan components that render a native form control inside them: a <label> wrapping
      // one labels that control.
      '@angular-eslint/template/label-has-associated-control': [
        'error',
        { controlComponents: ['hlm-native-select', 'hlm-switch', 'hlm-checkbox'] },
      ],
    },
  },
  {
    // Stories show stock spartan components (questionnaire choices, select) that create their
    // form control inside the component, where this rule can't see it.
    files: ['**/stories/**/*.ts', '**/stories/**/*.html'],
    rules: { '@angular-eslint/template/label-has-associated-control': 'off' },
  },
  {
    // The agent skill's templates are copied into apps: they use the app's `app` prefix, and
    // their handlers are stubs whose parameters the app fills in.
    files: ['tools/claude-plugin/skills/*/templates/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
    },
  },
  {
    files: ['**/*.mjs', '**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
);
