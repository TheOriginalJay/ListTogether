import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // dist = build output; .gemini = non-source scratch/skill files (not part of the app)
  globalIgnores(['dist', '.gemini']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Dev-only Fast Refresh hint with no runtime impact; we intentionally co-locate
      // context hooks and component variants with their components.
      'react-refresh/only-export-components': 'off',
      // Data-loading effects that setState after `await` are a supported React pattern.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Vendored shadcn/ui primitives — kept as shipped, not linted as first-party code.
    files: ['src/components/ui/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
    },
  },
])
