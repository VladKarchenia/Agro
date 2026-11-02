import {
  AVTOPROVOD,
  BELROSCABEL,
  CORE_USE,
  cableSpecs,
  coresPhrase,
  formatNumber,
  type Manufacturer,
  PVC_REDUCED_FIRE,
  sizeLabel,
  slugNumber,
} from '../builders'
import type { Product, SubcategoryData } from '../types'

// Факты о товарах: страницы elswi.by (см. sourceUrl). Параметры и свойства при пожаре:
// страница ВВГнг(А)-LS каталога СЗАО «Белтелекабель». Тексты пишем поверх фактов (docs/specs/content.md).
const subcategory: SubcategoryData['subcategory'] = {
  slug: 'kabel-vvgng-ls',
  categorySlug: 'kabel-provod',
  title: 'Кабель ВВГнг-LS',
  description:
    'Силовой медный кабель, не распространяющий горение, с пониженным дымо- и газовыделением, 0,66 кВ',
  seoTitle: 'Кабель ВВГнг-LS в Беларуси: медный, не распространяет горение',
  seoDescription:
    'Силовой медный кабель ВВГнг(А)-LS и плоский ВВГ-Пнг(А)-LS на 0,66 кВ: не распространяет горение, пониженное дымо- и газовыделение. Цена по запросу.',
  intro: [
    'ВВГнг-LS — силовой кабель с медными жилами, изоляцией и оболочкой из ПВХ-пластиката пониженной пожарной опасности, без защитных покровов (брони). Кабель не распространяет горение при групповой прокладке и выделяет мало дыма и газа. Его применяют в стационарных установках на номинальное переменное напряжение в основном 0,66 и 1 кВ.',
    'Кабель выпускают круглым — ВВГнг(А)-LS и плоским — ВВГ-Пнг(А)-LS. Ниже — расшифровка маркировки, свойства при пожаре, основные параметры, советы по выбору и список типоразмеров для заказа.',
  ],
  sections: [
    {
      heading: 'Расшифровка маркировки ВВГнг-LS',
      items: [
        'отсутствие буквы «А» в начале — медные жилы;',
        '«В» — изоляция из ПВХ-пластиката (винила);',
        '«В» — оболочка из ПВХ-пластиката (винила);',
        '«Г» — отсутствие брони (голый);',
        '«нг-LS» — не распространяет горение при групповой прокладке, с пониженным дымо- и газовыделением;',
        '«(А)» — категория А групповой прокладки;',
        '«П» в ВВГ-Пнг(А)-LS — плоское исполнение кабеля.',
      ],
    },
    {
      heading: 'Свойства при пожаре',
      paragraphs: ['По данным СЗАО «Белтелекабель», кабель этого типа обладает такими свойствами:'],
      items: [
        'не распространяет горение при групповой прокладке по категории А;',
        'дымообразование при горении и тлении не приводит к снижению светопроницаемости в испытательной камере более чем на 50 %;',
        'массовая доля хлористого водорода, выделяющегося при горении, не более 10 %.',
      ],
    },
    {
      heading: 'Где применяют кабель ВВГнг-LS',
      paragraphs: [
        'По данным производителя, кабели применяют при групповой прокладке в кабельных сооружениях и помещениях, в том числе в пожароопасных и взрывоопасных зонах, при отсутствии опасности механических повреждений в процессе эксплуатации, за исключением взрывоопасных зон классов В-1 и В-1а.',
        'Брони у кабеля нет, поэтому там, где возможны механические повреждения, выбирайте бронированные исполнения.',
      ],
    },
    {
      heading: 'Основные параметры',
      paragraphs: [
        'Значения ниже приведены по данным каталогов СЗАО «Белтелекабель» и ОАО «Щучинский завод «Автопровод» для кабеля ВВГнг(А)-LS (ГОСТ 31996-2012); температуры нагрева жил и прокладки — по каталогу «Белтелекабеля». У кабеля другого завода значения могут отличаться, ориентируйтесь на его паспорт.',
      ],
      items: [
        'номинальное напряжение: 0,66 и 1 кВ, частота 50 Гц;',
        'температура эксплуатации: от −50 до +50 °С;',
        'прокладка без предварительного подогрева: при температуре не ниже −15 °С;',
        'допустимая температура нагрева жил: длительно 70 °С, в режиме перегрузки 90 °С;',
        'минимальный радиус изгиба при прокладке многожильных кабелей: 7,5 наружных диаметров (для плоского кабеля уточняйте по паспорту);',
        'срок службы: не менее 30 лет;',
        'относительная влажность воздуха при эксплуатации: до 98 % при температуре 35 °С;',
        'изоляция нулевых жил голубого цвета, жил заземления — зелёно-жёлтого;',
        'гарантийный срок: 5 лет с даты ввода в эксплуатацию, но не позднее 6 месяцев с даты изготовления.',
      ],
    },
    {
      heading: 'Как выбрать кабель ВВГнг-LS',
      paragraphs: [
        'Если не уверены в выборе, оформите заявку: менеджер свяжется с вами и уточнит детали. Основные критерии выбора:',
      ],
      items: [
        'Требования к пожарной безопасности. Индексы «нг(А)-LS» нужны там, где проект требует нераспространения горения при групповой прокладке и пониженного дымо- и газовыделения.',
        'Число жил. Две жилы подходят для однофазной цепи, три — для однофазной цепи с защитным проводником, пять — для трёхфазной сети с раздельными нулевой и защитной жилами.',
        'Сечение. Его подбирают по расчётной токовой нагрузке и длине линии (падению напряжения) в соответствии с проектом и ПУЭ.',
        'Исполнение. Плоский кабель тоньше и ложится вдоль поверхности, круглый удобнее протягивать в трубах.',
      ],
    },
  ],
  faq: [
    {
      question: 'Чем ВВГнг-LS отличается от обычного ВВГ?',
      answer:
        'У ВВГнг-LS изоляция и оболочка из ПВХ-пластиката пониженной пожарной опасности: кабель не распространяет горение при групповой прокладке и выделяет меньше дыма и газа. Обычный ВВГ такими свойствами в маркировке не обладает.',
    },
    {
      question: 'Чем ВВГнг-LS отличается от АВВГ?',
      answer:
        'В ВВГнг-LS жилы медные, в АВВГ алюминиевые (буква «А» в начале маркировки). Кроме того, ВВГнг-LS не распространяет горение при групповой прокладке, а у АВВГ в маркировке нет индекса «нг».',
    },
    {
      question: 'Что означает LS в маркировке?',
      answer:
        'Индекс LS обозначает пониженное дымо- и газовыделение при горении и тлении кабеля. Он идёт вместе с индексом «нг» — нераспространением горения при групповой прокладке.',
    },
    {
      question: 'Почему на сайте нет цены?',
      answer:
        'Цены на сайте не публикуются, у каждого товара указано «Цена по запросу». Добавьте нужные позиции в корзину и отправьте заявку, менеджер свяжется с вами.',
    },
  ],
  sources: [
    'https://beltelecabel.by/catalog/kabeli-silovye',
    'https://avtoprovod.com/kabeli-silovyie-s-polivinilxloridnoj-izolyacziej-i-obolochkoj',
    'https://elswi.by/kabel-provod/vvgng-ls-vvgng-frls/kabel-vvg-png-a-ls-2h1-5-n-660v-buhtoy/',
  ],
}

interface Input {
  flat: boolean
  cores: 2 | 3 | 5
  section: number
  /** Размеры в миллиметрах, как в источнике: «10» для круглого, «5×8» для плоского */
  outerDiameter?: string
  /** Не задаётся, если источник производителя не называет */
  manufacturer?: Manufacturer
  sourceUrl: string
}

function vvgngLs(input: Input): Product {
  const { flat, cores, section, outerDiameter, manufacturer } = input
  const series = flat ? 'ВВГ-Пнг(А)-LS' : 'ВВГнг(А)-LS'
  const size = sizeLabel(cores, section)
  const name = `Кабель ${series} ${size} - 0,66 кВ`

  const description = [
    `${name} — силовой кабель с медными жилами: ${coresPhrase(cores, ['однопроволочная', 'однопроволочные', 'однопроволочных'])} сечением ${section} мм², изоляция и оболочка из ПВХ-пластиката пониженной пожарной опасности, без брони. Номинальное напряжение — 0,66 кВ.`,
    'Кабель не распространяет горение при групповой прокладке (нг(А)) и имеет пониженное дымо- и газовыделение (LS).',
    `${flat ? 'Плоское исполнение: кабель ложится вдоль поверхности.' : 'Круглое исполнение: кабель удобно протягивать в трубах.'} ${CORE_USE[cores]}`,
  ]
  if (manufacturer) {
    description.push(
      `Кабель выпускает ${manufacturer.legalName}, страна происхождения — Беларусь, гарантийный срок — 5 лет.`,
    )
  }
  if (outerDiameter) {
    description.push(
      flat
        ? `Размеры сечения кабеля — ${outerDiameter} мм. Их учитывают при выборе креплений и каналов для прокладки.`
        : `Наружный диаметр кабеля — ${outerDiameter} мм. Его учитывают при выборе кабельных вводов, труб и креплений.`,
    )
  }

  return {
    slug: `kabel-${flat ? 'vvg-png-a-ls' : 'vvg-ng-a-ls'}-${cores}x${slugNumber(section)}`,
    categorySlug: subcategory.categorySlug,
    subcategorySlug: subcategory.slug,
    name,
    summary: `${flat ? 'Плоский медный кабель' : 'Медный кабель'} ${size} мм², не распространяет горение, 0,66 кВ.`,
    description,
    specs: cableSpecs({
      series,
      manufacturer,
      cores,
      section: formatNumber(section),
      voltage: '0,66 кВ',
      material: 'Медь',
      conductorClass: '1, однопроволочная',
      shape: flat ? 'Плоский' : 'Круглый',
      insulation: PVC_REDUCED_FIRE,
      sheath: PVC_REDUCED_FIRE,
      color: { name: 'Цвет оболочки', value: 'Чёрный' },
      noFlame: true,
      lowSmoke: true,
      outerDiameter: outerDiameter ? `${outerDiameter} мм` : undefined,
      guarantee: manufacturer ? '5 лет' : undefined,
    }),
    brand: manufacturer?.brand,
    price: null,
    sourceUrl: input.sourceUrl,
  }
}

const SOURCE = 'https://elswi.by/kabel-provod'

const products: Product[] = [
  vvgngLs({
    flat: true,
    cores: 2,
    section: 1.5,
    outerDiameter: '5×8',
    manufacturer: AVTOPROVOD,
    sourceUrl: `${SOURCE}/vvgng-ls-vvgng-frls/kabel-vvg-png-a-ls-2h1-5-n-660v-buhtoy/`,
  }),
  vvgngLs({
    flat: true,
    cores: 2,
    section: 2.5,
    outerDiameter: '7×9',
    manufacturer: AVTOPROVOD,
    sourceUrl: `${SOURCE}/vvgng-ls-vvgng-frls/kabel-vvg-png-a-ls-2h2-5-n-660v-buhtoy/`,
  }),
  vvgngLs({
    flat: true,
    cores: 3,
    section: 1.5,
    outerDiameter: '6×10',
    manufacturer: AVTOPROVOD,
    sourceUrl: `${SOURCE}/vvgng-ls-vvgng-frls/kabel-vvg-png-a-ls-3h1-5-n-660v-buhtoy/`,
  }),
  vvgngLs({
    flat: true,
    cores: 3,
    section: 2.5,
    outerDiameter: '6×12',
    manufacturer: AVTOPROVOD,
    sourceUrl: `${SOURCE}/vvgng-ls-vvgng-frls/kabel-vvg-png-a-ls-3h2-5-n-660v-buhtoy/`,
  }),
  vvgngLs({
    flat: true,
    cores: 3,
    section: 4,
    outerDiameter: '7×13',
    manufacturer: AVTOPROVOD,
    sourceUrl: `${SOURCE}/kabel-vvgng-ls/vvgng-ls/kabel-vvg-png-a-ls-3kh4-0-n-660v/`,
  }),
  vvgngLs({
    flat: true,
    cores: 3,
    section: 6,
    outerDiameter: '8×16',
    manufacturer: AVTOPROVOD,
    sourceUrl: `${SOURCE}/kabel-vvgng-ls/vvgng-ls/kabel-vvg-png-a-ls-3kh6-0-n-660v/`,
  }),
  vvgngLs({
    flat: false,
    cores: 5,
    section: 1.5,
    outerDiameter: '10',
    manufacturer: BELROSCABEL,
    sourceUrl: `${SOURCE}/vvgng-ls-vvgng-frls/kabel-vvg-ng-a-ls-5h1-5-0-66-kv/`,
  }),
  vvgngLs({
    flat: false,
    cores: 5,
    section: 2.5,
    outerDiameter: '11',
    manufacturer: AVTOPROVOD,
    sourceUrl: `${SOURCE}/kabel-vvgng-ls/kabel-vvg-ng-a-ls-5kh2-5-n-660v/`,
  }),
  // 5х6: страницы с этим типоразмером на источнике нет, добавлено по просьбе заказчика.
  // Производитель и гарантия, как у соседних типоразмеров по подтверждению заказчика. Диаметр не указан:
  // на сайте завода таблицы размеров нет, вычислять его по соседним размерам нельзя.
  vvgngLs({
    flat: false,
    cores: 5,
    section: 6,
    manufacturer: AVTOPROVOD,
    sourceUrl: `${SOURCE}/kabel-vvgng-ls/vvgng-ls/kabel-vvg-ng-a-ls-5kh10-0-n-660v/`,
  }),
  vvgngLs({
    flat: false,
    cores: 5,
    section: 10,
    outerDiameter: '18',
    manufacturer: AVTOPROVOD,
    sourceUrl: `${SOURCE}/kabel-vvgng-ls/vvgng-ls/kabel-vvg-ng-a-ls-5kh10-0-n-660v/`,
  }),
]

export const vvgngLsData: SubcategoryData = { subcategory, products }
