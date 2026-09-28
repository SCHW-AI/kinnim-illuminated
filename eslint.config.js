import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'coverage', '.wrangler', 'docs']),
  {
    files: ['**/*.{ts,tsx,js}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    // The engine is pure TypeScript: no React, no Motion, no stage runtime.
    // Type-only imports of the Scene contract (src/stage/scene.ts) are allowed.
    files: ['src/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(react|react-dom|motion)(/.*)?$',
              message: 'src/engine must stay free of React and Motion.',
            },
            {
              group: ['**/stage/**', '!**/stage/scene'],
              message: 'src/engine may import only types from src/stage/scene.',
            },
            {
              group: ['**/stage/scene'],
              allowTypeImports: true,
              message: 'src/engine may import only types from src/stage/scene (use `import type`).',
            },
          ],
        },
      ],
    },
  },
]);
