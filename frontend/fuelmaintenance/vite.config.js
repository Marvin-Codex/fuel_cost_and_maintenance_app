import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'FuelMaintenance — fuel cost, trips & maintenance',
        short_name: 'FuelMaintenance',
        description:
          'GPS trip tracking, fuel cost and consumption tracking, ML cost predictions and maintenance reminders for cars and bikes. Works offline.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f4f7fb',
        theme_color: '#0ea5c4',
        lang: 'en',
        categories: ['productivity', 'travel', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Same-origin OpenStreetMap tiles — avoids Firefox Opaque Response
      // Blocking on cross-origin tile images.
      '/osm-tiles': {
        target: 'https://tile.openstreetmap.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/osm-tiles/, ''),
        headers: { Referer: 'http://localhost:5173/' },
      },
      // Same-origin Nominatim geocoding (place search + reverse lookup).
      '/osm-geocode': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/osm-geocode/, ''),
        headers: { Referer: 'http://localhost:5173/' },
      },
      // Same-origin OSRM routing (road-following geometries for the trip map).
      '/osm-route': {
        target: 'https://router.project-osrm.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/osm-route/, ''),
      },
    },
  },
})

