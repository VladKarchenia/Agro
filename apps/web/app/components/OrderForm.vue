<script setup lang="ts">
import { buildConsentInfo, CONSENT_VERSION } from '~/content/order-consent'
import { company } from '~/data/company'
import type { CartItem } from '~/utils/cart'
import { submitOrder } from '~/utils/order-submit'
import {
  emptyOrderForm,
  FIELD_ORDER,
  LIMITS,
  type OrderErrors,
  type OrderField,
  toOrderPayload,
  validateOrder,
} from '~/utils/order-validation'

const props = defineProps<{ items: CartItem[] }>()
const emit = defineEmits<{ done: [demo: boolean] }>()

const config = useRuntimeConfig()
const consentInfo = buildConsentInfo(company)

const form = reactive(emptyOrderForm())
const touched = reactive<Partial<Record<OrderField, boolean>>>({})
const submitted = ref(false)
const sending = ref(false)
const serverError = ref('')

const validation = computed(() => validateOrder(form))

// Ошибку поля показываем после ухода с поля или после попытки отправки
const errors = computed(() => {
  const visible: OrderErrors = {}
  for (const field of FIELD_ORDER) {
    const message = validation.value.errors[field]
    if (message && (submitted.value || touched[field])) visible[field] = message
  }
  return visible
})

const isOrganization = computed(() => form.customerType === 'organization')

async function onSubmit() {
  submitted.value = true
  serverError.value = ''
  if (props.items.length === 0) return

  if (!validation.value.valid) {
    await nextTick()
    const first = FIELD_ORDER.find((field) => validation.value.errors[field])
    if (first) document.getElementById(`field-${first}`)?.focus()
    return
  }

  // Заполненная ловушка означает бота: имитируем успех и ничего не отправляем
  if (form.website) {
    emit('done', false)
    return
  }

  sending.value = true
  const payload = toOrderPayload(form, props.items, {
    textVersion: CONSENT_VERSION,
    at: new Date().toISOString(),
  })
  const result = await submitOrder(
    payload,
    config.public.orderMode === 'api' ? 'api' : 'demo',
    (url, body) => $fetch(url, { method: 'POST', body }),
  )
  sending.value = false

  if (result.ok) emit('done', result.demo)
  else serverError.value = result.message
}

const segmentClass = (active: boolean) => [
  'flex h-12 cursor-pointer items-center justify-center rounded-control border-2 px-4 text-center font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
  active ? 'border-ink bg-ink text-on-dark' : 'border-line-strong text-ink hover:bg-surface-sunken',
]
</script>

<template>
  <form class="grid gap-5" novalidate @submit.prevent="onSubmit">
    <fieldset class="grid gap-2">
      <legend class="mb-1 text-sm font-medium">Вы оформляете заявку как</legend>
      <div class="grid grid-cols-2 gap-3">
        <label :class="segmentClass(!isOrganization)">
          <input v-model="form.customerType" type="radio" value="individual" class="sr-only" />
          Физлицо
        </label>
        <label :class="segmentClass(isOrganization)">
          <input v-model="form.customerType" type="radio" value="organization" class="sr-only" />
          Организация или ИП
        </label>
      </div>
    </fieldset>

    <BaseInput
      id="field-name"
      v-model="form.name"
      label="Имя"
      required
      autocomplete="name"
      :maxlength="LIMITS.name"
      :error="errors.name"
      @blur="touched.name = true"
    />
    <BaseInput
      id="field-phone"
      v-model="form.phone"
      label="Телефон"
      type="tel"
      required
      autocomplete="tel"
      inputmode="tel"
      placeholder="+375 29 123-45-67"
      :error="errors.phone"
      @blur="touched.phone = true"
    />
    <BaseInput
      id="field-email"
      v-model="form.email"
      label="Email"
      type="email"
      required
      autocomplete="email"
      inputmode="email"
      :maxlength="LIMITS.email"
      :error="errors.email"
      @blur="touched.email = true"
    />

    <template v-if="isOrganization">
      <BaseInput
        id="field-organization"
        v-model="form.organization"
        label="Название организации"
        required
        autocomplete="organization"
        :maxlength="LIMITS.organization"
        :error="errors.organization"
        @blur="touched.organization = true"
      />
      <BaseInput
        id="field-unp"
        v-model="form.unp"
        label="УНП"
        required
        inputmode="numeric"
        autocomplete="off"
        :maxlength="9"
        hint="9 цифр"
        :error="errors.unp"
        @blur="touched.unp = true"
      />
    </template>

    <BaseInput
      id="field-city"
      v-model="form.city"
      label="Город или адрес доставки"
      autocomplete="street-address"
      :maxlength="LIMITS.city"
      :error="errors.city"
      @blur="touched.city = true"
    />
    <BaseInput
      id="field-comment"
      v-model="form.comment"
      label="Комментарий"
      multiline
      :maxlength="LIMITS.comment"
      hint="Пожелания, вопросы по товарам, удобное время звонка"
      :error="errors.comment"
      @blur="touched.comment = true"
    />

    <!-- Ловушка для ботов: скрыта от людей и от скринридеров -->
    <div class="absolute -left-[9999px]" aria-hidden="true">
      <label>
        Сайт
        <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" />
      </label>
    </div>

    <section
      class="rounded-card border border-line bg-surface-alt p-4 text-sm"
      aria-labelledby="consent-title"
    >
      <h3 id="consent-title" class="font-semibold">Обработка персональных данных</h3>
      <dl class="mt-2 grid gap-1.5">
        <div v-for="row in consentInfo.rows" :key="row.label">
          <dt class="inline font-medium">{{ row.label }}:</dt>
          <dd class="inline text-ink-muted">{{ ' ' }}{{ row.value }}</dd>
        </div>
      </dl>
      <h4 class="mt-4 font-semibold">Ваши права</h4>
      <p class="mt-1 text-ink-muted">{{ consentInfo.rights }}</p>
    </section>

    <div class="grid gap-1.5">
      <label class="flex cursor-pointer items-start gap-3">
        <input
          id="field-consent"
          v-model="form.consent"
          type="checkbox"
          class="mt-0.5 size-5 shrink-0 accent-brand"
          :aria-invalid="errors.consent ? true : undefined"
          :aria-describedby="errors.consent ? 'field-consent-error' : undefined"
          @change="touched.consent = true"
        />
        <span>
          Даю согласие на обработку моих персональных данных на указанных условиях и ознакомлен(а)
          с
          <NuxtLink to="/privacy" target="_blank" class="text-link underline">
            политикой обработки персональных данных
          </NuxtLink>
        </span>
      </label>
      <p v-if="errors.consent" id="field-consent-error" class="text-sm text-danger">
        {{ errors.consent }}
      </p>
    </div>

    <p v-if="serverError" class="rounded-control border border-danger p-3 text-danger" role="alert">
      {{ serverError }}
    </p>

    <AppButton type="submit" :disabled="sending || items.length === 0">
      {{ sending ? 'Отправляем…' : 'Отправить заявку' }}
    </AppButton>
  </form>
</template>
