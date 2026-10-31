<script setup lang="ts">
import { getCategories } from '~/data/catalog'
import { company } from '~/data/company'
import { organizationLd, websiteLd } from '~/utils/structured-data'

const categories = getCategories()
const { siteUrl } = useRuntimeConfig().public

usePageSeo({
  title: 'Техника и оборудование для сельского хозяйства',
  description:
    'АгроЭд: техника, оборудование и запчасти для сельского хозяйства в Беларуси. Цены по запросу, заявка на сайте.',
  jsonLd: [organizationLd(siteUrl, company), websiteLd(siteUrl, company.brand)],
})
</script>

<template>
  <div>
    <section class="bg-dark text-on-dark">
      <div class="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <h1 class="max-w-3xl text-4xl font-extrabold md:text-6xl">
          Техника и оборудование для <span class="text-brand">сельского хозяйства</span>
        </h1>
        <p class="mt-5 max-w-xl text-lg text-on-dark-muted">
          Подберём решение под вашу задачу и подготовим предложение. Цена по запросу.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <AppButton to="/catalog">Открыть каталог</AppButton>
          <AppButton to="/contacts" variant="ghost-light">Связаться с нами</AppButton>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-5 py-12 md:py-16">
      <h2 class="text-2xl font-extrabold md:text-3xl">Категории</h2>
      <p class="mt-2 text-sm text-ink-subtle">Названия условные, только для демо.</p>
      <ul class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="category in categories" :key="category.slug">
          <NuxtLink
            :to="`/catalog/${category.slug}`"
            class="block h-full rounded-card border border-line bg-surface p-5 transition-colors hover:border-brand"
          >
            <h3 class="text-lg font-bold">{{ category.title }}</h3>
            <p class="mt-1 text-ink-muted">{{ category.description }}</p>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
