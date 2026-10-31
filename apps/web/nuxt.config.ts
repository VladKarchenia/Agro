import tailwindcss from '@tailwindcss/vite'

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
    // Разрешать ли ботам обучения ИИ (GPTBot, ClaudeBot, Google-Extended…) собирать контент: 'allow' | 'disallow'.
    // Не влияет на поисковую выдачу и ответы ИИ-поиска. Решение заказчика, см. docs/specs/seo.md
    aiTrainingCrawlers: 'allow',
    public: {
      // 'production': сайт открыт для индексации. 'demo': закрыт (GitHub Pages и другие тестовые окружения).
      // Задаётся переменной NUXT_PUBLIC_SITE_ENV
      siteEnv: 'production',
      // Публичный адрес сайта вместе с базовым путём, без завершающего слеша: NUXT_PUBLIC_SITE_URL
      // Домен agroed.by предварительный, он ещё не куплен
      siteUrl: 'https://agroed.by',
      // 'demo': заявка не отправляется (статичное демо). 'api': отправка на /api/orders после подключения бэкенда
      orderMode: 'demo',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      // Безопасное значение по умолчанию: всё, что не объявило SEO через usePageSeo (в том числе оболочки
      // 404.html и 200.html, которые рендерятся без приложения), закрыто от индексации.
      // Страницу открывает только usePageSeo
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
    },
  },
  nitro: {
    // Эти файлы генерируются серверными маршрутами и не имеют ссылок на сайте, поэтому перечислены явно
    prerender: { routes: ['/robots.txt', '/sitemap.xml', '/llms.txt'] },
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
