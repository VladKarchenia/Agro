export const SITE_NAME = 'АгроЭд'
export const SITE_LOCALE = 'ru_BY'
export const DESCRIPTION_MAX = 160

export function buildTitle(title?: string | null): string {
  const clean = title?.trim()
  return clean ? `${clean} | ${SITE_NAME}` : SITE_NAME
}

/**
 * Приводит путь к единому виду: без параметров и якоря, без повторных и завершающих слешей.
 * Адреса на сайте всегда без завершающего слеша (кроме главной), это единое правило для canonical,
 * sitemap и редиректов.
 */
export function normalizePath(input: string): string {
  const withoutQuery = input.split(/[?#]/)[0] ?? ''
  const collapsed = `/${withoutQuery}`.replace(/\/{2,}/g, '/')
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : '/'
}

/** Абсолютный адрес страницы. `siteUrl` включает базовый путь, если он есть (демо на GitHub Pages) */
export function absoluteUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/+$/, '')
  const normalized = normalizePath(path)
  return normalized === '/' ? `${base}/` : `${base}${normalized}`
}

/** Сжимает пробелы и обрезает описание по границе слова, чтобы оно целиком помещалось в сниппет */
export function clampDescription(text: string, max = DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean

  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  const trimmed = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${trimmed.replace(/[\s,.;:—-]+$/, '')}…`
}

export function robotsDirective(indexable: boolean): string {
  return indexable ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, nofollow'
}

/** JSON-LD внутри <script>: экранируем «<», чтобы данные из CMS не смогли закрыть тег */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
