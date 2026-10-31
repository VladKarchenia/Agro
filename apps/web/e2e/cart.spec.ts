import { expect, test } from './fixtures'
import { cartLink, open, openWithCart, productCard, readCart, reload } from './helpers'

const FIRST = 'Почвообработка: пример 1'
const FIRST_SLUG = 'pochvoobrabotka-primer-1'
const SECOND_SLUG = 'posev-primer-2'

test.describe('Корзина: добавление', () => {
  test('пустая корзина: в шапке нет счётчика, на странице подсказка и ссылка в каталог', async ({
    page,
  }) => {
    await open(page, '/catalog/pochvoobrabotka')
    await expect(cartLink(page)).toHaveAccessibleName('Корзина, пока пусто')

    await open(page, '/cart')
    await expect(page.getByText('В корзине пока нет товаров')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Открыть каталог' })).toBeVisible()
  })

  test('на карточке выбирается количество и добавляется целиком', async ({ page }) => {
    await open(page, '/catalog/pochvoobrabotka')
    const card = productCard(page, FIRST)

    await card.getByRole('button', { name: 'Увеличить количество' }).click()
    await card.getByRole('button', { name: 'Увеличить количество' }).click()
    await card.getByRole('button', { name: /^В корзину/ }).click()

    await expect(card.getByText('В корзине: 3 шт.')).toBeVisible()
    await expect(cartLink(page)).toHaveAccessibleName('Корзина, позиций: 1')
    expect(await readCart(page)).toEqual([{ slug: FIRST_SLUG, quantity: 3 }])
  })

  test('повторное добавление суммирует количество, а не создаёт вторую позицию', async ({
    page,
  }) => {
    await open(page, '/catalog/pochvoobrabotka')
    const card = productCard(page, FIRST)

    await card.getByRole('button', { name: 'Увеличить количество' }).click()
    await card.getByRole('button', { name: /^В корзину/ }).click()
    await card.getByRole('button', { name: /^Добавлено|^В корзину/ }).click()

    expect(await readCart(page)).toEqual([{ slug: FIRST_SLUG, quantity: 4 }])
    await expect(cartLink(page)).toHaveAccessibleName('Корзина, позиций: 1')
  })

  test('количество нельзя опустить ниже единицы кнопкой «минус»', async ({ page }) => {
    await open(page, '/catalog/pochvoobrabotka')
    const card = productCard(page, FIRST)
    await expect(card.getByRole('button', { name: 'Уменьшить количество' })).toBeDisabled()
  })

  test('со страницы товара добавляется выбранное количество', async ({ page }) => {
    await open(page, `/catalog/posev/${SECOND_SLUG}`)
    await page.getByRole('button', { name: 'Увеличить количество' }).click()
    await page.getByRole('button', { name: /^В корзину/ }).click()

    expect(await readCart(page)).toEqual([{ slug: SECOND_SLUG, quantity: 2 }])
  })

  test('корзина сохраняется после перезагрузки и при переходах между страницами', async ({
    page,
  }) => {
    await open(page, '/catalog/pochvoobrabotka')
    await productCard(page, FIRST)
      .getByRole('button', { name: /^В корзину/ })
      .click()

    await reload(page)
    await expect(cartLink(page)).toHaveAccessibleName('Корзина, позиций: 1')

    await page.getByRole('link', { name: 'Каталог', exact: true }).first().click()
    await expect(page).toHaveURL(/\/catalog$/)
    await expect(cartLink(page)).toHaveAccessibleName('Корзина, позиций: 1')
  })

  test('корзина синхронизируется между вкладками', async ({ context, page }) => {
    await open(page, '/')
    const other = await context.newPage()
    await open(other, '/catalog/uborka')

    await productCard(other, 'Уборка урожая: пример 1')
      .getByRole('button', { name: /^В корзину/ })
      .click()

    // Пользователь возвращается на первую вкладку: корзина в ней уже обновлена
    await page.bringToFront()
    await expect(cartLink(page)).toHaveAccessibleName('Корзина, позиций: 1')
  })
})

test.describe('Корзина: страница', () => {
  test('показывает позиции с количеством и ссылками на товары', async ({ page }) => {
    await openWithCart(page, [
      { slug: FIRST_SLUG, quantity: 3 },
      { slug: SECOND_SLUG, quantity: 2 },
    ])

    const rows = page.getByRole('list').filter({ hasText: FIRST }).getByRole('listitem')
    await expect(rows).toHaveCount(2)
    await expect(rows.first().getByRole('textbox')).toHaveValue('3')
    await expect(rows.first().getByRole('link', { name: FIRST })).toHaveAttribute(
      'href',
      `/catalog/pochvoobrabotka/${FIRST_SLUG}`,
    )
    await expect(page.getByRole('heading', { name: 'Оформление заявки' })).toBeVisible()
  })

  test('количество меняется кнопками и вводом, значение сохраняется', async ({ page }) => {
    await openWithCart(page, [{ slug: FIRST_SLUG, quantity: 2 }])
    const quantity = page.getByRole('textbox', { name: `Количество: ${FIRST}` })

    await page.getByRole('button', { name: 'Увеличить количество' }).click()
    await expect(quantity).toHaveValue('3')
    expect(await readCart(page)).toEqual([{ slug: FIRST_SLUG, quantity: 3 }])

    await quantity.fill('12')
    await quantity.press('Enter')
    expect(await readCart(page)).toEqual([{ slug: FIRST_SLUG, quantity: 12 }])
  })

  test('некорректное количество исправляется: пусто возвращает прежнее, 0 даёт 1, большое ограничено', async ({
    page,
  }) => {
    await openWithCart(page, [{ slug: FIRST_SLUG, quantity: 5 }])
    const quantity = page.getByRole('textbox', { name: `Количество: ${FIRST}` })

    await quantity.fill('')
    await quantity.blur()
    await expect(quantity).toHaveValue('5')

    await quantity.fill('0')
    await quantity.blur()
    await expect(quantity).toHaveValue('1')

    await quantity.fill('999999')
    await quantity.blur()
    await expect(quantity).toHaveValue('9999')
    expect(await readCart(page)).toEqual([{ slug: FIRST_SLUG, quantity: 9999 }])
  })

  test('удаление позиции, а после последней показывается пустая корзина', async ({ page }) => {
    await openWithCart(page, [
      { slug: FIRST_SLUG, quantity: 1 },
      { slug: SECOND_SLUG, quantity: 1 },
    ])

    await page.getByRole('button', { name: `Удалить из корзины: ${FIRST}` }).click()
    expect(await readCart(page)).toEqual([{ slug: SECOND_SLUG, quantity: 1 }])

    await page.getByRole('button', { name: /^Удалить из корзины/ }).click()
    await expect(page.getByText('В корзине пока нет товаров')).toBeVisible()
    await expect(cartLink(page)).toHaveAccessibleName('Корзина, пока пусто')
  })

  test('испорченные данные в localStorage не ломают сайт', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('agroed:cart:v1', '{не json'))
    await open(page, '/cart')

    await expect(page.getByText('В корзине пока нет товаров')).toBeVisible()
    await expect(cartLink(page)).toHaveAccessibleName('Корзина, пока пусто')
  })

  test('недоступный товар помечен, не мешает остальным и не даёт отправить пустую заявку', async ({
    page,
  }) => {
    await openWithCart(page, [{ slug: 'net-takogo', quantity: 2 }])
    await expect(page.getByText('Товар больше недоступен')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Отправить заявку' })).toBeDisabled()

    await openWithCart(page, [
      { slug: 'net-takogo', quantity: 2 },
      { slug: FIRST_SLUG, quantity: 1 },
    ])
    await expect(page.getByText('Товар больше недоступен')).toBeVisible()
    await expect(page.getByRole('link', { name: FIRST })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Отправить заявку' })).toBeEnabled()
  })
})

test.describe('Корзина: адреса товаров', () => {
  test('товар по адресу чужой категории даёт страницу 404', async ({ page, allowedConsole }) => {
    // Браузер и Nuxt штатно пишут в консоль о ресурсе с кодом 404
    allowedConsole.push(/404/, /NUXT_E1005/)
    const response = await page.goto(`/catalog/posev/${FIRST_SLUG}`)
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible()
  })
})
