import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { open } from './helpers'

// Свой скроллбар включается только для мыши. На мобильном (касания) остаётся системная прокрутка.
const THUMB = '.app-scrollbar__thumb'

const scrollTop = (page: Page) => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)
const maxScroll = (page: Page) =>
  page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement
    return root.scrollHeight - root.clientHeight
  })
const thumbBox = async (page: Page) => {
  const box = await page.locator(THUMB).boundingBox()
  if (!box) throw new Error('ползунок не найден')
  return box
}

test.describe('Скроллбар: мышь', () => {
  test.skip(({ isMobile }) => isMobile, 'свой скроллбар только для мыши')

  test('на длинной странице ползунок виден, на короткой его нет', async ({ page }) => {
    await open(page, '/catalog/uborka')
    expect(await maxScroll(page)).toBeGreaterThan(0)
    await expect(page.locator(THUMB)).toBeVisible()

    await open(page, '/about')
    expect(await maxScroll(page)).toBeLessThanOrEqual(1)
    await expect(page.locator(THUMB)).toHaveCount(0)
  })

  test('системная полоса спрятана: страница занимает всю ширину, фон шапки доходит до края', async ({
    page,
  }) => {
    for (const path of ['/about', '/catalog/uborka']) {
      await open(page, path)
      const sizes = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.clientWidth,
        header: document.querySelector('header')?.getBoundingClientRect().right ?? 0,
        footer: document.querySelector('footer')?.getBoundingClientRect().right ?? 0,
      }))
      expect(sizes.document, path).toBe(sizes.viewport)
      expect(Math.round(sizes.header), path).toBe(sizes.viewport)
      expect(Math.round(sizes.footer), path).toBe(sizes.viewport)
    }
  })

  test('ползунок прижат к правому краю и не выходит за окно', async ({ page }) => {
    await open(page, '/catalog/uborka')
    const box = await thumbBox(page)
    const viewport = page.viewportSize()
    expect(box.x + box.width).toBeLessThanOrEqual(viewport?.width ?? 0)
    expect(box.x + box.width).toBeGreaterThan((viewport?.width ?? 0) - 16)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport?.height ?? 0)
  })

  test('колесо мыши двигает страницу, а ползунок следует за ней до самого низа', async ({
    page,
  }) => {
    await open(page, '/catalog/uborka')
    const before = await thumbBox(page)

    await page.mouse.move(400, 400)
    await page.mouse.wheel(0, 200)
    await expect.poll(async () => (await thumbBox(page)).y).toBeGreaterThan(before.y)

    await page.mouse.wheel(0, 5000)
    await expect.poll(() => scrollTop(page)).toBe(await maxScroll(page))
    const end = await thumbBox(page)
    const viewport = page.viewportSize()
    expect(end.y + end.height).toBeGreaterThan((viewport?.height ?? 0) - 4)
  })

  test('перетаскивание ползунка прокручивает страницу', async ({ page }) => {
    await open(page, '/catalog/uborka')
    const box = await thumbBox(page)
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2

    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + 5000, { steps: 5 })
    await page.mouse.up()

    await expect.poll(() => scrollTop(page)).toBeGreaterThanOrEqual((await maxScroll(page)) - 2)
  })

  test('щелчок по свободной зоне под ползунком прокручивает на экран вниз', async ({ page }) => {
    await open(page, '/catalog/uborka')
    const box = await thumbBox(page)
    const viewport = page.viewportSize()
    const clickY = box.y + box.height + 20
    expect(clickY).toBeLessThan(viewport?.height ?? 0)

    await page.mouse.click(box.x + box.width / 2, clickY)
    await expect.poll(() => scrollTop(page)).toBeGreaterThan(0)
  })

  test('клавиатура по-прежнему прокручивает страницу (End, Home, Space)', async ({ page }) => {
    await open(page, '/catalog/uborka')
    await page.mouse.click(10, 300)

    await page.keyboard.press('End')
    await expect.poll(() => scrollTop(page)).toBe(await maxScroll(page))
    await page.keyboard.press('Home')
    await expect.poll(() => scrollTop(page)).toBe(0)
    await page.keyboard.press('Space')
    await expect.poll(() => scrollTop(page)).toBeGreaterThan(0)
  })

  test('ползунок скрыт от скринридера и не берёт фокус', async ({ page }) => {
    await open(page, '/catalog/uborka')
    const rail = page.locator('.app-scrollbar')
    await expect(rail).toHaveAttribute('aria-hidden', 'true')
    expect(await page.locator(`${THUMB}[tabindex]`).count()).toBe(0)
  })

  test('при переходе на короткую страницу ползунок исчезает, на длинную появляется', async ({
    page,
  }) => {
    await open(page, '/catalog/uborka')
    await expect(page.locator(THUMB)).toBeVisible()

    await page.getByRole('banner').getByRole('link', { name: 'О компании' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(page.locator(THUMB)).toHaveCount(0)

    await page.goBack()
    await expect(page.locator(THUMB)).toBeVisible()
  })
})

test.describe('Скроллбар: касание', () => {
  test('на мобильном свой скроллбар не включается, прокрутка системная', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop', 'только для мобильного')
    await open(page, '/catalog/uborka')

    const enabled = await page.evaluate(() =>
      document.documentElement.classList.contains('has-custom-scrollbar'),
    )
    expect(enabled).toBe(false)
    await expect(page.locator('.app-scrollbar')).toHaveCount(0)
    expect(await maxScroll(page)).toBeGreaterThan(0)
  })
})
