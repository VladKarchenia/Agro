import {
  CHOICE_NOTE,
  COLOR_TEMPERATURE_HINT,
  IP20_NOTE,
  LAMP_CATEGORY,
  lampProduct,
  lampSize,
  NOT_FOR_HOME,
  PRICE_FAQ,
  SELECTABLE_TEMPERATURE,
} from '../lamp-builders'
import type { SubcategoryData } from '../types'

// Факты о лампах: страницы luxlighting.by (см. sourceUrl). Описаний и производителя там нет,
// тексты написаны поверх характеристик и общеизвестных обозначений (docs/specs/content.md).
const subcategory: SubcategoryData['subcategory'] = {
  slug: 'lampy-svetodiodnye-led-power-e27-e40',
  categorySlug: LAMP_CATEGORY,
  title: 'Лампы светодиодные высокой мощности LED POWER E27, E40',
  description: 'Мощные светодиодные лампы 30, 40, 50 и 60 Вт с цоколем E27 и E27/E40',
  seoTitle: 'Лампы светодиодные LED POWER E27, E40 в Беларуси: 30–60 Вт',
  seoDescription:
    'Светодиодные лампы высокой мощности LED POWER 30, 40, 50 и 60 Вт с цоколем E27 и E27/E40: световой поток 2800–5300 лм, ресурс 30 000 часов. Цена по запросу.',
  intro: [
    'LED POWER — светодиодные лампы повышенной мощности, от 30 до 60 Вт, с цоколем E27 или E27/E40. По данным каталога, их используют для освещения производственных помещений, складов и открытых площадок, а также в аварийном освещении. Лампы не предназначены для использования в быту.',
    'В каталоге четыре модели со световым потоком от 2800 до 5300 лм. У всех срок службы 30 000 часов, степень защиты IP20, частота сети 50 Гц. Ниже — расшифровка обозначений, параметры, советы по выбору и список моделей для заказа.',
  ],
  sections: [
    {
      heading: 'Расшифровка обозначений',
      items: [
        '«LED» — светодиодная лампа, «POWER» — название серии ламп повышенной мощности;',
        '«A80» и «A90» — форма колбы A («груша»), число — диаметр колбы в миллиметрах, как и в обозначении A60;',
        '«E27» — резьбовой цоколь Эдисона с диаметром резьбы 27 мм;',
        '«E40» — резьбовой цоколь с диаметром резьбы 40 мм, его применяют в светильниках для мощных ламп;',
        '«E27/E40» — так в каталоге указан цоколь ламп на 50 и 60 Вт;',
        '«30 Вт», «40 Вт», «50 Вт», «60 Вт» — потребляемая мощность.',
      ],
    },
    {
      heading: 'Где применяют лампы LED POWER',
      paragraphs: [
        'По данным каталога, лампы предназначены для освещения производственных помещений, складов, открытых площадок и для аварийного освещения. Для использования в быту они не предназначены.',
        IP20_NOTE,
      ],
    },
    {
      heading: 'Основные параметры',
      paragraphs: ['Значения указаны по данным каталога.'],
      items: [
        'цоколь: E27 (30 и 40 Вт) и E27/E40 (50 и 60 Вт);',
        'потребляемая мощность: 30, 40, 50 и 60 Вт;',
        'световой поток: 2800, 3750, 4750 и 5300 лм соответственно;',
        'цветовая температура: 4000 К или 6500 К на выбор (30 и 40 Вт) и 6500 К (50 и 60 Вт);',
        'срок службы: 30 000 часов;',
        'степень защиты: IP20;',
        'частота сети: 50 Гц;',
        'габаритные размеры: от 150×80 мм (30 Вт) до 223×125 мм (60 Вт).',
      ],
    },
    {
      heading: 'Как выбрать лампу LED POWER',
      paragraphs: [
        'Если не уверены в выборе, оформите заявку: менеджер свяжется с вами и уточнит детали. Основные критерии выбора:',
      ],
      items: [
        'Световой поток. Сравнивайте лампы по люменам: он растёт от 2800 лм у лампы на 30 Вт до 5300 лм у лампы на 60 Вт.',
        'Цоколь. У ламп на 30 и 40 Вт цоколь E27, у ламп на 50 и 60 Вт указан E27/E40. Как лампа соединяется с вашим патроном, уточняйте у менеджера до заказа.',
        'Размеры. Лампы крупные: длина от 150 до 223 мм, диаметр от 80 до 125 мм. Проверьте, что лампа помещается в светильник.',
        COLOR_TEMPERATURE_HINT,
      ],
    },
  ],
  faq: [
    {
      question: 'Можно ли использовать лампы LED POWER дома?',
      answer: NOT_FOR_HOME,
    },
    {
      question: 'Подходят ли лампы для улицы?',
      answer: IP20_NOTE,
    },
    {
      question: 'Что значит E27/E40 в названии?',
      answer:
        'E27 и E40 — резьбовые цоколи с диаметром резьбы 27 и 40 мм. В каталоге у ламп на 50 и 60 Вт указаны оба; подходящий вариант для вашего патрона уточните у менеджера.',
    },
    {
      question: 'Можно ли выбрать оттенок света?',
      answer: `У ламп на 30 и 40 Вт оттенок выбирается: 4000 К или 6500 К, выбранный вариант попадёт в корзину и заявку. Лампы на 50 и 60 Вт — только 6500 К.`,
    },
    PRICE_FAQ,
  ],
  sources: ['https://luxlighting.by/product-category/industrial-lamps/led-lamps-e27-e40/'],
}

const SOURCE = 'https://luxlighting.by/product'

interface Model {
  /** Часть названия до мощности: «LED POWER» или «LED POWER A80» */
  series: string
  slug: string
  power: number
  luminousFlux: number
  socket: string
  colorTemperature: string
  length: number
  diameter: number
  sourceSlug: string
}

const MODELS: Model[] = [
  {
    series: 'LED POWER',
    slug: 'lampa-svetodiodnaya-led-power-50vt-e27-e40',
    power: 50,
    luminousFlux: 4750,
    socket: 'E27/E40',
    colorTemperature: '6500 К',
    length: 208,
    diameter: 115,
    sourceSlug: 't125-50vt-4000-6500k-e27-e40',
  },
  {
    series: 'LED POWER',
    slug: 'lampa-svetodiodnaya-led-power-60vt-e27-e40',
    power: 60,
    luminousFlux: 5300,
    socket: 'E27/E40',
    colorTemperature: '6500 К',
    length: 223,
    diameter: 125,
    sourceSlug: 't140-65vt-4000-6500k-e27-e40',
  },
  {
    series: 'LED POWER A80',
    slug: 'lampa-svetodiodnaya-led-power-a80-30vt-e27',
    power: 30,
    luminousFlux: 2800,
    socket: 'E27',
    colorTemperature: SELECTABLE_TEMPERATURE,
    length: 150,
    diameter: 80,
    sourceSlug: 't100-30vt-4000-6500k-e27',
  },
  {
    series: 'LED POWER A90',
    slug: 'lampa-svetodiodnaya-led-power-a90-40vt-e27',
    power: 40,
    luminousFlux: 3750,
    socket: 'E27',
    colorTemperature: SELECTABLE_TEMPERATURE,
    length: 168,
    diameter: 90,
    sourceSlug: 't115-40vt-4000-6500k-e27',
  },
]

export const lampsLedPowerData: SubcategoryData = {
  subcategory,
  products: MODELS.map((model) => {
    const name = `Лампа светодиодная ${model.series} ${model.power} Вт ${model.socket}`
    const size = lampSize(model.length, model.diameter)
    const range = model.colorTemperature === SELECTABLE_TEMPERATURE
    return lampProduct({
      subcategory,
      slug: model.slug,
      name,
      summary: `Светодиодная лампа ${model.power} Вт, ${model.luminousFlux} лм, ${model.colorTemperature}, IP20.`,
      description: [
        `${name} — светодиодная лампа повышенной мощности с цоколем ${model.socket}. Потребляемая мощность — ${model.power} Вт, световой поток — ${model.luminousFlux} лм, цветовая температура — ${model.colorTemperature}, срок службы — 30 000 часов. Габаритные размеры — ${size}, степень защиты — IP20, частота сети — 50 Гц.`,
        'По данным каталога, лампы серии предназначены для освещения производственных помещений, складов, открытых площадок и для аварийного освещения; для использования в быту они не предназначены.',
        IP20_NOTE,
        ...(range ? [CHOICE_NOTE] : []),
      ],
      specs: {
        kind: 'Светодиодная',
        socket: model.socket,
        power: model.power,
        luminousFlux: model.luminousFlux,
        colorTemperature: model.colorTemperature,
        frequency: 50,
        lifetime: '30 000 часов',
        ip: 20,
        size,
      },
      sourceUrl: `${SOURCE}/${model.sourceSlug}/`,
    })
  }),
}
