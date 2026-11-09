import {
  SELECTABLE_TEMPERATURE,
  SELECTABLE_TEMPERATURE_SPEC,
  temperatureVariants,
} from './color-temperature'
import type { Product, ProductSpec, SubcategoryData } from './types'

// Общие помощники для светодиодных светильников: характеристики в едином порядке, сборка товара,
// повторяющиеся тексты. Производитель и бренд в источнике не названы, страну происхождения для
// светильников заказчик не подтверждал, поэтому их в карточках нет.

export const FIXTURE_CATEGORY = 'svetilniki-svetodiodnye'

export interface FixtureSpecInput {
  /** Например «Светодиодный светильник» */
  kind: string
  /** Потребляемая мощность, Вт */
  power?: number
  /** Световой поток, лм */
  luminousFlux?: number
  /** Уже отформатировано: «6500 К». Для моделей на выбор — SELECTABLE_TEMPERATURE */
  colorTemperature?: string
  /** «220 В», «180–265 В» */
  voltage?: string
  /** «50 Гц», «50/60 Гц» */
  frequency?: string
  /** Степень защиты, число после IP */
  ip?: number
  /** «от −20 до +40 °С» */
  operatingTemperature?: string
  housing?: string
  diffuser?: string
  /** Цоколь ламп, для светильников под сменные лампы */
  socket?: string
  /** «2 лампы T8, 1200 мм» */
  lamps?: string
  /** Есть ли монтажная пластина (по разделу каталога) */
  mountingPlate?: boolean
  /** «1200×75×25 мм» */
  size?: string
}

/** Характеристики светильника в едином порядке. Незаданные значения в список не попадают */
export function fixtureSpecs(input: FixtureSpecInput): ProductSpec[] {
  const specs: (ProductSpec | undefined)[] = [
    { name: 'Тип', value: input.kind },
    input.power === undefined
      ? undefined
      : { name: 'Потребляемая мощность', value: `${input.power} Вт` },
    input.luminousFlux === undefined
      ? undefined
      : { name: 'Световой поток', value: `${input.luminousFlux} лм` },
    input.colorTemperature
      ? { name: 'Цветовая температура', value: input.colorTemperature }
      : undefined,
    input.voltage ? { name: 'Напряжение питания', value: input.voltage } : undefined,
    input.frequency ? { name: 'Частота сети', value: input.frequency } : undefined,
    input.ip === undefined ? undefined : { name: 'Степень защиты', value: `IP${input.ip}` },
    input.operatingTemperature
      ? { name: 'Температура эксплуатации', value: input.operatingTemperature }
      : undefined,
    input.housing ? { name: 'Материал корпуса', value: input.housing } : undefined,
    input.diffuser ? { name: 'Рассеиватель', value: input.diffuser } : undefined,
    input.socket ? { name: 'Цоколь ламп', value: input.socket } : undefined,
    input.lamps ? { name: 'Количество ламп', value: input.lamps } : undefined,
    input.mountingPlate === undefined
      ? undefined
      : { name: 'Монтажная пластина', value: input.mountingPlate ? 'Есть' : 'Нет' },
    input.size ? { name: 'Габаритные размеры', value: input.size } : undefined,
  ]
  return specs.filter((spec): spec is ProductSpec => Boolean(spec))
}

/** «1200×75×25 мм» */
export const fixtureSize = (...sides: number[]) => `${sides.join('×')} мм`

export interface FixtureInput {
  subcategory: SubcategoryData['subcategory']
  slug: string
  name: string
  /** До ~75 знаков: название, описание и фраза про цену должны уложиться в мета-описание */
  summary: string
  description: string[]
  specs: FixtureSpecInput
  /** Страница, по которой проверены факты */
  sourceUrl: string
}

export function fixtureProduct(input: FixtureInput): Product {
  // Модель, которая есть с двумя оттенками: оттенок выбирается на странице и уходит в корзину
  const selectable = input.specs.colorTemperature === SELECTABLE_TEMPERATURE
  return {
    slug: input.slug,
    categorySlug: input.subcategory.categorySlug,
    subcategorySlug: input.subcategory.slug,
    name: input.name,
    summary: input.summary,
    description: input.description,
    specs: fixtureSpecs(
      selectable ? { ...input.specs, colorTemperature: SELECTABLE_TEMPERATURE_SPEC } : input.specs,
    ),
    price: null,
    variants: selectable ? temperatureVariants(input.slug) : undefined,
    sourceUrl: input.sourceUrl,
  }
}

export const FIXTURE_PRICE_FAQ = {
  question: 'Почему на сайте нет цены?',
  answer:
    'Цены на сайте не публикуются, у каждого товара указано «Цена по запросу». Добавьте нужные позиции в корзину и отправьте заявку, менеджер свяжется с вами.',
}

/** Что означает IP40, IP65 и IP66: полезно при выборе места установки */
export const IP40_NOTE =
  'Степень защиты IP40 означает защиту от попадания твёрдых предметов крупнее 1 мм, но не от воды: светильник рассчитан на сухие помещения.'
export const IP65_NOTE =
  'Степень защиты IP65 означает полную защиту от пыли и от струй воды: светильник подходит для пыльных и влажных помещений.'
export const IP66_NOTE =
  'Степень защиты IP66 означает полную защиту от пыли и от сильных струй воды: светильник рассчитан на установку на открытом воздухе и в тяжёлых условиях.'
