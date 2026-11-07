import {
  CHOICE_NOTE,
  COLOR_TEMPERATURE_HINT,
  LAMP_CATEGORY,
  lampProduct,
  lampSize,
  PRICE_FAQ,
  SELECTABLE_TEMPERATURE,
} from '../lamp-builders'
import type { SubcategoryData } from '../types'

// Факты о лампах: страницы luxlighting.by (см. sourceUrl). Описаний и производителя там нет,
// тексты написаны поверх характеристик и общеизвестных обозначений (docs/specs/content.md).
const subcategory: SubcategoryData['subcategory'] = {
  slug: 'lampy-svetodiodnye-std-a60-e27',
  categorySlug: LAMP_CATEGORY,
  title: 'Лампы светодиодные STD-A60 E27',
  description: 'Светодиодные лампы с цоколем E27 мощностью 10, 12, 15 и 20 Вт',
  seoTitle: 'Лампы светодиодные STD-A60 E27 в Беларуси: 10–20 Вт',
  seoDescription:
    'Светодиодные лампы STD-A60 с цоколем E27 мощностью 10, 12, 15 и 20 Вт: световой поток 850–1700 лм, цветовая температура на выбор: 4000 К или 6500 К. Цена по запросу.',
  intro: [
    'Лампы STD-A60 — светодиодные лампы в колбе формы A60 с резьбовым цоколем E27. Этот формат привычен по лампам накаливания, поэтому лампы подходят для светильников и патронов с цоколем E27. В каталоге четыре мощности: 10, 12, 15 и 20 Вт, световой поток от 850 до 1700 лм.',
    'Для всех ламп можно выбрать цветовую температуру 4000 К или 6500 К; срок службы 30 000 часов и частота сети 50 Гц. Ниже — расшифровка обозначений, параметры, советы по выбору и список моделей для заказа.',
  ],
  sections: [
    {
      heading: 'Расшифровка обозначений',
      items: [
        '«A60» — форма колбы A («груша») диаметром 60 мм;',
        '«E27» — резьбовой цоколь Эдисона с диаметром резьбы 27 мм;',
        '«10W», «12W», «15W», «20W» — потребляемая мощность в ваттах;',
        '«4000K», «6500K» — цветовая температура в кельвинах, выбирается на странице лампы.',
      ],
    },
    {
      heading: 'Куда подходят лампы STD-A60',
      paragraphs: [
        'Лампы устанавливают в светильники и патроны с цоколем E27. Перед покупкой проверьте, что светильник рассчитан на светодиодную лампу такой мощности, и сверьте размеры: лампа на 20 Вт длиннее остальных (118 мм вместо 108 мм), поэтому в узкий плафон она может не поместиться.',
      ],
    },
    {
      heading: 'Основные параметры',
      paragraphs: ['Значения указаны по данным каталога.'],
      items: [
        'цоколь: E27;',
        'потребляемая мощность: 10, 12, 15 и 20 Вт;',
        'световой поток: 850, 1020, 1275 и 1700 лм соответственно;',
        'цветовая температура: 4000 К или 6500 К на выбор;',
        'срок службы: 30 000 часов;',
        'частота сети: 50 Гц;',
        'габаритные размеры: 108×60 мм (10, 12 и 15 Вт) и 118×60 мм (20 Вт).',
      ],
    },
    {
      heading: 'Как выбрать лампу STD-A60',
      paragraphs: [
        'Если не уверены в выборе, оформите заявку: менеджер свяжется с вами и уточнит детали. Основные критерии выбора:',
      ],
      items: [
        'Световой поток. Сравнивайте лампы по люменам, а не только по ваттам: чем больше световой поток, тем ярче лампа. У лампы на 10 Вт он 850 лм, на 20 Вт — 1700 лм.',
        COLOR_TEMPERATURE_HINT,
        'Цоколь и размеры. Убедитесь, что патрон E27 и лампа помещается в плафон: длина 108 или 118 мм, диаметр 60 мм.',
      ],
    },
  ],
  faq: [
    {
      question: 'Какой цоколь у ламп STD-A60?',
      answer: 'E27: резьбовой цоколь с диаметром резьбы 27 мм, подходит к патронам E27.',
    },
    {
      question: 'Что значит A60 в названии?',
      answer:
        'Это форма и размер колбы: буква A — классическая «груша», число 60 — диаметр колбы в миллиметрах. В характеристиках диаметр 60 мм указан для каждой модели.',
    },
    {
      question: 'Чем отличаются лампы 10, 12, 15 и 20 Вт?',
      answer:
        'Мощностью и световым потоком: от 850 лм у лампы на 10 Вт до 1700 лм у лампы на 20 Вт. Лампа на 20 Вт ещё и чуть длиннее остальных.',
    },
    {
      question: 'Можно ли выбрать оттенок света?',
      answer: `Да. ${CHOICE_NOTE} Выбранный вариант попадёт в корзину и заявку.`,
    },
    PRICE_FAQ,
  ],
  sources: [
    'https://luxlighting.by/product-category/industrial-lamps/lampa-svetodiodnaya-std-a60-e27/',
  ],
}

const SOURCE = 'https://luxlighting.by/product'

interface Model {
  power: number
  luminousFlux: number
  length: number
  sourceSlug: string
}

const MODELS: Model[] = [
  {
    power: 10,
    luminousFlux: 850,
    length: 108,
    sourceSlug: 'lampa-svetodiodnaya-std-a60-10w-6500-4000k-e27',
  },
  {
    power: 12,
    luminousFlux: 1020,
    length: 108,
    sourceSlug: 'lampa-svetodiodnaya-std-a60-12w-6500-4000k-e27',
  },
  {
    power: 15,
    luminousFlux: 1275,
    length: 108,
    sourceSlug: 'lampa-svetodiodnaya-std-a60-15w-6500-4000k-e27',
  },
  {
    power: 20,
    luminousFlux: 1700,
    length: 118,
    sourceSlug: 'lampa-svetodiodnaya-std-a60-20w-6500-4000k-e27',
  },
]

export const lampsStdA60Data: SubcategoryData = {
  subcategory,
  products: MODELS.map((model) => {
    const name = `Лампа светодиодная STD-A60 ${model.power} Вт E27`
    return lampProduct({
      subcategory,
      slug: `lampa-svetodiodnaya-std-a60-${model.power}vt-e27`,
      name,
      summary: `Светодиодная лампа E27, ${model.power} Вт, ${model.luminousFlux} лм, 4000 К или 6500 К.`,
      description: [
        `${name} — светодиодная лампа в колбе формы A60 с цоколем E27. Потребляемая мощность — ${model.power} Вт, световой поток — ${model.luminousFlux} лм, цветовая температура — на выбор, 4000 К или 6500 К, срок службы — 30 000 часов. Габаритные размеры — ${lampSize(model.length, 60)}, частота сети — 50 Гц.`,
        CHOICE_NOTE,
      ],
      specs: {
        kind: 'Светодиодная',
        socket: 'E27',
        power: model.power,
        luminousFlux: model.luminousFlux,
        colorTemperature: SELECTABLE_TEMPERATURE,
        frequency: 50,
        lifetime: '30 000 часов',
        size: lampSize(model.length, 60),
      },
      sourceUrl: `${SOURCE}/${model.sourceSlug}/`,
    })
  }),
}
