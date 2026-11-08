import {
  SELECTABLE_TEMPERATURE,
  SELECTABLE_TEMPERATURE_SPEC,
  temperatureVariants,
} from './color-temperature'
import type { Product, ProductSpec, SubcategoryData } from './types'

// Файлы ламп берут выбор оттенка отсюда же
export {
  CHOICE_NOTE,
  COLOR_TEMPERATURE_HINT,
  SELECTABLE_TEMPERATURE,
} from './color-temperature'

// Общие помощники для ламп: характеристики в едином порядке, сборка товара, повторяющиеся тексты.
// Производитель, бренд и страну происхождения умышленно не указываем (решение заказчика).

export const LAMP_CATEGORY = 'lampy-promyshlennye'

export type LampKind = 'Светодиодная' | 'Люминесцентная' | 'Компактная люминесцентная'

export interface LampSpecInput {
  kind: LampKind
  socket: string
  /** Потребляемая мощность, Вт */
  power: number
  /** Световой поток, лм */
  luminousFlux: number
  /** Уже отформатировано: «6500 К». Для моделей на выбор — SELECTABLE_TEMPERATURE */
  colorTemperature: string
  /** «230 В»: только если источник называет напряжение */
  voltage?: string
  /** Частота сети, Гц */
  frequency: number
  /** «30 000 часов» */
  lifetime?: string
  /** Степень защиты, число после IP */
  ip?: number
  /** «от −25 до +50 °С» */
  operatingTemperature?: string
  /** Угол свечения, градусы */
  beamAngle?: number
  /** «590×26 мм» */
  size: string
}

/** Характеристики лампы в едином порядке. Незаданные значения в список не попадают */
export function lampSpecs(input: LampSpecInput): ProductSpec[] {
  const specs: (ProductSpec | undefined)[] = [
    { name: 'Тип лампы', value: input.kind },
    { name: 'Цоколь', value: input.socket },
    { name: 'Потребляемая мощность', value: `${input.power} Вт` },
    { name: 'Световой поток', value: `${input.luminousFlux} лм` },
    { name: 'Цветовая температура', value: input.colorTemperature },
    input.voltage ? { name: 'Номинальное напряжение', value: input.voltage } : undefined,
    { name: 'Частота сети', value: `${input.frequency} Гц` },
    input.lifetime ? { name: 'Срок службы', value: input.lifetime } : undefined,
    input.ip === undefined ? undefined : { name: 'Степень защиты', value: `IP${input.ip}` },
    input.operatingTemperature
      ? { name: 'Температура эксплуатации', value: input.operatingTemperature }
      : undefined,
    input.beamAngle === undefined
      ? undefined
      : { name: 'Угол свечения', value: `${input.beamAngle}°` },
    { name: 'Габаритные размеры', value: input.size },
  ]
  return specs.filter((spec): spec is ProductSpec => Boolean(spec))
}

/** «108×60 мм» */
export const lampSize = (length: number, diameter: number) => `${length}×${diameter} мм`

export interface LampInput {
  subcategory: SubcategoryData['subcategory']
  slug: string
  name: string
  /** До ~75 знаков: название, описание и фраза про цену должны уложиться в мета-описание */
  summary: string
  description: string[]
  specs: LampSpecInput
  /** Страница, по которой проверены факты */
  sourceUrl: string
}

export function lampProduct(input: LampInput): Product {
  // Модель, которая есть с двумя оттенками: оттенок выбирается на странице и уходит в корзину
  const selectable = input.specs.colorTemperature === SELECTABLE_TEMPERATURE
  return {
    slug: input.slug,
    categorySlug: input.subcategory.categorySlug,
    subcategorySlug: input.subcategory.slug,
    name: input.name,
    summary: input.summary,
    description: input.description,
    specs: lampSpecs(
      selectable ? { ...input.specs, colorTemperature: SELECTABLE_TEMPERATURE_SPEC } : input.specs,
    ),
    price: null,
    variants: selectable ? temperatureVariants(input.slug) : undefined,
    sourceUrl: input.sourceUrl,
  }
}

export const PRICE_FAQ = {
  question: 'Почему на сайте нет цены?',
  answer:
    'Цены на сайте не публикуются, у каждого товара указано «Цена по запросу». Добавьте нужные позиции в корзину и отправьте заявку, менеджер свяжется с вами.',
}

/** По данным каталога источника: промышленные лампы не для дома */
export const NOT_FOR_HOME =
  'По данным каталога, лампы этой группы предназначены для промышленного освещения и не предназначены для использования в быту.'

/** Что означает IP20: полезно там, где в каталоге названы открытые площадки */
export const IP20_NOTE =
  'Степень защиты IP20 означает защиту от попадания твёрдых предметов крупнее 12,5 мм, но не от воды и влаги. Если лампу нужно установить на открытой площадке или в сыром помещении, её ставят в закрытый влагозащищённый светильник.'
