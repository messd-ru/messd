import { defineConfig } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import globals from 'globals'
import base from './base.js'

export default defineConfig(
	base,
	reactHooks.configs.flat.recommended,
	reactRefresh.configs.vite(),
	{
		languageOptions: {
			globals: globals.browser,
		},
	},
)
