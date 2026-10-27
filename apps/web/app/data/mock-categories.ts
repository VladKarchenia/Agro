// Условные категории только для демо. Реальный каталог придёт из CMS (см. docs/adr/0002).
export interface MockCategory {
  slug: string
  title: string
  description: string
}

export const mockCategories: MockCategory[] = [
  { slug: 'pochvoobrabotka', title: 'Почвообработка', description: 'Плуги, культиваторы, бороны' },
  { slug: 'posev', title: 'Посев и посадка', description: 'Сеялки и посадочные машины' },
  {
    slug: 'zashchita-rastenij',
    title: 'Защита растений',
    description: 'Опрыскиватели и протравители',
  },
  { slug: 'uborka', title: 'Уборка урожая', description: 'Жатки, подборщики, комбайны' },
  {
    slug: 'kormozagotovka',
    title: 'Кормозаготовка',
    description: 'Косилки, грабли, пресс-подборщики',
  },
  { slug: 'zapchasti', title: 'Запчасти', description: 'Расходные материалы и комплектующие' },
]
