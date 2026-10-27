<script setup lang="ts">
import type { LegalSection } from '~/content/privacy-policy'

defineProps<{
  title: string
  sections: LegalSection[]
  draft?: boolean
}>()
</script>

<template>
  <article class="mx-auto max-w-3xl px-5 py-12 md:py-16">
    <h1 class="text-3xl font-extrabold md:text-4xl">{{ title }}</h1>

    <p
      v-if="draft"
      class="mt-6 rounded-card border border-line bg-brand-soft p-4 text-sm text-ink"
      role="note"
    >
      Черновик. Данные организации заполнены не полностью (отмечены в квадратных скобках), текст
      проходит юридическую проверку.
    </p>

    <nav class="mt-8" aria-label="Содержание">
      <ol class="grid gap-1 text-sm">
        <li v-for="(section, index) in sections" :key="section.id">
          <a :href="`#${section.id}`" class="text-link underline">{{ index + 1 }}. {{ section.title }}</a>
        </li>
      </ol>
    </nav>

    <section
      v-for="(section, index) in sections"
      :id="section.id"
      :key="section.id"
      class="mt-10 scroll-mt-24"
    >
      <h2 class="text-xl font-bold md:text-2xl">{{ index + 1 }}. {{ section.title }}</h2>
      <template v-for="(block, blockIndex) in section.blocks" :key="blockIndex">
        <p v-if="block.type === 'p'" class="mt-3 text-ink-muted">{{ block.text }}</p>
        <ul v-else class="mt-3 list-disc space-y-2 pl-6 text-ink-muted">
          <li v-for="item in block.items" :key="item">{{ item }}</li>
        </ul>
      </template>
    </section>
  </article>
</template>
