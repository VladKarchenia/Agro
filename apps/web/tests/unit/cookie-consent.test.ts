import { describe, expect, it } from 'vitest'
import {
  CONSENT_VERSION,
  createChoice,
  parseChoice,
  serializeChoice,
} from '../../app/utils/cookie-consent'

describe('createChoice', () => {
  it('записывает выбор, версию и дату', () => {
    const choice = createChoice(true, new Date('2026-11-07T10:00:00.000Z'))
    expect(choice).toEqual({
      analytics: true,
      version: CONSENT_VERSION,
      date: '2026-11-07T10:00:00.000Z',
    })
  })
})

describe('parseChoice', () => {
  it('читает записанный выбор: и согласие, и отказ', () => {
    for (const analytics of [true, false]) {
      const choice = createChoice(analytics)
      expect(parseChoice(serializeChoice(choice))).toEqual(choice)
    }
  })

  it('пустая запись означает «выбора нет»', () => {
    expect(parseChoice(null)).toBeNull()
    expect(parseChoice(undefined)).toBeNull()
    expect(parseChoice('')).toBeNull()
  })

  it('испорченный JSON не считается согласием', () => {
    expect(parseChoice('{analytics:true')).toBeNull()
    expect(parseChoice('true')).toBeNull()
    expect(parseChoice('null')).toBeNull()
    expect(parseChoice('[]')).toBeNull()
  })

  it('поля неверного типа не считаются согласием', () => {
    const date = '2026-11-07T10:00:00.000Z'
    expect(
      parseChoice(JSON.stringify({ analytics: 'true', version: CONSENT_VERSION, date })),
    ).toBeNull()
    expect(parseChoice(JSON.stringify({ analytics: 1, version: CONSENT_VERSION, date }))).toBeNull()
    expect(parseChoice(JSON.stringify({ analytics: true, version: CONSENT_VERSION }))).toBeNull()
    expect(
      parseChoice(JSON.stringify({ analytics: true, version: CONSENT_VERSION, date: 'вчера' })),
    ).toBeNull()
  })

  it('выбор другой версии не действует, баннер нужно показать заново', () => {
    const date = '2026-11-07T10:00:00.000Z'
    expect(
      parseChoice(JSON.stringify({ analytics: true, version: CONSENT_VERSION - 1, date })),
    ).toBeNull()
    expect(
      parseChoice(JSON.stringify({ analytics: true, version: CONSENT_VERSION + 1, date })),
    ).toBeNull()
  })

  it('лишние поля отбрасываются', () => {
    const date = '2026-11-07T10:00:00.000Z'
    const raw = JSON.stringify({ analytics: false, version: CONSENT_VERSION, date, extra: 1 })
    expect(parseChoice(raw)).toEqual({ analytics: false, version: CONSENT_VERSION, date })
  })
})
