import { describe, expect, it } from 'vitest'
import { buildPrivacyPolicy } from '../../app/content/privacy-policy'
import { type Company, company, missingCompanyFields } from '../../app/data/company'

const filled: Company = {
  brand: 'АгроЭд',
  siteUrl: 'agroed.by',
  legalName: 'ООО «Тест»',
  unp: '123456789',
  address: 'г. Минск, ул. Тестовая, 1',
  email: 'info@example.by',
  phone: '+375 29 000-00-00',
  hostingProvider: 'ООО «Хостинг»',
  retentionPeriod: '3 года',
  policyDate: '01.01.2027',
}

const textOf = (sections: ReturnType<typeof buildPrivacyPolicy>) =>
  sections
    .flatMap((section) => section.blocks)
    .flatMap((block) => (block.type === 'p' ? [block.text] : block.items))
    .join('\n')

describe('buildPrivacyPolicy', () => {
  it('содержит обязательные разделы с уникальными id', () => {
    const sections = buildPrivacyPolicy(filled)
    const ids = sections.map((section) => section.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(
      expect.arrayContaining(['general', 'purposes', 'cross-border', 'rights', 'cookies']),
    )
  })

  it('подставляет данные организации и не оставляет пометок, если всё заполнено', () => {
    const text = textOf(buildPrivacyPolicy(filled))
    expect(text).toContain('ООО «Тест»')
    expect(text).toContain('123456789')
    expect(text).not.toMatch(/\[[^\]]+\]/)
  })

  it('оставляет пометки в квадратных скобках для незаполненных полей', () => {
    const text = textOf(buildPrivacyPolicy(company))
    expect(text).toContain('[наименование организации]')
    expect(text).toContain('[УНП]')
  })

  it('указывает сроки реализации прав из Закона 99-З', () => {
    const text = textOf(buildPrivacyPolicy(filled))
    expect(text).toContain('15 дней')
    expect(text).toContain('5 рабочих дней')
  })
})

describe('missingCompanyFields', () => {
  it('возвращает пустой список для заполненных данных', () => {
    expect(missingCompanyFields(filled)).toEqual([])
  })

  it('перечисляет незаполненные поля', () => {
    expect(missingCompanyFields(company)).toContain('legalName')
    expect(missingCompanyFields(company)).not.toContain('brand')
  })
})
