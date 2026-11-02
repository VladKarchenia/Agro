<script setup lang="ts">
import {
  categoryPath,
  getCategory,
  getProduct,
  getProductImages,
  getSubcategory,
  productPath,
  subcategoryPath,
} from '~/data/catalog'
import { productLd } from '~/utils/structured-data'

const route = useRoute()
const product = getProduct(String(route.params.product))
const category = product && getCategory(product.categorySlug)
const subcategory = product && getSubcategory(product.categorySlug, product.subcategorySlug)

// Товар доступен только по адресу своей подкатегории: один адрес на товар, без дублей для SEO
if (
  !product ||
  !category ||
  !subcategory ||
  product.categorySlug !== route.params.category ||
  product.subcategorySlug !== route.params.subcategory
) {
  throw createError({ statusCode: 404, message: 'Товар не найден', fatal: true })
}

const quantity = ref(1)

// У товара с исполнениями (цвет) в корзину уходит выбранное исполнение, а не сам товар
const variantSlug = ref(product.variants?.options[0]?.slug ?? product.slug)
const cartName = computed(() => {
  const option = product.variants?.options.find((item) => item.slug === variantSlug.value)
  return option ? `${product.name} ${option.label}` : product.name
})

// Фото выбранного цвета: фото одного цвета другому не подставляем, без фото показывается заглушка
const images = computed(() => getProductImages(product, variantSlug.value))
const activeImage = ref(0)
watch(variantSlug, () => {
  activeImage.value = 0
})
const mainImage = computed(() => images.value[activeImage.value])

const { siteUrl } = useRuntimeConfig().public
const path = productPath(product)
// Для превью ссылки и разметки берём фото цвета по умолчанию, остальные цвета у того же адреса
const seoImages = getProductImages(product, product.variants?.options[0]?.slug)
const firstSeoImage = seoImages[0]
// Описание всегда начинается с названия товара, поэтому не совпадает у разных товаров
const description = `${product.name}. ${product.summary} Цена по запросу, заказ через заявку на сайте.`

usePageSeo({
  title: `${product.name}, цена по запросу`,
  description,
  breadcrumbs: [
    { name: 'Каталог', path: '/catalog' },
    { name: category.title, path: categoryPath(category) },
    { name: subcategory.title, path: subcategoryPath(subcategory) },
    { name: product.name, path },
  ],
  image: firstSeoImage?.src,
  imageSize: firstSeoImage && { width: firstSeoImage.width, height: firstSeoImage.height },
  imageAlt: firstSeoImage?.alt,
  jsonLd: [
    productLd(siteUrl, {
      name: product.name,
      description: product.description[0] ?? product.summary,
      path,
      category: subcategory.title,
      brand: product.brand,
      properties: product.specs,
      image: seoImages.map((image) => image.src),
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
        { label: subcategory.title, to: subcategoryPath(subcategory) },
        { label: product.name },
      ]"
    />

    <div class="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
      <div>
        <div class="overflow-hidden rounded-card border border-line">
          <ProductPhoto :image="mainImage" priority />
        </div>
        <ul v-if="images.length > 1" class="mt-3 flex flex-wrap gap-3" aria-label="Фотографии товара">
          <li v-for="(image, index) in images" :key="image.src">
            <button
              type="button"
              :aria-label="`Показать фото ${index + 1} из ${images.length}`"
              :aria-pressed="index === activeImage"
              :class="[
                'block w-20 overflow-hidden rounded-control border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                index === activeImage ? 'border-ink' : 'border-line hover:border-line-strong',
              ]"
              @click="activeImage = index"
            >
              <ProductPhoto :image="image" compact />
            </button>
          </li>
        </ul>
      </div>

      <div>
        <h1 class="text-3xl font-extrabold md:text-4xl">{{ product.name }}</h1>
        <p class="mt-3 text-lg text-ink-muted">Цена по запросу</p>
        <p class="mt-4 text-ink-muted">{{ product.summary }}</p>

        <fieldset v-if="product.variants" class="mt-6 grid gap-2">
          <legend class="mb-1 text-sm font-medium">{{ product.variants.title }}</legend>
          <div class="flex flex-wrap gap-3">
            <label
              v-for="option in product.variants.options"
              :key="option.slug"
              :class="[
                'flex min-h-11 items-center justify-center rounded-control border-2 px-4 text-center font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
                variantSlug === option.slug
                  ? 'border-ink bg-ink text-on-dark'
                  : 'border-line-strong text-ink hover:bg-surface-sunken',
              ]"
            >
              <input v-model="variantSlug" type="radio" :value="option.slug" class="sr-only" />
              {{ option.label }}
            </label>
          </div>
        </fieldset>

        <div class="mt-8 flex flex-wrap items-start gap-4">
          <QuantityInput v-model="quantity" :label="cartName" />
          <AddToCartButton :slug="variantSlug" :name="cartName" :quantity="quantity" />
        </div>
        <p class="mt-4 text-sm text-ink-subtle">
          <NuxtLink to="/cart" class="text-link underline">Перейти в корзину</NuxtLink>
        </p>
      </div>
    </div>

    <div class="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-12">
      <section aria-labelledby="description-title">
        <h2 id="description-title" class="text-2xl font-bold">Описание</h2>
        <p v-for="paragraph in product.description" :key="paragraph" class="mt-3 text-ink-muted">
          {{ paragraph }}
        </p>
        <p class="mt-3 text-ink-muted">
          Назначение, расшифровку маркировки и советы по выбору смотрите в разделе
          <NuxtLink :to="subcategoryPath(subcategory)" class="text-link underline">
            «{{ subcategory.title }}»</NuxtLink
          >.
        </p>
      </section>

      <section aria-labelledby="specs-title">
        <h2 id="specs-title" class="text-2xl font-bold">Характеристики</h2>
        <dl class="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
          <div
            v-for="spec in product.specs"
            :key="spec.name"
            class="grid gap-1 p-3 sm:grid-cols-[1fr_1fr] sm:gap-4"
          >
            <dt class="text-ink-muted">{{ spec.name }}</dt>
            <dd class="font-medium">{{ spec.value }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>
