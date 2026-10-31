<script setup lang="ts">
import {
  applyPhoneEdit,
  caretAfterDigits,
  extractNationalDigits,
  formatNational,
  PHONE_PREFIX,
  toFullPhone,
} from '~/utils/phone'

// Код страны +375 показан всегда и стереть его нельзя: он вне поля ввода.
// Человек вводит только код оператора (2 цифры) и номер. В форму уходит «+375 (29) 123-45-67».
const props = defineProps<{
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
}>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ blur: [] }>()

const display = computed(() => formatNational(extractNationalDigits(model.value)))

function onInput(event: Event) {
  const el = event.target as HTMLInputElement
  const { digits, caretDigits } = applyPhoneEdit(
    display.value,
    el.value,
    el.selectionStart ?? el.value.length,
  )
  const formatted = formatNational(digits)

  // Подставляем значение сразу, чтобы курсор не прыгал в конец при правке в середине номера
  el.value = formatted
  const caret = caretAfterDigits(formatted, caretDigits)
  el.setSelectionRange(caret, caret)

  model.value = toFullPhone(digits)
}

const wrapperClass = computed(() => [
  'flex h-12 w-full items-center rounded-control border bg-surface text-base text-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus',
  props.error ? 'border-danger' : 'border-line-strong',
])
</script>

<template>
  <FormField :id="id" :label="label" :error="error" :hint="hint" :required="required">
    <template #label>
      {{ label }}<span class="sr-only">, код страны {{ PHONE_PREFIX }} уже указан</span>
    </template>
    <template #default="{ describedBy, invalid }">
      <div :class="wrapperClass">
        <span class="select-none pl-3.5 pr-1.5 font-medium" aria-hidden="true">{{ PHONE_PREFIX }}</span>
        <input
          :id="id"
          type="tel"
          :value="display"
          class="h-full min-w-0 flex-1 bg-transparent pr-3.5 outline-none placeholder:text-ink-subtle"
          autocomplete="tel-national"
          inputmode="tel"
          placeholder="(29) 123-45-67"
          :aria-invalid="invalid || undefined"
          :aria-describedby="describedBy"
          :aria-required="required || undefined"
          @input="onInput"
          @blur="emit('blur')"
        />
      </div>
    </template>
  </FormField>
</template>
