import {
  addItem,
  CART_STORAGE_KEY,
  type CartItem,
  parseCart,
  removeItem,
  serializeCart,
  setQuantity,
} from '~/utils/cart'

// Корзина хранится в браузере (localStorage), без сервера и авторизации.
// На сервере и до гидратации она пустая, `ready` показывает, что данные уже прочитаны.
export function useCart() {
  const items = useState<CartItem[]>('cart-items', () => [])
  const ready = useState('cart-ready', () => false)

  const count = computed(() => items.value.length)

  function persist() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, serializeCart(items.value))
    } catch {
      // Хранилище недоступно (приватный режим, переполнение): корзина живёт до перезагрузки
    }
  }

  function hydrate() {
    try {
      items.value = parseCart(localStorage.getItem(CART_STORAGE_KEY))
    } catch {
      items.value = []
    }
    ready.value = true
  }

  function add(slug: string, quantity = 1) {
    items.value = addItem(items.value, slug, quantity)
    persist()
  }

  function update(slug: string, quantity: number) {
    items.value = setQuantity(items.value, slug, quantity)
    persist()
  }

  function remove(slug: string) {
    items.value = removeItem(items.value, slug)
    persist()
  }

  function clear() {
    items.value = []
    persist()
  }

  function quantityOf(slug: string): number {
    return items.value.find((item) => item.slug === slug)?.quantity ?? 0
  }

  return { items, ready, count, hydrate, add, update, remove, clear, quantityOf }
}
