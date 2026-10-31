<script setup lang="ts">
// Заглушка до появления реальных фото (см. docs/specs/content.md: ИИ-картинки товара не используем)
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <div
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
