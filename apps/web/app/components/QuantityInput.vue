<script setup lang="ts">
import { clampQuantity } from '~/utils/cart'

const props = defineProps<{ label: string }>()
const model = defineModel<number>({ required: true })

// Пока человек печатает, поле может быть пустым, поэтому правим значение только на blur и Enter
const draft = ref(String(model.value))
watch(model, (value) => {
  draft.value = String(value)
})

function commit() {
  const parsed = Number.parseInt(draft.value, 10)
  model.value = clampQuantity(Number.isNaN(parsed) ? model.value : parsed)
  draft.value = String(model.value)
}

function step(delta: number) {
  model.value = clampQuantity(model.value + delta)
}

const buttonClass =
  'grid size-11 place-items-center text-xl leading-none text-ink hover:bg-surface-sunken disabled:opacity-40'
</script>

<template>
  <div
    class="inline-flex items-center overflow-hidden rounded-control border border-line-strong bg-surface"
    role="group"
    :aria-label="`Количество: ${props.label}`"
  >
    <button
      type="button"
      :class="buttonClass"
      :disabled="model <= 1"
      aria-label="Уменьшить количество"
      @click="step(-1)"
    >
      −
    </button>
    <input
      v-model="draft"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      class="h-11 w-14 border-x border-line bg-surface text-center text-base text-ink"
      :aria-label="`Количество: ${props.label}`"
      @blur="commit"
      @keydown.enter.prevent="commit"
    />
    <button type="button" :class="buttonClass" aria-label="Увеличить количество" @click="step(1)">
      +
    </button>
  </div>
</template>
