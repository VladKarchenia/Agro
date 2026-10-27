<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
    <h1 class="text-3xl font-extrabold md:text-5xl">{{ title }}</h1>
    <p class="mt-4 max-w-xl text-ink-muted">Страница в разработке.</p>
  </div>
</template>
