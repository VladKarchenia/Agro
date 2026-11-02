<script setup lang="ts">
import { highlight } from '~/utils/search'

// Текст с подсвеченными словами запроса. Подсветка только визуальная: скринридер читает обычный текст
const props = defineProps<{ text: string; tokens: string[] }>()
const segments = computed(() => highlight(props.text, props.tokens))
</script>

<template>
  <span>
    <template v-for="(segment, index) in segments" :key="index">
      <mark v-if="segment.hit" class="rounded-sm bg-brand/35 text-inherit">{{ segment.text }}</mark>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>
