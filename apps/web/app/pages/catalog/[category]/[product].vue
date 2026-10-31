<script setup lang="ts">
import { getCategory, getProduct } from '~/data/catalog'
import { productLd } from '~/utils/structured-data'

const route = useRoute()
const product = getProduct(String(route.params.product))
const category = product && getCategory(product.categorySlug)

// Товар доступен только по адресу своей категории: один адрес на товар, без дублей для SEO
if (!product || !category || product.categorySlug !== route.params.category) {
  throw createError({ statusCode: 404, message: 'Товар не найден', fatal: true })
}

const quantity = ref(1)

const { siteUrl } = useRuntimeConfig().public
const path = `/catalog/${category.slug}/${product.slug}`
// Описание всегда начинается с названия товара, поэтому не совпадает у разных товаров
const description = `${product.name}. ${product.summary} Цена по запросу, заказ через заявку на сайте.`

usePageSeo({
  title: `${product.name}, цена по запросу`,
  description,
  breadcrumbs: [
    { name: 'Каталог', path: '/catalog' },
    { name: category.title, path: `/catalog/${category.slug}` },
    { name: product.name, path },
  ],
  jsonLd: [
    productLd(siteUrl, {
      name: product.name,
      description: product.summary,
      path,
      category: category.title,
    }),
  ],
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
    <AppBreadcrumbs
      :items="[
        { label: 'Каталог', to: '/catalog' },
        { label: category.title, to: `/catalog/${category.slug}` },
        { label: product.name },
      ]"
    />

    <div class="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
      <div class="overflow-hidden rounded-card border border-line">
        <ProductPhoto />
      </div>

      <div>
        <h1 class="text-3xl font-extrabold md:text-4xl">{{ product.name }}</h1>
        <p class="mt-3 text-lg text-ink-muted">Цена по запросу</p>
        <p class="mt-4 text-ink-muted">{{ product.summary }}</p>

        <div class="mt-8 flex flex-wrap items-start gap-4">
          <QuantityInput v-model="quantity" :label="product.name" />
          <AddToCartButton :slug="product.slug" :name="product.name" :quantity="quantity" />
        </div>
        <p class="mt-4 text-sm text-ink-subtle">
          <NuxtLink to="/cart" class="text-link underline">Перейти в корзину</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
