import {
  CONSENT_STORAGE_KEY,
  type CookieChoice,
  createChoice,
  parseChoice,
  serializeChoice,
} from '~/utils/cookie-consent'

export const COOKIE_BANNER_ID = 'cookie-banner'
export const COOKIE_SETTINGS_ID = 'cookie-settings'

// Выбор посетителя хранится в браузере (localStorage). На сервере и до гидратации выбора «нет»,
// а `ready` показывает, что запись уже прочитана: пока она не прочитана, баннер не показываем.
export function useCookieConsent() {
  const choice = useState<CookieChoice | null>('cookie-choice', () => null)
  const ready = useState('cookie-ready', () => false)
  // Посетитель открыл баннер повторно через «Настройки cookie»
  const reopened = useState('cookie-reopened', () => false)

  const bannerVisible = computed(() => ready.value && (choice.value === null || reopened.value))
  // Единственное место, от которого зависит загрузка счётчиков (Метрика, GA4)
  const analyticsAllowed = computed(() => ready.value && choice.value?.analytics === true)

  function hydrate() {
    try {
      choice.value = parseChoice(localStorage.getItem(CONSENT_STORAGE_KEY))
    } catch {
      // Хранилище недоступно: оставляем выбор, сделанный в этой вкладке, до перезагрузки
    }
    ready.value = true
  }

  function decide(analytics: boolean) {
    const wasReopened = reopened.value
    choice.value = createChoice(analytics)
    reopened.value = false
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, serializeChoice(choice.value))
    } catch {
      // Хранилище недоступно (приватный режим): выбор действует до перезагрузки страницы
    }
    // Кнопки баннера исчезают вместе с ним, поэтому фокус возвращаем туда, откуда баннер открыли
    if (wasReopened) focusAfterRender(COOKIE_SETTINGS_ID)
  }

  function reopen() {
    reopened.value = true
    focusAfterRender(COOKIE_BANNER_ID)
  }

  return { choice, ready, bannerVisible, analyticsAllowed, hydrate, decide, reopen }
}

function focusAfterRender(id: string) {
  nextTick(() => document.getElementById(id)?.focus())
}
