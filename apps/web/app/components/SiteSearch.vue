<script setup lang="ts">
import { getProductImages, productPath, subcategoryPath } from '~/data/catalog'
import { getSearchIndex } from '~/data/search-index'
import {
  listSections,
  type ProductHit,
  type SearchResult,
  type SectionHit,
  search,
} from '~/utils/search'

// Поиск по каталогу в шапке. Работает в браузере по данным каталога, правила: docs/specs/search.md.
// На узком экране кнопка-лупа раскрывает строку под шапкой, на широком поле стоит в шапке.
// Паттерн combobox со списком: фокус остаётся в поле, выбранный вариант указывает aria-activedescendant.
const expanded = defineModel<boolean>('expanded', { default: false })

const EXAMPLES = ['АВБбШв 4х16', 'провод синий', 'медный 6', 'лампа E27 20 Вт']
const RECENT_KEY = 'agroed:search:recent:v1'
const RECENT_LIMIT = 5
const RECENT_SHOWN = 3
const PRODUCT_LIMIT = 8
const EMPTY: SearchResult = { tokens: [], sections: [], products: [], totalProducts: 0 }

type SearchOption =
  | { kind: 'product'; id: string; index: number; hit: ProductHit; path: string }
  | { kind: 'section'; id: string; index: number; hit: SectionHit; path: string }
  | { kind: 'query'; id: string; index: number; text: string; recent: boolean }

interface Group {
  key: string
  title: string
  options: SearchOption[]
}

const route = useRoute()
const query = ref('')
const panelOpen = ref(false)
const active = ref(-1)
const recents = ref<string[]>([])
const box = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const toggle = ref<HTMLButtonElement | null>(null)

const trimmed = computed(() => query.value.trim())
// Индекс строится при первом открытии поиска, а не при загрузке страницы
const result = computed(() =>
  panelOpen.value && trimmed.value
    ? search(getSearchIndex(), trimmed.value, { limit: PRODUCT_LIMIT })
    : EMPTY,
)
const nothingFound = computed(
  () => trimmed.value !== '' && result.value.products.length + result.value.sections.length === 0,
)

const groups = computed<Group[]>(() => {
  if (!panelOpen.value) return []
  let counter = 0
  const next = () => counter++
  const make = (key: string, title: string, options: SearchOption[]): Group[] =>
    options.length > 0 ? [{ key, title, options }] : []
  const sectionOption = (hit: SectionHit): SearchOption => {
    const index = next()
    return {
      kind: 'section',
      id: `site-search-option-${index}`,
      index,
      hit,
      path: subcategoryPath(hit.subcategory),
    }
  }
  const queryOption = (text: string, recent: boolean): SearchOption => {
    const index = next()
    return { kind: 'query', id: `site-search-option-${index}`, index, text, recent }
  }

  if (!trimmed.value) {
    return [
      ...make(
        'recent',
        'Недавние запросы',
        recents.value.slice(0, RECENT_SHOWN).map((text) => queryOption(text, true)),
      ),
      ...make(
        'examples',
        'Можно искать так',
        EXAMPLES.map((text) => queryOption(text, false)),
      ),
      ...make('sections', 'Разделы каталога', listSections(getSearchIndex()).map(sectionOption)),
    ]
  }
  if (nothingFound.value) {
    return make('sections', 'Разделы каталога', listSections(getSearchIndex()).map(sectionOption))
  }
  return [
    ...make('sections', 'Разделы', result.value.sections.slice(0, 3).map(sectionOption)),
    ...make(
      'products',
      'Товары',
      result.value.products.map((hit): SearchOption => {
        const index = next()
        return {
          kind: 'product',
          id: `site-search-option-${index}`,
          index,
          hit,
          path: productPath(hit.product),
        }
      }),
    ),
  ]
})
const options = computed(() => groups.value.flatMap((group) => group.options))
const activeId = computed(() => options.value[active.value]?.id)

const announcement = computed(() => {
  if (!panelOpen.value || !trimmed.value) return ''
  if (nothingFound.value) return 'Ничего не найдено'
  const { totalProducts } = result.value
  return `Найдено товаров: ${totalProducts}`
})

// Первый вариант выбран заранее, чтобы Enter открывал самый подходящий товар.
// Если ничего не нашлось, разделы только предлагаются: Enter не должен уводить в случайный из них
function defaultActive(): number {
  return trimmed.value && !nothingFound.value ? 0 : -1
}
watch(trimmed, () => {
  active.value = defaultActive()
})
watch(options, (list) => {
  // Пока список закрыт, выбор не трогаем: он понадобится, когда список откроют снова
  if (panelOpen.value && active.value >= list.length) active.value = list.length - 1
})
watch(panelOpen, (isOpen) => {
  if (isOpen) active.value = defaultActive()
})
watch(active, async (index) => {
  if (index < 0) return
  await nextTick()
  document.getElementById(`site-search-option-${index}`)?.scrollIntoView({ block: 'nearest' })
})

function plural(count: number, forms: [string, string, string]): string {
  const rest = count % 100
  const last = count % 10
  if (rest >= 11 && rest <= 14) return forms[2]
  if (last === 1) return forms[0]
  if (last >= 2 && last <= 4) return forms[1]
  return forms[2]
}

function loadRecents() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    recents.value = Array.isArray(stored)
      ? stored.filter((item): item is string => typeof item === 'string').slice(0, RECENT_LIMIT)
      : []
  } catch {
    recents.value = []
  }
}

function saveRecents() {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents.value))
  } catch {
    // Хранилище недоступно: история живёт до перезагрузки
  }
}

function remember(text: string) {
  const value = text.trim()
  if (value.length < 2) return
  recents.value = [
    value,
    ...recents.value.filter((item) => item.toLowerCase() !== value.toLowerCase()),
  ].slice(0, RECENT_LIMIT)
  saveRecents()
}

function clearRecents() {
  recents.value = []
  saveRecents()
  input.value?.focus()
}

function openSearch() {
  expanded.value = true
  panelOpen.value = true
  nextTick(() => {
    input.value?.focus()
    input.value?.select()
  })
}

function toggleSearch() {
  if (expanded.value) {
    expanded.value = false
    panelOpen.value = false
    return
  }
  openSearch()
}

function closePanel() {
  panelOpen.value = false
}

async function choose(option: SearchOption) {
  if (option.kind === 'query') {
    query.value = option.text
    input.value?.focus()
    return
  }
  remember(query.value)
  panelOpen.value = false
  expanded.value = false
  input.value?.blur()
  query.value = ''
  await navigateTo(option.path)
}

function onKeydown(event: KeyboardEvent) {
  const count = options.value.length
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp': {
      event.preventDefault()
      const down = event.key === 'ArrowDown'
      if (!panelOpen.value) {
        // Список был закрыт: стрелка только открывает его и ставит выбор на край
        panelOpen.value = true
        nextTick(() => {
          active.value = down ? 0 : options.value.length - 1
        })
      } else if (count > 0) {
        active.value = down
          ? (active.value + 1) % count
          : active.value <= 0
            ? count - 1
            : active.value - 1
      }
      break
    }
    case 'Enter': {
      const option = options.value[active.value]
      if (option && panelOpen.value) {
        event.preventDefault()
        choose(option)
      }
      break
    }
    case 'Escape':
      if (panelOpen.value) {
        event.stopPropagation()
        closePanel()
      } else if (query.value) {
        event.stopPropagation()
        query.value = ''
      } else if (expanded.value) {
        event.stopPropagation()
        expanded.value = false
        toggle.value?.focus()
      }
      break
  }
}

function clearQuery() {
  query.value = ''
  panelOpen.value = true
  input.value?.focus()
}

// Табом ушли из поиска: закрываем список. Нажатие мышью вне поиска ловит onPointerDown
function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget
  if (next instanceof Node && !box.value?.contains(next)) closePanel()
}

function onPointerDown(event: PointerEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  if (box.value?.contains(target) || toggle.value?.contains(target)) return
  closePanel()
}

// На телефоне прокрутка списка убирает клавиатуру: иначе она закрывает половину результатов
function onPanelTouchMove() {
  if (document.activeElement === input.value) input.value?.blur()
}

// «/» и Ctrl+K открывают поиск откуда угодно, кроме полей ввода
function onShortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey) return
  const target = event.target
  const typing =
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  const isSlash = event.key === '/' && !event.ctrlKey && !event.metaKey && !typing
  const isCtrlK = event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)
  if (!isSlash && !isCtrlK) return
  event.preventDefault()
  openSearch()
}

onMounted(() => {
  loadRecents()
  window.addEventListener('keydown', onShortcut)
  document.addEventListener('pointerdown', onPointerDown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onShortcut)
  document.removeEventListener('pointerdown', onPointerDown)
})

watch(
  () => route.fullPath,
  () => {
    panelOpen.value = false
    expanded.value = false
  },
)
</script>

<template>
  <div>
    <button
      ref="toggle"
      type="button"
      class="grid size-11 place-items-center rounded-control text-on-dark hover:bg-dark-raised lg:hidden"
      :aria-expanded="expanded"
      aria-controls="site-search"
      aria-label="Поиск по каталогу"
      @click="toggleSearch"
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
        <path v-if="expanded" d="M6 6l12 12M18 6L6 18" />
        <template v-else>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </template>
      </svg>
    </button>

    <div
      id="site-search"
      ref="box"
      role="search"
      aria-label="Поиск по каталогу"
      :class="[
        expanded ? 'block' : 'hidden lg:block',
        'absolute inset-x-0 top-full border-t border-dark-line bg-dark px-5 pb-4 pt-3 shadow-2xl',
        'lg:relative lg:inset-x-auto lg:top-auto lg:w-64 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none xl:w-72',
      ]"
      @focusout="onFocusOut"
    >
      <div class="group relative">
        <svg
          class="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-on-dark-muted group-focus-within:text-ink-subtle"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        <input
          ref="input"
          v-model="query"
          type="text"
          role="combobox"
          aria-label="Поиск по каталогу"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-keyshortcuts="/ Control+K"
          aria-controls="site-search-list"
          :aria-expanded="panelOpen && options.length > 0"
          :aria-activedescendant="panelOpen ? activeId : undefined"
          placeholder="Поиск: кабель, лампа, АВВГ, E27…"
          enterkeyhint="search"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          class="h-11 w-full rounded-control border border-dark-line bg-dark-raised pl-10 pr-11 text-base text-on-dark placeholder:text-on-dark-muted focus:border-brand focus:bg-surface focus:text-ink focus:placeholder:text-ink-subtle"
          @focus="panelOpen = true"
          @click="panelOpen = true"
          @keydown="onKeydown"
        />
        <button
          v-if="query"
          type="button"
          class="absolute right-0 top-0 grid size-11 place-items-center rounded-control text-on-dark-muted group-focus-within:text-ink-subtle"
          aria-label="Очистить поиск"
          @click="clearQuery"
        >
          <svg
            class="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <kbd
          v-else
          class="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-dark-line px-1.5 font-sans text-xs text-on-dark-muted group-focus-within:!hidden lg:block"
          aria-hidden="true"
        >
          /
        </kbd>
      </div>

      <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>

      <Transition
        enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
        leave-to-class="opacity-0"
      >
        <div
          v-if="panelOpen"
          role="group"
          aria-label="Подсказки поиска"
          tabindex="0"
          class="mt-3 max-h-[calc(100dvh-9.5rem)] overflow-y-auto overscroll-contain rounded-card border border-line bg-surface text-ink shadow-2xl lg:absolute lg:right-0 lg:top-full lg:mt-2 lg:max-h-[min(34rem,calc(100dvh-6rem))] lg:w-[34rem]"
          @mousedown.prevent
          @touchmove.passive="onPanelTouchMove"
        >
          <p v-if="result.corrected" class="px-4 pt-3 text-sm text-ink-muted">
            Показаны результаты для «<strong class="font-semibold text-ink">{{ result.corrected.to }}</strong>»
          </p>

          <div v-if="nothingFound" class="flex items-start gap-3 px-4 py-4">
            <svg
              class="mt-0.5 size-6 shrink-0 text-ink-subtle"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5M9 11h4" />
            </svg>
            <div>
              <p class="font-semibold">Ничего не нашлось по «{{ trimmed }}»</p>
              <p class="mt-1 text-sm text-ink-muted">
                Попробуйте марку (АВВГ, ПуВ), типоразмер (4х16), цоколь (E27), мощность (18 Вт) или цвет. Если нужного нет в
                списке, откройте подходящий раздел ниже.
              </p>
            </div>
          </div>

          <div v-if="options.length > 0" id="site-search-list" role="listbox" aria-label="Результаты поиска">
            <div
              v-for="group in groups"
              :key="group.key"
              role="group"
              :aria-labelledby="`site-search-group-${group.key}`"
              class="py-1.5"
            >
              <div
                :id="`site-search-group-${group.key}`"
                class="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle"
              >
                {{ group.title }}
              </div>
              <div
                v-for="option in group.options"
                :id="option.id"
                :key="option.id"
                role="option"
                :aria-selected="option.index === active"
                :class="[
                  'mx-2 flex scroll-my-12 items-center gap-3 rounded-control px-2 py-2',
                  option.index === active ? 'bg-brand-soft ring-1 ring-inset ring-brand' : '',
                ]"
                @click="choose(option)"
                @mousemove="active = option.index"
              >
                <template v-if="option.kind === 'product'">
                  <div
                    class="w-16 shrink-0 overflow-hidden rounded-control border border-line bg-white"
                    aria-hidden="true"
                  >
                    <ProductPhoto :image="getProductImages(option.hit.product)[0]" compact />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold leading-snug">
                      <SearchHighlight :text="option.hit.product.name" :tokens="result.tokens" />
                    </p>
                    <p
                      v-if="option.hit.snippet"
                      class="mt-0.5 text-sm text-ink-muted"
                    >
                      {{ option.hit.snippet.label }}:
                      <SearchHighlight :text="option.hit.snippet.text" :tokens="result.tokens" />
                    </p>
                    <p v-else class="mt-0.5 line-clamp-1 text-sm text-ink-muted">
                      <SearchHighlight :text="option.hit.product.summary" :tokens="result.tokens" />
                    </p>
                  </div>
                </template>

                <template v-else-if="option.kind === 'section'">
                  <span
                    class="grid size-12 shrink-0 place-items-center rounded-control bg-brand-soft text-link"
                    aria-hidden="true"
                  >
                    <svg
                      class="size-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="4" y="4" width="7" height="7" rx="1.5" />
                      <rect x="13" y="4" width="7" height="7" rx="1.5" />
                      <rect x="4" y="13" width="7" height="7" rx="1.5" />
                      <rect x="13" y="13" width="7" height="7" rx="1.5" />
                    </svg>
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold leading-snug">
                      <SearchHighlight :text="option.hit.subcategory.title" :tokens="result.tokens" />
                    </p>
                    <p class="mt-0.5 line-clamp-1 text-sm text-ink-muted">
                      {{ option.hit.productCount }}
                      {{ plural(option.hit.productCount, ['товар', 'товара', 'товаров']) }}
                    </p>
                  </div>
                </template>

                <template v-else>
                  <span
                    class="grid size-9 shrink-0 place-items-center rounded-full bg-surface-sunken text-ink-muted"
                    aria-hidden="true"
                  >
                    <svg
                      class="size-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <template v-if="option.recent">
                        <circle cx="12" cy="12" r="8" />
                        <path d="M12 8v4l3 2" />
                      </template>
                      <template v-else>
                        <circle cx="11" cy="11" r="6" />
                        <path d="M15.5 15.5L19 19" />
                      </template>
                    </svg>
                  </span>
                  <span class="min-w-0 flex-1">{{ option.text }}</span>
                </template>

                <svg
                  v-if="option.index === active"
                  class="hidden size-5 shrink-0 text-ink-muted lg:block"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 5v6a3 3 0 0 1-3 3H5M9 10l-4 4 4 4" />
                </svg>
              </div>
            </div>
          </div>

          <p
            v-if="result.totalProducts > result.products.length"
            class="border-t border-line px-4 py-3 text-sm text-ink-muted"
          >
            Показаны первые {{ result.products.length }} из {{ result.totalProducts }}. Добавьте
            марку, сечение, цоколь, мощность или цвет, чтобы сузить выдачу.
          </p>

          <div
            :class="[
              !trimmed && recents.length > 0 ? 'flex' : 'hidden lg:flex',
              'sticky bottom-0 items-center justify-between gap-3 border-t border-line bg-surface-alt px-4 py-2 text-xs text-ink-muted',
            ]"
          >
            <p class="hidden gap-3 lg:flex" aria-hidden="true">
              <span><kbd class="font-sans font-semibold">↑↓</kbd> выбор</span>
              <span><kbd class="font-sans font-semibold">Enter</kbd> открыть</span>
              <span><kbd class="font-sans font-semibold">Esc</kbd> закрыть</span>
            </p>
            <button
              v-if="!trimmed && recents.length > 0"
              type="button"
              class="min-h-11 rounded-control px-2 text-link underline lg:min-h-0"
              @click="clearRecents"
            >
              Очистить историю
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
