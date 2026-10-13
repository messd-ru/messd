import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000'
const coreTarget = process.env.CORE_PROXY_TARGET ?? 'http://localhost:4000'

export default defineConfig({
	plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
	server: {
		host: true,
		port: 5173,
		strictPort: true,
		proxy: {
			'/api': { target: apiTarget, changeOrigin: true },
			'/ws': { target: coreTarget, ws: true, changeOrigin: true },
		},
	},
	preview: {
		port: 4173,
		proxy: {
			'/api': { target: apiTarget, changeOrigin: true },
			'/ws': { target: coreTarget, ws: true, changeOrigin: true },
		},
	},
	worker: {
		format: 'es',
	},
	build: {
		target: 'es2022',
		rolldownOptions: {
			output: {
				codeSplitting: {
					groups: [
						{
							name: 'react',
							test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
						},
						{
							name: 'ui',
							test: /node_modules[\\/](radix-ui|@radix-ui|sonner|lucide-react|@floating-ui)[\\/]/,
						},
						{ name: 'zod', test: /node_modules[\\/]zod[\\/]/ },
					],
				},
			},
		},
	},
})
