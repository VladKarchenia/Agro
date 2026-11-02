import { readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  categoryPath,
  getAllProducts,
  getCartEntry,
  getCategories,
  getCategory,
  getProduct,
  getProductImages,
  getProducts,
  getSubcategories,
  getSubcategory,
  photoKeys,
  productPath,
  subcategoryPath,
} from '../../app/data/catalog'
import { PHOTO_FILES } from '../../app/data/photo-files'
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

  it('цвета на выбор: ПуВ пять, ПуГВ семь, ПВС два, у остальных товаров цветов нет', () => {
    const counts: Record<string, number> = {}
    for (const product of products) {
      const count = product.variants?.options.length ?? 0
      counts[product.subcategorySlug] ??= count
      expect(count, product.slug).toBe(counts[product.subcategorySlug])
    }
    expect(counts).toMatchObject({
      'kabel-avbbshv': 0,
      'kabel-avvg': 0,
      'kabel-vvgng-ls': 0,
      'provod-pv-1-puv': 5,
      'provod-pv-3-pugv': 7,
      'provod-pvs': 2,
      'provod-sip': 0,
    })
  })

  it('у ПВС цвета белый и чёрный, а цвет не входит в название и адрес товара', () => {
    const pvs = getProducts('kabel-provod', 'provod-pvs')
    for (const product of pvs) {
      expect(
        product.variants?.options.map((option) => option.label),
        product.slug,
      ).toEqual(['белый', 'чёрный'])
      expect(product.name.toLowerCase(), product.slug).not.toMatch(/белый|чёрный/)
      expect(product.slug, product.slug).not.toMatch(/belyi|chernyi/)
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

describe('фото товаров', () => {
  const root = join(__dirname, '..', '..', 'public', 'images', 'products')
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
    )
  const onDisk = walk(root)
    .filter((file) => /\.(webp|jpe?g|png)$/i.test(file))
    .map((file) => relative(root, file).split(sep).join('/'))
    .sort()

  it('список фото для сайта совпадает с папкой, лишних форматов и необработанных файлов нет', () => {
    // Если тест упал: запустите pnpm photos
    expect(onDisk).toEqual(Object.keys(PHOTO_FILES).sort())
  })

  it('каждое фото лежит в папке своей подкатегории и называется по товару или его цвету', () => {
    const keys = photoKeys(products)
    for (const file of Object.keys(PHOTO_FILES)) {
      const key = file.replace(/\.webp$/, '')
      const base = key.replace(/-\d+$/, '')
      expect(keys.has(key) || keys.has(base), file).toBe(true)
    }
  })

  it('все фото 4:3 и не шире 1200 px', () => {
    for (const [file, [width, height]] of Object.entries(PHOTO_FILES)) {
      expect(Math.abs(width / height - 4 / 3), file).toBeLessThan(0.01)
      expect(width, file).toBeLessThanOrEqual(1200)
    }
  })

  it('дополнительные кадры идут подряд: после -2 не бывает пропуска перед -3', () => {
    for (const file of Object.keys(PHOTO_FILES)) {
      const match = file.match(/^(.*)-(\d+)\.webp$/)
      const number = match?.[2]
      // адрес товара сам может оканчиваться цифрой (…-2-5), это не номер кадра
      const isProductKey = photoKeys(products).has(file.replace(/.webp$/, ''))
      if (match && number && !isProductKey && Number(number) > 2) {
        expect(PHOTO_FILES[`${match[1]}-${Number(number) - 1}.webp`], file).toBeDefined()
      }
    }
  })

  it('getProductImages: у обычного товара фото по порядку, alt содержит название', () => {
    const withGallery = products.find(
      (product) => !product.variants && getProductImages(product).length > 1,
    )
    expect(withGallery).toBeDefined()
    const images = withGallery ? getProductImages(withGallery) : []
    expect(images[0]?.alt).toBe(withGallery?.name)
    expect(images[1]?.alt).toBe(`${withGallery?.name}, фото 2`)
    expect(images[0]?.src).toMatch(/^\/images\/products\/.+\.webp$/)
  })

  it('getProductImages: у товара с цветами фото берётся по выбранному цвету и не подменяется другим', () => {
    const colored = products.filter((product) => product.variants)
    expect(colored.length).toBeGreaterThan(0)
    for (const product of colored) {
      for (const option of product.variants?.options ?? []) {
        const images = getProductImages(product, option.slug)
        const expected = PHOTO_FILES[`${product.subcategorySlug}/${option.slug}.webp`]
        expect(images.length > 0, `${option.slug}`).toBe(Boolean(expected))
        if (images[0]) expect(images[0].alt, option.slug).toBe(`${product.name} ${option.label}`)
      }
    }
  })

  it('у ПВС чёрного цвета в списке нет фото там, где его не прислали: заглушка, а не фото белого', () => {
    const missing = getProducts('kabel-provod', 'provod-pvs').filter(
      (product) => getProductImages(product, `${product.slug}-chernyi`).length === 0,
    )
    for (const product of missing) {
      expect(getProductImages(product, `${product.slug}-chernyi`)).toEqual([])
      // но в списке (без выбранного цвета) показывается фото белого
      expect(getProductImages(product).length, product.slug).toBeGreaterThan(0)
    }
  })
})
