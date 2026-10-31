import { describe, expect, it } from 'vitest'
import {
  emptyOrderForm,
  LIMITS,
  normalizePhone,
  type OrderFormInput,
  toOrderPayload,
  validateOrder,
} from '../../app/utils/order-validation'

const valid = (patch: Partial<OrderFormInput> = {}): OrderFormInput => ({
  ...emptyOrderForm(),
  name: 'Иван',
  phone: '+375 29 123-45-67',
  email: 'ivan@example.by',
  consent: true,
  ...patch,
})

describe('normalizePhone', () => {
  it.each([
    ['+375 29 123-45-67', '+375291234567'],
    ['375291234567', '+375291234567'],
    ['8 029 123-45-67', '+375291234567'],
    ['+375 (17) 123-45-67', '+375171234567'],
  ])('приводит %s к %s', (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected)
  })

  it.each(['', 'abc', '+7 912 345-67-89', '+375 29 123-45', '291234567', '+375 29 123-45-678'])(
    'отклоняет %s',
    (raw) => {
      expect(normalizePhone(raw)).toBeNull()
    },
  )
})

describe('validateOrder', () => {
  it('принимает корректную заявку физлица', () => {
    expect(validateOrder(valid())).toEqual({ valid: true, errors: {} })
  })

  it('требует имя, телефон, email и согласие', () => {
    const { valid: ok, errors } = validateOrder(emptyOrderForm())
    expect(ok).toBe(false)
    expect(Object.keys(errors).sort()).toEqual(['consent', 'email', 'name', 'phone'])
  })

  it('не требует поля организации для физлица', () => {
    expect(validateOrder(valid({ organization: '', unp: '' })).errors).toEqual({})
  })

  it('требует название и УНП для организации', () => {
    const { errors } = validateOrder(valid({ customerType: 'organization' }))
    expect(errors.organization).toBeDefined()
    expect(errors.unp).toBeDefined()
  })

  it('проверяет, что УНП состоит из 9 цифр', () => {
    const org = (unp: string) => valid({ customerType: 'organization', organization: 'ООО', unp })
    expect(validateOrder(org('123456789')).valid).toBe(true)
    expect(validateOrder(org('12345678')).errors.unp).toBeDefined()
    expect(validateOrder(org('12345678a')).errors.unp).toBeDefined()
  })

  it('проверяет формат email', () => {
    expect(validateOrder(valid({ email: 'без-собаки' })).errors.email).toBeDefined()
    expect(validateOrder(valid({ email: 'a@b' })).errors.email).toBeDefined()
    expect(validateOrder(valid({ email: ' a@b.by ' })).errors.email).toBeUndefined()
  })

  it('считает пробелы вместо значения пустым полем', () => {
    expect(validateOrder(valid({ name: '   ' })).errors.name).toBeDefined()
  })

  it('ограничивает длину комментария', () => {
    const long = 'я'.repeat(LIMITS.comment + 1)
    expect(validateOrder(valid({ comment: long })).errors.comment).toBeDefined()
    expect(
      validateOrder(valid({ comment: 'я'.repeat(LIMITS.comment) })).errors.comment,
    ).toBeUndefined()
  })

  it('не принимает заявку без согласия', () => {
    expect(validateOrder(valid({ consent: false })).errors.consent).toBeDefined()
  })
})

describe('toOrderPayload', () => {
  const consent = { textVersion: 'v1', at: '2026-01-01T00:00:00.000Z' }
  const items = [{ slug: 'a', quantity: 2 }]

  it('нормализует телефон, обрезает пробелы и опускает пустые необязательные поля', () => {
    const payload = toOrderPayload(
      valid({ name: '  Иван ', city: '  ', comment: '' }),
      items,
      consent,
    )
    expect(payload).toEqual({
      customerType: 'individual',
      name: 'Иван',
      phone: '+375291234567',
      email: 'ivan@example.by',
      items,
      consent: { given: true, ...consent },
    })
  })

  it('добавляет данные организации только для организации', () => {
    const org = valid({
      customerType: 'organization',
      organization: ' ООО Тест ',
      unp: '123456789',
    })
    expect(toOrderPayload(org, items, consent)).toMatchObject({
      organization: 'ООО Тест',
      unp: '123456789',
    })

    const person = valid({ organization: 'остаток', unp: '123456789' })
    const payload = toOrderPayload(person, items, consent)
    expect(payload).not.toHaveProperty('organization')
    expect(payload).not.toHaveProperty('unp')
  })

  it('копирует позиции, а не ссылается на корзину', () => {
    const payload = toOrderPayload(valid(), items, consent)
    expect(payload.items).toEqual(items)
    expect(payload.items[0]).not.toBe(items[0])
  })
})
