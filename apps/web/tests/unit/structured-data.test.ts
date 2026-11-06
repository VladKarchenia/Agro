import { describe, expect, it } from 'vitest'
import { type Company, company, contacts } from '../../app/data/company'
import {
  breadcrumbLd,
  collectionLd,
  localBusinessLd,
  organizationId,
  organizationLd,
  productLd,
  websiteLd,
} from '../../app/utils/structured-data'

const SITE = 'https://agroed.by'

describe('organizationLd', () => {
  it('содержит только известные данные: пустые поля не выводятся', () => {
    const ld = organizationLd(SITE, {
      ...company,
      legalName: null,
      unp: null,
      address: null,
      email: null,
      phone: null,
    })
    expect(ld).toMatchObject({ '@type': 'Organization', name: 'АгроЭд', url: `${SITE}/` })
    for (const key of ['legalName', 'taxID', 'telephone', 'email', 'address']) {
      expect(ld).not.toHaveProperty(key)
    }
    expect(JSON.stringify(ld)).not.toContain('[')
  })

  it('реквизиты компании из данных проекта попадают в разметку', () => {
    expect(organizationLd(SITE, company)).toMatchObject({
      legalName: 'Общество с ограниченной ответственностью «Агроэд»',
      taxID: '591753004',
    })
  })

  it('добавляет реквизиты и адрес, когда они заполнены', () => {
    const filled: Company = {
      ...company,
      legalName: 'ООО «Тест»',
      unp: '123456789',
      phone: '+375 29 000-00-00',
      email: 'info@example.by',
      address: 'г. Минск, ул. Тестовая, 1',
    }
    expect(organizationLd(SITE, filled)).toMatchObject({
      legalName: 'ООО «Тест»',
      taxID: '123456789',
      telephone: '+375 29 000-00-00',
      email: 'info@example.by',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'г. Минск, ул. Тестовая, 1',
        addressCountry: 'BY',
      },
    })
  })
})

describe('localBusinessLd', () => {
  it('описывает офис: адрес, телефоны, часы работы и ссылку на карту', () => {
    expect(localBusinessLd(SITE, company, contacts)).toMatchObject({
      '@type': 'LocalBusiness',
      '@id': `${SITE}/contacts#localbusiness`,
      url: `${SITE}/contacts`,
      parentOrganization: { '@id': organizationId(SITE) },
      telephone: ['+375447909310', '+375156266849'],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Минский тракт, 30, офис 7',
        addressLocality: 'Слоним',
        addressCountry: 'BY',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '08:00',
          closes: '17:00',
        },
      ],
      hasMap: contacts.map.orgUrl,
    })
  })

  it('выходные в часы работы не попадают в разметку', () => {
    const ld = localBusinessLd(SITE, company, contacts) as {
      openingHoursSpecification: { dayOfWeek: string[] }[]
    }
    const days = ld.openingHoursSpecification.flatMap((item) => item.dayOfWeek)
    expect(days).not.toContain('Saturday')
    expect(days).not.toContain('Sunday')
  })

  it('не выводит неизвестное: без почты и часов работы этих полей нет, один телефон строкой', () => {
    const [first] = contacts.phones
    const ld = localBusinessLd(SITE, company, {
      ...contacts,
      email: null,
      hours: null,
      phones: first ? [first] : [],
    })
    for (const key of ['email', 'openingHoursSpecification']) {
      expect(ld).not.toHaveProperty(key)
    }
    expect(ld.telephone).toBe('+375447909310')
    for (const key of ['aggregateRating', 'review', 'priceRange']) {
      expect(ld).not.toHaveProperty(key)
    }
  })
})

describe('websiteLd', () => {
  it('ссылается на организацию по идентификатору', () => {
    expect(websiteLd(SITE, 'АгроЭд')).toMatchObject({
      '@type': 'WebSite',
      inLanguage: 'ru-BY',
      publisher: { '@id': organizationId(SITE) },
    })
  })
})

describe('breadcrumbLd', () => {
  it('нумерует позиции с единицы и строит абсолютные адреса', () => {
    const ld = breadcrumbLd(SITE, [
      { name: 'Главная', path: '/' },
      { name: 'Каталог', path: '/catalog/' },
    ]) as { itemListElement: { position: number; item: string }[] }
    expect(ld.itemListElement.map((item) => item.position)).toEqual([1, 2])
    expect(ld.itemListElement.map((item) => item.item)).toEqual([`${SITE}/`, `${SITE}/catalog`])
  })
})

describe('productLd', () => {
  it('не содержит цены, наличия и отзывов, которых у нас нет', () => {
    const ld = productLd(SITE, { name: 'Товар', description: 'Описание', path: '/catalog/a/b' })
    expect(ld).toMatchObject({ '@type': 'Product', name: 'Товар', url: `${SITE}/catalog/a/b` })
    for (const key of [
      'offers',
      'aggregateRating',
      'review',
      'image',
      'sku',
      'brand',
      'additionalProperty',
    ]) {
      expect(ld).not.toHaveProperty(key)
    }
  })

  it('выводит характеристики как additionalProperty и пропускает пустой список', () => {
    const base = { name: 'Товар', description: 'Описание', path: '/catalog/a/b' }
    expect(productLd(SITE, { ...base, properties: [] })).not.toHaveProperty('additionalProperty')
    expect(
      productLd(SITE, { ...base, properties: [{ name: 'Сечение', value: '16 мм²' }] }),
    ).toMatchObject({
      additionalProperty: [{ '@type': 'PropertyValue', name: 'Сечение', value: '16 мм²' }],
    })
  })

  it('добавляет изображение и бренд только когда они переданы, путь превращает в абсолютный адрес', () => {
    const ld = productLd(SITE, {
      name: 'Товар',
      description: 'Описание',
      path: '/catalog/a/b',
      image: '/images/b.jpg',
      brand: 'Бренд',
      sku: 'A-1',
    })
    expect(ld).toMatchObject({
      image: [`${SITE}/images/b.jpg`],
      brand: { '@type': 'Brand', name: 'Бренд' },
      sku: 'A-1',
    })
  })
})

describe('collectionLd', () => {
  it('описывает список и считает элементы', () => {
    const ld = collectionLd(SITE, {
      name: 'Каталог',
      description: 'Описание',
      path: '/catalog',
      items: [
        { name: 'Один', path: '/catalog/one' },
        { name: 'Два', path: '/catalog/two/' },
      ],
    }) as { mainEntity: { numberOfItems: number; itemListElement: { url: string }[] } }
    expect(ld.mainEntity.numberOfItems).toBe(2)
    expect(ld.mainEntity.itemListElement.map((item) => item.url)).toEqual([
      `${SITE}/catalog/one`,
      `${SITE}/catalog/two`,
    ])
  })
})
