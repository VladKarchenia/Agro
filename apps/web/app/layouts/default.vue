<template>
  <div class="flex min-h-dvh flex-col">
    <!-- Ссылка для клавиатуры и скринридеров: пропустить шапку и перейти к содержимому. Видна только в фокусе -->
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-40 focus:rounded-control focus:bg-brand focus:px-4 focus:py-3 focus:font-semibold focus:text-on-brand"
    >
      Перейти к содержимому
    </a>
    <AppTopBar />
    <AppHeader />
    <main id="main" tabindex="-1" class="flex-1 scroll-mt-20 outline-none">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
