export const PHONE_PREFIX = '+375'
export const NATIONAL_LENGTH = 9

/**
 * Достаёт из любой записи номера 9 национальных цифр (без кода страны).
 * Понимает ввод и вставку в видах: 29 123-45-67, +375 29 123-45-67, 375291234567,
 * 8 029 123-45-67, 029 1234567. Белорусские коды операторов и городов не начинаются
 * с 0, 8 и не бывает кода «375», поэтому такие начала однозначно считаются префиксами.
 */
export function extractNationalDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^(375|80|8|0)/, '')
  return digits.slice(0, NATIONAL_LENGTH)
}

/** (29) 123-45-67, по мере ввода формат достраивается: (2, (29), (29) 1, (29) 123-4 */
export function formatNational(digits: string): string {
  if (!digits) return ''
  const code = digits.slice(0, 2)
  const rest = digits.slice(2)

  let out = `(${code}`
  if (code.length === 2) out += ')'
  if (rest) out += ` ${rest.slice(0, 3)}`
  if (rest.length > 3) out += `-${rest.slice(3, 5)}`
  if (rest.length > 5) out += `-${rest.slice(5, 7)}`
  return out
}

/** Значение для формы: «+375 (29) 123-45-67» или пустая строка, если цифр нет */
export function toFullPhone(digits: string): string {
  return digits ? `${PHONE_PREFIX} ${formatNational(digits)}` : ''
}

export function countDigits(text: string): number {
  return text.replace(/\D/g, '').length
}

/** Позиция курсора сразу после n-й цифры в отформатированной строке (или в конце, если цифр не больше n) */
export function caretAfterDigits(formatted: string, n: number): number {
  if (n <= 0) return 0
  let seen = 0
  for (let index = 0; index < formatted.length; index++) {
    if (/\d/.test(formatted[index] ?? '')) seen++
    if (seen === n) {
      // Если дальше только разделители, курсор ставим в конец: следующая цифра продолжит ввод
      return /\d/.test(formatted.slice(index + 1)) ? index + 1 : formatted.length
    }
  }
  return formatted.length
}

export interface PhoneEdit {
  digits: string
  /** Сколько цифр должно остаться слева от курсора */
  caretDigits: number
}

/**
 * Применяет правку поля к цифрам. Если человек стёр разделитель (скобку, пробел, дефис),
 * число цифр не меняется и поле «залипло» бы, поэтому вместо разделителя удаляем цифру перед курсором.
 */
export function applyPhoneEdit(previous: string, nextRaw: string, caret: number): PhoneEdit {
  let digits = extractNationalDigits(nextRaw)
  let caretDigits = Math.min(countDigits(nextRaw.slice(0, caret)), digits.length)

  const deletedSeparatorOnly =
    nextRaw.length < previous.length && digits === extractNationalDigits(previous)
  if (deletedSeparatorOnly && caretDigits > 0) {
    digits = digits.slice(0, caretDigits - 1) + digits.slice(caretDigits)
    caretDigits -= 1
  }

  return { digits, caretDigits }
}
