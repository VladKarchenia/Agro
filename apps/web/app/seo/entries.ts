import { getCategories, getProducts } from '../data/catalog'
import { normalizePath } from '../utils/seo'

// Единый реестр страниц для SEO: sitemap, robots, llms.txt, мета-теги `robots` и проверки в CI
// берут данные отсюда. Новая страница в `app/pages` без записи здесь не пройдёт тест
// (tests/unit/seo-coverage.test.ts).
export interface StaticPage {
  path: string
  /** false: страница закрыта от индексации и не попадает в sitemap */
  indexable: boolean
  /** Короткое название для llms.txt и навигации */
  title: string
  /** Зачем страница закрыта, если indexable: false. Откройте, когда появится содержимое */
  reason?: string
}

export const STATIC_PAGES: StaticPage[] = [
  { path: '/', indexable: true, title: 'Главная' },
  { path: '/catalog', indexable: true, title: 'Каталог' },
  { path: '/about', indexable: false, title: 'О компании', reason: 'заглушка без содержимого' },
  { path: '/delivery', indexable: false, title: 'Доставка', reason: 'заглушка без содержимого' },
  { path: '/contacts', indexable: false, title: 'Контакты', reason: 'заглушка без содержимого' },
  { path: '/privacy', indexable: true, title: 'Политика обработки персональных данных' },
  { path: '/consent', indexable: true, title: 'Согласие на обработку персональных данных' },
  { path: '/cart', indexable: false, title: 'Корзина', reason: 'личная страница пользователя' },
]

export function findStaticPage(path: string): StaticPage | undefined {
  const normalized = normalizePath(path)
  return STATIC_PAGES.find((page) => page.path === normalized)
}

/** Динамические страницы каталога: категории и товары. Позже данные придут из CMS */
export function getCatalogPaths(): string[] {
  return getCategories().flatMap((category) => [
    `/catalog/${category.slug}`,
    ...getProducts(category.slug).map((product) => `/catalog/${category.slug}/${product.slug}`),
  ])
}

/** Все адреса, которые должны попасть в sitemap и llms.txt */
export function getIndexablePaths(): string[] {
  return [
    ...STATIC_PAGES.filter((page) => page.indexable).map((page) => page.path),
    ...getCatalogPaths(),
  ]
}
