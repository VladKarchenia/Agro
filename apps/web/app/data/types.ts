export interface Category {
  slug: string
  title: string
  /** Короткое описание для карточек и мета-тегов */
  description: string
  /** Как называем позиции раздела в заголовках: у кабеля «типоразмеры» (по умолчанию), у ламп «модели» */
  itemsNoun?: 'типоразмеры' | 'модели'
}

export interface ContentSection {
  heading: string
  /** Выводятся перед списком */
  paragraphs?: string[]
  items?: string[]
}

export interface Subcategory {
  slug: string
  categorySlug: string
  title: string
  /** Короткое описание для карточки в списке подкатегорий */
  description: string
  seoTitle: string
  seoDescription: string
  intro: string[]
  sections: ContentSection[]
  faq: { question: string; answer: string }[]
  /** Откуда взяты факты в текстах, чтобы их можно было перепроверить */
  sources: string[]
}

export interface ProductSpec {
  name: string
  value: string
}

export interface ProductVariant {
  /** Уникален во всём каталоге: именно он хранится в корзине */
  slug: string
  label: string
}

export interface Product {
  slug: string
  categorySlug: string
  subcategorySlug: string
  name: string
  /** Короткое описание для карточек и мета-тегов, до ~90 символов */
  summary: string
  /** Абзацы описания на странице товара */
  description: string[]
  specs: ProductSpec[]
  /** Название бренда для разметки schema.org. Не заполняем, если источник производителя не называет */
  brand?: string
  /** Цена в BYN. Пока не заполняется: на сайте везде «Цена по запросу» */
  price: number | null
  /** Исполнения одного товара (например, цвета): на странице выбирается одно, в корзину идёт его slug */
  variants?: {
    title: string
    options: ProductVariant[]
    /** Текст кнопки в списке товаров. По умолчанию «Выбрать <название в нижнем регистре>» */
    chooseLabel?: string
    /** Фото одно на все исполнения (цветовая температура лампы): лежит под slug товара, а не исполнения */
    sharedPhotos?: boolean
  }
  /** Страница, по которой проверены факты о товаре */
  sourceUrl: string
}

export interface SubcategoryData {
  subcategory: Subcategory
  products: Product[]
}
