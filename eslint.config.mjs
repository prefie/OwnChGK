import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
    {
        plugins: {
            prettier: eslintPluginPrettier,
            react: eslintPluginReact,
            'react-hooks': eslintPluginReactHooks,
            'react-refresh': eslintPluginReactRefresh,
            '@typescript-eslint': tseslint.plugin,
        },
    },
    {
        ignores: ['node_modules', 'build', 'dist', 'eslint.config.mjs', 'jest.config.js'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                project: ['tsconfig.json', 'tsconfig.frontend.json', 'tsconfig.tests.json'],
            },
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.es2021,
            },
        },
    },
    {
        files: ['{**/*,*}.{ts,tsx}'],
        rules: {
            ...eslintPluginPrettier.configs.recommended.rules,
            ...eslintConfigPrettier.rules,
            'prefer-const': 'error',
            '@typescript-eslint/no-explicit-any': ['off'],
        },
    },
);
