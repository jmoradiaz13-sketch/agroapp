import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Surcos Campo',
        short_name: 'Surcos',
        description: 'Gestión de fincas y suelos — funciona en campo sin conexión',
        theme_color: '#0B2F31',
        background_color: '#F6F1E4',
        display: 'standalone',
        lang: 'es-CO',
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // Cachea tiles y GeoTIFF/GeoJSON de predios (límite lógico 200 MB por predio, ver base_datos/local.ts)
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/imagenes/'),
            handler: 'CacheFirst',
            options: { cacheName: 'imagenes-fondo', expiration: { maxEntries: 30 } }
          },          {
            urlPattern: /^https:\/\/(tile|server)\..*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'tiles-fondo', expiration: { maxEntries: 500 } }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-agroapp' }
          }
        ]
      }
    })
  ],
  server: { port: 5173, host: true },
  preview: { port: 5173 }
});
