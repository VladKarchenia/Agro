import { describe, expect, it } from 'vitest'
import {
  applyPhoneEdit,
  caretAfterDigits,
  extractNationalDigits,
  formatNational,
  toFullPhone,
} from '../../app/utils/phone'

describe('extractNationalDigits', () => {
  it.each([
    ['291234567', '291234567'],
    ['(29) 123-45-67', '291234567'],
    ['+375 (29) 123-45-67', '291234567'],
    ['375291234567', '291234567'],
    ['8 029 123-45-67', '291234567'],
    ['80291234567', '291234567'],
    ['029 1234567', '291234567'],
    ['+375 (17) 123-45-67', '171234567'],
    ['+375 (152) 23-45-67', '152234567'],
  ])('%s → %s', (raw, expected) => {
    expect(extractNationalDigits(raw)).toBe(expected)
  })

  it('обрезает лишние цифры и игнорирует буквы', () => {
    expect(extractNationalDigits('29 123-45-67 доб. 123')).toBe('291234567')
    expect(extractNationalDigits('abc')).toBe('')
  })

  it('не принимает за префикс начало реального кода оператора', () => {
    expect(extractNationalDigits('33')).toBe('33')
    expect(extractNationalDigits('44')).toBe('44')
    expect(extractNationalDigits('25')).toBe('25')
  })
})

describe('formatNational и toFullPhone', () => {
  it.each([
    ['', ''],
    ['2', '(2'],
    ['29', '(29)'],
    ['291', '(29) 1'],
    ['291234', '(29) 123-4'],
    ['2912345', '(29) 123-45'],
    ['29123456', '(29) 123-45-6'],
    ['291234567', '(29) 123-45-67'],
  ])('%j → %s', (digits, expected) => {
    expect(formatNational(digits)).toBe(expected)
  })

  it('добавляет код страны, а для пустого ввода возвращает пустую строку', () => {
    expect(toFullPhone('291234567')).toBe('+375 (29) 123-45-67')
    expect(toFullPhone('')).toBe('')
  })

  it('результат форматирования снова разбирается в те же цифры', () => {
    const full = toFullPhone('291234567')
    expect(extractNationalDigits(full)).toBe('291234567')
  })
})

describe('caretAfterDigits', () => {
  it('ставит курсор сразу после нужной цифры', () => {
    expect(caretAfterDigits('(29) 123-45-67', 1)).toBe(2)
    expect(caretAfterDigits('(29) 123-45-67', 3)).toBe(6)
  })

  it('в конце строки курсор остаётся в конце, включая автоматические разделители', () => {
    expect(caretAfterDigits('(29)', 2)).toBe(4)
    expect(caretAfterDigits('(29) 123-45-67', 9)).toBe(14)
  })

  it('для нуля цифр и пустой строки возвращает 0', () => {
    expect(caretAfterDigits('(29)', 0)).toBe(0)
    expect(caretAfterDigits('', 5)).toBe(0)
  })
})

describe('applyPhoneEdit', () => {
  it('обычный ввод цифры в конец', () => {
    expect(applyPhoneEdit('(29)', '(29)1', 5)).toEqual({ digits: '291', caretDigits: 3 })
  })

  it('вставка полного номера с кодом страны', () => {
    const result = applyPhoneEdit('', '+375 29 123-45-67', 17)
    expect(result.digits).toBe('291234567')
  })

  it('удаление разделителя Backspace удаляет цифру перед ним, а не залипает', () => {
    // было «(29) 1», курсор после пробела, нажали Backspace и пробел исчез: «(29)1».
    // Вместо разделителя удаляется предшествующая цифра «9», остаётся «21»
    const result = applyPhoneEdit('(29) 1', '(29)1', 4)
    expect(result).toEqual({ digits: '21', caretDigits: 1 })
  })

  it('удаление последней цифры работает как обычно', () => {
    expect(applyPhoneEdit('(29) 1', '(29) ', 5)).toEqual({ digits: '29', caretDigits: 2 })
  })

  it('удаление цифры в середине сохраняет позицию курсора', () => {
    // было «(29) 123», стёрли «2» из «(29) 123» → «(29) 13»
    const result = applyPhoneEdit('(29) 123', '(29) 13', 5)
    expect(result.digits).toBe('2913')
    expect(result.caretDigits).toBe(2)
  })
})
