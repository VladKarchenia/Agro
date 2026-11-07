import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  categoryPath,
  getAllProducts,
  getAllSubcategories,
  getCartEntry,
  getCategories,
  getCategory,
  getOtherSubcategories,
  getProduct,
  getProductImages,
  getProducts,
  getRelatedProducts,
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

describe('перелинковка на карточке товара', () => {
  it('другие типоразмеры: только из той же подкатегории, без самого товара и без повторов', () => {
    for (const product of products) {
      const related = getRelatedProducts(product)
      const siblings = getProducts(product.categorySlug, product.subcategorySlug)
      expect(related.length, product.slug).toBe(Math.min(8, siblings.length - 1))
      expect(
        related.map((item) => item.slug),
        product.slug,
      ).not.toContain(product.slug)
      expect(new Set(related.map((item) => item.slug)).size, product.slug).toBe(related.length)
      for (const item of related) {
        expect(item.subcategorySlug, product.slug).toBe(product.subcategorySlug)
      }
    }
  })

  it('соседи идут по кругу, начиная со следующего за текущим', () => {
    const siblings = getProducts('kabel-provod', 'kabel-avbbshv')
    const [first, second, third, fourth] = siblings
    expect(first && getRelatedProducts(first).map((item) => item.slug)).toEqual(
      siblings.slice(1).map((item) => item.slug),
    )
    expect(fourth && getRelatedProducts(fourth).map((item) => item.slug)).toEqual(
      [first, second, third].map((item) => item?.slug),
    )
  })

  it('число соседей ограничено лимитом', () => {
    const big = getSubcategories('kabel-provod')
      .map((subcategory) => getProducts('kabel-provod', subcategory.slug))
      .find((list) => list.length > 3)
    const first = big?.[0]
    expect(first && getRelatedProducts(first, 2)).toHaveLength(2)
  })

  it('другие подкатегории: все остальные той же категории', () => {
    const [first] = getSubcategories('kabel-provod')
    const others = first ? getOtherSubcategories(first) : []
    expect(others.map((item) => item.slug)).not.toContain(first?.slug)
    expect(others).toHaveLength(getSubcategories('kabel-provod').length - 1)
  })
})

describe('позиции корзины и исполнения (цвета)', () => {
  const withColors = products.find((product) => product.variants)
  const cables = products.filter((product) => product.categorySlug === 'kabel-provod')

  it('цвета на выбор: ПуВ пять, ПуГВ семь, ПВС два, у остальных товаров цветов нет', () => {
    const counts: Record<string, number> = {}
    for (const product of cables) {
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

  it('в текстах подкатегорий нет невставленных подстановок вроде $colorList(...)', () => {
    for (const subcategory of getAllSubcategories()) {
      const text = [
        subcategory.title,
        subcategory.description,
        ...subcategory.intro,
        ...subcategory.sections.flatMap((section) => [
          section.heading,
          ...(section.paragraphs ?? []),
          ...(section.items ?? []),
        ]),
        ...subcategory.faq.flatMap((item) => [item.question, item.answer]),
      ].join(' ')
      expect(text, subcategory.slug).not.toMatch(/\$\w+\(|\$\{|undefined|NaN/)
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
    const colored = products.filter((product) => product.variants && !product.variants.sharedPhotos)
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

describe('лампы промышленные', () => {
  const lampCategory = 'lampy-promyshlennye'
  const counts: Record<string, number> = {
    'lampy-svetodiodnye-std-a60-e27': 4,
    'lampy-svetodiodnye-led-power-e27-e40': 4,
    'lampy-svetodiodnye-t8-g13': 6,
    'lampy-lyuminescentnye-t8-g13': 2,
    'lampy-kompaktnye-lyuminescentnye-kl-11-g23': 1,
  }

  it('в категории пять подкатегорий в заданном порядке и нужное число товаров в каждой', () => {
    expect(getSubcategories(lampCategory).map((item) => item.slug)).toEqual(Object.keys(counts))
    for (const [slug, count] of Object.entries(counts)) {
      expect(getProducts(lampCategory, slug), slug).toHaveLength(count)
    }
  })

  it('у ламп нет бренда и производителя (скрыты умышленно), страна — Китай', () => {
    for (const subcategory of getSubcategories(lampCategory)) {
      for (const product of getProducts(lampCategory, subcategory.slug)) {
        expect(product.brand, product.slug).toBeUndefined()
        const names = product.specs.map((spec) => spec.name)
        expect(names, product.slug).not.toContain('Производитель')
        expect(product.specs.find((spec) => spec.name === 'Страна происхождения')?.value).toBe(
          'Китай',
        )
        expect(product.description[0], product.slug).toContain('Страна происхождения — Китай.')
        expect(names, product.slug).toEqual(expect.arrayContaining(['Цоколь', 'Световой поток']))
      }
    }
  })

  it('в названии и характеристиках мощность и цоколь совпадают', () => {
    for (const subcategory of getSubcategories(lampCategory)) {
      for (const product of getProducts(lampCategory, subcategory.slug)) {
        const spec = (name: string) => product.specs.find((item) => item.name === name)?.value
        expect(product.name, product.slug).toContain(`${spec('Потребляемая мощность')}`)
        expect(product.name.replace(/\s/g, ''), product.slug).toContain(
          (spec('Цоколь') ?? '').replace(/\s/g, ''),
        )
        expect(product.slug, product.slug).toMatch(/^lampa-/)
      }
    }
  })

  it('в обозначениях цоколя и колбы только латинские буквы, незаполненных значений нет', () => {
    for (const subcategory of getSubcategories(lampCategory)) {
      for (const product of getProducts(lampCategory, subcategory.slug)) {
        const text = [product.name, product.summary, ...product.description].join(' ')
        // кириллические «Е27», «Т8», «А60» вместо латинских E27, T8, A60
        expect(text, product.slug).not.toMatch(/[ЕТА]\d|undefined|NaN/)
      }
    }
  })

  it('позиции категории называем моделями, у кабеля остаются типоразмеры', () => {
    expect(getCategory(lampCategory)?.itemsNoun).toBe('модели')
    expect(getCategory('kabel-provod')?.itemsNoun).toBeUndefined()
  })
})

describe('лампы: выбор цветовой температуры', () => {
  const lamps = products.filter((product) => product.categorySlug === 'lampy-promyshlennye')
  const selectable = lamps.filter((product) => product.variants)

  it('выбор 4000 К / 6500 К у десяти моделей, у остальных одна температура 6500 К или 6400 К', () => {
    expect(selectable.map((product) => product.slug)).toEqual([
      'lampa-svetodiodnaya-std-a60-10vt-e27',
      'lampa-svetodiodnaya-std-a60-12vt-e27',
      'lampa-svetodiodnaya-std-a60-15vt-e27',
      'lampa-svetodiodnaya-std-a60-20vt-e27',
      'lampa-svetodiodnaya-led-power-a80-30vt-e27',
      'lampa-svetodiodnaya-led-power-a90-40vt-e27',
      'lampa-svetodiodnaya-t8-10vt-g13-600mm',
      'lampa-svetodiodnaya-t8-18vt-g13-1200mm',
      'lampa-svetodiodnaya-t8-24vt-g13-1500mm',
      'lampa-svetodiodnaya-t8-36vt-g13-1200mm-pro',
    ])
    for (const product of lamps.filter((item) => !item.variants)) {
      const value = product.specs.find((spec) => spec.name === 'Цветовая температура')?.value
      expect(value, product.slug).toMatch(/^6[45]00 К$/)
    }
  })

  it('у исполнения свой slug для корзины, название в корзине с оттенком, фото общее', () => {
    for (const product of selectable) {
      expect(
        product.variants?.options.map((option) => option.label),
        product.slug,
      ).toEqual(['4000 К', '6500 К'])
      expect(product.variants?.sharedPhotos, product.slug).toBe(true)
      const option = product.variants?.options[1]
      expect(option?.slug).toBe(`${product.slug}-6500k`)
      expect(option && getCartEntry(option.slug)?.name).toBe(`${product.name} 6500 К`)
      expect(product.name, product.slug).not.toMatch(/4000|6500/)
      expect(product.specs.find((spec) => spec.name === 'Цветовая температура')?.value).toBe(
        '4000 К и 6500 К (на выбор)',
      )
    }
  })
})

describe('обложки категорий', () => {
  const publicDir = join(__dirname, '..', '..', 'public')

  it('у каждой категории есть обложка, и её файл лежит в public/images/categories', () => {
    for (const category of getCategories()) {
      expect(category.cover, category.slug).toBeDefined()
      const src = category.cover?.src ?? ''
      expect(src, category.slug).toBe(`/images/categories/${category.slug}.webp`)
      expect(() => readFileSync(join(publicDir, src)), category.slug).not.toThrow()
      expect(
        Math.abs((category.cover?.width ?? 0) / (category.cover?.height ?? 1) - 4 / 3),
      ).toBeLessThan(0.01)
    }
  })

  it('в папке обложек нет файлов без категории', () => {
    const files = readdirSync(join(publicDir, 'images', 'categories')).sort()
    expect(files).toEqual(
      getCategories()
        .map((category) => `${category.slug}.webp`)
        .sort(),
    )
  })
})
