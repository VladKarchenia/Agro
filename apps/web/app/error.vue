<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error.statusCode === 404)

usePageSeo({
  title: is404.value ? 'Страница не найдена' : 'Ошибка',
  description: is404.value
    ? 'Такой страницы нет. Возможно, адрес изменился или страница была удалена.'
    : 'Произошла ошибка. Попробуйте обновить страницу позже.',
  noindex: true,
  canonical: false,
})
</script>

<template>
  <NuxtLayout>
    <div class="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <p class="font-heading text-6xl font-extrabold text-brand">{{ error.statusCode }}</p>
      <h1 class="mt-4 text-3xl font-extrabold md:text-4xl">
        {{ is404 ? 'Страница не найдена' : 'Что-то пошло не так' }}
      </h1>
      <p class="mt-4 max-w-xl text-ink-muted">
        {{
          is404
            ? 'Возможно, адрес изменился или страница была удалена.'
            : 'Попробуйте обновить страницу позже.'
        }}
      </p>
      <div class="mt-8">
        <AppButton @click="clearError({ redirect: '/' })">На главную</AppButton>
      </div>
    </div>
  </NuxtLayout>
</template>
