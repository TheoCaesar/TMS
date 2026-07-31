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
  optimizeDeps: {
    // MapLibre parses vector tiles in a Web Worker it spawns by URL. Vite's
    // dep pre-bundling rewrites that URL to
    // /node_modules/.vite/deps/maplibre-gl-worker.mjs, which fails to load
    // (net::ERR_FAILED). The failure is silent in the worst way: the style,
    // sprites and raster tiles all load fine over HTTP on the main thread,
    // so the map looks alive — but no .pbf is ever requested, so it renders
    // as an empty background with markers floating on it.
    // Excluding it from pre-bundling lets the worker resolve from the real
    // package path. Dev-only concern; the production build emits the worker
    // as a normal asset.
    exclude: ['maplibre-gl'],
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
