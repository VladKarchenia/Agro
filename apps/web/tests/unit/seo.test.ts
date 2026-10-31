import { describe, expect, it } from 'vitest'
import {
  absoluteUrl,
  buildTitle,
  clampDescription,
  DESCRIPTION_MAX,
  normalizePath,
  robotsDirective,
  SITE_NAME,
  serializeJsonLd,
} from '../../app/utils/seo'

describe('buildTitle', () => {
  it('добавляет название сайта к заголовку страницы', () => {
    expect(buildTitle('Каталог')).toBe(`Каталог | ${SITE_NAME}`)
  })

  it('возвращает только название сайта, если заголовка нет', () => {
    expect(buildTitle()).toBe(SITE_NAME)
    expect(buildTitle(null)).toBe(SITE_NAME)
    expect(buildTitle('   ')).toBe(SITE_NAME)
  })

  it('обрезает пробелы по краям', () => {
    expect(buildTitle('  Доставка ')).toBe(`Доставка | ${SITE_NAME}`)
  })
})

describe('normalizePath', () => {
  it.each([
    ['/', '/'],
    ['', '/'],
    ['/catalog', '/catalog'],
    ['/catalog/', '/catalog'],
    ['catalog', '/catalog'],
    ['//catalog///uborka//', '/catalog/uborka'],
    ['/catalog?utm_source=x', '/catalog'],
    ['/catalog/#top', '/catalog'],
    ['/?a=1', '/'],
  ])('%j → %s', (input, expected) => {
    expect(normalizePath(input)).toBe(expected)
  })
})

describe('absoluteUrl', () => {
  it('собирает адрес без завершающего слеша, кроме главной', () => {
    expect(absoluteUrl('https://agroed.by', '/catalog/')).toBe('https://agroed.by/catalog')
    expect(absoluteUrl('https://agroed.by', '/')).toBe('https://agroed.by/')
  })

  it('учитывает базовый путь (демо на GitHub Pages) и лишний слеш в конце siteUrl', () => {
    expect(absoluteUrl('https://user.github.io/Agro/', '/catalog')).toBe(
      'https://user.github.io/Agro/catalog',
    )
    expect(absoluteUrl('https://user.github.io/Agro', '/')).toBe('https://user.github.io/Agro/')
  })

  it('убирает параметры и якорь', () => {
    expect(absoluteUrl('https://agroed.by', '/catalog?page=2#x')).toBe('https://agroed.by/catalog')
  })
})

describe('clampDescription', () => {
  it('короткий текст не меняет, лишние пробелы схлопывает', () => {
    expect(clampDescription('  Один   два\nтри ')).toBe('Один два три')
  })

  it('длинный текст обрезает по границе слова и ставит многоточие', () => {
    const text = 'слово '.repeat(60)
    const result = clampDescription(text)
    expect(result.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
    expect(result.endsWith('…')).toBe(true)
    expect(result).not.toMatch(/\s…$/)
    expect(
      result
        .replace('…', '')
        .trim()
        .split(' ')
        .every((word) => word === 'слово'),
    ).toBe(true)
  })

  it('не оставляет висячую запятую перед многоточием', () => {
    const text = `${'а'.repeat(150)}, ${'б'.repeat(50)}`
    expect(clampDescription(text)).not.toMatch(/,…$/)
  })
})

describe('robotsDirective', () => {
  it('разрешает индексацию и крупные превью для открытых страниц', () => {
    expect(robotsDirective(true)).toBe('index, follow, max-image-preview:large, max-snippet:-1')
  })

  it('закрывает страницу целиком для закрытых', () => {
    expect(robotsDirective(false)).toBe('noindex, nofollow')
  })
})

describe('serializeJsonLd', () => {
  it('экранирует «<», чтобы данные не могли закрыть тег script', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(json).not.toContain('<')
    expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script>')
  })
})
