import { getCategories } from '../data/catalog'
import { absoluteUrl, SITE_NAME } from '../utils/seo'
import { STATIC_PAGES } from './entries'

// llms.txt: краткий путеводитель по сайту для ИИ-агентов. Google его не использует, и ни один крупный
// ИИ-поиск публично не подтвердил, что читает файл. Он дешёвый, поэтому ведём его, но на него не рассчитываем.
// Описание строится только из того, что известно по брифу: ничего не выдумываем.
const SUMMARY =
  'Витрина техники, оборудования и запчастей для сельского хозяйства в Республике Беларусь. ' +
  'Цены по запросу: клиент собирает корзину и отправляет заявку, менеджер связывается для подтверждения.'

export function buildLlmsTxt(siteUrl: string): string {
  const link = (title: string, path: string, note?: string) =>
    `- [${title}](${absoluteUrl(siteUrl, path)})${note ? `: ${note}` : ''}`

  const categories = getCategories().map((category) =>
    link(category.title, `/catalog/${category.slug}`, category.description),
  )
  const pages = STATIC_PAGES.filter((page) => page.indexable && page.path !== '/').map((page) =>
    link(page.title, page.path),
  )

  return [
    `# ${SITE_NAME}`,
    '',
    `> ${SUMMARY}`,
    '',
    '## Каталог',
    '',
    ...categories,
    '',
    '## Информация',
    '',
    ...pages,
    '',
  ].join('\n')
}
