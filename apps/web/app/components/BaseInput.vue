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

const describedBy = computed(
  () =>
    [props.error ? `${props.id}-error` : null, props.hint ? `${props.id}-hint` : null]
      .filter(Boolean)
      .join(' ') || undefined,
)

const fieldClass = computed(() => [
  'w-full rounded-control border bg-surface px-3.5 text-base text-ink placeholder:text-ink-subtle',
  props.error ? 'border-danger' : 'border-line-strong',
])
</script>

<template>
  <div class="grid gap-1.5">
    <label :for="id" class="text-sm font-medium">
      {{ label }}<span v-if="required" class="text-danger" aria-hidden="true"> *</span>
    </label>
    <textarea
      v-if="multiline"
      :id="id"
      v-model="model"
      rows="4"
      :class="[fieldClass, 'py-3']"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :aria-invalid="error ? true : undefined"
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
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      :aria-required="required || undefined"
      @blur="emit('blur')"
    />
    <p v-if="hint && !error" :id="`${id}-hint`" class="text-sm text-ink-subtle">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="text-sm text-danger">{{ error }}</p>
  </div>
</template>
