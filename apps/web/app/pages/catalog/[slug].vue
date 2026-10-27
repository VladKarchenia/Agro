<script setup lang="ts">
import { mockCategories } from '~/data/mock-categories'

const route = useRoute()
const category = mockCategories.find((item) => item.slug === route.params.slug)

if (!category) {
  throw createError({ statusCode: 404, statusMessage: 'Категория не найдена', fatal: true })
}

useSeoMeta({ title: category.title, description: category.description })
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
    <NuxtLink to="/catalog" class="text-sm text-link underline">← Каталог</NuxtLink>
    <h1 class="mt-3 text-3xl font-extrabold md:text-5xl">{{ category.title }}</h1>
    <p class="mt-4 max-w-xl text-ink-muted">{{ category.description }}. Товары появятся позже.</p>
  </div>
</template>
