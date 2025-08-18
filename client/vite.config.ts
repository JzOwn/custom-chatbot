import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// No plugin needed for basic React 18 JSX, but keeping placeholder in case
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	const rawAssetsDir = env.ASSETS_DIR || env.VITE_ASSETS_DIR || 'assests'
	// Rollup patterns cannot start with '/' – strip any leading slashes from assetsDir
	const normalizedAssetsDir = rawAssetsDir.replace(/^\/+/, '')
	return {
		base: env.BASE_PATH || env.VITE_BASE_PATH || '/custom-chatbot/',
		server: {
			port: 13241,
			host: true
		},
		build: {
			assetsDir: normalizedAssetsDir
		},
		plugins: [react()]
	}
})