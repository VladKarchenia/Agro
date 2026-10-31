<script setup lang="ts">
import { getCategory, getProducts } from '~/data/catalog'

const route = useRoute()
const category = getCategory(String(route.params.category))

if (!category) {
  throw createError({ statusCode: 404, message: 'Категория не найдена', fatal: true })
}

const products = getProducts(category.slug)

useSeoMeta({ title: category.title, description: category.description })
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
    <AppBreadcrumbs :items="[{ label: 'Каталог', to: '/catalog' }, { label: category.title }]" />
    <h1 class="mt-3 text-3xl font-extrabold md:text-5xl">{{ category.title }}</h1>
    <p class="mt-4 max-w-xl text-ink-muted">{{ category.description }}</p>

    <ul class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="product in products" :key="product.slug">
        <ProductCard :product="product" />
      </li>
    </ul>
    <p class="mt-6 text-sm text-ink-subtle">Товары условные, только для демо.</p>
  </div>
</template>
