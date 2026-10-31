<script setup lang="ts">
const { app } = useRuntimeConfig()

// Включает свой скроллбар только для мыши и трекпада (не для касаний) и не в режиме высокой контрастности.
// Выполняется в <head> до первой отрисовки: иначе страница сначала нарисуется с системной полосой,
// потом полоса исчезнет, и содержимое дёрнется на ширину полосы.
const customScrollbarSwitch =
  "if(matchMedia('(pointer: fine)').matches&&!matchMedia('(forced-colors: active)').matches)document.documentElement.classList.add('has-custom-scrollbar')"

useHead({
  titleTemplate: (title) => buildTitle(title),
  link: [{ rel: 'icon', type: 'image/svg+xml', href: `${app.baseURL}favicon.svg` }],
  script: [{ innerHTML: customScrollbarSwitch, tagPosition: 'head' }],
})
</script>

<template>
  <!-- Озвучивает скринридеру смену страницы при переходах внутри сайта (без перезагрузки) -->
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppScrollbar />
</template>
