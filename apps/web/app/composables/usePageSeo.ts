import { findStaticPage } from '~/seo/entries'
import {
  absoluteUrl,
  buildTitle,
  clampDescription,
  normalizePath,
  robotsDirective,
  SITE_LOCALE,
  SITE_NAME,
  serializeJsonLd,
} from '~/utils/seo'
import { breadcrumbLd, type Crumb, type JsonLd } from '~/utils/structured-data'

export interface PageSeoInput {
  title: string
  description: string
  /** Адрес страницы, по умолчанию текущий */
  path?: string
  /** Хлебные крошки без главной страницы: превращаются в разметку BreadcrumbList */
  breadcrumbs?: Crumb[]
  /** Дополнительная разметка schema.org */
  jsonLd?: JsonLd[]
  type?: 'website' | 'article'
  /** Закрыть страницу от индексации сверх реестра (например, страница ошибки) */
  noindex?: boolean
  /** false: не выводить canonical (страницы ошибок) */
  canonical?: boolean
  /** Картинка для превью ссылок, по умолчанию общая */
  image?: string
}

/**
 * Единственный способ задать SEO страницы. Каждая страница в `app/pages` обязана вызывать его
 * (проверяет tests/unit/seo-coverage.test.ts). Индексируемость определяет реестр `app/seo/entries.ts`
 * и окружение: демо всегда закрыто от индексации.
 */
export function usePageSeo(input: PageSeoInput) {
  const config = useRuntimeConfig()
  const route = useRoute()
  const siteUrl = config.public.siteUrl

  const path = normalizePath(input.path ?? route.path)
  const registered = findStaticPage(path)
  const indexable =
    config.public.siteEnv === 'production' && !input.noindex && (registered?.indexable ?? true)

  const description = clampDescription(input.description)
  const canonical = absoluteUrl(siteUrl, path)
  const image = absoluteUrl(siteUrl, input.image ?? '/og-default.png')
  const fullTitle = buildTitle(input.title)

  useSeoMeta({
    title: input.title,
    description,
    robots: robotsDirective(indexable),
    ogTitle: fullTitle,
    ogDescription: description,
    ogType: input.type ?? 'website',
    ogUrl: canonical,
    ogSiteName: SITE_NAME,
    ogLocale: SITE_LOCALE,
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: `${SITE_NAME}: техника и оборудование для сельского хозяйства`,
    twitterCard: 'summary_large_image',
    twitterTitle: fullTitle,
    twitterDescription: description,
    twitterImage: image,
  })

  const structured: JsonLd[] = [
    ...(input.breadcrumbs
      ? [breadcrumbLd(siteUrl, [{ name: 'Главная', path: '/' }, ...input.breadcrumbs])]
      : []),
    ...(input.jsonLd ?? []),
  ]

  useHead({
    link: input.canonical === false ? [] : [{ rel: 'canonical', href: canonical }],
    script: structured.map((item) => ({
      type: 'application/ld+json',
      innerHTML: serializeJsonLd(item),
    })),
  })
}
