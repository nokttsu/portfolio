import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// host 127.0.0.1 so the in-app browser (localhost -> 127.0.0.1) can connect
// BASE_PATH is set by the GitHub Pages workflow (project sites serve from /<repo>/)
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5175, strictPort: true },
})
