import { test as base, expect } from '@playwright/test'

interface Fixtures {
  /** Шаблоны сообщений консоли, которые в этом тесте ожидаемы (например, запись Nuxt о 404) */
  allowedConsole: RegExp[]
  /**
   * Что знает браузер о cookie-баннере. По умолчанию посетитель уже ответил («rejected»), иначе
   * закреплённый баннер перекрывал бы страницу в каждом тесте. 'none' даёт первый визит с баннером.
   * Меняется через `test.use({ cookieChoice: 'none' })`
   */
  cookieChoice: 'rejected' | 'none'
}

const CONSENT_KEY = 'agroed:cookie-consent'
const REJECTED = JSON.stringify({
  analytics: false,
  version: 1,
  date: '2026-01-01T00:00:00.000Z',
})

// Каждый тест автоматически падает, если в консоли браузера появились ошибки или предупреждения:
// именно так находятся ошибки гидратации и сломанные ресурсы
export const test = base.extend<Fixtures>({
  cookieChoice: ['rejected', { option: true }],

  // Массив свой у каждого теста: тест, ожидающий 404, добавляет в него шаблон через push
  // biome-ignore lint/correctness/noEmptyPattern: Playwright определяет зависимости фикстуры по деструктуризации первого аргумента
  allowedConsole: async ({}, use) => {
    await use([])
  },

  page: async ({ page, allowedConsole, cookieChoice }, use) => {
    // Скрипт выполняется при каждой загрузке страницы, поэтому записываем выбор, только если его ещё нет:
    // иначе он затирал бы ответ, который тест дал баннеру, при перезагрузке
    if (cookieChoice === 'rejected') {
      await page.addInitScript(
        ([key, value]) => {
          if (localStorage.getItem(key) === null) localStorage.setItem(key, value)
        },
        [CONSENT_KEY, REJECTED] as const,
      )
    }

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
