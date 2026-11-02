import {
  cableSpecs,
  formatNumber,
  type Manufacturer,
  PVC,
  slugNumber,
  WIRE_COLORS,
} from '../builders'
import type { Product, SubcategoryData } from '../types'

// Общая часть проводов ПуВ (ПВ-1) и ПуГВ (ПВ-3): одна жила, изоляция из ПВХ, пять цветов на выбор.
// Факты: страницы elswi.by (см. sourceUrl). Тексты пишем поверх фактов (docs/specs/content.md).
export interface InstallationWireInput {
  subcategory: SubcategoryData['subcategory']
  /** «ПуВ» или «ПуГВ» */
  series: string
  /** Латиницей для адреса: «puv» или «pugv» */
  slugName: string
  /** Значение «Класс токопроводящей жилы» */
  conductorClass: string
  /** Как жила описывается в тексте: «медной однопроволочной» */
  conductorText: string
  section: number
  /** Наружный диаметр, мм. Указываем, только если он есть в источнике */
  outerDiameter?: number
  /** Производитель. Не задаётся, если для этого типоразмера он в источнике не назван */
  manufacturer?: Manufacturer
  /** Дополнение к назначению провода из описания производителя */
  extraUse?: string
  sourceUrl: string
}

export function installationWire(input: InstallationWireInput): Product {
  const { series, section, outerDiameter, manufacturer } = input
  const size = `1х${formatNumber(section)}`
  const name = `Провод ${series} ${size}`
  const slug = `provod-${input.slugName}-1x${slugNumber(section)}`
  const colors = WIRE_COLORS.map((color) => color.label).join(', ')

  const description = [
    `${name} — установочный провод с одной ${input.conductorText} жилой сечением ${section} мм² и изоляцией из ПВХ-пластиката, без оболочки. Выпускается в цветах: ${colors}. Цвет выбирается на этой странице.`,
    `Провод предназначен для стационарной прокладки в закрытых помещениях и под навесом (при отсутствии прямого воздействия солнечного излучения и атмосферных осадков) в осветительных и силовых сетях, а также для монтажа электрооборудования, машин, механизмов и станков на номинальное напряжение до 450 В (для сетей 450/750 В) частотой до 400 Гц или постоянное напряжение до 1000 В.${input.extraUse ? ` ${input.extraUse}` : ''}`,
  ]
  if (manufacturer) {
    description.push(
      `Провод выпускает ${manufacturer.legalName}, страна происхождения — Беларусь, гарантийный срок — 3 года.${outerDiameter ? ` Наружный диаметр — ${outerDiameter} мм.` : ''}`,
    )
  }

  return {
    slug,
    categorySlug: input.subcategory.categorySlug,
    subcategorySlug: input.subcategory.slug,
    name,
    summary: `Установочный провод, медная жила ${section} мм², изоляция ПВХ, 5 цветов.`,
    description,
    specs: cableSpecs({
      series,
      manufacturer,
      cores: 1,
      section: formatNumber(section),
      voltage: '450/750 В',
      material: 'Медь',
      conductorClass: input.conductorClass,
      shape: 'Круглый',
      insulation: PVC,
      color: { name: 'Цвета изоляции', value: colors },
      noFlame: false,
      lowSmoke: false,
      outerDiameter: outerDiameter ? `${outerDiameter} мм` : undefined,
      guarantee: manufacturer ? '3 года' : undefined,
    }),
    brand: manufacturer?.brand,
    price: null,
    variants: {
      title: 'Цвет',
      options: WIRE_COLORS.map((color) => ({
        slug: `${slug}-${color.slug}`,
        label: color.label,
      })),
    },
    sourceUrl: input.sourceUrl,
  }
}
