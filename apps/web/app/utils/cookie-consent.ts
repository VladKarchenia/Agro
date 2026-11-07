export const CONSENT_STORAGE_KEY = 'agroed:cookie-consent'

// Версия текста и перечня сервисов. При её изменении (добавили сервис, поправили формулировку)
// старые ответы перестают действовать, и баннер показывается снова.
export const CONSENT_VERSION = 1

export interface CookieChoice {
  /** Согласие на аналитические cookie (Яндекс Метрика, Google Analytics). Необходимые включены всегда */
  analytics: boolean
  version: number
  /** Когда посетитель сделал выбор, ISO 8601 */
  date: string
}

export function createChoice(analytics: boolean, now: Date = new Date()): CookieChoice {
  return { analytics, version: CONSENT_VERSION, date: now.toISOString() }
}

export function serializeChoice(choice: CookieChoice): string {
  return JSON.stringify(choice)
}

// Данные из localStorage считаем недоверенными. Испорченная запись или запись старой версии
// означает «выбора нет»: лучше спросить заново, чем считать согласие данным.
export function parseChoice(raw: string | null | undefined): CookieChoice | null {
  if (!raw) return null

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null

  const { analytics, version, date } = data as Record<string, unknown>
  if (typeof analytics !== 'boolean') return null
  if (version !== CONSENT_VERSION) return null
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date))) return null

  return { analytics, version, date }
}
