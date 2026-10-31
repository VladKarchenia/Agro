<script setup lang="ts">
import { getCategories } from '~/data/catalog'
import { collectionLd } from '~/utils/structured-data'

const categories = getCategories()
const { siteUrl } = useRuntimeConfig().public
const description =
  'Каталог техники, оборудования и запчастей для сельского хозяйства: категории и товары. Цена по запросу, заказ через заявку.'

usePageSeo({
  title: 'Каталог техники и оборудования для сельского хозяйства',
  description,
  breadcrumbs: [{ name: 'Каталог', path: '/catalog' }],
  jsonLd: [
    collectionLd(siteUrl, {
      name: 'Каталог',
      description,
      path: '/catalog',
      items: categories.map((category) => ({
        name: category.title,
        path: `/catalog/${category.slug}`,
      })),
    }),
  ],
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
    <h1 class="text-3xl font-extrabold md:text-5xl">Каталог</h1>
    <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="category in categories" :key="category.slug">
        <NuxtLink
          :to="`/catalog/${category.slug}`"
          class="block h-full rounded-card border border-line bg-surface p-5 transition-colors hover:border-brand"
        >
          <h2 class="text-lg font-bold">{{ category.title }}</h2>
          <p class="mt-1 text-ink-muted">{{ category.description }}</p>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
