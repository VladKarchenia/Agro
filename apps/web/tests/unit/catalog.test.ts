import { describe, expect, it } from 'vitest'
import { getCategories, getCategory, getProduct, getProducts } from '../../app/data/catalog'
import { mockProducts } from '../../app/data/mock-products'

describe('каталог (моковые данные)', () => {
  it('у каждого товара существующая категория и уникальный slug, пригодный для URL', () => {
    const slugs = mockProducts.map((product) => product.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const product of mockProducts) {
      expect(product.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(getCategory(product.categorySlug)).toBeDefined()
    }
  })

  it('в каждой категории есть товары', () => {
    for (const category of getCategories()) {
      expect(getProducts(category.slug).length).toBeGreaterThan(0)
    }
  })

  it('getProduct находит товар по slug и возвращает undefined для неизвестного', () => {
    const [first] = mockProducts
    expect(first && getProduct(first.slug)).toEqual(first)
    expect(getProduct('net-takogo')).toBeUndefined()
  })
})
