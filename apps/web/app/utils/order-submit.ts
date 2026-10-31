import type { OrderPayload } from './order-validation'

export type OrderMode = 'demo' | 'api'

export type SubmitResult = { ok: true; demo: boolean } | { ok: false; message: string }

export type Post = (url: string, body: OrderPayload) => Promise<unknown>

const NETWORK_ERROR = 'Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.'

// 'demo': заявка никуда не уходит (статичное демо без бэкенда).
// 'api': отправка на /api/orders, эндпоинт появится вместе с БД и CMS (этап с Docker).
export async function submitOrder(
  payload: OrderPayload,
  mode: OrderMode,
  post: Post,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<SubmitResult> {
  if (mode === 'demo') {
    await wait(600)
    return { ok: true, demo: true }
  }

  try {
    await post('/api/orders', payload)
    return { ok: true, demo: false }
  } catch {
    return { ok: false, message: NETWORK_ERROR }
  }
}
