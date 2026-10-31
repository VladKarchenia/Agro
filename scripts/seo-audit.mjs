#!/usr/bin/env node
// Аудит SEO собранного сайта (результат `nuxt generate`). Проверяет итоговый HTML, а не исходники,
// поэтому ловит то, что не видят модульные тесты: дубли, битые ссылки, расхождения sitemap и мета-тегов.
// Запуск: pnpm seo:audit [--dir <путь>] [--mode production|demo] [--site-url <адрес>]
// Код возврата 1, если есть ошибки. Предупреждения (warning) не роняют проверку.
// Правила и их смысл описаны в docs/specs/seo.md.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { parse } from 'node-html-parser'

const args = process.argv.slice(2)
const arg = (name) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args[index + 1] : undefined
}

const DIR = resolve(arg('dir') ?? 'apps/web/.output/public')
const MODE = arg('mode') ?? (process.env.NUXT_PUBLIC_SITE_ENV === 'demo' ? 'demo' : 'production')
const SITE_URL = (
  arg('site-url') ??
  process.env.NUXT_PUBLIC_SITE_URL ??
  'https://agroed.by'
).replace(/\/+$/, '')
const SITE_PATH = new URL(SITE_URL).pathname.replace(/\/+$/, '') // базовый путь, например /Agro
const INDEXABLE_SITE = MODE === 'production'

const TITLE_MAX = 70
const DESCRIPTION_MIN = 50
const DESCRIPTION_MAX = 170
const CORE_PATHS = ['/', '/catalog'] // должны быть в sitemap всегда

const issues = []
const error = (where, message) => issues.push({ level: 'error', where, message })
const warn = (where, message) => issues.push({ level: 'warning', where, message })

if (!existsSync(DIR)) {
  console.error(`Каталог со сборкой не найден: ${DIR}. Сначала выполните pnpm generate.`)
  process.exit(2)
}

// ---------- Сбор страниц ----------
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? (name === '_nuxt' ? [] : walk(full)) : [full]
  })

const files = walk(DIR)
const rel = (file) => relative(DIR, file).split(sep).join('/')

/** index.html → /, catalog/index.html → /catalog, about.html → /about */
function pathOfHtml(file) {
  const name = rel(file).replace(/\.html$/, '')
  if (name === 'index') return '/'
  return `/${name.replace(/\/index$/, '')}`
}

const pages = files
  .filter((file) => file.endsWith('.html') && !['200.html', '404.html'].includes(rel(file)))
  .map((file) => ({ file, path: pathOfHtml(file), doc: parse(readFileSync(file, 'utf8')) }))
const pagePaths = new Set(pages.map((page) => page.path))

const canonicalOf = (path) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`)

/** Адрес из ссылки → путь внутри сайта или null для внешних, mailto, tel и якорей */
function internalPath(href) {
  if (!href || href.startsWith('#') || /^(mailto|tel|sms|javascript):/i.test(href)) return null
  let pathname
  try {
    const url = new URL(href, `${SITE_URL}/`)
    if (/^https?:/.test(href) && url.origin !== new URL(SITE_URL).origin) return null
    pathname = url.pathname
  } catch {
    return null
  }
  if (SITE_PATH && pathname.startsWith(SITE_PATH)) pathname = pathname.slice(SITE_PATH.length)
  return pathname === '' ? '/' : pathname
}

const meta = (doc, attr, name) =>
  doc.querySelectorAll(`meta[${attr}="${name}"]`).map((node) => node.getAttribute('content') ?? '')

// ---------- Проверки страниц ----------
const seen = { titles: new Map(), descriptions: new Map() }
const indexableByPath = new Map()

for (const { path, doc } of pages) {
  const at = path
  const html = doc.querySelector('html')

  if (html?.getAttribute('lang') !== 'ru')
    error(at, `<html lang> должен быть "ru", сейчас "${html?.getAttribute('lang')}"`)

  const titles = doc.querySelectorAll('title')
  const title = titles[0]?.text.trim() ?? ''
  if (titles.length !== 1 || !title)
    error(at, `должен быть ровно один непустой <title> (найдено: ${titles.length})`)
  if (title.length > TITLE_MAX)
    warn(at, `title длиннее ${TITLE_MAX} символов (${title.length}): "${title}"`)

  if (doc.querySelectorAll('meta[name="viewport"]').length !== 1)
    error(at, 'должен быть ровно один meta viewport')

  const robots = meta(doc, 'name', 'robots')
  if (robots.length !== 1) {
    error(at, `должен быть ровно один meta robots (найдено: ${robots.length})`)
  }
  const noindex = /noindex/i.test(robots[0] ?? '')
  indexableByPath.set(at, !noindex)

  const descriptions = meta(doc, 'name', 'description')
  const description = descriptions[0]?.trim() ?? ''
  if (descriptions.length !== 1 || !description)
    error(at, `должно быть ровно одно непустое description (найдено: ${descriptions.length})`)

  const canonicals = doc.querySelectorAll('link[rel="canonical"]')
  if (canonicals.length !== 1) {
    error(at, `должен быть ровно один canonical (найдено: ${canonicals.length})`)
  } else if (canonicals[0].getAttribute('href') !== canonicalOf(at)) {
    error(at, `canonical "${canonicals[0].getAttribute('href')}", ожидался "${canonicalOf(at)}"`)
  }

  for (const [attr, name] of [
    ['property', 'og:title'],
    ['property', 'og:description'],
    ['property', 'og:type'],
    ['property', 'og:site_name'],
    ['property', 'og:locale'],
    ['property', 'og:url'],
    ['property', 'og:image'],
    ['name', 'twitter:card'],
  ]) {
    const values = meta(doc, attr, name)
    if (values.length !== 1 || !values[0])
      error(at, `должен быть ровно один ${name} (найдено: ${values.length})`)
  }
  if (meta(doc, 'property', 'og:url')[0] !== canonicalOf(at))
    error(at, `og:url не совпадает с canonical`)
  if (meta(doc, 'property', 'og:locale')[0] !== 'ru_BY') error(at, `og:locale должен быть ru_BY`)
  const ogImage = meta(doc, 'property', 'og:image')[0] ?? ''
  if (!/^https?:\/\//.test(ogImage))
    error(at, `og:image должен быть абсолютным адресом: "${ogImage}"`)
  else {
    const imagePath = internalPath(ogImage)
    if (imagePath && !existsSync(join(DIR, imagePath)))
      error(at, `og:image не найден в сборке: ${imagePath}`)
  }

  if (INDEXABLE_SITE && !noindex) {
    if (
      description &&
      (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX)
    ) {
      warn(
        at,
        `description ${description.length} символов, рекомендуется ${DESCRIPTION_MIN}–${DESCRIPTION_MAX}`,
      )
    }
    for (const [store, value, label] of [
      [seen.titles, title, 'title'],
      [seen.descriptions, description, 'description'],
    ]) {
      if (!value) continue
      if (store.has(value)) error(at, `${label} дублирует страницу ${store.get(value)}: "${value}"`)
      else store.set(value, at)
    }
  }

  const h1 = doc.querySelectorAll('h1')
  if (h1.length !== 1) error(at, `должен быть ровно один h1 (найдено: ${h1.length})`)

  for (const img of doc.querySelectorAll('img')) {
    if (img.getAttribute('alt') === undefined)
      error(at, `<img> без alt: ${img.getAttribute('src')}`)
  }

  // Структурированные данные
  const ld = []
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(script.rawText)
      ld.push(data)
      if (data['@context'] !== 'https://schema.org')
        error(at, 'JSON-LD без @context https://schema.org')
      if (!data['@type']) error(at, 'JSON-LD без @type')
    } catch (cause) {
      error(at, `JSON-LD не разбирается: ${cause.message}`)
    }
  }
  const ofType = (type) => ld.filter((item) => item['@type'] === type)

  if (at === '/' && INDEXABLE_SITE) {
    if (ofType('Organization').length !== 1)
      error(at, 'на главной должна быть ровно одна разметка Organization')
    if (ofType('WebSite').length !== 1)
      error(at, 'на главной должна быть ровно одна разметка WebSite')
  }
  if (at.startsWith('/catalog/')) {
    const crumbs = ofType('BreadcrumbList')
    if (crumbs.length !== 1)
      error(at, 'страница каталога должна иметь ровно одну разметку BreadcrumbList')
    else {
      const items = crumbs[0].itemListElement ?? []
      if (items.some((item, index) => item.position !== index + 1))
        error(at, 'позиции в BreadcrumbList должны идти подряд с 1')
      if (items.at(-1)?.item !== canonicalOf(at))
        error(at, 'последний пункт BreadcrumbList должен вести на саму страницу')
    }
  }
  if (at.split('/').length === 4 && at.startsWith('/catalog/')) {
    const products = ofType('Product')
    if (products.length !== 1) error(at, 'страница товара должна иметь ровно одну разметку Product')
    for (const product of products) {
      if (product.url !== canonicalOf(at)) error(at, 'Product.url должен совпадать с canonical')
      const offers = [product.offers].flat().filter(Boolean)
      for (const offer of offers) {
        if (offer.price === undefined)
          error(at, 'Product.offers без price: цену не выдумываем, уберите offers')
      }
      if (product.aggregateRating || product.review)
        error(at, 'отзывы и рейтинг допустимы только настоящие, проверьте источник')
    }
  }

  // Ссылки
  for (const anchor of doc.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href')
    const target = internalPath(href)
    if (target === null) continue
    const normalized = target === '/' ? '/' : target.replace(/\/+$/, '')
    if (target !== '/' && target.endsWith('/') && !/\.[a-z0-9]+\/?$/i.test(target)) {
      warn(at, `ссылка со слешем на конце: ${href} (адреса на сайте без завершающего слеша)`)
    }
    const isFile = /\.[a-z0-9]{2,5}$/i.test(normalized)
    const exists = isFile ? existsSync(join(DIR, normalized)) : pagePaths.has(normalized)
    if (!exists) error(at, `битая внутренняя ссылка: ${href}`)
    if (
      anchor.getAttribute('target') === '_blank' &&
      !/noopener/.test(anchor.getAttribute('rel') ?? '')
    ) {
      warn(at, `ссылка с target=_blank без rel=noopener: ${href}`)
    }
  }
}

// ---------- Страница 404 ----------
const notFound = join(DIR, '404.html')
if (!existsSync(notFound)) {
  error('/404.html', 'нет страницы 404')
} else {
  const doc = parse(readFileSync(notFound, 'utf8'))
  if (!/noindex/i.test(meta(doc, 'name', 'robots')[0] ?? ''))
    error('/404.html', 'страница 404 должна быть закрыта от индексации')
  if (doc.querySelectorAll('link[rel="canonical"]').length > 0)
    error('/404.html', 'у страницы 404 не должно быть canonical')
}

// ---------- Файлы сайта ----------
for (const asset of ['favicon.svg', 'logo.svg', 'og-default.png', 'robots.txt']) {
  if (!existsSync(join(DIR, asset))) error(`/${asset}`, 'файл не найден в сборке')
}

const read = (name) => (existsSync(join(DIR, name)) ? readFileSync(join(DIR, name), 'utf8') : null)

const robotsTxt = read('robots.txt')
if (robotsTxt) {
  if (INDEXABLE_SITE) {
    if (!robotsTxt.includes(`Sitemap: ${SITE_URL}/sitemap.xml`))
      error('/robots.txt', 'нет строки Sitemap с правильным адресом')
    if (/^User-agent: \*\s*\n(?:(?!User-agent)[^\n]*\n)*?Disallow: \/\s*$/m.test(robotsTxt))
      error('/robots.txt', 'открытый сайт не должен запрещать всё для User-agent: *')
    if (!robotsTxt.includes('User-agent: OAI-SearchBot'))
      error('/robots.txt', 'поисковые боты ИИ не заданы явно')
    if (!/Clean-param: utm_source/.test(robotsTxt))
      warn('/robots.txt', 'нет Clean-param для Яндекса')
  } else if (!/^Disallow: \/\s*$/m.test(robotsTxt)) {
    error('/robots.txt', 'закрытое окружение должно запрещать всё (Disallow: /)')
  }
}

const sitemap = read('sitemap.xml')
const sitemapPaths = new Set()
if (INDEXABLE_SITE) {
  if (!sitemap) {
    error('/sitemap.xml', 'sitemap.xml не найден')
  } else {
    const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
      match[1].replace(/&amp;/g, '&'),
    )
    if (new Set(locs).size !== locs.length) error('/sitemap.xml', 'в sitemap есть дубли адресов')
    for (const loc of locs) {
      if (!loc.startsWith(`${SITE_URL}/`) && loc !== `${SITE_URL}/`) {
        error('/sitemap.xml', `адрес не с домена сайта: ${loc}`)
        continue
      }
      if (/[?#]/.test(loc)) error('/sitemap.xml', `адрес с параметрами или якорем: ${loc}`)
      const path = internalPath(loc)
      if (path !== '/' && path.endsWith('/'))
        error('/sitemap.xml', `адрес со слешем на конце: ${loc}`)
      sitemapPaths.add(path)
      if (!pagePaths.has(path)) error('/sitemap.xml', `адреса нет в сборке: ${loc}`)
      else if (indexableByPath.get(path) === false)
        error('/sitemap.xml', `закрытая от индексации страница в sitemap: ${loc}`)
    }
    for (const [path, indexable] of indexableByPath) {
      if (indexable && !sitemapPaths.has(path))
        error('/sitemap.xml', `индексируемой страницы нет в sitemap: ${path}`)
    }
    for (const core of CORE_PATHS) {
      if (!sitemapPaths.has(core))
        error('/sitemap.xml', `в sitemap нет обязательной страницы ${core}`)
    }
  }
} else {
  for (const [path, indexable] of indexableByPath) {
    if (indexable) error(path, 'в закрытом окружении (demo) страница не закрыта от индексации')
  }
}

const llms = read('llms.txt')
if (INDEXABLE_SITE) {
  if (!llms) {
    warn('/llms.txt', 'llms.txt не найден')
  } else {
    if (!llms.startsWith('# '))
      error('/llms.txt', 'файл должен начинаться с заголовка "# Название"')
    for (const match of llms.matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
      const path = internalPath(match[1])
      if (path === null || !sitemapPaths.has(path))
        error('/llms.txt', `ссылка на страницу вне sitemap: ${match[1]}`)
    }
  }
}

// ---------- Отчёт ----------
const errors = issues.filter((issue) => issue.level === 'error')
const warnings = issues.filter((issue) => issue.level === 'warning')

console.log(`SEO-аудит: режим ${MODE}, сайт ${SITE_URL}, страниц ${pages.length}`)
for (const issue of issues) {
  console.log(`  ${issue.level === 'error' ? '✗' : '!'} ${issue.where}: ${issue.message}`)
}
console.log(`Ошибок: ${errors.length}, предупреждений: ${warnings.length}`)
process.exit(errors.length > 0 ? 1 : 0)
