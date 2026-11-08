import {
  FIXTURE_CATEGORY,
  FIXTURE_PRICE_FAQ,
  fixtureProduct,
  fixtureSize,
  IP40_NOTE,
  IP65_NOTE,
} from '../fixture-builders'
import type { SubcategoryData } from '../types'

// Факты о светильниках: страницы luxlighting.by (см. sourceUrl). Описаний и производителя там нет,
// тексты написаны поверх характеристик и общего текста раздела (docs/specs/content.md).
// В источнике раздел делится на «Без монтажной пластины» (LED-TS, LED-M) и «С монтажной пластиной» (LED-GS);
// у нас один раздел, а наличие пластины вынесено в характеристику «Монтажная пластина».
const subcategory: SubcategoryData['subcategory'] = {
  slug: 'svetilniki-dlya-led-lamp-t8-g13-ip65',
  categorySlug: FIXTURE_CATEGORY,
  title: 'Светильники для LED ламп T8 G13 IP65',
  description: 'Пылевлагозащищённые светильники для светодиодных ламп T8 с цоколем G13',
  seoTitle: 'Светильники для LED ламп T8 G13 IP65 в Беларуси',
  seoDescription:
    'Светильники для светодиодных ламп T8 с цоколем G13 на 1 и 2 лампы, степень защиты IP65, с монтажной пластиной и без: размеры, характеристики. Цена по запросу.',
  intro: [
    'Светильники LED-TS, LED-GS и LED-M рассчитаны на светодиодные лампы T8 с цоколем G13: их выпускают на одну и две лампы длиной 600, 1200 и 1500 мм. Степень защиты IP65 у большинства моделей позволяет использовать их в сухих и влажных помещениях. По данным каталога, светильники предназначены для общего освещения административных, общественных, производственных, торговых и других помещений.',
    'Модели делятся на светильники с монтажной пластиной (LED-GS) и без неё (LED-TS, LED-M). Ниже — расшифровка обозначений, параметры, советы по выбору и список моделей для заказа.',
  ],
  sections: [
    {
      heading: 'Расшифровка обозначений',
      items: [
        '«T8 G13» — светильник рассчитан на трубчатые лампы T8 (диаметр около 26 мм) с двухштырьковым цоколем G13;',
        '«LED-TS», «LED-GS», «LED-M» — серии светильников; по разделам каталога LED-GS идут с монтажной пластиной, LED-TS и LED-M без неё;',
        '«1×1200», «2×600» и т. п. — число ламп и их номинальная длина в миллиметрах;',
        '«IP65», «IP40» — степень защиты от пыли и влаги.',
      ],
    },
    {
      heading: 'Где применяют светильники для ламп T8',
      paragraphs: [
        'По данным каталога, светильники этой группы универсальны: степень защиты IP65 позволяет использовать их в сухих и влажных помещениях, монтаж возможен накладной и подвесной. Они предназначены для общего освещения административных, общественных, производственных, торговых и других помещений.',
        IP65_NOTE,
        'Исключение — модель LED-M-2×1200: у неё степень защиты IP40, корпус из металла и рассеиватель из поликарбоната, она рассчитана на сухие помещения. Лампы в её комплект поставки не входят.',
      ],
    },
    {
      heading: 'Основные параметры',
      paragraphs: ['Значения указаны по данным каталога.'],
      items: [
        'цоколь ламп: G13;',
        'степень защиты: IP65 (LED-M-2×1200: IP40);',
        'температура эксплуатации: от −10 до +40 °С (для моделей, где она указана);',
        'частота сети: 50/60 Гц (LED-M-2×1200: 50 Гц);',
        'материал корпуса: поликарбонат (LED-M-2×1200: металл);',
        'цветовая температура зависит от установленной лампы;',
        'габаритные размеры: от 660×107×61 мм (2×600) до 1590×104×61 мм (2×1500).',
      ],
    },
    {
      heading: 'Как выбрать светильник для ламп T8',
      paragraphs: [
        'Если не уверены в выборе, оформите заявку: менеджер свяжется с вами и уточнит детали. Основные критерии выбора:',
      ],
      items: [
        'Лампы. Светильник должен соответствовать длине ламп (600, 1200 или 1500 мм) и их числу (1 или 2). Оттенок света и мощность определяет сама лампа.',
        'Комплектация. У модели LED-M-2×1200 лампы в комплект не входят, по остальным моделям комплектацию уточняйте у менеджера.',
        'Монтажная пластина. Светильники LED-GS идут с монтажной пластиной, LED-TS и LED-M без неё: выбирайте по способу крепления на объекте.',
        'Условия. Для пыльных и влажных помещений нужна степень защиты IP65, для сухих хватит IP40.',
      ],
    },
  ],
  faq: [
    {
      question: 'Лампы входят в комплект?',
      answer:
        'У модели LED-M-2×1200 по данным каталога лампы в комплект поставки не входят. По остальным моделям комплектацию уточняйте у менеджера до заказа.',
    },
    {
      question: 'Какие лампы подходят к светильникам?',
      answer:
        'Светильники рассчитаны на лампы T8 с цоколем G13, в названии указаны число ламп и их длина. Лампы можно подобрать в разделах «Лампы светодиодные T8 G13» и «Лампы люминесцентные T8 G13».',
    },
    {
      question: 'Чем отличаются светильники с монтажной пластиной и без неё?',
      answer:
        'В каталоге светильники LED-GS идут с монтажной пластиной, LED-TS и LED-M без неё. Пластина облегчает крепление светильника на потолок или стену; подробности по каждой модели уточняйте у менеджера.',
    },
    {
      question: 'Подходят ли светильники для влажных помещений?',
      answer: `${IP65_NOTE} Исключение — модель LED-M-2×1200 со степенью защиты IP40. ${IP40_NOTE}`,
    },
    FIXTURE_PRICE_FAQ,
  ],
  sources: [
    'https://luxlighting.by/product-category/led-fixtures/led-floodlights-t8-g13-ip65/',
    'https://luxlighting.by/product-category/led-fixtures/led-floodlights-t8-g13-ip65/led-ts/',
    'https://luxlighting.by/product-category/led-fixtures/led-floodlights-t8-g13-ip65/led-gs/',
  ],
}

const SOURCE = 'https://luxlighting.by/product'

interface Model {
  /** «LED-TS-1×1200» */
  code: string
  slug: string
  lamps: number
  lampLength: number
  size: [number, number, number]
  ip: 40 | 65
  housing: string
  diffuser?: string
  frequency: string
  /** Температура эксплуатации указана не у всех */
  operatingTemperature?: string
  mountingPlate: boolean
  sourceSlug: string
}

const TEMPERATURE = 'от −10 до +40 °С'

const MODELS: Model[] = [
  {
    code: 'LED-TS-1×1200',
    slug: 'svetilnik-dlya-led-lamp-t8-g13-led-ts-1x1200-ip65',
    lamps: 1,
    lampLength: 1200,
    size: [1263, 68, 65],
    ip: 65,
    housing: 'Поликарбонат',
    frequency: '50/60 Гц',
    operatingTemperature: TEMPERATURE,
    mountingPlate: false,
    sourceSlug: 'svetilnik-promyshlennyj-dlya-svetodiodnyh-lamp-t8-g13-led-ts-1x1200-ip65',
  },
  {
    code: 'LED-TS-2×600',
    slug: 'svetilnik-dlya-led-lamp-t8-g13-led-ts-2x600-ip65',
    lamps: 2,
    lampLength: 600,
    size: [660, 107, 61],
    ip: 65,
    housing: 'Поликарбонат',
    frequency: '50/60 Гц',
    operatingTemperature: TEMPERATURE,
    mountingPlate: false,
    sourceSlug: 't8-g13-led-ts-2x600-ip65',
  },
  {
    code: 'LED-TS-2×1200',
    slug: 'svetilnik-dlya-led-lamp-t8-g13-led-ts-2x1200-ip65',
    lamps: 2,
    lampLength: 1200,
    size: [1260, 107, 61],
    ip: 65,
    housing: 'Поликарбонат',
    frequency: '50/60 Гц',
    operatingTemperature: TEMPERATURE,
    mountingPlate: false,
    sourceSlug: 't8-g13-led-ts-2x1200-ip65',
  },
  {
    code: 'LED-TS-2×1500',
    slug: 'svetilnik-dlya-led-lamp-t8-g13-led-ts-2x1500-ip65',
    lamps: 2,
    lampLength: 1500,
    size: [1590, 104, 61],
    ip: 65,
    housing: 'Поликарбонат',
    frequency: '50/60 Гц',
    operatingTemperature: TEMPERATURE,
    mountingPlate: false,
    sourceSlug: 'svetilnik-promyshlennyj-dlya-svetodiodnyh-lamp-t8-g13-led-ts-2x1500-ip65',
  },
  {
    code: 'LED-GS-2×600',
    slug: 'svetilnik-dlya-led-lamp-t8-g13-led-gs-2x600-ip65',
    lamps: 2,
    lampLength: 600,
    size: [657, 106, 90],
    ip: 65,
    housing: 'Поликарбонат',
    frequency: '50/60 Гц',
    operatingTemperature: TEMPERATURE,
    mountingPlate: true,
    sourceSlug: 't8-g13-led-gs-2x600-ip65',
  },
  {
    code: 'LED-GS-2×1200',
    slug: 'svetilnik-dlya-led-lamp-t8-g13-led-gs-2x1200-ip65',
    lamps: 2,
    lampLength: 1200,
    size: [1263, 106, 90],
    ip: 65,
    housing: 'Поликарбонат',
    frequency: '50/60 Гц',
    operatingTemperature: TEMPERATURE,
    mountingPlate: true,
    sourceSlug: 't8-g13-led-gs-2x1200-ip65',
  },
  {
    code: 'LED-M-2×1200',
    slug: 'svetilnik-dlya-led-lamp-t8-g13-led-m-2x1200-ip40',
    lamps: 2,
    lampLength: 1200,
    size: [1330, 125, 45],
    ip: 40,
    housing: 'Металл',
    diffuser: 'Поликарбонат',
    frequency: '50 Гц',
    mountingPlate: false,
    sourceSlug: 'svetilnik-promyshlennyj-dlya-svetodiodnyh-lamp-t8-g13-led-m-2x1200-ip40',
  },
]

export const fixturesT8Ip65Data: SubcategoryData = {
  subcategory,
  products: MODELS.map((model) => {
    const name = `Светильник для ламп T8 ${model.code} IP${model.ip}`
    const size = fixtureSize(...model.size)
    const lampsText = model.lamps === 1 ? 'одну лампу' : 'две лампы'
    const isMetal = model.ip === 40
    return fixtureProduct({
      subcategory,
      slug: model.slug,
      name,
      summary: `Светильник на ${model.lamps === 1 ? '1 лампу' : '2 лампы'} T8 G13 длиной ${model.lampLength} мм, IP${model.ip}.`,
      description: [
        `${name} — светильник для светодиодных ламп T8 с цоколем G13, рассчитан на ${lampsText} длиной ${model.lampLength} мм. Степень защиты — IP${model.ip}, корпус из ${isMetal ? 'металла, рассеиватель из поликарбоната' : 'поликарбоната'}. Габаритные размеры — ${size}.`,
        `${
          model.mountingPlate
            ? 'По разделу каталога светильник идёт с монтажной пластиной. '
            : 'По разделу каталога светильник идёт без монтажной пластины. '
        }Частота сети — ${model.frequency}${model.operatingTemperature ? `, температура эксплуатации — ${model.operatingTemperature}` : ''}. Цветовая температура света зависит от установленной лампы.`,
        isMetal
          ? 'Лампы в комплект поставки не входят. Светильник рассчитан на сухие помещения; для пыльных и влажных помещений выбирайте модели со степенью защиты IP65.'
          : 'Комплектацию (входят ли лампы) уточняйте у менеджера до заказа. По данным каталога, светильники этой группы предназначены для общего освещения административных, общественных, производственных, торговых и других помещений.',
      ],
      specs: {
        kind: 'Светильник для светодиодных ламп',
        colorTemperature: 'Зависит от лампы',
        frequency: model.frequency,
        ip: model.ip,
        operatingTemperature: model.operatingTemperature,
        housing: model.housing,
        diffuser: model.diffuser,
        socket: 'G13',
        lamps: `${model.lamps} × T8, ${model.lampLength} мм`,
        mountingPlate: model.mountingPlate,
        size,
      },
      sourceUrl: `${SOURCE}/${model.sourceSlug}/`,
    })
  }),
}
