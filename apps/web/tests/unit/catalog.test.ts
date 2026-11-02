import { describe, expect, it } from 'vitest'
import {
  categoryPath,
  getAllProducts,
  getCartEntry,
  getCategories,
  getCategory,
  getProduct,
  getProducts,
  getSubcategories,
  getSubcategory,
  productPath,
  subcategoryPath,
} from '../../app/data/catalog'
import { getCatalogPaths } from '../../app/seo/entries'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const products = getAllProducts()

describe('каталог', () => {
  it('slug товаров и их исполнений уникальны и пригодны для URL', () => {
    const slugs = products.flatMap((product) => [
      product.slug,
      ...(product.variants?.options.map((option) => option.slug) ?? []),
    ])
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(SLUG)
  })

  it('у каждого товара существующие категория и подкатегория', () => {
    for (const product of products) {
      expect(getCategory(product.categorySlug), product.slug).toBeDefined()
      expect(
        getSubcategory(product.categorySlug, product.subcategorySlug),
        product.slug,
      ).toBeDefined()
    }
  })

  it('в каждой категории есть подкатегории, а в каждой подкатегории товары', () => {
    for (const category of getCategories()) {
      const subcategories = getSubcategories(category.slug)
      expect(subcategories.length, category.slug).toBeGreaterThan(0)
      for (const subcategory of subcategories) {
        expect(
          getProducts(category.slug, subcategory.slug).length,
          subcategory.slug,
        ).toBeGreaterThan(0)
      }
    }
  })

  it('getProduct находит товар по slug и возвращает undefined для неизвестного', () => {
    const [first] = products
    expect(first && getProduct(first.slug)).toEqual(first)
    expect(getProduct('net-takogo')).toBeUndefined()
  })

  it('адреса без завершающего слеша и без повторов', () => {
    const paths = getCatalogPaths()
    expect(new Set(paths).size).toBe(paths.length)
    for (const path of paths) expect(path).not.toMatch(/\/$/)
    expect(categoryPath({ slug: 'a' })).toBe('/catalog/a')
    expect(subcategoryPath({ categorySlug: 'a', slug: 'b' })).toBe('/catalog/a/b')
    expect(productPath({ categorySlug: 'a', subcategorySlug: 'b', slug: 'c' })).toBe(
      '/catalog/a/b/c',
    )
  })
})

describe('позиции корзины и исполнения (цвета)', () => {
  const withColors = products.find((product) => product.variants)

  it('у проводов ПуВ и ПуГВ пять цветов на выбор', () => {
    const colored = products.filter((product) => product.variants)
    expect(colored.length).toBeGreaterThan(0)
    for (const product of colored) {
      expect(
        product.variants?.options.map((option) => option.label),
        product.slug,
      ).toEqual(['белый', 'синий', 'красный', 'зелёный', 'жёлто-зелёный'])
    }
  })

  it('исполнение находится по своему slug и получает название с цветом', () => {
    const option = withColors?.variants?.options[1]
    expect(option).toBeDefined()
    const entry = option && getCartEntry(option.slug)
    expect(entry?.name).toBe(`${withColors?.name} ${option?.label}`)
    expect(entry?.product).toBe(withColors)
  })

  it('товар с исполнениями без выбранного цвета позицией корзины не считается', () => {
    expect(withColors && getCartEntry(withColors.slug)).toBeUndefined()
  })

  it('обычный товар находится по своему slug, неизвестный slug даёт undefined', () => {
    const plain = products.find((product) => !product.variants)
    expect(plain && getCartEntry(plain.slug)?.name).toBe(plain?.name)
    expect(getCartEntry('net-takogo')).toBeUndefined()
  })
})

describe('наполнение товаров', () => {
  it('у товара есть описание, характеристики без повторов и источник данных', () => {
    for (const product of products) {
      expect(product.description.length, product.slug).toBeGreaterThan(0)
      const names = product.specs.map((spec) => spec.name)
      expect(new Set(names).size, product.slug).toBe(names.length)
      for (const spec of product.specs) {
        expect(spec.value.trim(), `${product.slug}: ${spec.name}`).not.toBe('')
      }
      expect(product.sourceUrl, product.slug).toMatch(/^https:\/\//)
    }
  })

  it('названия товаров уникальны', () => {
    const names = products.map((product) => product.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('цену не выдумываем: пока везде «по запросу»', () => {
    for (const product of products) expect(product.price, product.slug).toBeNull()
  })

  it('мета-описание страницы товара укладывается в 50–170 знаков', () => {
    for (const product of products) {
      const description = `${product.name}. ${product.summary} Цена по запросу, заказ через заявку на сайте.`
      expect(description.length, product.slug).toBeGreaterThanOrEqual(50)
      expect(description.length, product.slug).toBeLessThanOrEqual(170)
    }
  })

  it('мета-описания товаров не повторяются', () => {
    const descriptions = products.map((product) => `${product.name}. ${product.summary}`)
    expect(new Set(descriptions).size).toBe(descriptions.length)
  })

  it('в текстах нет опечаток вроде «5 жилы» и незаполненных значений', () => {
    for (const product of products) {
      const text = [
        product.name,
        product.summary,
        ...product.description,
        ...product.specs.map((spec) => `${spec.name} ${spec.value}`),
      ].join(' ')
      expect(text, product.slug).not.toMatch(/[2-4] жил(?!ы)|[5-9] жилы|__|undefined|NaN/)
    }
  })

  it('если производитель не назван, бренда и страны в товаре нет', () => {
    for (const product of products) {
      const hasManufacturer = product.specs.some((spec) => spec.name === 'Производитель')
      expect(Boolean(product.brand), product.slug).toBe(hasManufacturer)
    }
  })

  it('у подкатегорий заполнены SEO-поля и размер title укладывается в норму', () => {
    const titles = new Set<string>()
    for (const category of getCategories()) {
      for (const subcategory of getSubcategories(category.slug)) {
        expect(subcategory.slug).toMatch(SLUG)
        expect(subcategory.seoTitle.length, subcategory.slug).toBeLessThanOrEqual(70)
        expect(subcategory.seoDescription.length, subcategory.slug).toBeGreaterThanOrEqual(50)
        expect(subcategory.seoDescription.length, subcategory.slug).toBeLessThanOrEqual(170)
        expect(subcategory.intro.length, subcategory.slug).toBeGreaterThan(0)
        expect(subcategory.sources.length, subcategory.slug).toBeGreaterThan(0)
        expect(titles.has(subcategory.seoTitle), subcategory.slug).toBe(false)
        titles.add(subcategory.seoTitle)
      }
    }
  })
})
