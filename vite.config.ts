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
      // Socket.IO (src/lib/api/socket.ts) is blocked by the same missing
      // CORS headers, so it's proxied too. `ws: true` is required for the
      // transport upgrade — without it the handshake succeeds but the
      // connection silently stays stuck on HTTP long-polling.
      '/socket.io': {
        target: 'https://tms-api-m7yf.onrender.com',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
