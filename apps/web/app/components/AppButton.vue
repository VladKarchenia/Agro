<script setup lang="ts">
withDefaults(
  defineProps<{
    to?: string
    variant?: 'primary' | 'ghost' | 'ghost-light'
  }>(),
  { variant: 'primary' },
)

const styles = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover active:bg-brand-active border-transparent',
  ghost: 'border-ink text-ink hover:bg-surface-sunken',
  'ghost-light': 'border-dark-line text-on-dark hover:bg-dark-raised',
}
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="inline-flex h-12 items-center justify-center rounded-control border-2 px-6 font-semibold transition-colors"
    :class="styles[variant]"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    type="button"
    class="inline-flex h-12 items-center justify-center rounded-control border-2 px-6 font-semibold transition-colors"
    :class="styles[variant]"
  >
    <slot />
  </button>
</template>
