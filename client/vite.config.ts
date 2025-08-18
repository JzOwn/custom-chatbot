import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No plugin needed for basic React 18 JSX, but keeping placeholder in case
export default defineConfig({
	base: '/custom-chatbot/',
	server: {
		port: 13241,
		host: true
	},
	build: {
		assetsDir: 'assests'
	},
	plugins: [react()]
})