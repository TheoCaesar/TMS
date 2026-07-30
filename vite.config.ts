import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // The live API (see .env.example) sends no CORS headers, so the
    // browser can't call it directly in dev. Proxying server-to-server
    // here sidesteps that for local development only — it does NOT fix
    // the underlying issue for the production build. See
    // docs/DEVELOPMENT_LOG.md ("CORS blocker") for details.
    proxy: {
      '/api': {
        target: 'https://tms-api-m7yf.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
