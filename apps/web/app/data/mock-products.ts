import { mockCategories } from './mock-categories'

// Условные товары только для демо. Реальные товары придут из CMS (см. docs/adr/0002).
export interface MockProduct {
  slug: string
  categorySlug: string
  name: string
  summary: string
}

export const mockProducts: MockProduct[] = mockCategories.flatMap((category) =>
  [1, 2].map((number) => ({
    slug: `${category.slug}-primer-${number}`,
    categorySlug: category.slug,
    name: `${category.title}: пример ${number}`,
    summary: `Условный товар из категории «${category.title}» для демонстрации каталога и заявки.`,
  })),
)
