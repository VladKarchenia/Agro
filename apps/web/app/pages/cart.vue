<script setup lang="ts">
import { getProduct } from '~/data/catalog'

useSeoMeta({ title: 'Корзина', robots: 'noindex, nofollow' })

const { items, ready, update, remove, clear } = useCart()

const rows = computed(() => items.value.map((item) => ({ item, product: getProduct(item.slug) })))
// В заявку попадают только товары, которые ещё есть в каталоге
const availableItems = computed(() =>
  rows.value.filter((row) => row.product).map((row) => row.item),
)

const done = ref<{ demo: boolean } | null>(null)

function onDone(demo: boolean) {
  done.value = { demo }
  clear()
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
    <h1 class="text-3xl font-extrabold md:text-5xl">Корзина</h1>

    <p v-if="!ready" class="mt-8 text-ink-muted" aria-busy="true">Загружаем корзину…</p>

    <section v-else-if="done" class="mt-8 max-w-xl" aria-live="polite">
      <h2 class="text-2xl font-bold">Заявка принята</h2>
      <p class="mt-3 text-ink-muted">
        Менеджер свяжется с вами, чтобы подтвердить заявку и обсудить условия.
      </p>
      <p
        v-if="done.demo"
        class="mt-4 rounded-card border border-line bg-brand-soft p-4 text-sm"
        role="note"
      >
        Это демо-версия сайта: заявка никуда не отправлена.
      </p>
      <div class="mt-8">
        <AppButton to="/catalog">Вернуться в каталог</AppButton>
      </div>
    </section>

    <section v-else-if="items.length === 0" class="mt-8 max-w-xl">
      <p class="text-ink-muted">В корзине пока нет товаров. Добавьте их из каталога.</p>
      <div class="mt-6">
        <AppButton to="/catalog">Открыть каталог</AppButton>
      </div>
    </section>

    <div v-else class="mt-8 grid gap-10 lg:grid-cols-[1fr_26rem] lg:items-start lg:gap-14">
      <section aria-labelledby="items-title">
        <h2 id="items-title" class="text-xl font-bold">Товары</h2>
        <ul class="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
          <li v-for="row in rows" :key="row.item.slug" class="flex flex-wrap items-center gap-4 p-4">
            <div class="w-20 shrink-0 overflow-hidden rounded-control">
              <ProductPhoto compact />
            </div>
            <div class="min-w-0 flex-1 basis-40">
              <NuxtLink
                v-if="row.product"
                :to="`/catalog/${row.product.categorySlug}/${row.product.slug}`"
                class="font-bold hover:underline"
              >
                {{ row.product.name }}
              </NuxtLink>
              <p v-else class="font-bold text-ink-muted">Товар больше недоступен</p>
              <p v-if="row.product" class="text-sm text-ink-muted">Цена по запросу</p>
              <p v-else class="text-sm text-danger">Он не попадёт в заявку. Удалите его из корзины.</p>
            </div>
            <QuantityInput
              v-if="row.product"
              :model-value="row.item.quantity"
              :label="row.product.name"
              @update:model-value="update(row.item.slug, $event)"
            />
            <button
              type="button"
              class="min-h-11 px-2 text-sm text-link underline"
              :aria-label="`Удалить из корзины:${row.product?.name ?? row.item.slug}`"
              @click="remove(row.item.slug)"
            >
              Удалить
            </button>
          </li>
        </ul>
      </section>

      <section aria-labelledby="form-title">
        <h2 id="form-title" class="text-xl font-bold">Оформление заявки</h2>
        <div class="mt-4">
          <OrderForm :items="availableItems" @done="onDone" />
        </div>
      </section>
    </div>
  </div>
</template>
