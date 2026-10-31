<script setup lang="ts">
const { app } = useRuntimeConfig()

useHead({
  titleTemplate: (title) => buildTitle(title),
  link: [{ rel: 'icon', type: 'image/svg+xml', href: `${app.baseURL}favicon.svg` }],
})
</script>

<template>
  <!-- Озвучивает скринридеру смену страницы при переходах внутри сайта (без перезагрузки) -->
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
