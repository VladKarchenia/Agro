import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { FIRST_PRODUCT, open, SECOND_PRODUCT, SUBCATEGORY_PATH } from './helpers'

// Поиск в шапке: широкий экран показывает поле сразу, узкий раскрывает его кнопкой-лупой.

/** Открывает поиск так, как это делает посетитель на текущем экране, и возвращает поле ввода */
async function openSearch(page: Page) {
  const toggle = page.getByRole('button', { name: 'Поиск по каталогу' })
  if (await toggle.isVisible()) await toggle.click()
  const input = page.getByRole('combobox', { name: 'Поиск по каталогу' })
  await input.click()
  return input
}

const options = (page: Page) => page.getByRole('listbox').getByRole('option')

test.describe('Поиск по каталогу', () => {
  test('находит товар и открывает его по клику', async ({ page }) => {
    await open(page, '/')
    const input = await openSearch(page)
    await input.fill('авббшв 4x16')

    const first = options(page).filter({ hasText: SECOND_PRODUCT.name })
    await expect(first).toBeVisible()
    await first.click()

    await expect(page).toHaveURL(new RegExp(`${SECOND_PRODUCT.path}$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(SECOND_PRODUCT.name)
  })

  test('Enter открывает выбранный стрелками вариант, Esc закрывает список', async ({ page }) => {
    await open(page, '/')
    const input = await openSearch(page)
    await input.fill('авббшв')

    await expect(options(page).first()).toBeVisible()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    // Первый вариант выбран заранее
    await expect(options(page).first()).toHaveAttribute('aria-selected', 'true')
    await expect(input).toHaveAttribute('aria-activedescendant', /site-search-option-0/)

    await page.keyboard.press('ArrowDown')
    await expect(options(page).nth(1)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowUp')
    await expect(options(page).first()).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/catalog\/kabel-provod\/[^/]+(\/[^/]+)?$/)
  })

  test('понимает типоразмер, цвет, опечатку и раскладку', async ({ page }) => {
    await open(page, '/')
    const input = await openSearch(page)

    await input.fill('провод синий')
    await expect(options(page).filter({ hasText: 'Цвет: синий' }).first()).toBeVisible()

    await input.fill('првод')
    await expect(options(page).filter({ hasText: 'Провод' }).first()).toBeVisible()

    await input.fill('ghjdjl')
    await expect(page.getByText('Показаны результаты для «провод»')).toBeVisible()
    await expect(options(page).filter({ hasText: 'Провод' }).first()).toBeVisible()

    await input.fill('avbbshv')
    await expect(options(page).filter({ hasText: 'АВБбШв' }).first()).toBeVisible()
  })

  test('подсвечивает найденное', async ({ page }) => {
    await open(page, '/')
    const input = await openSearch(page)
    await input.fill('авббшв 2х16')
    const row = options(page).filter({ hasText: FIRST_PRODUCT.name })
    // Название в первой строке; ниже описание, где типоразмер подсвечен тоже
    await expect(row.locator('p').first().locator('mark')).toHaveText(['АВБбШв', '2х16'])
  })

  test('без запроса предлагает разделы и примеры, пример подставляется в поле', async ({
    page,
  }) => {
    await open(page, '/')
    const input = await openSearch(page)
    await expect(page.getByText('Разделы каталога')).toBeVisible()
    await options(page).filter({ hasText: 'провод синий' }).click()
    await expect(input).toHaveValue('провод синий')
    await expect(options(page).first()).toBeVisible()
  })

  test('при пустой выдаче объясняет и предлагает разделы', async ({ page }) => {
    await open(page, '/')
    const input = await openSearch(page)
    await input.fill('трактор')
    await expect(page.getByText('Ничего не нашлось по «трактор»')).toBeVisible()
    // Разделы только предлагаются: Enter не должен открыть случайный из них
    await expect(options(page).first()).toHaveAttribute('aria-selected', 'false')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/')
    await options(page).filter({ hasText: 'Кабель АВБбШв' }).click()
    await expect(page).toHaveURL(new RegExp(`${SUBCATEGORY_PATH}$`))
  })

  test('запоминает выбранные запросы и очищает историю', async ({ page }) => {
    await open(page, '/')
    let input = await openSearch(page)
    await input.fill('авббшв 4х16')
    await options(page).first().click()
    await expect(page).toHaveURL(/\/catalog\//)

    input = await openSearch(page)
    await expect(page.getByText('Недавние запросы')).toBeVisible()
    const recent = page.getByRole('group', { name: 'Недавние запросы' }).getByRole('option')
    await expect(recent).toHaveText(['авббшв 4х16'])

    await page.getByRole('button', { name: 'Очистить историю' }).click()
    await expect(page.getByText('Недавние запросы')).toBeHidden()
  })

  test('клавиша «/» переносит фокус в поиск, но не мешает вводу в других полях', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'горячие клавиши нужны только с клавиатурой')
    await open(page, '/')
    await page.keyboard.press('/')
    await expect(page.getByRole('combobox', { name: 'Поиск по каталогу' })).toBeFocused()

    await page.keyboard.press('Escape')
    await page.keyboard.press('Control+k')
    await expect(page.getByRole('combobox', { name: 'Поиск по каталогу' })).toBeFocused()

    // В самом поле «/» остаётся обычным символом
    await page.keyboard.type('4/')
    await expect(page.getByRole('combobox', { name: 'Поиск по каталогу' })).toHaveValue('4/')
  })

  test('на узком экране поле раскрывается кнопкой и не вызывает горизонтальный скролл', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'проверка для узкого экрана')
    await open(page, '/')
    const input = page.getByRole('combobox', { name: 'Поиск по каталогу' })
    await expect(input).toBeHidden()

    const toggle = page.getByRole('button', { name: 'Поиск по каталогу' })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(input).toBeVisible()

    await input.fill('кабель')
    await expect(options(page).first()).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)

    // Меню и поиск не открыты одновременно
    await page.getByRole('button', { name: 'Меню' }).click()
    await expect(input).toBeHidden()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('цели нажатия в поиске не меньше 44 px', async ({ page }) => {
    await open(page, '/')
    const input = await openSearch(page)
    await input.fill('кабель')
    const clear = page.getByRole('button', { name: 'Очистить поиск' })
    const box = await clear.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(44)
    expect(box?.height).toBeGreaterThanOrEqual(44)
    const inputBox = await input.boundingBox()
    expect(inputBox?.height).toBeGreaterThanOrEqual(44)
  })

  test('axe не находит нарушений при открытом списке', async ({ page }) => {
    await open(page, '/')
    const input = await openSearch(page)
    for (const text of ['', 'кабель', 'трактор']) {
      await input.fill(text)
      await page.waitForTimeout(250) // конец анимации появления
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze()
      expect(
        violations.map((item) => `${item.id}: ${item.nodes[0]?.target.join(' ')}`),
        `запрос «${text}»`,
      ).toEqual([])
    }
  })
})
