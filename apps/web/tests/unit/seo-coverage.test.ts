import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { STATIC_PAGES } from '../../app/seo/entries'

// Защита от SEO-регрессий при развитии проекта: новая страница не может появиться
// без SEO-данных и без записи в реестре страниц.
const appDir = join(__dirname, '..', '..', 'app')
const pagesDir = join(appDir, 'pages')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const pageFiles = walk(pagesDir).filter((file) => file.endsWith('.vue'))

/** pages/about.vue → /about, pages/index.vue → /, pages/catalog/index.vue → /catalog */
function routeOf(file: string): string {
  const parts = relative(pagesDir, file)
    .split(sep)
    .join('/')
    .replace(/\.vue$/, '')
    .split('/')
  if (parts[parts.length - 1] === 'index') parts.pop()
  return `/${parts.join('/')}`
}

const staticFiles = pageFiles.filter((file) => !routeOf(file).includes('['))
const dynamicFiles = pageFiles.filter((file) => routeOf(file).includes('['))

describe('SEO-покрытие страниц', () => {
  it('каждая страница вызывает usePageSeo', () => {
    for (const file of [...pageFiles, join(appDir, 'error.vue')]) {
      expect(readFileSync(file, 'utf8'), relative(appDir, file)).toMatch(/usePageSeo\(/)
    }
  })

  it('никто не обходит usePageSeo прямыми useSeoMeta и useHead с мета-тегами в страницах', () => {
    for (const file of pageFiles) {
      const source = readFileSync(file, 'utf8')
      expect(source, relative(appDir, file)).not.toMatch(/useSeoMeta\(/)
      expect(source, relative(appDir, file)).not.toMatch(/useHead\(/)
    }
  })

  it('каждая статическая страница есть в реестре app/seo/entries.ts и наоборот', () => {
    const fromFiles = staticFiles.map(routeOf).sort()
    const fromRegistry = STATIC_PAGES.map((page) => page.path).sort()
    expect(fromFiles).toEqual(fromRegistry)
  })

  it('динамические страницы известны: только каталог (категории и товары)', () => {
    // Новый динамический раздел нужно добавить в getCatalogPaths/getIndexablePaths
    // (sitemap, llms.txt), после чего обновить этот список.
    expect(dynamicFiles.map(routeOf).sort()).toEqual([
      '/catalog/[category]',
      '/catalog/[category]/[product]',
    ])
  })

  it('на закрытых страницах нет разметки, которую стоило бы индексировать: описание заглушек честное', () => {
    for (const page of STATIC_PAGES.filter((item) => !item.indexable)) {
      expect(page.reason?.length ?? 0, page.path).toBeGreaterThan(5)
    }
  })
})
