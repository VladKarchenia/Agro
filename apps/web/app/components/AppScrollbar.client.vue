<script setup lang="ts">
import {
  computeThumb,
  pageScrollTarget,
  type ScrollMetrics,
  scrollTopForOffset,
  type ThumbGeometry,
} from '~/utils/scrollbar'

// Свой скроллбар поверх страницы. Системная полоса спрятана классом has-custom-scrollbar (см. main.css),
// поэтому фон страницы доходит до правого края, а раскладка не зависит от того, есть ли прокрутка.
// Сама прокрутка остаётся нативной: колесо, клавиатура, касания и поиск по странице работают как обычно.
// Компонент только рисует ползунок и умеет его перетаскивать, для скринридера он не существует.
const active = ref(false)
const dragging = ref(false)
const geometry = ref<ThumbGeometry>(
  computeThumb({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 }),
)
const rail = ref<HTMLElement | null>(null)

let frame = 0
let observer: ResizeObserver | undefined
let dragStartY = 0
let dragStartOffset = 0

function readMetrics(): ScrollMetrics {
  const root = document.scrollingElement ?? document.documentElement
  return {
    scrollTop: root.scrollTop,
    scrollHeight: root.scrollHeight,
    clientHeight: root.clientHeight,
  }
}

function measure() {
  geometry.value = computeThumb(readMetrics())
}

function schedule() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    measure()
  })
}

onMounted(() => {
  active.value = document.documentElement.classList.contains('has-custom-scrollbar')
  if (!active.value) return

  measure()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  // Высота страницы меняется при переходах, подгрузке шрифтов и картинок
  observer = new ResizeObserver(schedule)
  observer.observe(document.body)
  observer.observe(document.documentElement)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  observer?.disconnect()
  if (frame) cancelAnimationFrame(frame)
})

function onThumbDown(event: PointerEvent) {
  dragging.value = true
  dragStartY = event.clientY
  dragStartOffset = geometry.value.offset
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onThumbMove(event: PointerEvent) {
  if (!dragging.value) return
  const offset = dragStartOffset + (event.clientY - dragStartY)
  window.scrollTo({ top: scrollTopForOffset(offset, geometry.value), behavior: 'instant' })
}

function onThumbUp(event: PointerEvent) {
  dragging.value = false
  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
}

// Щелчок по свободной части зоны прокручивает страницу на экран вверх или вниз
function onRailDown(event: PointerEvent) {
  const top = rail.value?.getBoundingClientRect().top ?? 0
  const target = pageScrollTarget(event.clientY - top, geometry.value, readMetrics())
  window.scrollTo({ top: target, behavior: 'instant' })
}
</script>

<template>
  <div
    v-if="active && geometry.visible"
    ref="rail"
    class="app-scrollbar"
    aria-hidden="true"
    @pointerdown.self="onRailDown"
  >
    <div
      class="app-scrollbar__thumb"
      :data-dragging="dragging"
      :style="{ height: `${geometry.size}px`, transform: `translateY(${geometry.offset}px)` }"
      @pointerdown.prevent="onThumbDown"
      @pointermove="onThumbMove"
      @pointerup="onThumbUp"
      @pointercancel="onThumbUp"
    />
  </div>
</template>
