import type { Category } from './types'

// Категории каталога. Позже данные придут из CMS (см. docs/adr/0002).
// Подкатегории и товары лежат рядом, по файлу на подкатегорию: app/data/subcategories/.
export const categories: Category[] = [
  {
    slug: 'kabel-provod',
    title: 'Кабель и провод',
    description: 'Силовые кабели и провода для электроустановок',
    cover: { src: '/images/categories/kabel-provod.webp', width: 1200, height: 900 },
  },
  {
    slug: 'lampy-promyshlennye',
    title: 'Лампы промышленные',
    description: 'Светодиодные, люминесцентные и компактные лампы для промышленного освещения',
    itemsNoun: 'модели',
    cover: { src: '/images/categories/lampy-promyshlennye.webp', width: 1200, height: 900 },
  },
]
