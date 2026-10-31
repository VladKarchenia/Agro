export interface ScrollMetrics {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

export interface ThumbGeometry {
  /** false: прокручивать нечего, ползунок не показываем */
  visible: boolean
  /** Высота ползунка в пикселях */
  size: number
  /** Смещение ползунка от верха в пикселях */
  offset: number
  /** На сколько пикселей ползунок может двигаться (высота зоны минус высота ползунка) */
  travel: number
  /** Максимальное значение scrollTop страницы */
  maxScroll: number
}

export const MIN_THUMB = 40

const HIDDEN: ThumbGeometry = { visible: false, size: 0, offset: 0, travel: 0, maxScroll: 0 }

/** Размер и положение ползунка по размерам страницы. Размер пропорционален видимой доле страницы */
export function computeThumb(metrics: ScrollMetrics, minThumb = MIN_THUMB): ThumbGeometry {
  const { scrollTop, scrollHeight, clientHeight } = metrics
  const maxScroll = scrollHeight - clientHeight
  // 1 пиксель допуска: из-за округлений у страницы без прокрутки бывает разница в 1 px
  if (clientHeight <= 0 || maxScroll <= 1) return HIDDEN

  const size = Math.min(
    clientHeight,
    Math.max(minThumb, (clientHeight * clientHeight) / scrollHeight),
  )
  const travel = clientHeight - size
  const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll))
  return { visible: true, size, offset: ratio * travel, travel, maxScroll }
}

/** Какой scrollTop соответствует положению ползунка (для перетаскивания) */
export function scrollTopForOffset(offset: number, geometry: ThumbGeometry): number {
  if (!geometry.visible || geometry.travel <= 0) return 0
  const ratio = Math.min(1, Math.max(0, offset / geometry.travel))
  return ratio * geometry.maxScroll
}

/** Куда прокрутить при щелчке по зоне рядом с ползунком: на страницу вверх или вниз */
export function pageScrollTarget(
  clickY: number,
  geometry: ThumbGeometry,
  metrics: ScrollMetrics,
): number {
  const direction = clickY < geometry.offset ? -1 : 1
  const step = metrics.clientHeight * 0.9
  return Math.min(geometry.maxScroll, Math.max(0, metrics.scrollTop + direction * step))
}
