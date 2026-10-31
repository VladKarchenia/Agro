export interface CartItem {
  slug: string
  quantity: number
}

export const CART_STORAGE_KEY = 'agroed:cart:v1'
export const MAX_QUANTITY = 9999
export const MAX_POSITIONS = 100

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(value)))
}

export function addItem(items: readonly CartItem[], slug: string, quantity = 1): CartItem[] {
  const amount = clampQuantity(quantity)
  const existing = items.find((item) => item.slug === slug)

  if (existing) {
    return items.map((item) =>
      item.slug === slug ? { ...item, quantity: clampQuantity(item.quantity + amount) } : item,
    )
  }
  if (items.length >= MAX_POSITIONS) return [...items]
  return [...items, { slug, quantity: amount }]
}

export function setQuantity(
  items: readonly CartItem[],
  slug: string,
  quantity: number,
): CartItem[] {
  return items.map((item) =>
    item.slug === slug ? { ...item, quantity: clampQuantity(quantity) } : item,
  )
}

export function removeItem(items: readonly CartItem[], slug: string): CartItem[] {
  return items.filter((item) => item.slug !== slug)
}

export function serializeCart(items: readonly CartItem[]): string {
  return JSON.stringify(items)
}

// Данные из localStorage считаем недоверенными: пользователь или старая версия могли их испортить
export function parseCart(raw: string | null | undefined): CartItem[] {
  if (!raw) return []

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(data)) return []

  let items: CartItem[] = []
  for (const entry of data) {
    if (typeof entry !== 'object' || entry === null) continue
    const { slug, quantity } = entry as Record<string, unknown>
    if (typeof slug !== 'string' || slug.trim() === '' || typeof quantity !== 'number') continue
    items = addItem(items, slug, quantity)
  }
  return items
}
