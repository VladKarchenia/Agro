import type { CartItem } from './cart'

export type CustomerType = 'individual' | 'organization'

export interface OrderFormInput {
  customerType: CustomerType
  name: string
  phone: string
  email: string
  organization: string
  unp: string
  city: string
  comment: string
  consent: boolean
  /** Поле-ловушка для ботов, у человека всегда пустое */
  website: string
}

export type OrderField = keyof OrderFormInput
export type OrderErrors = Partial<Record<OrderField, string>>

export interface OrderPayload {
  customerType: CustomerType
  name: string
  phone: string
  email: string
  organization?: string
  unp?: string
  city?: string
  comment?: string
  items: CartItem[]
  consent: { given: true; textVersion: string; at: string }
}

export const LIMITS = {
  name: 100,
  email: 254,
  organization: 200,
  city: 200,
  comment: 1000,
} as const

export const FIELD_ORDER: OrderField[] = [
  'name',
  'phone',
  'email',
  'organization',
  'unp',
  'city',
  'comment',
  'consent',
]

export function emptyOrderForm(): OrderFormInput {
  return {
    customerType: 'individual',
    name: '',
    phone: '',
    email: '',
    organization: '',
    unp: '',
    city: '',
    comment: '',
    consent: false,
    website: '',
  }
}

/** Приводит белорусский номер к виду +375XXXXXXXXX или возвращает null, если номер не подходит */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('80') && digits.length === 11) digits = `375${digits.slice(2)}`
  return /^375\d{9}$/.test(digits) ? `+${digits}` : null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const UNP_RE = /^\d{9}$/

export function validateOrder(input: OrderFormInput): { valid: boolean; errors: OrderErrors } {
  const errors: OrderErrors = {}
  const name = input.name.trim()
  const email = input.email.trim()

  if (!name) errors.name = 'Укажите имя'
  else if (name.length < 2) errors.name = 'Имя слишком короткое'
  else if (name.length > LIMITS.name) errors.name = 'Имя слишком длинное'

  if (!input.phone.trim()) errors.phone = 'Укажите телефон'
  else if (!normalizePhone(input.phone))
    errors.phone = 'Введите номер полностью: +375 (29) 123-45-67'

  if (!email) errors.email = 'Укажите email'
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email)) {
    errors.email = 'Проверьте адрес электронной почты'
  }

  if (input.customerType === 'organization') {
    const organization = input.organization.trim()
    if (!organization) errors.organization = 'Укажите название организации'
    else if (organization.length > LIMITS.organization) {
      errors.organization = 'Название слишком длинное'
    }

    const unp = input.unp.trim()
    if (!unp) errors.unp = 'Укажите УНП'
    else if (!UNP_RE.test(unp)) errors.unp = 'УНП состоит из 9 цифр'
  }

  if (input.city.trim().length > LIMITS.city) errors.city = 'Слишком длинный текст'
  if (input.comment.trim().length > LIMITS.comment) {
    errors.comment = `Не больше ${LIMITS.comment} символов`
  }

  if (!input.consent) errors.consent = 'Нужно согласие на обработку персональных данных'

  return { valid: Object.keys(errors).length === 0, errors }
}

/** Собирает данные для отправки. Вызывать только для прошедшей проверку формы */
export function toOrderPayload(
  input: OrderFormInput,
  items: readonly CartItem[],
  consent: { textVersion: string; at: string },
): OrderPayload {
  const payload: OrderPayload = {
    customerType: input.customerType,
    name: input.name.trim(),
    phone: normalizePhone(input.phone) ?? input.phone.trim(),
    email: input.email.trim(),
    items: items.map((item) => ({ ...item })),
    consent: { given: true, ...consent },
  }

  if (input.customerType === 'organization') {
    payload.organization = input.organization.trim()
    payload.unp = input.unp.trim()
  }
  const city = input.city.trim()
  if (city) payload.city = city
  const comment = input.comment.trim()
  if (comment) payload.comment = comment

  return payload
}
