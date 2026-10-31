import { describe, expect, it } from 'vitest'
import { getIndexablePaths, STATIC_PAGES } from '../../app/seo/entries'
import { buildLlmsTxt } from '../../app/seo/llms'
import { AI_SEARCH_BOTS, AI_TRAINING_BOTS, buildRobotsTxt } from '../../app/seo/robots'
import { buildSitemapXml } from '../../app/seo/sitemap'

const SITE = 'https://agroed.by'

describe('buildRobotsTxt', () => {
  const open = buildRobotsTxt({ siteUrl: SITE, indexable: true, aiTraining: 'allow' })

  it('для закрытого окружения запрещает всё', () => {
    expect(buildRobotsTxt({ siteUrl: SITE, indexable: false, aiTraining: 'allow' })).toBe(
      'User-agent: *\nDisallow: /\n',
    )
  })

  it('для открытого сайта разрешает обход, закрывает служебные страницы и указывает sitemap', () => {
    expect(open).toContain('User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /api/')
    expect(open).toContain(`Sitemap: ${SITE}/sitemap.xml`)
    expect(open).not.toMatch(/^Disallow: \/$/m)
  })

  it('явно разрешает поисковых ботов ИИ и повторяет для них запреты служебных страниц', () => {
    const block = open.split('\n\n').find((section) => section.includes('OAI-SearchBot')) ?? ''
    for (const bot of AI_SEARCH_BOTS) expect(block).toContain(`User-agent: ${bot}`)
    expect(block).toContain('Allow: /')
    expect(block).toContain('Disallow: /cart')
  })

  it('для Яндекса добавляет Clean-param с метками, а запреты дублирует', () => {
    const block = open.split('\n\n').find((section) => section.includes('User-agent: Yandex')) ?? ''
    expect(block).toContain('Clean-param: utm_source&utm_medium')
    expect(block).toContain('Disallow: /cart')
  })

  it('при политике allow не упоминает ботов обучения, при disallow запрещает их целиком', () => {
    for (const bot of AI_TRAINING_BOTS) expect(open).not.toContain(bot)

    const closed = buildRobotsTxt({ siteUrl: SITE, indexable: true, aiTraining: 'disallow' })
    const block = closed.split('\n\n').find((section) => section.includes('GPTBot')) ?? ''
    for (const bot of AI_TRAINING_BOTS) expect(block).toContain(`User-agent: ${bot}`)
    expect(block).toContain('Disallow: /')
    // запрет обучения не должен задевать поисковых ботов
    for (const bot of AI_SEARCH_BOTS) expect(block).not.toContain(bot)
  })
})

describe('buildSitemapXml', () => {
  it('содержит абсолютные адреса без дублей и без служебных полей', () => {
    const xml = buildSitemapXml(SITE, ['/', '/catalog', '/catalog/', '/catalog/a'])
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
    expect(locs).toEqual([`${SITE}/`, `${SITE}/catalog`, `${SITE}/catalog/a`])
    expect(xml).not.toMatch(/lastmod|changefreq|priority/)
  })

  it('экранирует спецсимволы в адресах', () => {
    expect(buildSitemapXml(SITE, ['/a&b'])).toContain('<loc>https://agroed.by/a&amp;b</loc>')
  })
})

describe('реестр страниц и sitemap', () => {
  it('в sitemap нет закрытых страниц и нет корзины', () => {
    const paths = getIndexablePaths()
    for (const page of STATIC_PAGES.filter((item) => !item.indexable)) {
      expect(paths).not.toContain(page.path)
    }
    expect(paths).not.toContain('/cart')
  })

  it('все адреса уникальны и нормализованы', () => {
    const paths = getIndexablePaths()
    expect(new Set(paths).size).toBe(paths.length)
    for (const path of paths) {
      expect(path).toBe(path === '/' ? '/' : path.replace(/\/+$/, ''))
      expect(path.startsWith('/')).toBe(true)
    }
  })

  it('закрытые страницы имеют причину, чтобы их не забыли открыть', () => {
    for (const page of STATIC_PAGES.filter((item) => !item.indexable)) {
      expect(page.reason, page.path).toBeTruthy()
    }
  })
})

describe('buildLlmsTxt', () => {
  const text = buildLlmsTxt(SITE)

  it('соблюдает структуру: заголовок, краткое описание, разделы со ссылками', () => {
    expect(text.startsWith('# АгроЭд\n\n> ')).toBe(true)
    expect(text).toContain('## Каталог')
    expect(text).toContain('## Информация')
  })

  it('ссылается только на индексируемые страницы', () => {
    const indexable = new Set(
      getIndexablePaths().map((path) => `${SITE}${path === '/' ? '/' : path}`),
    )
    const urls = [...text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1] ?? '')
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) expect(indexable.has(url), url).toBe(true)
  })

  it('не содержит выдуманных сведений о компании', () => {
    expect(text).not.toMatch(/\d{4,}/)
    // квадратные скобки допустимы только в ссылках [текст](адрес), но не как пометки-заглушки
    expect(text).not.toMatch(/\[[^\]]*\](?!\()/)
  })
})
