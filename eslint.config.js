import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
    globalIgnores(['dist', 'node_modules']),
    // Base config for all TypeScript files
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
        ],
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                ...globals.browser,
                ...globals.node
            },
        }, rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-unused-vars': 'off',
            'no-inline-styles': 'off',
            // React specific rules for src files
            'react/no-inline-styles': 'off',
            'react/jsx-no-bind': 'off'
        }
    },
    // Specific config for src files
    {
        files: ['src/**/*.{ts,tsx}'],
        extends: [
            reactHooks.configs['recommended-latest'],
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.app.json',
            }
        },
        rules: {
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            'react-hooks/exhaustive-deps': 'off',
        }
    },
    // Specific config for config files
    {
        files: ['*.config.ts'],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.node.json',
            }
        }
    }
])
