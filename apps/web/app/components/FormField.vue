<script setup lang="ts">
// Общая оболочка поля: подпись, подсказка, ошибка. Сам элемент ввода передаётся в слот.
const props = defineProps<{
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
}>()

const describedBy = computed(
  () =>
    [props.error ? `${props.id}-error` : null, props.hint ? `${props.id}-hint` : null]
      .filter(Boolean)
      .join(' ') || undefined,
)
</script>

<template>
  <div class="grid gap-1.5">
    <label :for="id" class="text-sm font-medium">
      <slot name="label">{{ label }}</slot
      ><span v-if="required" class="text-danger" aria-hidden="true"> *</span>
    </label>
    <slot :described-by="describedBy" :invalid="Boolean(error)" />
    <p v-if="hint && !error" :id="`${id}-hint`" class="text-sm text-ink-subtle">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="text-sm text-danger">{{ error }}</p>
  </div>
</template>
