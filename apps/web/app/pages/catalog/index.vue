<script setup lang="ts">
import { mockCategories } from '~/data/mock-categories'

useSeoMeta({ title: 'Каталог', description: 'Каталог техники и оборудования АгроЭд.' })
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
    <h1 class="text-3xl font-extrabold md:text-5xl">Каталог</h1>
    <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="category in mockCategories" :key="category.slug">
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
