import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No plugin needed for basic React 18 JSX, but keeping placeholder in case
export default defineConfig({
	server: {
		port: 13241,
		host: true
	},
	plugins: [react()]
})