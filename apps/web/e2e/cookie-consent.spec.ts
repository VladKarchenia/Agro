import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { open, reload } from './helpers'

// Первый визит: в браузере нет ответа на вопрос о cookie, баннер должен появиться
test.use({ cookieChoice: 'none' })

const CONSENT_KEY = 'agroed:cookie-consent'

const banner = (page: Page) => page.getByRole('region', { name: 'Файлы cookie' })
const accept = (page: Page) => banner(page).getByRole('button', { name: 'Принять' })
const reject = (page: Page) => banner(page).getByRole('button', { name: 'Отклонить' })
const settings = (page: Page) => page.getByRole('button', { name: 'Настройки cookie' })

function readChoice(
  page: Page,
): Promise<{ analytics: boolean; version: number; date: string } | null> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), CONSENT_KEY)
}

test.describe('Баннер cookie', () => {
  test('на первом визите баннер виден, кнопки одинакового размера, выбор не записан', async ({
    page,
  }) => {
    await open(page, '/')
    await expect(banner(page)).toBeVisible()
    await expect(banner(page).getByRole('link', { name: 'Подробнее в политике' })).toHaveAttribute(
      'href',
      /\/privacy#cookies$/,
    )

    const [acceptBox, rejectBox] = await Promise.all([
      accept(page).boundingBox(),
      reject(page).boundingBox(),
    ])
    expect(acceptBox?.width).toBe(rejectBox?.width)
    expect(acceptBox?.height).toBe(rejectBox?.height)
    expect(acceptBox?.height).toBeGreaterThanOrEqual(44)

    expect(await readChoice(page)).toBeNull()
  })

  test('«Принять» записывает согласие, баннер закрывается и не возвращается после перезагрузки', async ({
    page,
  }) => {
    await open(page, '/catalog')
    await accept(page).click()

    await expect(banner(page)).toBeHidden()
    const choice = await readChoice(page)
    expect(choice?.analytics).toBe(true)
    expect(choice?.version).toBe(1)
    expect(Number.isNaN(Date.parse(choice?.date ?? ''))).toBe(false)

    await reload(page)
    await expect(banner(page)).toBeHidden()
  })

  test('«Отклонить» записывает отказ, баннер закрывается и не возвращается на других страницах', async ({
    page,
  }) => {
    await open(page, '/')
    await reject(page).click()

    await expect(banner(page)).toBeHidden()
    expect((await readChoice(page))?.analytics).toBe(false)

    await open(page, '/contacts')
    await expect(banner(page)).toBeHidden()
  })

  test('баннер не двигает страницу и не закрывает больше трети экрана', async ({ page }) => {
    await open(page, '/')
    await expect(banner(page)).toBeVisible()

    const before = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      headingTop: document.querySelector('main h1')?.getBoundingClientRect().top ?? -1,
      position: getComputedStyle(document.getElementById('cookie-banner') as Element).position,
    }))
    const box = await banner(page).boundingBox()
    const viewport = page.viewportSize()
    expect(box && viewport && box.height / viewport.height).toBeLessThan(0.34)

    await reject(page).click()
    await expect(banner(page)).toBeHidden()
    const after = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      headingTop: document.querySelector('main h1')?.getBoundingClientRect().top ?? -1,
    }))

    expect(before.position).toBe('fixed')
    expect(after).toEqual({ height: before.height, headingTop: before.headingTop })
  })

  test('ответ, записанный в старой версии, не действует: баннер показывается снова', async ({
    page,
  }) => {
    await open(page, '/')
    await page.evaluate(
      (key) =>
        localStorage.setItem(
          key,
          JSON.stringify({ analytics: true, version: 0, date: '2026-01-01T00:00:00.000Z' }),
        ),
      CONSENT_KEY,
    )
    await reload(page)
    await expect(banner(page)).toBeVisible()
  })

  test('испорченная запись не считается согласием', async ({ page }) => {
    await open(page, '/')
    await page.evaluate((key) => localStorage.setItem(key, '{analytics:true'), CONSENT_KEY)
    await reload(page)
    await expect(banner(page)).toBeVisible()
  })

  test('«Настройки cookie» в подвале открывают баннер снова и позволяют передумать', async ({
    page,
  }) => {
    await open(page, '/')
    await accept(page).click()
    await expect(banner(page)).toBeHidden()

    await settings(page).click()
    await expect(banner(page)).toBeVisible()
    await expect(banner(page)).toBeFocused()
    await expect(banner(page)).toContainText('Сейчас аналитика включена.')

    await reject(page).click()
    await expect(banner(page)).toBeHidden()
    expect((await readChoice(page))?.analytics).toBe(false)
  })

  test('после ответа в повторно открытом баннере фокус возвращается на «Настройки cookie»', async ({
    page,
  }) => {
    await open(page, '/')
    await reject(page).click()

    await settings(page).focus()
    await page.keyboard.press('Enter')
    await expect(banner(page)).toBeFocused()

    await accept(page).focus()
    await page.keyboard.press('Enter')
    await expect(banner(page)).toBeHidden()
    await expect(settings(page)).toBeFocused()
  })

  test('баннер доступен с клавиатуры: сразу после ссылки пропуска, ответ по Enter', async ({
    page,
  }) => {
    await open(page, '/')
    await expect(banner(page)).toBeVisible()

    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Перейти к содержимому' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(banner(page).getByRole('link', { name: 'Подробнее в политике' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(accept(page)).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(reject(page)).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(banner(page)).toBeHidden()
    expect((await readChoice(page))?.analytics).toBe(false)
  })

  test('элемент в фокусе не прячется под баннером', async ({ page }) => {
    await open(page, '/catalog')
    await expect(banner(page)).toBeVisible()

    const link = page.getByRole('main').getByRole('link').last()
    await link.focus()
    await link.scrollIntoViewIfNeeded()

    const [linkBox, bannerBox] = await Promise.all([link.boundingBox(), banner(page).boundingBox()])
    expect(linkBox && bannerBox && linkBox.y + linkBox.height <= bannerBox.y + 1).toBe(true)
  })

  test('в подвале есть «Настройки cookie» и без баннера', async ({ page }) => {
    await open(page, '/')
    await reject(page).click()
    await expect(settings(page)).toBeVisible()
  })
})
