import {
  BELROSCABEL,
  BELTELECABEL,
  CORE_USE,
  cableSpecs,
  coresPhrase,
  formatNumber,
  type Manufacturer,
  PVC,
  sizeLabel,
  slugNumber,
} from '../builders'
import type { Product, SubcategoryData } from '../types'

// Факты о товарах: страницы elswi.by (см. sourceUrl). Параметры эксплуатации группы кабелей:
// каталог СЗАО «Белтелекабель». Тексты пишем поверх фактов (docs/specs/content.md).
const subcategory: SubcategoryData['subcategory'] = {
  slug: 'kabel-avvg',
  categorySlug: 'kabel-provod',
  title: 'Кабель АВВГ',
  description: 'Силовой кабель с алюминиевыми жилами и ПВХ-изоляцией без брони, 0,66 кВ',
  seoTitle: 'Кабель АВВГ и АВВГ-П в Беларуси: силовой, 0,66 кВ',
  seoDescription:
    'Силовой кабель АВВГ и плоский АВВГ-П с алюминиевыми жилами на 0,66 кВ: сечения, число жил, характеристики. Цена по запросу, заказ через заявку.',
  intro: [
    'АВВГ — силовой кабель с алюминиевыми токопроводящими жилами, изоляцией и оболочкой из ПВХ-пластиката, без защитных покровов (брони). Его применяют для передачи и распределения электроэнергии в стационарных установках на номинальное переменное напряжение в основном 0,66 и 1 кВ при температуре окружающей среды от −50 до +50 °С.',
    'Кабель выпускают в двух исполнениях: круглом (АВВГ) и плоском (АВВГ-П). Ниже — расшифровка маркировки, основные параметры, советы по выбору и список типоразмеров для заказа.',
  ],
  sections: [
    {
      heading: 'Расшифровка маркировки АВВГ',
      items: [
        '«А» — алюминиевые жилы;',
        '«В» — изоляция из ПВХ-пластиката (винила);',
        '«В» — оболочка из ПВХ-пластиката (винила);',
        '«Г» — отсутствие брони (голый);',
        '«П» в АВВГ-П — плоское исполнение кабеля.',
      ],
    },
    {
      heading: 'Круглый или плоский кабель',
      paragraphs: [
        'Исполнение выбирают по способу прокладки: плоский кабель тоньше и ложится вдоль поверхности, круглый удобнее протягивать в трубах и заводить в кабельные вводы.',
        'У плоского кабеля размер сечения указывают двумя числами (ширина и высота), у круглого — одним наружным диаметром.',
      ],
    },
    {
      heading: 'Где применяют кабель АВВГ',
      paragraphs: [
        'Кабель предназначен для стационарных электроустановок: передачи и распределения электроэнергии на переменное напряжение 0,66 и 1 кВ частотой 50 Гц.',
        'Брони у кабеля нет, поэтому там, где возможны механические повреждения, выбирайте бронированные исполнения, например АВБбШв.',
      ],
    },
    {
      heading: 'Основные параметры',
      paragraphs: [
        'Значения ниже приведены по данным каталога СЗАО «Белтелекабель» для группы силовых кабелей, в которую входят АВВГ и АВВГ-П. У кабеля другого завода значения могут отличаться, ориентируйтесь на его паспорт.',
      ],
      items: [
        'номинальное напряжение: 0,66 и 1 кВ, частота 50 Гц;',
        'температура эксплуатации: от −50 до +50 °С;',
        'прокладка без предварительного подогрева: при температуре не ниже −15 °С;',
        'допустимая температура нагрева жил при эксплуатации: 70 °С;',
        'срок службы: 30 лет;',
        'гарантийный срок: 5 лет с даты ввода в эксплуатацию, но не позднее 6 месяцев с даты изготовления.',
      ],
    },
    {
      heading: 'Как выбрать кабель АВВГ',
      paragraphs: [
        'Если не уверены в выборе, оформите заявку: менеджер свяжется с вами и уточнит детали. Основные критерии выбора:',
      ],
      items: [
        'Число жил. Две жилы подходят для однофазной цепи, четыре — для трёхфазной сети с нулевой жилой, пять — для трёхфазной сети с раздельными нулевой и защитной жилами.',
        'Сечение. Его подбирают по расчётной токовой нагрузке и длине линии (падению напряжения) в соответствии с проектом и ПУЭ. Алюминиевым жилам при той же нагрузке требуется большее сечение, чем медным.',
        'Негорючесть. В маркировке нет индекса «нг», кабель не рассчитан на требования к нераспространению горения при групповой прокладке. Если их предъявляет проект, нужны исполнения с индексом «нг», например ВВГнг-LS.',
      ],
    },
  ],
  faq: [
    {
      question: 'Чем АВВГ отличается от ВВГ?',
      answer:
        'В АВВГ жилы алюминиевые, в ВВГ медные: отсутствие буквы «А» в начале маркировки означает медные жилы. Алюминиевым жилам при той же нагрузке требуется большее сечение.',
    },
    {
      question: 'Чем АВВГ-П отличается от АВВГ?',
      answer:
        'Материалы и назначение у них одинаковые, различается форма: АВВГ-П плоский, АВВГ круглый. Форму выбирают по способу прокладки.',
    },
    {
      question: 'Почему на сайте нет цены?',
      answer:
        'Цены на сайте не публикуются, у каждого товара указано «Цена по запросу». Добавьте нужные позиции в корзину и отправьте заявку, менеджер свяжется с вами.',
    },
  ],
  sources: [
    'https://beltelecabel.by/production/kabeli-silovye-6/',
    'https://elswi.by/kabel-provod/kabel-avvg/kabel-avvg-p-2kh6-0-0-66/',
  ],
}

interface Input {
  flat: boolean
  cores: 2 | 3 | 4 | 5
  section: number
  /** Размеры в миллиметрах, как в источнике: «17» для круглого, «7×11» для плоского */
  outerDiameter?: string
  manufacturer: Manufacturer
  sourceUrl: string
}

function avvg(input: Input): Product {
  const { flat, cores, section, outerDiameter, manufacturer } = input
  const series = flat ? 'АВВГ-П' : 'АВВГ'
  const size = sizeLabel(cores, section)
  const name = `Кабель ${series} ${size} - 0,66 кВ`

  const description = [
    `${name} — силовой кабель с алюминиевыми жилами: ${coresPhrase(cores, ['однопроволочная', 'однопроволочные', 'однопроволочных'])} сечением ${section} мм², изоляция и оболочка из ПВХ-пластиката, без брони. Номинальное напряжение — 0,66 кВ.`,
    `${flat ? 'Плоское исполнение: кабель ложится вдоль поверхности.' : 'Круглое исполнение: кабель удобно протягивать в трубах.'} ${CORE_USE[cores]}`,
    `Кабель выпускает ${manufacturer.legalName}, страна происхождения — Беларусь, гарантийный срок — 5 лет.`,
  ]
  if (outerDiameter) {
    description.push(
      flat
        ? `Размеры сечения кабеля — ${outerDiameter} мм. Их учитывают при выборе креплений и каналов для прокладки.`
        : `Наружный диаметр кабеля — ${outerDiameter} мм. Его учитывают при выборе кабельных вводов, труб и креплений.`,
    )
  }

  return {
    slug: `kabel-${flat ? 'avvg-p' : 'avvg'}-${cores}x${slugNumber(section)}`,
    categorySlug: subcategory.categorySlug,
    subcategorySlug: subcategory.slug,
    name,
    summary: `${flat ? 'Плоский силовой кабель' : 'Силовой кабель'}, алюминиевые жилы ${size} мм², 0,66 кВ, ПВХ.`,
    description,
    specs: cableSpecs({
      series,
      manufacturer,
      cores,
      section: formatNumber(section),
      voltage: '0,66 кВ',
      material: 'Алюминий',
      conductorClass: '1, однопроволочная',
      shape: flat ? 'Плоский' : 'Круглый',
      insulation: PVC,
      sheath: PVC,
      color: { name: 'Цвет оболочки', value: 'Чёрный' },
      noFlame: false,
      lowSmoke: false,
      outerDiameter: outerDiameter ? `${outerDiameter} мм` : undefined,
      guarantee: '5 лет',
    }),
    brand: manufacturer.brand,
    price: null,
    sourceUrl: input.sourceUrl,
  }
}

const SOURCE = 'https://elswi.by/kabel-provod'

const products: Product[] = [
  avvg({
    flat: true,
    cores: 2,
    section: 6,
    outerDiameter: '7×11',
    manufacturer: BELROSCABEL,
    sourceUrl: `${SOURCE}/kabel-avvg/kabel-avvg-p-2kh6-0-0-66/`,
  }),
  avvg({
    flat: true,
    cores: 2,
    section: 10,
    outerDiameter: '13×8',
    manufacturer: BELROSCABEL,
    sourceUrl: `${SOURCE}/kabel-avvg/kabel-avvg-p-2kh10-0-0-66/`,
  }),
  avvg({
    flat: true,
    cores: 2,
    section: 16,
    manufacturer: BELTELECABEL,
    sourceUrl: `${SOURCE}/avvg-avvgng-avvgng-ls/kabel-avvg-p-2h16-0-0-66-kv-btk/`,
  }),
  avvg({
    flat: true,
    cores: 3,
    section: 2.5,
    outerDiameter: '5×11',
    manufacturer: BELROSCABEL,
    sourceUrl: `${SOURCE}/kabel-avvg/kabel-avvg-p-3kh2-5-0-66/`,
  }),
  avvg({
    flat: false,
    cores: 4,
    section: 10,
    outerDiameter: '17',
    manufacturer: BELROSCABEL,
    sourceUrl: `${SOURCE}/kabel-avvg/kabel-avvg-4kh10-0-0-66/`,
  }),
  avvg({
    flat: false,
    cores: 4,
    section: 16,
    outerDiameter: '19',
    manufacturer: BELTELECABEL,
    sourceUrl: `${SOURCE}/avvg-avvgng-avvgng-ls/kabel-avvg-4h16-0-0-66-kv-btk/`,
  }),
  avvg({
    flat: false,
    cores: 5,
    section: 6,
    manufacturer: BELTELECABEL,
    sourceUrl: `${SOURCE}/avvg-avvgng-avvgng-ls/kabel-avvg-5h6-0-0-66-kv-btk/`,
  }),
  avvg({
    flat: false,
    cores: 5,
    section: 10,
    outerDiameter: '18',
    manufacturer: BELROSCABEL,
    sourceUrl: `${SOURCE}/avvg-avvgng-avvgng-ls/kabel-avvg-5h10-0-0-66-kv/`,
  }),
  avvg({
    flat: false,
    cores: 5,
    section: 16,
    outerDiameter: '20',
    manufacturer: BELROSCABEL,
    sourceUrl: `${SOURCE}/kabel-avvg/kabel-avvg-5kh16-0-0-66/`,
  }),
]

export const avvgData: SubcategoryData = { subcategory, products }
