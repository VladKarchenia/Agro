import { describe, expect, it } from 'vitest'
import { type Company, company } from '../../app/data/company'
import {
  breadcrumbLd,
  collectionLd,
  organizationId,
  organizationLd,
  productLd,
  websiteLd,
} from '../../app/utils/structured-data'

const SITE = 'https://agroed.by'

describe('organizationLd', () => {
  it('содержит только известные данные: пустые поля не выводятся', () => {
    const ld = organizationLd(SITE, company)
    expect(ld).toMatchObject({ '@type': 'Organization', name: 'АгроЭд', url: `${SITE}/` })
    for (const key of ['legalName', 'taxID', 'telephone', 'email', 'address']) {
      expect(ld).not.toHaveProperty(key)
    }
    expect(JSON.stringify(ld)).not.toContain('[')
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
    for (const key of ['offers', 'aggregateRating', 'review', 'image', 'sku', 'brand']) {
      expect(ld).not.toHaveProperty(key)
    }
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
      image: `${SITE}/images/b.jpg`,
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
