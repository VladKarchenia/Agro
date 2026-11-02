import type { Product, Subcategory } from '../data/types'

// Поиск по каталогу в браузере: без сервера и сторонних библиотек (каталог небольшой).
// Что умеет: любой порядок слов, «2x16» = «2х16» = «2 х 16», запятая и точка в числах, ё = е,
// окончания («медный», «медная»), одна-две опечатки, набор не в той раскладке («ghjdjl» → «провод»)
// и латиницей («avbbshv» → «авббшв»). Правила: docs/specs/search.md.

type FieldKind = 'name' | 'group' | 'variant' | 'spec' | 'summary'

interface Field {
  kind: FieldKind
  /** Подпись для плашки «Цвет: синий» */
  label?: string
  text: string
  tokens: string[]
  weight: number
}

interface IndexedProduct {
  product: Product
  order: number
  fields: Field[]
  /** Название без регистра и лишних знаков: для бонуса, когда запрос совпал с началом названия */
  nameKey: string
}

interface IndexedSection {
  subcategory: Subcategory
  order: number
  productCount: number
  fields: Field[]
}

export interface SearchIndex {
  products: IndexedProduct[]
  sections: IndexedSection[]
}

export interface Snippet {
  label: string
  text: string
}

export interface ProductHit {
  product: Product
  snippet?: Snippet
}

export interface SectionHit {
  subcategory: Subcategory
  productCount: number
}

export interface SearchResult {
  /** Слова запроса после очистки: по ним подсвечиваем найденное */
  tokens: string[]
  /** Запрос исправлен: показали результаты не по тому, что набрано */
  corrected?: { to: string }
  sections: SectionHit[]
  products: ProductHit[]
  /** Сколько товаров нашлось всего (в products только первые) */
  totalProducts: number
}

export interface Segment {
  text: string
  hit: boolean
}

/** Слова, которые ничего не уточняют: «4 жилы 6 мм²» ищется как «4 6» */
const STOP_WORDS = new Set([
  'мм',
  'мм2',
  'кв',
  'жил',
  'жила',
  'жилы',
  'для',
  'и',
  'с',
  'на',
  'по',
  'в',
  'из',
  'шт',
])

/** Разные формы одного слова, которые правило окончаний не сводит вместе */
const CANONICAL: Record<string, string> = {
  медь: 'медный',
  меди: 'медный',
  медью: 'медный',
  алюминий: 'алюминиевый',
  алюминия: 'алюминиевый',
  алюминием: 'алюминиевый',
}

const ENDINGS = [
  'ого',
  'его',
  'ому',
  'ему',
  'ами',
  'ями',
  'ый',
  'ий',
  'ой',
  'ая',
  'яя',
  'ое',
  'ее',
  'ые',
  'ие',
  'ым',
  'им',
  'ом',
  'ем',
  'ов',
  'ей',
  'ах',
  'ях',
  'а',
  'я',
  'у',
  'ю',
  'ы',
  'и',
  'е',
  'о',
  'ь',
]

const SIZE_TOKEN = /^\d+(?:\.\d+)?(?:х\d+(?:\.\d+)?)+$/
const PLAIN_NUMBER = /^\d+(?:\.\d+)?$/

/** Приводит текст к виду, в котором слова сравниваются: нижний регистр, ё, единый вид типоразмеров */
export function normalizeText(text: string): string {
  return (
    text
      .toLowerCase()
      .replaceAll('ё', 'е')
      .replaceAll('²', '2')
      .replace(/(\d),(\d)/g, '$1.$2')
      // «2 x 16», «2*16», «2×16», «2х16» (латинская или кириллическая) → «2х16» с кириллической «х»
      .replace(/\d+(?:\.\d+)?(?:\s*[xх×*]\s*\d+(?:\.\d+)?)+/g, (size) =>
        size.replace(/\s*[xх×*]\s*/g, 'х'),
      )
      // «4x», пока человек ещё не дописал вторую цифру
      .replace(/(\d)\s*[xх×*](?=\s|$)/g, '$1х')
  )
}

function stem(word: string): string {
  for (const ending of ENDINGS) {
    if (word.length - ending.length >= 3 && word.endsWith(ending)) {
      return word.slice(0, -ending.length)
    }
  }
  return word
}

const canonical = (word: string) => CANONICAL[word] ?? word

/** Слова нормализованного текста: составные («пв-1», «жёлто-зелёный») идут целиком и по частям */
function wordsOf(normalized: string): string[] {
  const words = new Set<string>()
  for (const match of normalized.matchAll(/[a-zа-я0-9]+(?:[.-][a-zа-я0-9]+)*/g)) {
    const word = canonical(match[0])
    words.add(word)
    if (word.includes('-')) {
      words.add(word.replaceAll('-', ''))
      for (const part of word.split('-')) words.add(canonical(part))
    }
    if (SIZE_TOKEN.test(word)) {
      for (const part of word.split('х')) words.add(part)
    }
  }
  return [...words]
}

function queryTokens(normalized: string): string[] {
  const tokens: string[] = []
  for (const match of normalized.matchAll(/[a-zа-я0-9]+(?:[.-][a-zа-я0-9]+)*/g)) {
    tokens.push(canonical(match[0]))
  }
  const meaningful = tokens.filter((token) => !STOP_WORDS.has(token))
  return [...new Set(meaningful.length > 0 ? meaningful : tokens)]
}

/** Расстояние Дамерау — Левенштейна (замена, вставка, удаление, перестановка соседних букв) */
function editDistance(a: string, b: string): number {
  const cols = b.length + 1
  const d = new Array<number>((a.length + 1) * cols).fill(0)
  const cell = (i: number, j: number) => d[i * cols + j] ?? 0
  for (let i = 0; i <= a.length; i++) d[i * cols] = i
  for (let j = 0; j < cols; j++) d[j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let best = Math.min(cell(i - 1, j) + 1, cell(i, j - 1) + 1, cell(i - 1, j - 1) + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, cell(i - 2, j - 2) + 1)
      }
      d[i * cols + j] = best
    }
  }
  return cell(a.length, b.length)
}

/**
 * Насколько слово документа подходит слову запроса: от 0 (никак) до 1 (точно).
 * last: слово запроса ещё набирается, поэтому одиночное число считаем началом («1» → «10»).
 */
export function matchQuality(query: string, word: string, last = false): number {
  if (query === word) return 1
  const plainNumber = PLAIN_NUMBER.test(query)
  if (word.startsWith(query)) return plainNumber ? (last ? 0.45 : 0) : 0.75
  if (/\d/.test(query)) return 0

  const queryStem = stem(query)
  const wordStem = stem(word)
  if (queryStem.length >= 3 && queryStem === wordStem) return 0.65
  if (queryStem.length >= 4 && wordStem.startsWith(queryStem)) return 0.6

  // Марки короткие («ПуВ», «ПуГВ»), опечатки в них не угадать: сравниваем только слова от 5 букв.
  // В первой букве опечатки бывают редко, а без этого условия «синий» находит «линий»
  if (query.length >= 5 && query[0] === word[0]) {
    const allowed = query.length >= 8 ? 2 : 1
    if (editDistance(query, word) <= allowed) return 0.4
    if (word.length > query.length && editDistance(query, word.slice(0, query.length)) <= allowed) {
      return 0.35
    }
  }
  return 0
}

function field(kind: FieldKind, text: string, weight: number, label?: string): Field {
  return { kind, label, text, tokens: wordsOf(normalizeText(text)), weight }
}

export function buildSearchIndex(subcategories: Subcategory[], products: Product[]): SearchIndex {
  const subcategoryBySlug = new Map(
    subcategories.map((subcategory) => [subcategory.slug, subcategory]),
  )

  const indexedProducts = products.map((product, order): IndexedProduct => {
    const fields: Field[] = [field('name', product.name, 3)]
    const group = subcategoryBySlug.get(product.subcategorySlug)
    if (group) fields.push(field('group', group.title, 2))
    for (const option of product.variants?.options ?? []) {
      fields.push(field('variant', option.label, 2, product.variants?.title))
    }
    for (const spec of product.specs) {
      const generic = ['да', 'нет'].includes(spec.value.toLowerCase())
      // Цвета из характеристик дублируют варианты: показываем их один раз
      if (generic || (product.variants && spec.name.startsWith('Цвет'))) continue
      fields.push(field('spec', spec.value, 1.2, spec.name))
    }
    fields.push(field('summary', product.summary, 1))
    return { product, order, fields, nameKey: normalizeText(product.name) }
  })

  const indexedSections = subcategories.map((subcategory, order): IndexedSection => {
    const productCount = products.filter(
      (product) =>
        product.categorySlug === subcategory.categorySlug &&
        product.subcategorySlug === subcategory.slug,
    ).length
    return {
      subcategory,
      order,
      productCount,
      fields: [field('name', subcategory.title, 3), field('summary', subcategory.description, 1)],
    }
  })

  return { products: indexedProducts, sections: indexedSections }
}

interface Scored {
  score: number
  snippet?: Snippet
}

/** Подходит ли запись под ВСЕ слова запроса. Возвращает оценку или undefined */
function scoreFields(fields: Field[], tokens: string[]): Scored | undefined {
  let score = 0
  let snippet: Snippet | undefined
  let snippetWeight = 0
  for (const [index, token] of tokens.entries()) {
    const last = index === tokens.length - 1
    let best = 0
    let bestField: Field | undefined
    for (const item of fields) {
      for (const word of item.tokens) {
        const quality = matchQuality(token, word, last)
        if (quality * item.weight > best) {
          best = quality * item.weight
          bestField = item
        }
      }
    }
    if (best === 0) return undefined
    score += best
    // Плашка нужна, когда нашлось не в названии: «Цвет: синий», «Материал жил: Медь»
    if (
      bestField &&
      (bestField.kind === 'variant' || bestField.kind === 'spec') &&
      best > snippetWeight
    ) {
      snippetWeight = best
      snippet = { label: bestField.label ?? '', text: bestField.text }
    }
  }
  return { score, snippet }
}

function run(index: SearchIndex, tokens: string[], phrase: string, limit: number): SearchResult {
  const products = index.products
    .flatMap((entry) => {
      const scored = scoreFields(entry.fields, tokens)
      if (!scored) return []
      const startsWithQuery = phrase.length > 0 && entry.nameKey.startsWith(phrase)
      return [{ entry, snippet: scored.snippet, score: scored.score + (startsWithQuery ? 2 : 0) }]
    })
    .sort((a, b) => b.score - a.score || a.entry.order - b.entry.order)

  const sections = index.sections
    .flatMap((entry) => {
      const scored = scoreFields(entry.fields, tokens)
      return scored ? [{ entry, score: scored.score }] : []
    })
    .sort((a, b) => b.score - a.score || a.entry.order - b.entry.order)

  return {
    tokens,
    sections: sections.map(({ entry }) => ({
      subcategory: entry.subcategory,
      productCount: entry.productCount,
    })),
    products: products.slice(0, limit).map(({ entry, snippet }) => ({
      product: entry.product,
      snippet,
    })),
    totalProducts: products.length,
  }
}

const TRANSLIT_PAIRS: Record<string, string> = {
  sch: 'щ',
  sh: 'ш',
  ch: 'ч',
  zh: 'ж',
  kh: 'х',
  ts: 'ц',
  ya: 'я',
  yu: 'ю',
  yo: 'е',
  a: 'а',
  b: 'б',
  c: 'ц',
  d: 'д',
  e: 'е',
  f: 'ф',
  g: 'г',
  h: 'х',
  i: 'и',
  j: 'й',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  q: 'к',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  v: 'в',
  w: 'в',
  y: 'ы',
  z: 'з',
}

/** «avbbshv» → «авббшв»: так пишут марки латиницей */
function transliterate(text: string): string {
  return text.replace(/sch|sh|ch|zh|kh|ts|ya|yu|yo|[a-z]/g, (part) => TRANSLIT_PAIRS[part] ?? part)
}

const KEYBOARD = "qwertyuiop[]asdfghjkl;'zxcvbnm,."
const KEYBOARD_RU = 'йцукенгшщзхъфывапролджэячсмитьбю'

/** «ghjdjl» → «провод»: текст набран при включённой английской раскладке */
function fixLayout(text: string): string {
  return text
    .split(' ')
    .map((word) =>
      /[a-z]/.test(word)
        ? [...word].map((char) => KEYBOARD_RU[KEYBOARD.indexOf(char)] ?? char).join('')
        : word,
    )
    .join(' ')
}

const LOOKALIKES: Record<string, string> = {
  a: 'а',
  b: 'в',
  c: 'с',
  e: 'е',
  h: 'н',
  k: 'к',
  m: 'м',
  o: 'о',
  p: 'р',
  t: 'т',
  x: 'х',
  y: 'у',
}

/** «BBГ» с латинскими буквами, похожими на русские, → «ввг». Только в словах, где уже есть русские буквы */
function fixLookalikes(text: string): string {
  return text
    .split(' ')
    .map((word) =>
      /[а-я]/.test(word) ? word.replace(/[a-z]/g, (char) => LOOKALIKES[char] ?? char) : word,
    )
    .join(' ')
}

/** Все разделы каталога в порядке показа: подсказка, пока запрос пустой */
export function listSections(index: SearchIndex): SectionHit[] {
  return index.sections.map(({ subcategory, productCount }) => ({ subcategory, productCount }))
}

export interface SearchOptions {
  /** Сколько товаров вернуть (всего найденных в totalProducts) */
  limit?: number
}

export function search(
  index: SearchIndex,
  rawQuery: string,
  options: SearchOptions = {},
): SearchResult {
  const limit = options.limit ?? 8
  const normalized = normalizeText(rawQuery).trim()
  const empty: SearchResult = { tokens: [], sections: [], products: [], totalProducts: 0 }
  if (normalized.length === 0) return empty

  const direct = run(index, queryTokens(normalized), normalized, limit)
  if (direct.totalProducts + direct.sections.length > 0) return direct

  // Прямой поиск ничего не дал: пробуем исправить набор. Берём вариант с наибольшим числом находок
  const variants = [
    transliterate(normalized),
    fixLayout(normalized),
    fixLookalikes(normalized),
  ].filter((variant, position, all) => variant !== normalized && all.indexOf(variant) === position)

  let best: { result: SearchResult; text: string } | undefined
  for (const text of variants) {
    const result = run(index, queryTokens(text), text, limit)
    const found = result.totalProducts + result.sections.length
    if (found > 0 && (!best || found > best.result.totalProducts + best.result.sections.length)) {
      best = { result, text }
    }
  }
  if (!best) return direct
  return { ...best.result, corrected: { to: best.text } }
}

interface Span {
  start: number
  end: number
}

/** Делит текст на куски для подсветки: найденное слово или его начало, если слово ещё набирается */
export function highlight(text: string, tokens: string[]): Segment[] {
  if (tokens.length === 0) return [{ text, hit: false }]
  const spans: Span[] = []
  const wordPattern =
    /\d+(?:[.,]\d+)?(?:\s?[xх×*]\s?\d+(?:[.,]\d+)?)+|[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*(?:[.,]\d+)?/gu

  for (const match of text.matchAll(wordPattern)) {
    const original = match[0]
    const start = match.index
    const word = canonical(normalizeText(original))
    const parts: { word: string; start: number }[] = [{ word, start: 0 }]
    if (word.includes('-')) {
      let offset = 0
      for (const part of word.split('-')) {
        parts.push({ word: canonical(part), start: offset })
        offset += part.length + 1
      }
    }
    const wholeWordOnly = SIZE_TOKEN.test(word)
    if (wholeWordOnly) for (const part of word.split('х')) parts.push({ word: part, start: 0 })

    for (const token of tokens) {
      for (const part of parts) {
        const quality = matchQuality(token, part.word)
        if (quality === 0) continue
        const prefixOnly = part.word !== token && part.word.startsWith(token) && !wholeWordOnly
        const length = prefixOnly ? token.length : part.word.length
        const from = start + (wholeWordOnly ? 0 : part.start)
        spans.push({ start: from, end: wholeWordOnly ? start + original.length : from + length })
        break
      }
    }
  }

  const merged = spans
    .sort((a, b) => a.start - b.start)
    .reduce<Span[]>((acc, span) => {
      const previous = acc.at(-1)
      if (previous && span.start <= previous.end) previous.end = Math.max(previous.end, span.end)
      else acc.push({ ...span })
      return acc
    }, [])

  const segments: Segment[] = []
  let cursor = 0
  for (const span of merged) {
    if (span.start > cursor) segments.push({ text: text.slice(cursor, span.start), hit: false })
    segments.push({ text: text.slice(span.start, span.end), hit: true })
    cursor = span.end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), hit: false })
  return segments
}
