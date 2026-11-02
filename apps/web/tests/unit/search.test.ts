import { describe, expect, it } from 'vitest'
import { getSearchIndex } from '../../app/data/search-index'
import { highlight, matchQuality, normalizeText, search } from '../../app/utils/search'

const index = getSearchIndex()
const names = (query: string) =>
  search(index, query, { limit: 100 }).products.map((hit) => hit.product.name)
const marked = (text: string, tokens: string[]) =>
  highlight(text, tokens)
    .filter((segment) => segment.hit)
    .map((segment) => segment.text)

describe('нормализация', () => {
  it('приводит типоразмеры к одному виду', () => {
    for (const written of ['2x16', '2 x 16', '2*16', '2×16', '2х16', '2 Х 16']) {
      expect(normalizeText(written), written).toBe('2х16')
    }
    expect(normalizeText('4x')).toBe('4х')
  })

  it('заменяет запятую в числах и убирает ё и верхний индекс', () => {
    expect(normalizeText('1х2,5 мм²')).toBe('1х2.5 мм2')
    expect(normalizeText('Жёлто-зелёный')).toBe('желто-зеленый')
  })
})

describe('сопоставление слов', () => {
  it('точное, по началу, по окончанию, с опечаткой', () => {
    expect(matchQuality('кабель', 'кабель')).toBe(1)
    expect(matchQuality('каб', 'кабель')).toBeGreaterThan(0.7)
    expect(matchQuality('белая', 'белый')).toBeGreaterThan(0.6)
    expect(matchQuality('кабле', 'кабель')).toBeGreaterThan(0)
    expect(matchQuality('провод', 'кабель')).toBe(0)
    expect(matchQuality('синий', 'линий')).toBe(0)
    expect(search(index, 'провод синий').sections).toEqual([])
  })

  it('число не считается началом другого числа, пока оно не последнее в запросе', () => {
    expect(matchQuality('1', '16')).toBe(0)
    expect(matchQuality('1', '16', true)).toBeGreaterThan(0)
    expect(matchQuality('16', '16')).toBe(1)
  })
})

describe('поиск по каталогу', () => {
  it('находит по марке и типоразмеру в любом написании', () => {
    for (const query of [
      'авббшв 4х16',
      'АВБбШв 4x16',
      'авббшв 4 х 16',
      '4*16 авббшв',
      '16 4 авббшв',
    ]) {
      const found = names(query)
      expect(found, query).toContain('Кабель АВБбШв 4х16 ок (N) - 1 кВ')
      expect(
        found.every((name) => name.includes('АВБбШв') && name.includes('4х16')),
        query,
      ).toBe(true)
    }
  })

  it('находит по обозначению в скобках и через дефис', () => {
    expect(names('пв-1').every((name) => name.startsWith('Провод ПуВ'))).toBe(true)
    expect(names('пв-1').length).toBeGreaterThan(0)
    expect(names('пв1').length).toBe(names('пв-1').length)
    expect(names('пугв').every((name) => name.includes('ПуГВ'))).toBe(true)
    expect(search(index, 'пв-3').sections.map((hit) => hit.subcategory.slug)).toContain(
      'provod-pv-3-pugv',
    )
  })

  it('находит по цвету, в том числе жёлто-зелёному', () => {
    const blue = search(index, 'провод синий').products
    expect(blue.length).toBeGreaterThan(0)
    expect(blue[0]?.snippet).toEqual({ label: expect.any(String), text: 'синий' })
    expect(names('зеленый').length).toBeGreaterThan(0)
    expect(names('жёлто-зелёный').length).toBeGreaterThan(0)
  })

  it('понимает разные формы слов и материал', () => {
    expect(names('медный').length).toBeGreaterThan(0)
    expect(names('медь').length).toBe(names('медный').length)
    expect(names('алюминиевый кабель').length).toBeGreaterThan(0)
    expect(names('алюминий').length).toBe(names('алюминиевый').length)
  })

  it('терпит опечатки', () => {
    expect(names('кабле').length).toBeGreaterThan(0)
    expect(names('првод').length).toBeGreaterThan(0)
    expect(names('бронерованный').length).toBeGreaterThan(0)
  })

  it('игнорирует служебные слова', () => {
    expect(names('4 жилы 16 мм2 авббшв')).toEqual(names('4 16 авббшв'))
  })

  it('исправляет раскладку и латиницу', () => {
    const layout = search(index, 'ghjdjl')
    expect(layout.corrected?.to).toBe('провод')
    expect(layout.totalProducts).toBeGreaterThan(0)

    const translit = search(index, 'avbbshv')
    expect(translit.corrected?.to).toBe('авббшв')
    expect(translit.products[0]?.product.name).toContain('АВБбШв')

    expect(search(index, 'puv').corrected?.to).toBe('пув')
    expect(search(index, 'kabel').corrected?.to).toBe('кабел')
    expect(search(index, 'provod').products.length).toBeGreaterThan(0)
  })

  it('не исправляет запрос, который и так нашёл результаты', () => {
    expect(search(index, 'кабель').corrected).toBeUndefined()
  })

  it('точное совпадение стоит выше частичного', () => {
    const [first] = search(index, 'авббшв 2х16').products
    expect(first?.product.name).toContain('2х16')
  })

  it('возвращает разделы с числом товаров и ограничивает выдачу', () => {
    const result = search(index, 'кабель', { limit: 3 })
    expect(result.products).toHaveLength(3)
    expect(result.totalProducts).toBeGreaterThan(3)
    expect(result.sections.length).toBeGreaterThan(0)
    expect(result.sections.every((hit) => hit.productCount > 0)).toBe(true)
  })

  it('пустой и бессмысленный запрос ничего не находит', () => {
    expect(search(index, '').products).toEqual([])
    expect(search(index, '   ').products).toEqual([])
    expect(search(index, 'щщщщщщ').totalProducts).toBe(0)
    expect(search(index, 'трактор').totalProducts).toBe(0)
  })

  it('примеры подсказок в интерфейсе находят товары', () => {
    for (const query of ['АВБбШв 4х16', 'провод синий', 'медный 6']) {
      expect(search(index, query).totalProducts, query).toBeGreaterThan(0)
    }
  })
})

describe('подсветка', () => {
  it('подсвечивает слово целиком, а набираемое слово по началу', () => {
    expect(marked('Кабель АВБбШв 4х16', ['кабель'])).toEqual(['Кабель'])
    expect(marked('Кабель АВБбШв 4х16', ['каб'])).toEqual(['Каб'])
  })

  it('подсвечивает типоразмер целиком и по составляющей', () => {
    expect(marked('Кабель АВБбШв 4х16 ок', ['4х16'])).toEqual(['4х16'])
    expect(marked('Кабель АВБбШв 4х16 ок', ['16'])).toEqual(['4х16'])
    expect(marked('Кабель 4 х 16', ['4х16'])).toEqual(['4 х 16'])
  })

  it('подсвечивает часть составного слова', () => {
    expect(marked('жёлто-зелёный', ['зеленый'])).toEqual(['зелёный'])
    expect(marked('Провод ПВ-1 (ПуВ)', ['пв-1'])).toEqual(['ПВ-1'])
  })

  it('ничего не подсвечивает без слов запроса и не теряет текст', () => {
    expect(highlight('Кабель', [])).toEqual([{ text: 'Кабель', hit: false }])
    const text = 'Провод ПуВ 1х4 — установочный'
    expect(
      highlight(text, ['провод', 'пув', 'установочный'])
        .map((segment) => segment.text)
        .join(''),
    ).toBe(text)
  })
})
