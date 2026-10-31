import { defineConfig } from '@playwright/test'

const PORT = 4173
const isCi = Boolean(process.env.CI)

// Тесты идут против статической сборки (`pnpm generate`), поэтому они проверяют то же, что получит посетитель.
// Локально на Windows можно взять установленный Edge: E2E_BROWSER_CHANNEL=msedge (иначе нужен
// `pnpm --filter @agroed/web exec playwright install chromium`).
const channel = process.env.E2E_BROWSER_CHANNEL || undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel,
    locale: 'ru-RU',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Классические скроллбары, как в Windows: иначе тест на смещение раскладки ничего не проверяет
    launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: `node e2e/static-server.mjs .output/public ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCi,
    timeout: 15_000,
  },
})
