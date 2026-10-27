import { describe, expect, it } from 'vitest'
import { buildTitle, SITE_NAME } from '../../app/utils/seo'

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
