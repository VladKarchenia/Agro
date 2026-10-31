import type { Locator } from '@playwright/test'
import { expect, test } from './fixtures'
import { cartLink, open, openWithCart, productCard } from './helpers'

// Проверки для людей, которые работают только с клавиатурой или скринридером.
// Автоматический анализ axe (a11y.spec.ts) этого не покрывает.

/** Видимая обводка у элемента в фокусе (WCAG 2.4.7) */
async function hasVisibleFocusRing(element: Locator) {
  return element.evaluate((node) => {
    const style = getComputedStyle(node)
    return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0
  })
}

test.describe('Доступность: клавиатура', () => {
  test('ссылка «Перейти к содержимому» появляется первой по Tab и переносит фокус в main', async ({
    page,
  }) => {
    await open(page, '/catalog')
    const skip = page.getByRole('link', { name: 'Перейти к содержимому' })

    await page.keyboard.press('Tab')
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()

    await page.keyboard.press('Enter')
    await expect(page.locator('main#main')).toBeFocused()
  })

  test('у элементов управления в фокусе есть видимая обводка', async ({ page }) => {
    await open(page, '/catalog/uborka')
    const card = productCard(page, 'Уборка урожая: пример 1')

    for (const control of [
      card.getByRole('button', { name: 'Увеличить количество' }),
      card.getByRole('button', { name: /^В корзину/ }),
      card.getByRole('link', { name: 'Уборка урожая: пример 1' }),
      cartLink(page),
    ]) {
      await control.focus()
      expect(await hasVisibleFocusRing(control), await control.innerHTML()).toBe(true)
    }
  })

  test('поле телефона показывает обводку на всей группе с кодом страны', async ({ page }) => {
    await openWithCart(page, [{ slug: 'uborka-primer-1', quantity: 1 }])
    const phone = page.getByLabel(/^Телефон/)
    await phone.focus()

    const group = phone.locator('xpath=..')
    const hasRing = await group.evaluate((node) => {
      const style = getComputedStyle(node)
      return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0
    })
    expect(hasRing).toBe(true)
  })

  test('полный путь заявки только с клавиатуры', async ({ page }) => {
    await open(page, '/catalog/uborka')

    // Добавляем товар: фокус на кнопку, Enter
    const add = productCard(page, 'Уборка урожая: пример 1').getByRole('button', {
      name: /^В корзину/,
    })
    await add.focus()
    await page.keyboard.press('Enter')
    await expect(cartLink(page)).toHaveAccessibleName('Корзина, позиций: 1')

    // Переходим в корзину по ссылке
    await cartLink(page).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/cart$/)

    // Заполняем поля, переходя Tab: имя → телефон → email
    await page.getByLabel('Имя').focus()
    await page.keyboard.type('Иван')
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/^Телефон/)).toBeFocused()
    await page.keyboard.type('291234567')
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Email')).toBeFocused()
    await page.keyboard.type('ivan@example.by')

    // Согласие пробелом, отправка Enter
    const consent = page.getByRole('checkbox')
    await consent.focus()
    await page.keyboard.press('Space')
    await expect(consent).toBeChecked()

    const submit = page.getByRole('button', { name: 'Отправить заявку' })
    await submit.focus()
    await page.keyboard.press('Enter')

    // Фокус переходит на подтверждение, а не теряется
    const done = page.getByRole('heading', { name: 'Заявка принята' })
    await expect(done).toBeVisible()
    await expect(done).toBeFocused()
  })

  test('после ошибки фокус на первом неверном поле, а ошибка связана с полем для скринридера', async ({
    page,
  }) => {
    await openWithCart(page, [{ slug: 'uborka-primer-1', quantity: 1 }])
    const submit = page.getByRole('button', { name: 'Отправить заявку' })
    await submit.focus()
    await page.keyboard.press('Enter')

    const name = page.getByLabel('Имя')
    await expect(name).toBeFocused()
    await expect(name).toHaveAccessibleDescription('Укажите имя')
  })

  test('меню на мобильном закрывается по Escape и возвращает фокус на кнопку', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop', 'только для мобильного')
    await open(page, '/')

    const toggle = page.getByRole('button', { name: 'Меню' })
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('navigation', { name: 'Мобильное меню' })).toBeVisible()

    await page.getByRole('navigation', { name: 'Мобильное меню' }).getByRole('link').first().focus()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('navigation', { name: 'Мобильное меню' })).toBeHidden()
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})

test.describe('Доступность: скринридер', () => {
  test('при переходе между страницами озвучивается новая страница', async ({ page }) => {
    await open(page, '/')
    // Кнопка в hero видна и на десктопе, и на мобильном (ссылка в шапке на мобильном спрятана в меню)
    await page.getByRole('link', { name: 'Открыть каталог' }).click()
    await expect(page).toHaveURL(/\/catalog$/)

    // Диктор маршрута (NuxtRouteAnnouncer) читает заголовок новой страницы через role=status
    await expect(page.getByRole('status').filter({ hasText: 'Каталог техники' })).toHaveCount(1)
  })

  test('иконки декоративные и скрыты, а кнопки без текста имеют имя', async ({ page }) => {
    await open(page, '/catalog/uborka')
    // Любая кнопка и ссылка на странице должна иметь доступное имя
    const unnamed = await page.evaluate(() => {
      const bad: string[] = []
      for (const node of document.querySelectorAll('button, a[href]')) {
        // Скрытые от скринридера дубли (ссылка на фото с aria-hidden) имени иметь не обязаны
        if (node.closest('[aria-hidden="true"]')) continue
        const name = (node.getAttribute('aria-label') ?? node.textContent ?? '').trim()
        if (!name) bad.push(node.outerHTML.slice(0, 120))
      }
      return bad
    })
    expect(unnamed).toEqual([])
  })
})
