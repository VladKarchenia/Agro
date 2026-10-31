import { describe, expect, it } from 'vitest'
import { buildConsentDocument, CONSENT_VERSION } from '../../app/content/order-consent'
import { type Company, company } from '../../app/data/company'

const filled: Company = {
  ...company,
  legalName: 'ООО «Тест»',
  unp: '123456789',
  address: 'г. Минск, ул. Тестовая, 1',
  email: 'info@example.by',
  phone: '+375 29 000-00-00',
  hostingProvider: 'ООО «Хостинг»',
  retentionPeriod: '3 года',
  policyDate: '01.01.2027',
}

const textOf = (company: Company) =>
  buildConsentDocument(company)
    .flatMap((section) => section.blocks)
    .flatMap((block) => (block.type === 'p' ? [block.text] : block.items))
    .join('\n')

describe('buildConsentDocument', () => {
  it('содержит всё, что нужно сообщить до согласия (ст. 5 Закона 99-З)', () => {
    const ids = buildConsentDocument(filled).map((section) => section.id)
    expect(ids).toEqual(['operator', 'purposes', 'data', 'actions', 'processors', 'term', 'rights'])
  })

  it('права разъяснены отдельным последним разделом со сроками закона', () => {
    const sections = buildConsentDocument(filled)
    const last = sections[sections.length - 1]
    expect(last?.id).toBe('rights')
    const text = textOf(filled)
    expect(text).toContain('15 дней')
    expect(text).toContain('5 рабочих дней')
  })

  it('подставляет данные организации и не оставляет пометок, если всё заполнено', () => {
    const text = textOf(filled)
    expect(text).toContain('ООО «Тест»')
    expect(text).toContain('3 года')
    expect(text).not.toMatch(/\[[^\]]+\]/)
  })

  it('оставляет пометки для незаполненных данных', () => {
    expect(textOf(company)).toContain('[наименование организации]')
  })

  it('версия текста задана, её сохраняют вместе с заявкой', () => {
    expect(CONSENT_VERSION).toMatch(/^\d{4}-\d{2}-/)
  })
})
