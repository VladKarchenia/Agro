import { expect, test } from './fixtures'
import {
  CATEGORY_PATH,
  COLOR_PRODUCT,
  COLOR_SUBCATEGORY_PATH,
  cartLink,
  FIRST_PRODUCT,
  open,
  productCard,
  readCart,
  SECOND_PRODUCT,
  SUBCATEGORY_PATH,
} from './helpers'

test.describe('Каталог: навигация по уровням', () => {
  test('каталог → категория → подкатегория → товар по ссылкам', async ({ page }) => {
    await open(page, '/catalog')
    await page.getByRole('link', { name: /Кабель и провод/ }).click()
    await expect(page).toHaveURL(new RegExp(`${CATEGORY_PATH}$`))
    await expect(page.getByRole('heading', { level: 1, name: 'Кабель и провод' })).toBeVisible()

    await page.getByRole('link', { name: /Кабель АВБбШв/ }).click()
    await expect(page).toHaveURL(new RegExp(`${SUBCATEGORY_PATH}$`))
    await expect(page.getByRole('heading', { level: 1, name: 'Кабель АВБбШв' })).toBeVisible()

    await page.getByRole('link', { name: FIRST_PRODUCT.name }).click()
    await expect(page).toHaveURL(new RegExp(`${FIRST_PRODUCT.path}$`))
    await expect(page.getByRole('heading', { level: 1, name: FIRST_PRODUCT.name })).toBeVisible()
  })

  test('категория показывает все семь подкатегорий', async ({ page }) => {
    await open(page, CATEGORY_PATH)
    const main = page.getByRole('main')
    for (const title of [
      'Кабель АВБбШв',
      'Кабель АВВГ',
      'Кабель ВВГнг-LS',
      'Провод ПВ-1 (ПуВ)',
      'Провод ПВ-3 (ПуГВ)',
      'Провод ПВС',
      'Провод СИП',
    ]) {
      await expect(main.getByRole('heading', { level: 2, name: title })).toBeVisible()
    }
  })

  test('подкатегория показывает все типоразмеры и SEO-текст с расшифровкой', async ({ page }) => {
    await open(page, SUBCATEGORY_PATH)
    for (const name of [FIRST_PRODUCT.name, SECOND_PRODUCT.name]) {
      await expect(productCard(page, name)).toBeVisible()
    }
    await expect(page.getByRole('article')).toHaveCount(4)
    await expect(page.getByRole('heading', { name: 'Расшифровка маркировки АВБбШв' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Частые вопросы' })).toBeVisible()
  })

  test('страница товара: описание, характеристики и ссылка на подкатегорию', async ({ page }) => {
    await open(page, FIRST_PRODUCT.path)
    await expect(page.getByRole('heading', { name: 'Описание' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Характеристики' })).toBeVisible()
    await expect(page.getByText('Материал жил', { exact: true })).toBeVisible()
    await expect(page.getByText('Алюминий', { exact: true })).toBeVisible()
    await expect(page.getByText('Цена по запросу').first()).toBeVisible()

    await page
      .getByRole('main')
      .getByRole('link', { name: /Кабель АВБбШв/ })
      .last()
      .click()
    await expect(page).toHaveURL(new RegExp(`${SUBCATEGORY_PATH}$`))
  })

  test('несуществующие категория и подкатегория дают 404', async ({ page, allowedConsole }) => {
    allowedConsole.push(/404/, /NUXT_E1005/)
    for (const path of ['/catalog/net-takoj', `${CATEGORY_PATH}/net-takoj`]) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(404)
      await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible()
    }
  })
})

test.describe('Каталог: выбор цвета провода', () => {
  test('на карточке в списке вместо корзины кнопка выбора цвета', async ({ page }) => {
    await open(page, COLOR_SUBCATEGORY_PATH)
    const card = productCard(page, COLOR_PRODUCT.name).first()
    await expect(card.getByRole('link', { name: 'Выбрать цвет' })).toBeVisible()
    await expect(card.getByRole('button', { name: /^В корзину/ })).toHaveCount(0)
  })

  test('цвет выбирается на странице товара и попадает в корзину', async ({ page }) => {
    await open(page, COLOR_PRODUCT.path)
    const colors = page.getByRole('group', { name: 'Цвет' })
    await expect(colors.getByRole('radio')).toHaveCount(5)
    await expect(colors.getByRole('radio', { name: 'белый' })).toBeChecked()

    await colors.getByText('синий', { exact: true }).click()
    await page.getByRole('button', { name: /^В корзину/ }).click()

    expect(await readCart(page)).toEqual([{ slug: `${COLOR_PRODUCT.slug}-sinij`, quantity: 1 }])
    await expect(cartLink(page)).toHaveAccessibleName('Корзина, позиций: 1')

    await open(page, '/cart')
    await expect(page.getByRole('link', { name: `${COLOR_PRODUCT.name} синий` })).toBeVisible()
  })

  test('разные цвета одного провода — разные позиции корзины', async ({ page }) => {
    await open(page, COLOR_PRODUCT.path)
    const colors = page.getByRole('group', { name: 'Цвет' })

    await page.getByRole('button', { name: /^В корзину/ }).click()
    await colors.getByText('красный', { exact: true }).click()
    await page.getByRole('button', { name: /^В корзину/ }).click()

    expect(await readCart(page)).toEqual([
      { slug: `${COLOR_PRODUCT.slug}-belyj`, quantity: 1 },
      { slug: `${COLOR_PRODUCT.slug}-krasnyj`, quantity: 1 },
    ])
  })

  test('цвет выбирается стрелками с клавиатуры', async ({ page }) => {
    await open(page, COLOR_PRODUCT.path)
    await page.getByRole('radio', { name: 'белый' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('radio', { name: 'синий' })).toBeChecked()
  })
})
