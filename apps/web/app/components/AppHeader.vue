<script setup lang="ts">
const links = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/about', label: 'О компании' },
  { to: '/delivery', label: 'Доставка' },
  { to: '/contacts', label: 'Контакты' },
]

const open = ref(false)
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)

const { count, ready } = useCart()
const showCount = computed(() => ready.value && count.value > 0)
const cartLabel = computed(() =>
  showCount.value ? `Заявка, позиций: ${count.value}` : 'Заявка, пока пусто',
)
</script>

<template>
  <header class="sticky top-0 z-30 bg-dark text-on-dark">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:h-[68px]">
      <NuxtLink to="/" aria-label="АгроЭд, на главную">
        <AppLogo tone="light" />
      </NuxtLink>

      <nav class="ml-auto hidden gap-7 text-[15px] md:flex" aria-label="Основное меню">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-on-dark-muted transition-colors hover:text-on-dark"
          active-class="!text-on-dark"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-1">
        <NuxtLink
          to="/cart"
          class="relative grid size-11 place-items-center rounded-control text-on-dark hover:bg-dark-raised"
          :aria-label="cartLabel"
        >
          <svg
            class="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="4" width="14" height="17" rx="2" />
            <path d="M9 4V3h6v1M9 11h6M9 15h4" />
          </svg>
          <span
            v-if="showCount"
            class="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs font-bold text-on-brand"
            aria-hidden="true"
          >
            {{ count }}
          </span>
        </NuxtLink>

        <button
          type="button"
          class="grid size-11 place-items-center rounded-control text-on-dark hover:bg-dark-raised md:hidden"
          :aria-expanded="open"
          aria-controls="mobile-menu"
          aria-label="Меню"
          @click="open = !open"
        >
          <svg
            class="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path v-if="!open" d="M4 7h16M4 12h16M4 17h16" />
            <path v-else d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>

    <nav
      v-show="open"
      id="mobile-menu"
      class="border-t border-dark-line px-5 pb-4 md:hidden"
      aria-label="Мобильное меню"
    >
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="block border-b border-dark-line py-3.5 text-lg text-on-dark-muted last:border-0"
        active-class="!text-on-dark"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>
  </header>
</template>
