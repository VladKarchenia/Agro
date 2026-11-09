import { expect, test } from './fixtures'
import {
  CATEGORY_PATH,
  COLOR_PRODUCT,
  COLOR_SUBCATEGORY_PATH,
  cartLink,
  FIRST_PRODUCT,
  open,
  openWithCart,
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

  test('страница товара: другие типоразмеры и другие разделы категории ведут дальше', async ({
    page,
  }) => {
    await open(page, FIRST_PRODUCT.path)
    const sizes = page.getByRole('region', { name: 'Другие типоразмеры' })
    await expect(sizes.getByRole('link', { name: SECOND_PRODUCT.name })).toBeVisible()
    // Самого товара среди «других» нет
    await expect(sizes.getByRole('link', { name: FIRST_PRODUCT.name, exact: true })).toHaveCount(0)
    await expect(sizes.getByRole('link', { name: /^Все типоразмеры раздела/ })).toHaveAttribute(
      'href',
      SUBCATEGORY_PATH,
    )

    const others = page.getByRole('region', { name: 'Ещё в категории «Кабель и провод»' })
    await expect(others.getByRole('heading', { level: 3 })).toHaveCount(6)
    await expect(others.getByRole('heading', { name: 'Кабель АВБбШв' })).toHaveCount(0)

    await sizes.getByRole('link', { name: SECOND_PRODUCT.name }).click()
    await expect(page).toHaveURL(new RegExp(`${SECOND_PRODUCT.path}$`))
    await expect(page.getByRole('heading', { level: 1, name: SECOND_PRODUCT.name })).toBeVisible()
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

    expect(await readCart(page)).toEqual([{ slug: `${COLOR_PRODUCT.slug}-siniy`, quantity: 1 }])
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
      { slug: `${COLOR_PRODUCT.slug}-belyi`, quantity: 1 },
      { slug: `${COLOR_PRODUCT.slug}-krasnyi`, quantity: 1 },
    ])
  })

  test('цвет выбирается стрелками с клавиатуры', async ({ page }) => {
    await open(page, COLOR_PRODUCT.path)
    await page.getByRole('radio', { name: 'белый' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('radio', { name: 'чёрный' })).toBeChecked()
  })
})

test.describe('Каталог: фото товаров', () => {
  const loaded = (page: import('@playwright/test').Page, selector: string) =>
    page.locator(selector).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)

  test('на странице товара фото загружается, подпись равна названию, заглушки нет', async ({
    page,
  }) => {
    await open(page, FIRST_PRODUCT.path)
    const photo = page.getByRole('main').getByRole('img', { name: FIRST_PRODUCT.name })
    await expect(photo).toBeVisible()
    await expect(photo).toHaveAttribute('src', /\/images\/products\/kabel-avbbshv\/.+\.webp$/)
    expect(await loaded(page, `img[alt="${FIRST_PRODUCT.name}"]`)).toBe(true)
    await expect(page.getByRole('img', { name: 'Фото появится позже' })).toHaveCount(0)
  })

  test('карточки в списке подкатегории показывают фото', async ({ page }) => {
    await open(page, SUBCATEGORY_PATH)
    await expect(page.getByRole('article').locator('img')).toHaveCount(4)
  })

  test('если у товара несколько фото, кнопки миниатюр переключают главное', async ({ page }) => {
    await open(page, SECOND_PRODUCT.path)
    const thumbs = page.getByRole('list', { name: 'Фотографии товара' }).getByRole('button')
    await expect(thumbs).toHaveCount(2)
    await expect(thumbs.first()).toHaveAttribute('aria-pressed', 'true')

    await thumbs.nth(1).click()
    await expect(thumbs.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page
        .getByRole('main')
        .getByRole('img', { name: `${SECOND_PRODUCT.name}, фото 2`, exact: true }),
    ).toHaveCount(2) // главное фото и миниатюра
  })

  test('при смене цвета меняется фото и подпись', async ({ page }) => {
    await open(page, COLOR_PRODUCT.path)
    const photo = page.getByRole('main').locator('img').first()
    await expect(photo).toHaveAttribute('alt', `${COLOR_PRODUCT.name} белый`)
    const white = await photo.getAttribute('src')

    await page.getByRole('group', { name: 'Цвет' }).getByText('синий', { exact: true }).click()
    await expect(photo).toHaveAttribute('alt', `${COLOR_PRODUCT.name} синий`)
    expect(await photo.getAttribute('src')).not.toBe(white)
  })

  test('если фото выбранного цвета нет, показывается заглушка, а не фото другого цвета', async ({
    page,
  }) => {
    await open(page, `${CATEGORY_PATH}/provod-pvs/provod-pvs-t-4x4-1x4`)
    await expect(page.getByRole('main').locator('img').first()).toHaveAttribute('alt', /белый/)

    await page.getByRole('group', { name: 'Цвет' }).getByText('чёрный', { exact: true }).click()
    await expect(page.getByRole('img', { name: 'Фото появится позже' })).toBeVisible()
    await expect(page.getByRole('main').locator('img')).toHaveCount(0)
  })

  test('в корзине у позиции с цветом фото этого цвета', async ({ page }) => {
    await openWithCart(page, [{ slug: `${COLOR_PRODUCT.slug}-siniy`, quantity: 1 }])
    await expect(
      page.getByRole('main').getByRole('img', { name: `${COLOR_PRODUCT.name} синий` }),
    ).toBeVisible()
  })

  test('превью ссылки на товар использует его фото', async ({ page }) => {
    await open(page, FIRST_PRODUCT.path)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/images\/products\/kabel-avbbshv\/.+\.webp$/,
    )
  })
})

test.describe('Каталог: лампы промышленные', () => {
  const LAMPS_PATH = '/catalog/lampy-promyshlennye'
  const T8_PATH = `${LAMPS_PATH}/lampy-svetodiodnye-t8-g13`
  const T8_PRODUCT = 'Лампа светодиодная T8 18 Вт G13 1200 мм'

  test('каталог → категория ламп → подкатегория → товар по ссылкам', async ({ page }) => {
    await open(page, '/catalog')
    await page.getByRole('link', { name: /Лампы промышленные/ }).click()
    await expect(page).toHaveURL(new RegExp(`${LAMPS_PATH}$`))
    await expect(page.getByRole('heading', { level: 1, name: 'Лампы промышленные' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveCount(5)

    await page.getByRole('link', { name: /Лампы светодиодные T8 G13/ }).click()
    await expect(page).toHaveURL(new RegExp(`${T8_PATH}$`))
    await expect(page.getByRole('heading', { level: 2, name: 'Модели' })).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(6)

    await productCard(page, T8_PRODUCT).getByRole('link').first().click()
    await expect(page.getByRole('heading', { level: 1, name: T8_PRODUCT })).toBeVisible()
    await expect(page.getByText('Цоколь', { exact: true })).toBeVisible()
    await expect(page.getByText('Цена по запросу').first()).toBeVisible()
  })

  test('страница лампы: другие модели, остальные разделы категории, лампа кладётся в корзину', async ({
    page,
  }) => {
    await open(page, `${T8_PATH}/lampa-svetodiodnaya-t8-18vt-g13-1200mm`)
    const models = page.getByRole('region', { name: 'Другие модели' })
    await expect(models.getByRole('link')).toHaveCount(6)
    const others = page.getByRole('region', { name: 'Ещё в категории «Лампы промышленные»' })
    await expect(others.getByRole('heading', { level: 3 })).toHaveCount(4)

    await page.getByRole('button', { name: /^В корзину/ }).click()
    await expect
      .poll(() => readCart(page))
      .toEqual([{ slug: 'lampa-svetodiodnaya-t8-18vt-g13-1200mm-4000k', quantity: 1 }])
  })

  test('цветовая температура выбирается на странице лампы и попадает в корзину', async ({
    page,
  }) => {
    await open(page, T8_PATH)
    const card = productCard(page, T8_PRODUCT).first()
    await expect(card.getByRole('link', { name: 'Выбрать оттенок' })).toBeVisible()
    await expect(card.getByRole('button', { name: /^В корзину/ })).toHaveCount(0)

    await card.getByRole('link', { name: 'Выбрать оттенок' }).click()
    const temperature = page.getByRole('group', { name: 'Цветовая температура' })
    await expect(temperature.getByRole('radio')).toHaveCount(2)
    await expect(temperature.getByRole('radio', { name: '4000 К' })).toBeChecked()

    await temperature.getByText('6500 К', { exact: true }).click()
    await page.getByRole('button', { name: /^В корзину/ }).click()
    await expect
      .poll(() => readCart(page))
      .toEqual([{ slug: 'lampa-svetodiodnaya-t8-18vt-g13-1200mm-6500k', quantity: 1 }])

    // у ламп только с одним оттенком выбора нет, лампа кладётся в корзину сразу
    await open(page, `${T8_PATH}/lampa-svetodiodnaya-t8-45vt-g13-1200mm-pro`)
    await expect(page.getByRole('group', { name: 'Цветовая температура' })).toHaveCount(0)
  })

  test('в корзине название лампы с выбранным оттенком', async ({ page }) => {
    await openWithCart(page, [
      { slug: 'lampa-svetodiodnaya-t8-18vt-g13-1200mm-6500k', quantity: 2 },
    ])
    await expect(page.getByRole('main').getByText(`${T8_PRODUCT} 6500 К`).first()).toBeVisible()
  })
})

test.describe('Каталог: обложки категорий', () => {
  test('на странице каталога у каждой категории загружена обложка', async ({ page }) => {
    await open(page, '/catalog')
    const covers = page.getByRole('main').locator('a[href^="/catalog/"] img')
    await expect(covers).toHaveCount(3)
    for (const cover of await covers.all()) {
      await expect(cover).toHaveAttribute('alt', '')
      await expect
        .poll(() => cover.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
        .toBeGreaterThan(0)
    }
  })

  test('карточка категории остаётся одной ссылкой с названием и описанием', async ({ page }) => {
    await open(page, '/catalog')
    const link = page.getByRole('link', { name: /Лампы промышленные/ })
    await expect(link).toHaveCount(1)
    await expect(link.getByRole('heading', { level: 2, name: 'Лампы промышленные' })).toBeVisible()
  })

  test('превью ссылки категории использует её обложку', async ({ page }) => {
    await open(page, '/catalog/lampy-promyshlennye')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/images\/categories\/lampy-promyshlennye\.webp$/,
    )
  })

  test('на главной у категорий тоже есть обложки', async ({ page }) => {
    await open(page, '/')
    await expect(page.getByRole('main').locator('a[href^="/catalog/"] img')).toHaveCount(3)
  })
})

test.describe('Каталог: светильники светодиодные', () => {
  const FIXTURES_PATH = '/catalog/svetilniki-svetodiodnye'

  test('каталог → категория светильников → подкатегория T8 → товар', async ({ page }) => {
    await open(page, '/catalog')
    await page.getByRole('link', { name: /Светильники светодиодные/ }).click()
    await expect(page).toHaveURL(new RegExp(`${FIXTURES_PATH}$`))
    await expect(
      page.getByRole('heading', { level: 1, name: 'Светильники светодиодные' }),
    ).toBeVisible()
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveCount(6)

    await page.getByRole('link', { name: /Светильники для LED ламп T8 G13 IP65/ }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Модели' })).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(7)

    await productCard(page, 'Светильник для ламп T8 LED-GS-2×600 IP65')
      .getByRole('link')
      .first()
      .click()
    await expect(page.getByText('Монтажная пластина', { exact: true })).toBeVisible()
    await expect(page.getByText('Есть', { exact: true })).toBeVisible()
    await expect(page.getByText('Цена по запросу').first()).toBeVisible()
  })

  test('у панели оттенок 4000 К / 6500 К выбирается на странице и попадает в корзину', async ({
    page,
  }) => {
    const panel = `${FIXTURES_PATH}/universalnye-paneli/svetilnik-svetodiodnyj-universalnyj-asl33-036-m-36vt-opal`
    await open(page, `${FIXTURES_PATH}/universalnye-paneli`)
    const card = productCard(page, 'Панель светодиодная ASL33-036-M 36 Вт Опал').first()
    await expect(card.getByRole('link', { name: 'Выбрать оттенок' })).toBeVisible()

    await open(page, panel)
    const temperature = page.getByRole('group', { name: 'Цветовая температура' })
    await expect(temperature.getByRole('radio')).toHaveCount(2)
    await temperature.getByText('6500 К', { exact: true }).click()
    await page.getByRole('button', { name: /^В корзину/ }).click()
    await expect
      .poll(() => readCart(page))
      .toEqual([
        { slug: 'svetilnik-svetodiodnyj-universalnyj-asl33-036-m-36vt-opal-6500k', quantity: 1 },
      ])
  })

  test('светильник кладётся в корзину без выбора вариантов', async ({ page }) => {
    await open(
      page,
      `${FIXTURES_PATH}/svetilniki-svetodiodnye-lpo/svetilnik-svetodiodnyj-lpo-eco-u-600-m-18vt`,
    )
    await page.getByRole('button', { name: /^В корзину/ }).click()
    await expect
      .poll(() => readCart(page))
      .toEqual([{ slug: 'svetilnik-svetodiodnyj-lpo-eco-u-600-m-18vt', quantity: 1 }])
  })
})
