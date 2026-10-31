import { type MockCategory, mockCategories } from './mock-categories'
import { type MockProduct, mockProducts } from './mock-products'

// Слой доступа к данным каталога. Сейчас моковые данные, позже запросы к CMS.
// Страницы и компоненты работают только через эти функции.
export type Category = MockCategory
export type Product = MockProduct

export function getCategories(): Category[] {
  return mockCategories
}

export function getCategory(slug: string): Category | undefined {
  return mockCategories.find((category) => category.slug === slug)
}

export function getProducts(categorySlug: string): Product[] {
  return mockProducts.filter((product) => product.categorySlug === categorySlug)
}

export function getProduct(slug: string): Product | undefined {
  return mockProducts.find((product) => product.slug === slug)
}
