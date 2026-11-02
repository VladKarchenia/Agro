import type { ProductSpec } from './types'

// Общие помощники для описания кабельной продукции: числа, склонения, характеристики.

export interface Manufacturer {
  brand: string
  legalName: string
}

export const BELROSCABEL: Manufacturer = {
  brand: 'БелРоскабель',
  legalName: 'ООО Завод «БелРоскабель»',
}
export const BELTELECABEL: Manufacturer = {
  brand: 'Белтелекабель',
  legalName: 'СЗАО «Белтелекабель»',
}
export const AVTOPROVOD: Manufacturer = {
  brand: 'Автопровод',
  legalName: 'ОАО Щучинский завод «Автопровод»',
}
export const ENERGOKOMPLEKT: Manufacturer = {
  brand: 'Энергокомплект',
  legalName: 'ООО «ПО «Энергокомплект»',
}

/** 2.5 → «2,5» */
export const formatNumber = (value: number) => String(value).replace('.', ',')

/** 2.5 → «2-5»: для адреса страницы */
export const slugNumber = (value: number) => String(value).replace('.', '-')

/** Типоразмер для названия: латинская «x» в названии нельзя, у кабелей пишут кириллическую «х» */
export const sizeLabel = (cores: number, section: number) => `${cores}х${formatNumber(section)}`

const CORE_NUMERALS: Record<number, { nominative: string; genitive: string }> = {
  1: { nominative: 'одна', genitive: 'одной' },
  2: { nominative: 'две', genitive: 'двух' },
  3: { nominative: 'три', genitive: 'трёх' },
  4: { nominative: 'четыре', genitive: 'четырёх' },
  5: { nominative: 'пять', genitive: 'пяти' },
}

/**
 * «две медные жилы», «одна медная жила», «пять медных жил». Прилагательное задаётся тремя формами:
 * женский род ед. числа, множественное число, родительный падеж множественного числа.
 */
export function coresPhrase(count: number, adjective: [string, string, string]): string {
  const numeral = CORE_NUMERALS[count]?.nominative
  if (!numeral) throw new Error(`Не поддерживается число жил: ${count}`)
  if (count === 1) return `${numeral} ${adjective[0]} жила`
  if (count < 5) return `${numeral} ${adjective[1]} жилы`
  return `${numeral} ${adjective[2]} жил`
}

/** «из двух жил», «из одной жилы» */
export function coresGenitive(count: number): string {
  const numeral = CORE_NUMERALS[count]?.genitive
  if (!numeral) throw new Error(`Не поддерживается число жил: ${count}`)
  return `${numeral} ${count === 1 ? 'жилы' : 'жил'}`
}

export interface CableSpecInput {
  series: string
  /** Не заполняем, если источник не называет производителя */
  manufacturer?: Manufacturer
  cores: number
  /** Сечение жилы, уже отформатированное: «2,5» */
  section: string
  voltage: string
  material: 'Алюминий' | 'Медь'
  conductorClass: string
  shape?: 'Круглый' | 'Плоский'
  insulation: string
  /** Для проводов без оболочки не задаётся */
  sheath?: string
  /** Цвет оболочки или изоляции с подписью */
  color?: ProductSpec
  armoured?: string
  noFlame: boolean
  lowSmoke: boolean
  outerDiameter?: string
  guarantee?: string
}

/** Характеристики кабеля или провода в едином порядке. Пустые значения в список не попадают */
export function cableSpecs(input: CableSpecInput): ProductSpec[] {
  const yesNo = (value: boolean) => (value ? 'Да' : 'Нет')
  const specs: (ProductSpec | undefined)[] = [
    { name: 'Марка', value: input.series },
    input.manufacturer ? { name: 'Производитель', value: input.manufacturer.legalName } : undefined,
    input.manufacturer ? { name: 'Страна происхождения', value: 'Беларусь' } : undefined,
    { name: 'Количество жил', value: String(input.cores) },
    { name: 'Номинальное сечение жилы', value: `${input.section} мм²` },
    { name: 'Номинальное напряжение', value: input.voltage },
    { name: 'Материал жил', value: input.material },
    { name: 'Класс токопроводящей жилы', value: input.conductorClass },
    input.shape ? { name: 'Конструктивное исполнение', value: input.shape } : undefined,
    { name: 'Материал изоляции', value: input.insulation },
    input.sheath ? { name: 'Материал оболочки', value: input.sheath } : undefined,
    input.color,
    { name: 'Бронированный', value: input.armoured ?? 'Нет' },
    { name: 'Экран', value: 'Нет' },
    { name: 'Не распространяет горение нг(А)', value: yesNo(input.noFlame) },
    { name: 'Пониженное дымо- и газовыделение LS', value: yesNo(input.lowSmoke) },
    input.outerDiameter ? { name: 'Наружный диаметр', value: input.outerDiameter } : undefined,
    input.guarantee ? { name: 'Гарантийный срок', value: input.guarantee } : undefined,
  ]
  return specs.filter((spec): spec is ProductSpec => Boolean(spec))
}

export const PVC = 'Поливинилхлорид (ПВХ)'
export const PVC_REDUCED_FIRE = 'Поливинилхлорид (ПВХ) пониженной пожарной опасности'

/** Для чего подходит число жил, если в маркировке нет пометок N и PE */
export const CORE_USE = {
  2: 'Двухжильное исполнение используют для однофазных цепей: фазный и нулевой проводники.',
  3: 'Трёхжильное исполнение подходит для однофазных цепей с защитным проводником (фаза, ноль, земля) или для трёхфазной нагрузки без нулевого проводника.',
  4: 'Четырёхжильное исполнение используют в трёхфазных сетях: три фазные жилы и нулевая.',
  5: 'Пятижильное исполнение предназначено для трёхфазных сетей с раздельными нулевым и защитным проводниками.',
} as const

/** Цвета изоляции установочных проводов ПуВ и ПуГВ: на странице товара выбирается один из них */
export const WIRE_COLORS = [
  { label: 'белый', slug: 'belyj' },
  { label: 'синий', slug: 'sinij' },
  { label: 'красный', slug: 'krasnyj' },
  { label: 'зелёный', slug: 'zelenyj' },
  { label: 'жёлто-зелёный', slug: 'zhelto-zelenyj' },
] as const
