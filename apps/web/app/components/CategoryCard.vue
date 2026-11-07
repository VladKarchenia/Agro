<script setup lang="ts">
import { type Category, categoryPath } from '~/data/catalog'

// level: уровень заголовка карточки (на странице каталога под h1 это 2, на главной под h2 это 3).
// Обложка декоративная: название категории уже есть в заголовке, поэтому alt пустой.
const props = withDefaults(defineProps<{ category: Category; level?: 2 | 3 }>(), { level: 2 })

const image = computed(() =>
  props.category.cover ? { ...props.category.cover, alt: '' } : undefined,
)
</script>

<template>
  <NuxtLink
    :to="categoryPath(category)"
    class="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-brand"
  >
    <ProductPhoto v-if="image" :image="image" priority />
    <div class="p-5">
      <component :is="`h${level}`" class="text-lg font-bold">{{ category.title }}</component>
      <p class="mt-1 text-ink-muted">{{ category.description }}</p>
    </div>
  </NuxtLink>
</template>
