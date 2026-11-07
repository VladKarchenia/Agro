<script setup lang="ts">
import { getProductImages, type Product, productPath } from '~/data/catalog'

// level: уровень заголовка товара. Он должен идти на единицу глубже заголовка раздела, внутри которого
// стоит карточка (под h1 это 2, под h2 это 3), иначе ломается структура страницы для скринридеров
const props = withDefaults(defineProps<{ product: Product; level?: 2 | 3 }>(), { level: 2 })

// В списке показываем первое фото (у товара с цветами: первого цвета, у которого оно есть)
const image = computed(() => getProductImages(props.product)[0])

// Количество выбирается прямо на карточке и добавляется в корзину одним нажатием
const quantity = ref(1)
</script>

<template>
  <article class="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface">
    <NuxtLink :to="productPath(product)" tabindex="-1" aria-hidden="true">
      <ProductPhoto :image="image" />
    </NuxtLink>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <component :is="`h${level}`" class="text-lg font-bold">
        <NuxtLink :to="productPath(product)" class="hover:underline">
          {{ product.name }}
        </NuxtLink>
      </component>
      <p class="text-sm text-ink-muted">{{ product.summary }}</p>
      <p class="text-ink-muted">Цена по запросу</p>
      <div v-if="product.variants" class="mt-auto pt-2">
        <AppButton :to="productPath(product)" variant="ghost" class="w-full">
          {{ product.variants.chooseLabel ?? `Выбрать ${product.variants.title.toLowerCase()}` }}
        </AppButton>
      </div>
      <div v-else class="mt-auto flex items-start gap-3 pt-2">
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
