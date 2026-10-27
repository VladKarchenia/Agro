import tailwindcss from '@tailwindcss/vite'

// Демо-сборка (GitHub Pages) закрыта от индексации, чтобы не конкурировать с боевым доменом
const isDemo = process.env.NUXT_PUBLIC_SITE_ENV === 'demo'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-27',
  devtools: { enabled: true },
  modules: ['@nuxt/fonts'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    public: {
      siteEnv: 'production',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      meta: isDemo ? [{ name: 'robots', content: 'noindex, nofollow' }] : [],
    },
  },
  fonts: {
    families: [
      {
        name: 'Manrope',
        provider: 'google',
        weights: [700, 800],
        styles: ['normal'],
        subsets: ['cyrillic', 'latin'],
      },
      {
        name: 'Inter',
        provider: 'google',
        weights: [400, 500, 600],
        styles: ['normal'],
        subsets: ['cyrillic', 'latin'],
      },
    ],
  },
})
