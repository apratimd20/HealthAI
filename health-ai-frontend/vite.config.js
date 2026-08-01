import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      srcDir: 'src',
      filename: 'sw.js',
      strategies: 'injectManifest',
      includeAssets: ['favicon.svg', 'icon-192.svg', 'icon-512.svg', 'offline.html'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,avif,json}'],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        sourcemap: false,
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,avif,json}'],
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/_/, /\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(url.href),
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 2,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Health AI - Smart Health & Diet Tracker',
        short_name: 'Health AI',
        description: 'AI-powered personalized diet, fitness, hydration and health tracking assistant.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        background_color: '#0b1020',
        theme_color: '#10b981',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react')) {
              return 'react';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            if (id.includes('react-icons')) {
              return 'icons';
            }
            if (id.includes('react-markdown') || id.includes('remark-gfm')) {
              return 'markdown';
            }
          }
        },
      },
    },
  },
})
