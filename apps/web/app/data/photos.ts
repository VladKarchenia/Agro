import { PHOTO_FILES } from './photo-files'
import type { Product } from './types'

// Фото товаров лежат в public/images/products/<подкатегория>/ и называются по адресу товара:
//   <slug>.webp, <slug>-2.webp, <slug>-3.webp (дополнительные кадры);
//   у товара с цветами: <slug-товара>-<цвет>.webp (имя совпадает со slug цвета в корзине).
// Список файлов создаёт скрипт `pnpm photos` (app/data/photo-files.ts), правила: docs/specs/content.md.
export interface ProductImage {
  /** Путь внутри сайта, без базового пути: /images/products/... */
  src: string
  alt: string
  width: number
  height: number
}

const IMAGE_ROOT = '/images/products'

function imagesFor(subcategorySlug: string, key: string, alt: string): ProductImage[] {
  const images: ProductImage[] = []
  for (let number = 1; ; number++) {
    const file = `${subcategorySlug}/${key}${number === 1 ? '' : `-${number}`}.webp`
    const size = PHOTO_FILES[file]
    if (!size) break
    images.push({
      src: `${IMAGE_ROOT}/${file}`,
      alt: number === 1 ? alt : `${alt}, фото ${number}`,
      width: size[0],
      height: size[1],
    })
  }
  return images
}

/**
 * Фото товара. У товара с цветами нужен slug выбранного цвета: фото одного цвета другому не подставляем.
 * Без выбранного цвета берём первый цвет, у которого есть фото (для карточек в списке).
 * Пустой список означает «фото нет»: на сайте показывается заглушка.
 */
export function getProductImages(product: Product, variantSlug?: string): ProductImage[] {
  const options = product.variants?.options
  if (!options) return imagesFor(product.subcategorySlug, product.slug, product.name)

  const chosen = variantSlug
    ? options.filter((option) => option.slug === variantSlug)
    : options.slice()
  for (const option of chosen) {
    const images = imagesFor(
      product.subcategorySlug,
      option.slug,
      `${product.name} ${option.label}`,
    )
    if (images.length > 0) return images
  }
  return []
}

/** Все ключи (без номера кадра и расширения), под которые может лежать фото товара */
export function photoKeys(products: Product[]): Set<string> {
  const keys = new Set<string>()
  for (const product of products) {
    keys.add(`${product.subcategorySlug}/${product.slug}`)
    for (const option of product.variants?.options ?? []) {
      keys.add(`${product.subcategorySlug}/${option.slug}`)
    }
  }
  return keys
}
