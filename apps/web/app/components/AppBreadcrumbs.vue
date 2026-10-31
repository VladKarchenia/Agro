<script setup lang="ts">
defineProps<{ items: { label: string; to?: string }[] }>()
</script>

<template>
  <nav aria-label="Хлебные крошки">
    <ol class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
      <li v-for="(item, index) in items" :key="item.label" class="flex items-center gap-2">
        <NuxtLink v-if="item.to" :to="item.to" class="text-link underline">{{ item.label }}</NuxtLink>
        <span v-else aria-current="page">{{ item.label }}</span>
        <span v-if="index < items.length - 1" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>
