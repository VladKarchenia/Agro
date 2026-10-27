<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'dark' | 'light' }>(), { tone: 'dark' })
</script>

<template>
  <span class="inline-flex items-center gap-2.5 font-heading text-2xl font-extrabold">
    <svg class="size-9 shrink-0" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" class="fill-dark-raised" />
      <g class="fill-brand">
        <path d="M30.75 12h2.5v43h-2.5z" />
        <ellipse cx="32" cy="14" rx="3.6" ry="6.4" />
        <path d="M32 30Q21 30 20 19Q31 19 32 30Z" />
        <path d="M32 30Q43 30 44 19Q33 19 32 30Z" />
        <path d="M32 40Q21 40 20 29Q31 29 32 40Z" />
        <path d="M32 40Q43 40 44 29Q33 29 32 40Z" />
        <path d="M32 50Q21 50 20 39Q31 39 32 50Z" />
        <path d="M32 50Q43 50 44 39Q33 39 32 50Z" />
      </g>
    </svg>
    <span :class="tone === 'light' ? 'text-on-dark' : 'text-ink'">
      Агро<span class="text-brand">Эд</span>
    </span>
  </span>
</template>
