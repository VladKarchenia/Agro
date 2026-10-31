import { absoluteUrl } from '../utils/seo'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// lastmod, changefreq и priority не указываем: у нас нет честных дат изменения (они появятся из CMS),
// а Google игнорирует неточные значения. Вернём lastmod, когда будет `updated_at` из базы.
export function buildSitemapXml(siteUrl: string, paths: string[]): string {
  const urls = [...new Set(paths.map((path) => absoluteUrl(siteUrl, path)))]
  const entries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`
}
