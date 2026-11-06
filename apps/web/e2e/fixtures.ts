import { test as base, expect } from '@playwright/test'

interface Fixtures {
  /** Шаблоны сообщений консоли, которые в этом тесте ожидаемы (например, запись Nuxt о 404) */
  allowedConsole: RegExp[]
}

// Каждый тест автоматически падает, если в консоли браузера появились ошибки или предупреждения:
// именно так находятся ошибки гидратации и сломанные ресурсы
export const test = base.extend<Fixtures>({
  // Массив свой у каждого теста: тест, ожидающий 404, добавляет в него шаблон через push
  // biome-ignore lint/correctness/noEmptyPattern: Playwright определяет зависимости фикстуры по деструктуризации первого аргумента
  allowedConsole: async ({}, use) => {
    await use([])
  },

  page: async ({ page, allowedConsole }, use) => {
    // Карта Яндекса на странице «Контакты» грузится сразу. Тесты не ходят во внешнюю сеть: ответ подменяем
    await page.route(/^https:\/\/([^/]+\.)?yandex\./, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>карта</title>' }),
    )

    const problems: string[] = []
    const isAllowed = (text: string) => allowedConsole.some((pattern) => pattern.test(text))

    page.on('console', (message) => {
      const text = message.text()
      if (['error', 'warning'].includes(message.type()) && !isAllowed(text)) {
        problems.push(`${message.type()}: ${text}`)
      }
    })
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))

    await use(page)

    expect(problems, 'ошибки и предупреждения в консоли браузера').toEqual([])
  },
})

export { expect }
