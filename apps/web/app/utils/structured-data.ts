import type { Company } from '../data/company'
import { absoluteUrl, normalizePath } from './seo'

export type JsonLd = Record<string, unknown>

const CONTEXT = 'https://schema.org'

/** Убирает пустые значения: в разметку попадает только то, что реально известно */
function compact<T extends JsonLd>(data: T): JsonLd {
  const result: JsonLd = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue
    result[key] = value
  }
  return result
}

const rootUrl = (siteUrl: string) => absoluteUrl(siteUrl, '/')
export const organizationId = (siteUrl: string) => `${rootUrl(siteUrl)}#organization`
export const websiteId = (siteUrl: string) => `${rootUrl(siteUrl)}#website`

export function organizationLd(siteUrl: string, company: Company): JsonLd {
  return compact({
    '@context': CONTEXT,
    '@type': 'Organization',
    '@id': organizationId(siteUrl),
    name: company.brand,
    legalName: company.legalName ?? undefined,
    url: rootUrl(siteUrl),
    logo: absoluteUrl(siteUrl, '/logo.svg'),
    taxID: company.unp ?? undefined,
    telephone: company.phone ?? undefined,
    email: company.email ?? undefined,
    address: company.address
      ? { '@type': 'PostalAddress', streetAddress: company.address, addressCountry: 'BY' }
      : undefined,
    areaServed: { '@type': 'Country', name: 'Беларусь' },
  })
}

export function websiteLd(siteUrl: string, name: string): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    '@id': websiteId(siteUrl),
    url: rootUrl(siteUrl),
    name,
    inLanguage: 'ru-BY',
    publisher: { '@id': organizationId(siteUrl) },
  }
}

export interface Crumb {
  name: string
  path: string
}

export function breadcrumbLd(siteUrl: string, crumbs: Crumb[]): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(siteUrl, crumb.path),
    })),
  }
}

export interface ProductLdInput {
  name: string
  description: string
  path: string
  category?: string
  sku?: string
  brand?: string
  /** Адрес реального фото товара (путь или абсолютный URL). Без реального фото поле не заполняем */
  image?: string
}

// Цену, наличие и отзывы не выдумываем: Product без offers корректен, но не даёт расширенного сниппета
export function productLd(siteUrl: string, input: ProductLdInput): JsonLd {
  const url = absoluteUrl(siteUrl, input.path)
  return compact({
    '@context': CONTEXT,
    '@type': 'Product',
    '@id': `${url}#product`,
    name: input.name,
    description: input.description,
    url,
    category: input.category,
    sku: input.sku,
    brand: input.brand ? { '@type': 'Brand', name: input.brand } : undefined,
    image: input.image
      ? /^https?:\/\//.test(input.image)
        ? input.image
        : absoluteUrl(siteUrl, input.image)
      : undefined,
  })
}

export interface CollectionLdInput {
  name: string
  description: string
  path: string
  items: Crumb[]
}

export function collectionLd(siteUrl: string, input: CollectionLdInput): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'CollectionPage',
    '@id': `${absoluteUrl(siteUrl, input.path)}#collection`,
    name: input.name,
    description: input.description,
    url: absoluteUrl(siteUrl, input.path),
    isPartOf: { '@id': websiteId(siteUrl) },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: absoluteUrl(siteUrl, normalizePath(item.path)),
      })),
    },
  }
}
