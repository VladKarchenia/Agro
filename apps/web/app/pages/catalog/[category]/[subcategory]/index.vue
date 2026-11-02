<script setup lang="ts">
import {
  categoryPath,
  getCategory,
  getProducts,
  getSubcategory,
  productPath,
  subcategoryPath,
} from '~/data/catalog'
import { collectionLd } from '~/utils/structured-data'

const route = useRoute()
const category = getCategory(String(route.params.category))
const subcategory = getSubcategory(String(route.params.category), String(route.params.subcategory))

if (!category || !subcategory) {
  throw createError({ statusCode: 404, message: 'Раздел не найден', fatal: true })
}

const products = getProducts(category.slug, subcategory.slug)

const { siteUrl } = useRuntimeConfig().public
const path = subcategoryPath(subcategory)

usePageSeo({
  title: subcategory.seoTitle,
  description: subcategory.seoDescription,
  breadcrumbs: [
    { name: 'Каталог', path: '/catalog' },
    { name: category.title, path: categoryPath(category) },
    { name: subcategory.title, path },
  ],
  jsonLd: [
    collectionLd(siteUrl, {
      name: subcategory.title,
      description: subcategory.seoDescription,
      path,
      items: products.map((product) => ({ name: product.name, path: productPath(product) })),
    }),
  ],
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
    <AppBreadcrumbs
      :items="[
        { label: 'Каталог', to: '/catalog' },
        { label: category.title, to: categoryPath(category) },
        { label: subcategory.title },
      ]"
    />
    <h1 class="mt-3 text-3xl font-extrabold md:text-5xl">{{ subcategory.title }}</h1>
    <div class="mt-4 max-w-3xl space-y-3 text-ink-muted">
      <p v-for="paragraph in subcategory.intro" :key="paragraph">{{ paragraph }}</p>
    </div>

    <section aria-labelledby="products-title" class="mt-10">
      <h2 id="products-title" class="text-2xl font-bold">Типоразмеры</h2>
      <ul class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="product in products" :key="product.slug">
          <ProductCard :product="product" :level="3" />
        </li>
      </ul>
    </section>

    <div class="mt-14 max-w-3xl space-y-10">
      <section v-for="section in subcategory.sections" :key="section.heading">
        <h2 class="text-2xl font-bold">{{ section.heading }}</h2>
        <p v-for="paragraph in section.paragraphs" :key="paragraph" class="mt-3 text-ink-muted">
          {{ paragraph }}
        </p>
        <ul v-if="section.items" class="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
          <li v-for="item in section.items" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section v-if="subcategory.faq.length > 0" aria-labelledby="faq-title">
        <h2 id="faq-title" class="text-2xl font-bold">Частые вопросы</h2>
        <div v-for="item in subcategory.faq" :key="item.question" class="mt-4">
          <h3 class="font-bold">{{ item.question }}</h3>
          <p class="mt-1 text-ink-muted">{{ item.answer }}</p>
        </div>
      </section>
    </div>
  </div>
</template>
