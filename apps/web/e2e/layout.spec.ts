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

const PAGES = [
  '/',
  '/catalog',
  CATEGORY_PATH,
  SUBCATEGORY_PATH,
  FIRST_PRODUCT.path,
  COLOR_PRODUCT.path,
  '/privacy',
  '/consent',
  '/about',
]

test.describe('Раскладка', () => {
  for (const path of PAGES) {
    test(`нет горизонтального скролла: ${path}`, async ({ page }) => {
      await open(page, path)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test('нет горизонтального скролла в корзине с формой организации', async ({ page }) => {
    await openWithCart(page, [
      { slug: FIRST_PRODUCT.slug, quantity: 2 },
      { slug: SECOND_PRODUCT.slug, quantity: 1 },
    ])
    await page.getByText('Организация или ИП').click()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('содержимое не смещается между страницей без прокрутки и страницей с прокруткой', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'на мобильных скроллбар накладывается поверх')

    // /about короткая (без скролла), /catalog/uborka длиннее окна (со скроллом)
    const positions: number[] = []
    const scrolls: boolean[] = []
    for (const path of ['/about', SUBCATEGORY_PATH, CATEGORY_PATH, '/']) {
      await open(page, path)
      const info = await page.evaluate(() => ({
        scrolls: document.documentElement.scrollHeight > window.innerHeight,
        logoX: Math.round(document.querySelector('header a')?.getBoundingClientRect().left ?? -1),
        contentX: Math.round(document.querySelector('main h1')?.getBoundingClientRect().left ?? -1),
      }))
      positions.push(info.logoX, info.contentX)
      scrolls.push(info.scrolls)
    }

    // Тест имеет смысл, только если среди страниц есть и с прокруткой, и без неё
    expect(scrolls).toContain(true)
    expect(scrolls).toContain(false)
    expect(new Set(positions).size, `позиции шапки и заголовков: ${positions}`).toBe(1)
  })
})

test.describe('Навигация', () => {
  test('на десктопе меню в шапке видно, кнопки меню нет', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'только для десктопа')
    await open(page, '/')
    await expect(page.getByRole('navigation', { name: 'Основное меню' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Меню' })).toBeHidden()
  })

  test('на мобильном меню открывается и закрывается, переход закрывает его', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop', 'только для мобильного')
    await open(page, '/')

    const toggle = page.getByRole('button', { name: 'Меню' })
    const menu = page.getByRole('navigation', { name: 'Мобильное меню' })
    await expect(menu).toBeHidden()

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(menu).toBeVisible()

    await menu.getByRole('link', { name: 'Каталог' }).click()
    await expect(page).toHaveURL(/\/catalog$/)
    await expect(menu).toBeHidden()
  })
})
