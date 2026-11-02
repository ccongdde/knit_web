import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 주소가 https://<계정>.github.io/knit_web/ 이라 하위 경로를 기준으로 빌드한다.
const base = '/knit_web/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '뜨개 기록',
        short_name: '뜨개 기록',
        description: '도안별 제작 기록, 실·바늘, 단수 카운터를 한 곳에서 관리해요.',
        lang: 'ko',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#FFFFFF',
        theme_color: '#2E4A7D',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          // 글꼴 안내 파일은 먼저 보여주고 뒤에서 새로 받는다.
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          // 글꼴 파일은 바뀌지 않아서 한 번 받으면 계속 쓴다.
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 40, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // 사진은 파일 이름이 바뀌지 않으므로 한 번 받으면 다시 받지 않는다.
          // 임시 주소의 token 이 새로 만들어져도 같은 사진으로 보도록 주소의 물음표 뒤는 무시한다.
          {
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/sign\/photos\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'photo-images', // src/lib/queryClient.ts 의 IMAGE_CACHE 와 같아야 한다.
              matchOptions: { ignoreSearch: true },
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
