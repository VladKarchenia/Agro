import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './fixtures'
import { open } from './helpers'

const CHANNELS = [
  ['Telegram', 'https://t.me/+375447909310'],
  ['Viber', 'https://viber.click/+375447909310'],
  ['Instagram', 'https://www.instagram.com/agroed_slonim/'],
] as const

test.describe('Страница «Контакты»', () => {
  test('адрес, телефоны, часы работы и выходные', async ({ page }) => {
    await open(page, '/contacts')
    const main = page.getByRole('main')
    await expect(main.getByRole('heading', { level: 1, name: 'Контакты' })).toBeVisible()
    await expect(main.getByText('Минский тракт, 30, офис 7')).toBeVisible()
    await expect(main.getByText('Пн–Пт: 08:00–17:00')).toBeVisible()
    await expect(main.getByText('Сб–Вс: выходной')).toBeVisible()

    await expect(main.getByRole('link', { name: '+375 44 790-93-10' })).toHaveAttribute(
      'href',
      'tel:+375447909310',
    )
    await expect(main.getByRole('link', { name: '+375 15 626-68-49' })).toHaveAttribute(
      'href',
      'tel:+375156266849',
    )
  })

  test('мессенджеры и соцсети открываются в новой вкладке безопасно', async ({ page }) => {
    await open(page, '/contacts')
    for (const [name, href] of CHANNELS) {
      const link = page.getByRole('main').getByRole('link', { name: new RegExp(`^${name}`) })
      await expect(link).toHaveAttribute('href', href)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noopener/)
    }
  })

  test('реквизиты: наименование, УНП и адрес регистрации', async ({ page }) => {
    await open(page, '/contacts')
    const requisites = page.getByRole('region', { name: 'Реквизиты' })
    await expect(requisites).toContainText('Общество с ограниченной ответственностью «Агроэд»')
    await expect(requisites).toContainText('591753004')
    await expect(requisites).toContainText('231800')
  })

  test('карта Яндекса показана сразу, с названием для скринридера', async ({ page }) => {
    const yandexRequests: string[] = []
    page.on('request', (request) => {
      if (/yandex\./.test(request.url())) yandexRequests.push(request.url())
    })

    await open(page, '/contacts')
    const frame = page.locator('iframe[title^="Карта"]')
    await expect(frame).toHaveAttribute(
      'src',
      /^https:\/\/yandex\.by\/map-widget\/v1\/org\/agroed\/71398902769\//,
    )
    await expect(frame).toBeVisible()
    await expect.poll(() => yandexRequests.length).toBeGreaterThan(0)
  })

  test('отзывы: официальный виджет Яндекса и ссылка на все отзывы', async ({ page }) => {
    await open(page, '/contacts')
    await expect(
      page.getByRole('heading', { level: 2, name: 'Отзывы на Яндекс Картах' }),
    ).toBeVisible()
    await expect(page.locator('iframe[title^="Отзывы"]')).toHaveAttribute(
      'src',
      /^https:\/\/yandex\.by\/maps-reviews-widget\/71398902769/,
    )
    const link = page.getByRole('link', { name: /^Все отзывы и оставить свой/ })
    await expect(link).toHaveAttribute(
      'href',
      /^https:\/\/yandex\.by\/maps\/org\/agroed\/71398902769\//,
    )
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
  })

  test('ссылки на Яндекс и Google Карты открываются в новой вкладке безопасно', async ({
    page,
  }) => {
    await open(page, '/contacts')
    for (const [name, href] of [
      ['Яндекс Картах', /^https:\/\/yandex\.by\/maps\/org\/agroed\/71398902769\/$/],
      ['Google Картах', /^https:\/\/www\.google\.com\/maps\/place\//],
    ] as const) {
      const link = page.getByRole('link', { name: new RegExp(`^Открыть на ${name}`) })
      await expect(link).toHaveAttribute('href', href)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noopener/)
      // Параметры отслеживания в ссылку не берём
      await expect(link).not.toHaveAttribute('href', /g_ep|entry=|yclid/)
    }
  })

  test('доступность не нарушается вместе с картой', async ({ page }) => {
    await open(page, '/contacts')
    await expect(page.locator('iframe[title^="Карта"]')).toBeVisible()
    await page.locator('iframe[title^="Отзывы"]').scrollIntoViewIfNeeded()
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(violations.map((violation) => violation.id)).toEqual([])
  })
})

test.describe('Контакты в верхней полосе сайта', () => {
  test('на десктопе: часы, оба телефона и каналы связи на любой странице', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'только для десктопа')
    await open(page, '/catalog')
    const bar = page.getByRole('region', { name: 'Контакты компании' })
    await expect(bar).toContainText('Пн–Пт: 08:00–17:00, Сб–Вс: выходной')
    await expect(bar.getByRole('link', { name: '+375 44 790-93-10' })).toHaveAttribute(
      'href',
      'tel:+375447909310',
    )
    await expect(bar.getByRole('link', { name: '+375 15 626-68-49' })).toBeVisible()
    for (const [name, href] of CHANNELS) {
      await expect(bar.getByRole('link', { name: new RegExp(`^${name}`) })).toHaveAttribute(
        'href',
        href,
      )
    }
  })

  test('на телефоне: в полосе основной номер, остальное в мобильном меню', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop', 'только для мобильного')
    await open(page, '/catalog')
    const bar = page.getByRole('region', { name: 'Контакты компании' })
    await expect(bar.getByRole('link', { name: '+375 44 790-93-10' })).toBeVisible()
    await expect(bar.getByRole('link', { name: '+375 15 626-68-49' })).toBeHidden()

    await page.getByRole('button', { name: 'Меню' }).click()
    const menu = page.getByRole('navigation', { name: 'Мобильное меню' })
    await expect(menu).toContainText('Пн–Пт: 08:00–17:00')
    await expect(menu).toContainText('Сб–Вс: выходной')
    await expect(menu.getByRole('link', { name: '+375 15 626-68-49' })).toBeVisible()
    for (const [name, href] of CHANNELS) {
      await expect(menu.getByRole('link', { name: new RegExp(`^${name}`) })).toHaveAttribute(
        'href',
        href,
      )
    }
  })

  test('цели нажатия в полосе не меньше 44 px', async ({ page }) => {
    await open(page, '/')
    const sizes = await page
      .getByRole('region', { name: 'Контакты компании' })
      .getByRole('link')
      .evaluateAll((links) =>
        links
          .filter((link) => link.getClientRects().length > 0)
          .map((link) => Math.round(link.getBoundingClientRect().height)),
      )
    expect(sizes.length).toBeGreaterThan(0)
    for (const height of sizes) expect(height).toBeGreaterThanOrEqual(44)
  })
})
