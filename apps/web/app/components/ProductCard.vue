<script setup lang="ts">
import type { Product } from '~/data/catalog'

defineProps<{ product: Product }>()

// Количество выбирается прямо на карточке и добавляется в корзину одним нажатием
const quantity = ref(1)
</script>

<template>
  <article class="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface">
    <NuxtLink
      :to="`/catalog/${product.categorySlug}/${product.slug}`"
      tabindex="-1"
      aria-hidden="true"
    >
      <ProductPhoto />
    </NuxtLink>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <h3 class="text-lg font-bold">
        <NuxtLink :to="`/catalog/${product.categorySlug}/${product.slug}`" class="hover:underline">
          {{ product.name }}
        </NuxtLink>
      </h3>
      <p class="text-ink-muted">Цена по запросу</p>
      <div class="mt-auto flex items-start gap-3 pt-2">
        <QuantityInput v-model="quantity" :label="product.name" class="shrink-0" />
        <AddToCartButton
          :slug="product.slug"
          :name="product.name"
          :quantity="quantity"
          class="min-w-0 flex-1"
        />
      </div>
    </div>
  </article>
</template>
