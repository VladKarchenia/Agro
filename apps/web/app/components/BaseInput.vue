<script setup lang="ts">
const props = defineProps<{
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  type?: string
  multiline?: boolean
  autocomplete?: string
  inputmode?: 'text' | 'tel' | 'email' | 'numeric'
  placeholder?: string
  maxlength?: number
}>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ blur: [] }>()

const fieldClass = computed(() => [
  'w-full rounded-control border bg-surface px-3.5 text-base text-ink placeholder:text-ink-subtle',
  props.error ? 'border-danger' : 'border-line-strong',
])
</script>

<template>
  <FormField :id="id" :label="label" :error="error" :hint="hint" :required="required">
    <template #default="{ describedBy, invalid }">
      <textarea
        v-if="multiline"
        :id="id"
        v-model="model"
        rows="4"
        :class="[fieldClass, 'py-3']"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        :aria-required="required || undefined"
        @blur="emit('blur')"
      />
      <input
        v-else
        :id="id"
        v-model="model"
        :type="type ?? 'text'"
        :class="[fieldClass, 'h-12']"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        :aria-required="required || undefined"
        @blur="emit('blur')"
      />
    </template>
  </FormField>
</template>
