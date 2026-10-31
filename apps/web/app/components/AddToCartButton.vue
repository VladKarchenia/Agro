<script setup lang="ts">
const props = withDefaults(defineProps<{ slug: string; quantity?: number; name: string }>(), {
  quantity: 1,
})

const { add, quantityOf } = useCart()
const justAdded = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function onAdd() {
  add(props.slug, props.quantity)
  justAdded.value = true
  clearTimeout(timer)
  timer = setTimeout(() => {
    justAdded.value = false
  }, 1800)
}

onBeforeUnmount(() => clearTimeout(timer))

const inCart = computed(() => quantityOf(props.slug))
</script>

<template>
  <div class="grid gap-1.5">
    <AppButton :aria-label="`В заявку: ${name}`" @click="onAdd">
      {{ justAdded ? 'Добавлено' : 'В заявку' }}
    </AppButton>
    <p class="min-h-5 text-sm text-ink-subtle" aria-live="polite">
      <template v-if="justAdded">В заявке: {{ inCart }} шт.</template>
    </p>
  </div>
</template>
