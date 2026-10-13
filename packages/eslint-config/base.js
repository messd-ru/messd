import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
	globalIgnores([
		'**/dist/**',
		'**/node_modules/**',
		'**/playwright-report/**',
		'**/test-results/**',
	]),
	js.configs.recommended,
	tseslint.configs.recommended,
	{
		rules: {
			'no-console': 'error',
			'@typescript-eslint/consistent-type-imports': 'error',
			'@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
		},
	},
)
