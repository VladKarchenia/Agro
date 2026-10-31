import { describe, expect, it } from 'vitest'
import {
  computeThumb,
  MIN_THUMB,
  pageScrollTarget,
  scrollTopForOffset,
} from '../../app/utils/scrollbar'

const page = (scrollTop: number, scrollHeight = 2000, clientHeight = 800) => ({
  scrollTop,
  scrollHeight,
  clientHeight,
})

describe('computeThumb', () => {
  it('для страницы без прокрутки ползунок скрыт', () => {
    expect(computeThumb(page(0, 800, 800)).visible).toBe(false)
    expect(computeThumb(page(0, 801, 800)).visible).toBe(false)
    expect(computeThumb(page(0, 0, 0)).visible).toBe(false)
  })

  it('размер пропорционален видимой доле страницы', () => {
    const thumb = computeThumb(page(0, 1600, 800))
    expect(thumb.visible).toBe(true)
    expect(thumb.size).toBe(400)
    expect(thumb.travel).toBe(400)
  })

  it('не меньше минимума даже для очень длинной страницы и не больше высоты окна', () => {
    expect(computeThumb(page(0, 100_000, 800)).size).toBe(MIN_THUMB)
    expect(computeThumb(page(0, 802, 800)).size).toBeLessThanOrEqual(800)
  })

  it('в начале страницы ползунок вверху, в конце внизу, посередине посередине', () => {
    const { maxScroll } = computeThumb(page(0))
    expect(computeThumb(page(0)).offset).toBe(0)
    const end = computeThumb(page(maxScroll))
    expect(end.offset).toBeCloseTo(end.travel)
    const middle = computeThumb(page(maxScroll / 2))
    expect(middle.offset).toBeCloseTo(middle.travel / 2)
  })

  it('прокрутка за пределы (резиночный эффект) не выводит ползунок за границы', () => {
    const above = computeThumb(page(-50))
    expect(above.offset).toBe(0)
    const below = computeThumb(page(99_999))
    expect(below.offset).toBeCloseTo(below.travel)
  })
})

describe('scrollTopForOffset', () => {
  const geometry = computeThumb(page(0))

  it('переводит положение ползунка в прокрутку страницы и обратно', () => {
    for (const scrollTop of [0, 300, 600, geometry.maxScroll]) {
      const thumb = computeThumb(page(scrollTop))
      expect(scrollTopForOffset(thumb.offset, geometry)).toBeCloseTo(scrollTop)
    }
  })

  it('ограничивает результат границами страницы', () => {
    expect(scrollTopForOffset(-100, geometry)).toBe(0)
    expect(scrollTopForOffset(99_999, geometry)).toBeCloseTo(geometry.maxScroll)
  })

  it('для скрытого ползунка возвращает 0', () => {
    expect(scrollTopForOffset(10, computeThumb(page(0, 800, 800)))).toBe(0)
  })
})

describe('pageScrollTarget', () => {
  const metrics = page(300)
  const geometry = computeThumb(metrics)

  it('щелчок выше ползунка прокручивает вверх, ниже вниз, примерно на экран', () => {
    const up = pageScrollTarget(geometry.offset - 10, geometry, metrics)
    const down = pageScrollTarget(geometry.offset + geometry.size + 10, geometry, metrics)
    expect(up).toBeLessThan(300)
    expect(down).toBeGreaterThan(300)
    expect(down - 300).toBeCloseTo(800 * 0.9)
  })

  it('не выходит за начало и конец страницы', () => {
    expect(pageScrollTarget(0, computeThumb(page(100)), page(100))).toBe(0)
    const bottom = page(1150)
    expect(pageScrollTarget(700, computeThumb(bottom), bottom)).toBe(1200)
  })
})
