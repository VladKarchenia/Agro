import { describe, expect, it } from 'vitest'
import {
  addItem,
  clampQuantity,
  MAX_POSITIONS,
  MAX_QUANTITY,
  parseCart,
  removeItem,
  serializeCart,
  setQuantity,
} from '../../app/utils/cart'

describe('clampQuantity', () => {
  it('ограничивает значение диапазоном 1..MAX_QUANTITY и отбрасывает дробную часть', () => {
    expect(clampQuantity(0)).toBe(1)
    expect(clampQuantity(-5)).toBe(1)
    expect(clampQuantity(2.9)).toBe(2)
    expect(clampQuantity(MAX_QUANTITY + 1)).toBe(MAX_QUANTITY)
  })

  it('для нечисловых значений возвращает 1', () => {
    expect(clampQuantity(Number.NaN)).toBe(1)
    expect(clampQuantity(Number.POSITIVE_INFINITY)).toBe(1)
  })
})

describe('addItem', () => {
  it('добавляет новую позицию', () => {
    expect(addItem([], 'a')).toEqual([{ slug: 'a', quantity: 1 }])
  })

  it('суммирует количество для той же позиции и не меняет исходный массив', () => {
    const original = [{ slug: 'a', quantity: 2 }]
    const result = addItem(original, 'a', 3)
    expect(result).toEqual([{ slug: 'a', quantity: 5 }])
    expect(original).toEqual([{ slug: 'a', quantity: 2 }])
  })

  it('не превышает максимальное количество', () => {
    expect(addItem([{ slug: 'a', quantity: MAX_QUANTITY }], 'a')[0]?.quantity).toBe(MAX_QUANTITY)
  })

  it('не добавляет новые позиции сверх лимита', () => {
    const full = Array.from({ length: MAX_POSITIONS }, (_, i) => ({ slug: `p${i}`, quantity: 1 }))
    expect(addItem(full, 'new')).toHaveLength(MAX_POSITIONS)
    expect(addItem(full, 'p0')[0]?.quantity).toBe(2)
  })
})

describe('setQuantity и removeItem', () => {
  const items = [
    { slug: 'a', quantity: 1 },
    { slug: 'b', quantity: 2 },
  ]

  it('меняет количество только у нужной позиции', () => {
    expect(setQuantity(items, 'b', 7)).toEqual([
      { slug: 'a', quantity: 1 },
      { slug: 'b', quantity: 7 },
    ])
  })

  it('не опускает количество ниже 1', () => {
    expect(setQuantity(items, 'a', 0)[0]?.quantity).toBe(1)
  })

  it('удаляет позицию', () => {
    expect(removeItem(items, 'a')).toEqual([{ slug: 'b', quantity: 2 }])
  })
})

describe('parseCart и serializeCart', () => {
  it('возвращает то, что было сериализовано', () => {
    const items = [
      { slug: 'a', quantity: 2 },
      { slug: 'b', quantity: 1 },
    ]
    expect(parseCart(serializeCart(items))).toEqual(items)
  })

  it('возвращает пустую корзину для пустых и испорченных данных', () => {
    expect(parseCart(null)).toEqual([])
    expect(parseCart('')).toEqual([])
    expect(parseCart('{не json')).toEqual([])
    expect(parseCart('{"slug":"a","quantity":1}')).toEqual([])
  })

  it('пропускает некорректные записи и оставляет корректные', () => {
    const raw = JSON.stringify([
      null,
      'строка',
      { slug: '', quantity: 1 },
      { slug: 'a' },
      { slug: 'b', quantity: '3' },
      { slug: 'ok', quantity: 3 },
    ])
    expect(parseCart(raw)).toEqual([{ slug: 'ok', quantity: 3 }])
  })

  it('склеивает дубли и ограничивает количество', () => {
    const raw = JSON.stringify([
      { slug: 'a', quantity: 2 },
      { slug: 'a', quantity: 3 },
      { slug: 'b', quantity: 99999 },
    ])
    expect(parseCart(raw)).toEqual([
      { slug: 'a', quantity: 5 },
      { slug: 'b', quantity: MAX_QUANTITY },
    ])
  })
})
