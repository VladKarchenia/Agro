import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import {
  CATEGORY_PATH,
  COLOR_PRODUCT,
  FIRST_PRODUCT,
  open,
  openWithCart,
  SECOND_PRODUCT,
  SUBCATEGORY_PATH,
} from './helpers'

// Автоматическая проверка доступности по WCAG 2.2 уровня AA (плюс рекомендации axe).
// Автоматика находит лишь часть проблем (контраст, подписи, роли, структура), поэтому дополняем её
// проверками клавиатуры ниже, а остальное остаётся на ручную проверку (docs/specs/accessibility.md).
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

async function scan(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  return violations.map(
    (violation) =>
      `${violation.id} [${violation.impact}]: ${violation.help}\n` +
      violation.nodes
        .slice(0, 3)
        .map(
          (node) =>
            `    ${node.target.join(' ')}\n      ${node.failureSummary?.split('\n')[1] ?? ''}`,
        )
        .join('\n'),
  )
}

const PAGES: [string, string][] = [
  ['главная', '/'],
  ['каталог', '/catalog'],
  ['категория', CATEGORY_PATH],
  ['подкатегория', SUBCATEGORY_PATH],
  ['товар', FIRST_PRODUCT.path],
  ['товар с выбором цвета', COLOR_PRODUCT.path],
  ['категория ламп', '/catalog/lampy-promyshlennye'],
  ['подкатегория ламп', '/catalog/lampy-promyshlennye/lampy-svetodiodnye-t8-g13'],
  [
    'товар лампа',
    '/catalog/lampy-promyshlennye/lampy-svetodiodnye-t8-g13/lampa-svetodiodnaya-t8-18vt-g13-1200mm',
  ],
  ['политика', '/privacy'],
  ['согласие', '/consent'],
  ['контакты', '/contacts'],
  ['заглушка', '/about'],
]

const CART = [
  { slug: FIRST_PRODUCT.slug, quantity: 2 },
  { slug: SECOND_PRODUCT.slug, quantity: 1 },
]

test.describe('Доступность: автоматический анализ (axe)', () => {
  for (const [name, path] of PAGES) {
    test(`страница «${name}»`, async ({ page }) => {
      await open(page, path)
      expect(await scan(page)).toEqual([])
    })
  }

  test('корзина с товарами и формой заявки', async ({ page }) => {
    await openWithCart(page, CART)
    expect(await scan(page)).toEqual([])
  })

  test('корзина: форма организации', async ({ page }) => {
    await openWithCart(page, CART)
    await page.getByText('Организация или ИП').click()
    expect(await scan(page)).toEqual([])
  })

  test('корзина: форма с ошибками', async ({ page }) => {
    await openWithCart(page, CART)
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText('Укажите имя')).toBeVisible()
    expect(await scan(page)).toEqual([])
  })

  test('пустая корзина', async ({ page }) => {
    await open(page, '/cart')
    expect(await scan(page)).toEqual([])
  })

  test('подтверждение заявки', async ({ page }) => {
    await openWithCart(page, CART)
    await page.getByLabel('Имя').fill('Иван')
    await page.getByLabel(/^Телефон/).fill('291234567')
    await page.getByLabel('Email').fill('ivan@example.by')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByRole('heading', { name: 'Заявка принята' })).toBeVisible()
    expect(await scan(page)).toEqual([])
  })

  test('мобильное меню в открытом состоянии', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop', 'только для мобильного')
    await open(page, '/')
    await page.getByRole('button', { name: 'Меню' }).click()
    await expect(page.getByRole('navigation', { name: 'Мобильное меню' })).toBeVisible()
    expect(await scan(page)).toEqual([])
  })

  test('страница 404', async ({ page, allowedConsole }) => {
    allowedConsole.push(/404/, /NUXT_E1005/)
    await page.goto('/net-takoj-stranicy')
    await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible()
    expect(await scan(page)).toEqual([])
  })
})
