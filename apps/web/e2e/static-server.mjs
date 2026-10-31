// Минимальный статический сервер для сквозных тестов: раздаёт собранный сайт (`nuxt generate`)
// так, как это делает хостинг: /catalog → catalog/index.html, неизвестный адрес → 404.html со статусом 404.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? '.output/public')
const port = Number(process.argv[3] ?? 4173)

if (!existsSync(join(root, 'index.html'))) {
  console.error(`Сборка не найдена в ${root}. Сначала выполните pnpm generate.`)
  process.exit(1)
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

function resolveFile(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '')
  const candidates = [safe, join(safe, 'index.html'), `${safe}.html`]
  for (const candidate of candidates) {
    const full = join(root, candidate)
    if (full.startsWith(root) && existsSync(full) && statSync(full).isFile()) return full
  }
  return null
}

createServer((request, response) => {
  const urlPath = (request.url ?? '/').split('?')[0]
  const file = resolveFile(urlPath)
  const target = file ?? join(root, '404.html')
  response.writeHead(file ? 200 : 404, {
    'content-type': types[extname(target)] ?? 'application/octet-stream',
  })
  response.end(readFileSync(target))
}).listen(port, () => console.log(`Статический сервер: http://localhost:${port} (${root})`))
