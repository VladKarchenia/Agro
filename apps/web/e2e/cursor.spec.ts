import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import {
  CATEGORY_PATH,
  COLOR_PRODUCT,
  cartLink,
  FIRST_PRODUCT,
  open,
  openWithCart,
  productCard,
  SECOND_PRODUCT,
  SUBCATEGORY_PATH,
} from './helpers'

// Курсор «рука» на всём, что можно нажать, и «запрещено» на недоступном. Tailwind 4 по умолчанию
// делает у кнопок обычную стрелку, поэтому правило задано глобально (main.css) и проверяется здесь.

/** Интерактивные элементы страницы, у которых курсор не такой, как должен быть */
function wrongCursors(page: Page) {
  return page.evaluate(() => {
    const wrong: string[] = []
    const nameOf = (node: Element) =>
      `${node.tagName.toLowerCase()} "${(node.getAttribute('aria-label') ?? node.textContent ?? '').trim().slice(0, 40)}"`

    for (const node of document.querySelectorAll(
      'a[href], button, summary, select, [role="button"], input[type="checkbox"], input[type="radio"]',
    )) {
      const disabled = node instanceof HTMLButtonElement && node.disabled
      const expected = disabled ? 'not-allowed' : 'pointer'
      const actual = getComputedStyle(node).cursor
      if (actual !== expected) wrong.push(`${nameOf(node)}:${actual}, ожидался ${expected}`)
    }
    return wrong
  })
}

const PAGES = [
  '/',
  '/catalog',
  CATEGORY_PATH,
  SUBCATEGORY_PATH,
  FIRST_PRODUCT.path,
  COLOR_PRODUCT.path,
  '/privacy',
  '/consent',
  '/contacts',
  '/about',
]

test.describe('Курсор', () => {
  for (const path of PAGES) {
    test(`на всех кнопках и ссылках курсор-рука: ${path}`, async ({ page }) => {
      await open(page, path)
      expect(await wrongCursors(page)).toEqual([])
    })
  }

  test('в корзине: поля формы, переключатель, чекбокс, кнопки количества и удаления', async ({
    page,
  }) => {
    await openWithCart(page, [
      { slug: FIRST_PRODUCT.slug, quantity: 1 },
      { slug: SECOND_PRODUCT.slug, quantity: 2 },
    ])
    expect(await wrongCursors(page)).toEqual([])

    await page.getByText('Организация или ИП').click()
    expect(await wrongCursors(page)).toEqual([])

    // Подписи, в которые вложен чекбокс или переключатель, тоже кликабельны целиком
    const labels = await page.evaluate(() =>
      [...document.querySelectorAll('label')]
        .filter((label) => label.querySelector('input[type="checkbox"], input[type="radio"]'))
        .map((label) => getComputedStyle(label).cursor),
    )
    expect(labels.length).toBeGreaterThanOrEqual(3)
    expect(labels.every((cursor) => cursor === 'pointer')).toBe(true)
  })

  test('текстовые поля сохраняют текстовый курсор', async ({ page }) => {
    await openWithCart(page, [{ slug: FIRST_PRODUCT.slug, quantity: 1 }])
    const cursor = await page.getByLabel('Имя').evaluate((node) => getComputedStyle(node).cursor)
    expect(['auto', 'text']).toContain(cursor)
  })

  test('недоступные кнопки показывают «запрещено»', async ({ page }) => {
    await open(page, SUBCATEGORY_PATH)
    const minus = productCard(page, FIRST_PRODUCT.name).getByRole('button', {
      name: 'Уменьшить количество',
    })
    await expect(minus).toBeDisabled()
    expect(await minus.evaluate((node) => getComputedStyle(node).cursor)).toBe('not-allowed')

    await openWithCart(page, [{ slug: 'net-takogo', quantity: 1 }])
    const submit = page.getByRole('button', { name: 'Отправить заявку' })
    await expect(submit).toBeDisabled()
    expect(await submit.evaluate((node) => getComputedStyle(node).cursor)).toBe('not-allowed')
  })

  test('иконка корзины и кнопка меню на мобильном тоже с курсором-рукой', async ({ page }) => {
    await open(page, '/')
    expect(await cartLink(page).evaluate((node) => getComputedStyle(node).cursor)).toBe('pointer')
  })
})
