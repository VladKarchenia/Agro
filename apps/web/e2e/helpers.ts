import type { Locator, Page } from '@playwright/test'

const CART_KEY = 'agroed:cart:v1'

export interface StoredItem {
  slug: string
  quantity: number
}

/** Открывает страницу и ждёт, пока Vue подключит обработчики (метка data-hydrated) */
export async function open(page: Page, path: string) {
  await page.goto(path)
  await page.locator('html[data-hydrated="true"]').waitFor({ state: 'attached' })
}

export async function reload(page: Page) {
  await page.reload()
  await page.locator('html[data-hydrated="true"]').waitFor({ state: 'attached' })
}

export function readCart(page: Page): Promise<StoredItem[]> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]'), CART_KEY)
}

/** Кладёт корзину в localStorage и открывает страницу: так же, как если бы товары добавили раньше */
export async function openWithCart(page: Page, items: StoredItem[], path = '/cart') {
  await page.goto('/')
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
    CART_KEY,
    JSON.stringify(items),
  ] as const)
  await open(page, path)
}

export function productCard(page: Page, name: string): Locator {
  return page.getByRole('article').filter({ hasText: name })
}

export function cartLink(page: Page): Locator {
  return page.getByRole('banner').getByRole('link', { name: /^Корзина/ })
}

export interface OrderValues {
  name?: string
  phone?: string
  email?: string
  consent?: boolean
}

/** Заполняет обязательные поля формы заявки физлица корректными значениями */
export async function fillValidOrder(page: Page, values: OrderValues = {}) {
  await page.getByLabel('Имя').fill(values.name ?? 'Иван')
  await page.getByLabel(/^Телефон/).fill(values.phone ?? '29 123-45-67')
  await page.getByLabel('Email').fill(values.email ?? 'ivan@example.by')
  if (values.consent !== false) await page.getByRole('checkbox').check()
}
