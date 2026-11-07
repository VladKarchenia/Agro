<script setup lang="ts">
const { bannerVisible, choice, decide } = useCookieConsent()
const banner = useTemplateRef<HTMLElement>('banner')

// Баннер закреплён у нижнего края и может перекрыть элемент в фокусе (WCAG 2.4.11).
// Сообщаем странице его высоту: браузер учтёт её при прокрутке к элементу (scroll-padding-bottom в main.css)
watch(banner, (element, _previous, onCleanup) => {
  if (!element) return
  const root = document.documentElement
  const observer = new ResizeObserver(() =>
    root.style.setProperty('--cookie-banner-height', `${element.offsetHeight}px`),
  )
  observer.observe(element)
  onCleanup(() => {
    observer.disconnect()
    root.style.removeProperty('--cookie-banner-height')
  })
})
</script>

<template>
  <!-- Не модальное окно: страницу можно читать и листать, не отвечая на вопрос. Тексту баннера не нужен заголовок h2:
       он добавил бы лишний уровень до h1 -->
  <section
    v-if="bannerVisible"
    :id="COOKIE_BANNER_ID"
    ref="banner"
    aria-labelledby="cookie-banner-title"
    tabindex="-1"
    class="fixed inset-x-0 bottom-0 z-50 border-t-2 border-ink bg-surface text-ink shadow-[0_-4px_16px_rgb(0_0_0/0.12)] outline-none"
  >
    <div
      class="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:gap-8"
    >
      <div class="text-sm">
        <p id="cookie-banner-title" class="font-semibold">Файлы cookie</p>
        <p class="mt-1 text-ink-muted">
          Аналитические cookie (Яндекс Метрика и Google Analytics) помогают понять, как используют
          сайт. Без вашего согласия они не загружаются. Необходимые для работы сайта cookie
          включены всегда.
          <NuxtLink to="/privacy#cookies" class="whitespace-nowrap text-link underline">
            Подробнее в политике
          </NuxtLink>
        </p>
        <p v-if="choice" class="mt-1 text-ink-muted">
          Сейчас аналитика {{ choice.analytics ? 'включена' : 'отключена' }}.
        </p>
      </div>
      <!-- Кнопки одинаковые по виду и размеру: отказ не должен быть менее заметным, чем согласие -->
      <div class="grid shrink-0 grid-cols-2 gap-3 md:w-80">
        <AppButton variant="ghost" @click="decide(true)">Принять</AppButton>
        <AppButton variant="ghost" @click="decide(false)">Отклонить</AppButton>
      </div>
    </div>
  </section>
</template>
