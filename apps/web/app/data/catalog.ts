import { categories } from './categories'
import { avbbshvData } from './subcategories/avbbshv'
import { avvgData } from './subcategories/avvg'
import { pv1Data } from './subcategories/pv-1-puv'
import { pv3Data } from './subcategories/pv-3-pugv'
import { pvsData } from './subcategories/pvs'
import { sipData } from './subcategories/sip'
import { vvgngLsData } from './subcategories/vvgng-ls'
import type { Category, Product, Subcategory, SubcategoryData } from './types'

// Слой доступа к данным каталога. Сейчас данные лежат в коде, позже запросы к CMS.
// Страницы и компоненты работают только через эти функции.
export type {
  Category,
  ContentSection,
  Product,
  ProductSpec,
  ProductVariant,
  Subcategory,
} from './types'

// Порядок подкатегорий в списках задаётся здесь
const data: SubcategoryData[] = [
  avbbshvData,
  avvgData,
  vvgngLsData,
  pv1Data,
  pv3Data,
  pvsData,
  sipData,
]
const subcategories: Subcategory[] = data.map((item) => item.subcategory)
const products: Product[] = data.flatMap((item) => item.products)

export function getCategories(): Category[] {
  return categories
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug)
}

export function getSubcategories(categorySlug: string): Subcategory[] {
  return subcategories.filter((subcategory) => subcategory.categorySlug === categorySlug)
}

export function getSubcategory(categorySlug: string, slug: string): Subcategory | undefined {
  return subcategories.find(
    (subcategory) => subcategory.categorySlug === categorySlug && subcategory.slug === slug,
  )
}

export function getProducts(categorySlug: string, subcategorySlug: string): Product[] {
  return products.filter(
    (product) =>
      product.categorySlug === categorySlug && product.subcategorySlug === subcategorySlug,
  )
}

export function getAllProducts(): Product[] {
  return products
}

/** Товар ищем по slug страницы: он уникален во всём каталоге */
export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug)
}

export interface CartEntry {
  /** То, что лежит в корзине: slug товара или его исполнения */
  slug: string
  /** Название с учётом исполнения, например «Провод ПуВ 1х4 белый» */
  name: string
  product: Product
}

/**
 * Позиция корзины по сохранённому slug. У товара с исполнениями (цвет) в корзину попадает slug
 * исполнения, поэтому сам slug товара без выбранного исполнения позицией не считается.
 */
export function getCartEntry(slug: string): CartEntry | undefined {
  for (const product of products) {
    if (!product.variants) {
      if (product.slug === slug) return { slug, name: product.name, product }
      continue
    }
    const option = product.variants.options.find((variant) => variant.slug === slug)
    if (option) return { slug, name: `${product.name} ${option.label}`, product }
  }
  return undefined
}

export const categoryPath = (category: Pick<Category, 'slug'>) => `/catalog/${category.slug}`

export const subcategoryPath = (subcategory: Pick<Subcategory, 'categorySlug' | 'slug'>) =>
  `/catalog/${subcategory.categorySlug}/${subcategory.slug}`

export const productPath = (product: Pick<Product, 'categorySlug' | 'subcategorySlug' | 'slug'>) =>
  `/catalog/${product.categorySlug}/${product.subcategorySlug}/${product.slug}`
