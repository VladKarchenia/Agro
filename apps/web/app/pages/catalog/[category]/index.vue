<script setup lang="ts">
import { categoryPath, getCategory, getSubcategories, subcategoryPath } from '~/data/catalog'
import { collectionLd } from '~/utils/structured-data'

const route = useRoute()
const category = getCategory(String(route.params.category))

if (!category) {
  throw createError({ statusCode: 404, message: 'Категория не найдена', fatal: true })
}

const subcategories = getSubcategories(category.slug)

const { siteUrl } = useRuntimeConfig().public
const path = categoryPath(category)
const description = `${category.description}. Каталог в Беларуси, цена по запросу, заказ через заявку на сайте.`

usePageSeo({
  title: `${category.title} в Беларуси: каталог`,
  description,
  breadcrumbs: [
    { name: 'Каталог', path: '/catalog' },
    { name: category.title, path },
  ],
  image: category.cover?.src,
  imageSize: category.cover && { width: category.cover.width, height: category.cover.height },
  imageAlt: category.cover && `${category.title}: фото товаров категории`,
  jsonLd: [
    collectionLd(siteUrl, {
      name: category.title,
      description,
      path,
      items: subcategories.map((subcategory) => ({
        name: subcategory.title,
        path: subcategoryPath(subcategory),
      })),
    }),
  ],
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
    <AppBreadcrumbs :items="[{ label: 'Каталог', to: '/catalog' }, { label: category.title }]" />
    <h1 class="mt-3 text-3xl font-extrabold md:text-5xl">{{ category.title }}</h1>
    <p class="mt-4 max-w-xl text-ink-muted">{{ category.description }}</p>

    <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="subcategory in subcategories" :key="subcategory.slug">
        <NuxtLink
          :to="subcategoryPath(subcategory)"
          class="block h-full rounded-card border border-line bg-surface p-5 transition-colors hover:border-brand"
        >
          <h2 class="text-lg font-bold">{{ subcategory.title }}</h2>
          <p class="mt-1 text-ink-muted">{{ subcategory.description }}</p>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
