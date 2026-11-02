<script setup lang="ts">
import type { ProductImage } from '~/data/catalog'

// Фото товара или заглушка, пока реального фото нет (docs/specs/content.md: ИИ-картинки товара не используем).
// priority: главное фото на странице товара, грузится сразу, остальные лениво.
const props = withDefaults(
  defineProps<{ image?: ProductImage; compact?: boolean; priority?: boolean }>(),
  { compact: false, priority: false },
)

// Файлы лежат в public: на демо-сайте с базовым путём (GitHub Pages) к адресу нужен этот путь
const { baseURL } = useRuntimeConfig().app
const src = computed(() => (props.image ? `${baseURL.replace(/\/$/, '')}${props.image.src}` : ''))
</script>

<template>
  <img
    v-if="image"
    :src="src"
    :alt="image.alt"
    :width="image.width"
    :height="image.height"
    :loading="priority ? 'eager' : 'lazy'"
    :fetchpriority="priority ? 'high' : undefined"
    decoding="async"
    class="aspect-[4/3] w-full bg-white object-contain"
  />
  <div
    v-else
    class="grid aspect-[4/3] place-items-center bg-surface-sunken text-ink-subtle"
    role="img"
    aria-label="Фото появится позже"
  >
    <svg
      :class="compact ? 'size-6' : 'size-10'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 16l-5-5-8 8" />
    </svg>
  </div>
</template>
