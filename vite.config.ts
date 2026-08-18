import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { VitePWA } from "vite-plugin-pwa"

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [inspectAttr(), react(), cloudflare(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Hermes Launchpad',
      short_name: 'Hermes',
      description: 'Fair-launch token curves with live market data',
      start_url: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      theme_color: '#000000',
      background_color: '#000000',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ],
      shortcuts: [
        { name: 'Create Token', url: '/create', description: 'Create a new token', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        { name: 'Account', url: '/account', description: 'Manage your account', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        { name: 'Leaderboard', url: '/#leaderboard', description: 'View the leaderboard', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] }
      ]
    },
    workbox: {
      cleanupOutdatedCaches: true,
      navigateFallback: '/index.html',
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-stylesheets',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] }
          }
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] }
          }
        },
        {
          urlPattern: /\/api\/(?:trades|tokens\/index|profile)/,
          handler: 'NetworkOnly',
          options: {
            cacheName: 'api-mutual'
          }
        }
      ]
    }
  })],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});