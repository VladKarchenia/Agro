import { describe, expect, it, vi } from 'vitest'
import { submitOrder } from '../../app/utils/order-submit'
import { emptyOrderForm, toOrderPayload } from '../../app/utils/order-validation'

const payload = toOrderPayload(
  { ...emptyOrderForm(), name: 'Иван', phone: '+375291234567', email: 'a@b.by', consent: true },
  [{ slug: 'a', quantity: 1 }],
  { textVersion: 'v1', at: '2026-01-01T00:00:00.000Z' },
)
const noWait = () => Promise.resolve()

describe('submitOrder', () => {
  it('в демо-режиме ничего не отправляет и сообщает об этом', async () => {
    const post = vi.fn()
    const result = await submitOrder(payload, 'demo', post, noWait)
    expect(result).toEqual({ ok: true, demo: true })
    expect(post).not.toHaveBeenCalled()
  })

  it('в режиме api отправляет заявку на /api/orders', async () => {
    const post = vi.fn().mockResolvedValue({})
    const result = await submitOrder(payload, 'api', post, noWait)
    expect(result).toEqual({ ok: true, demo: false })
    expect(post).toHaveBeenCalledWith('/api/orders', payload)
  })

  it('при ошибке сети возвращает понятное сообщение, а не бросает исключение', async () => {
    const post = vi.fn().mockRejectedValue(new Error('network'))
    const result = await submitOrder(payload, 'api', post, noWait)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(/Не удалось отправить/)
  })
})
