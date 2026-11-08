#!/usr/bin/env node
// Собирает обложки категорий для карточек каталога и превью ссылок: apps/web/public/images/categories/<slug>.webp.
// Использование: `pnpm covers` (после `pnpm photos`, если меняли фото). Обложка не рисуется, а собирается
// из реальных фото товаров: три плитки 4:3 (фото показываются целиком, без обрезки) и четвёртая с колосом
// из знака бренда. Оформление по брендбуку: радиус, граница `line`, мягкие градиенты из палитры.
// Какие фото брать, задаёт COVERS ниже. Правила: docs/brand/brandbook.md, раздел «Обложки категорий».
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PRODUCTS = join(ROOT, 'apps/web/public/images/products')
const OUTPUT = join(ROOT, 'apps/web/public/images/categories')

// Три фото на категорию: порядок слева направо, сверху вниз. Пути относительно папки products
const COVERS = {
  'kabel-provod': [
    'kabel-vvgng-ls/kabel-vvg-ng-a-ls-5x10.webp',
    'provod-pv-1-puv/provod-puv-1x10-siniy.webp',
    'kabel-avbbshv/kabel-avbbshv-4x16-ok-n.webp',
  ],
  'svetilniki-svetodiodnye': [
    'universalnye-paneli/svetilnik-svetodiodnyj-universalnyj-asl-30-036-36vt-prizma.webp',
    'svetilniki-dlya-led-lamp-t8-g13-ip65/svetilnik-dlya-led-lamp-t8-g13-led-gs-2x1200-ip65.webp',
    'svetilnik-promyshlennyj-svetodiodnyj-ll-spp1/svetilnik-promyshlennyj-svetodiodnyj-ll-spp1-18vt-ip65.webp',
  ],
  'lampy-promyshlennye': [
    'lampy-svetodiodnye-led-power-e27-e40/lampa-svetodiodnaya-led-power-60vt-e27-e40.webp',
    'lampy-svetodiodnye-std-a60-e27/lampa-svetodiodnaya-std-a60-20vt-e27.webp',
    'lampy-svetodiodnye-t8-g13/lampa-svetodiodnaya-t8-18vt-g13-1200mm.webp',
  ],
}

const WIDTH = 1200
const HEIGHT = 900
const GAP = 28
const TILE_WIDTH = 508
const TILE_HEIGHT = 381 // плитка строго 4:3: фото показывается целиком
const RADIUS = 24
const BORDER = 3
const MARGIN_X = (WIDTH - 2 * TILE_WIDTH - GAP) / 2
const MARGIN_Y = (HEIGHT - 2 * TILE_HEIGHT - GAP) / 2
const SLOTS = [
  [MARGIN_X, MARGIN_Y],
  [MARGIN_X + TILE_WIDTH + GAP, MARGIN_Y],
  [MARGIN_X, MARGIN_Y + TILE_HEIGHT + GAP],
  [MARGIN_X + TILE_WIDTH + GAP, MARGIN_Y + TILE_HEIGHT + GAP],
]

// Цвета из брендбука (docs/brand/brandbook.md)
const COLOR = {
  forest50: '#F4F7F4',
  forest100: '#E8EEE9',
  forest200: '#D2DCD4',
  forest300: '#B1C0B5',
  lime50: '#F4FAE0',
  lime100: '#E6F4B8',
  lime200: '#D2EA82',
  lime300: '#BEE04F',
  lime700: '#4E6B10',
}

// Колос из знака бренда (docs/brand/logo-mark.svg) без фона, область 64×64
const EAR = `<g fill="${COLOR.lime700}"><path d="M30.75 12h2.5v43h-2.5z"/><ellipse cx="32" cy="14" rx="3.6" ry="6.4"/><path d="M32 30Q21 30 20 19Q31 19 32 30Z"/><path d="M32 30Q43 30 44 19Q33 19 32 30Z"/><path d="M32 40Q21 40 20 29Q31 29 32 40Z"/><path d="M32 40Q43 40 44 29Q33 29 32 40Z"/><path d="M32 50Q21 50 20 39Q31 39 32 50Z"/><path d="M32 50Q43 50 44 39Q33 39 32 50Z"/></g>`

// Фон: мягкая основа и градиентные формы по углам, частично скрытые за плитками.
// Формы случайные, но зависят от slug категории: у каждой обложки свой рисунок, а повторный запуск
// даёт тот же файл (в git не появляется лишних изменений).
const GRADIENTS = [
  [COLOR.lime200, COLOR.lime50],
  [COLOR.lime300, COLOR.lime100],
  [COLOR.forest300, COLOR.forest100],
  [COLOR.forest200, COLOR.forest100],
]

/** Число из строки: одинаковая строка всегда даёт одно число */
function hash(text) {
  let value = 2166136261
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619)
  return value >>> 0
}

/** Генератор псевдослучайных чисел от 0 до 1 с заданным зерном */
function random(seed) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeBackground(slug) {
  const next = random(hash(slug))
  const between = (min, max) => min + next() * (max - min)
  const pick = (list) => list[Math.floor(next() * list.length)]

  // Углы холста; форма сдвигается от угла внутрь, чтобы выглядывать из-за плиток
  const corners = [
    [0, 0, 1, 1],
    [WIDTH, 0, -1, 1],
    [0, HEIGHT, 1, -1],
    [WIDTH, HEIGHT, -1, -1],
  ]
  // Хотя бы одна лаймовая и одна хвойная форма, хотя бы одно кольцо
  const styles = [
    GRADIENTS[pick([0, 1])],
    GRADIENTS[pick([2, 3])],
    pick(GRADIENTS),
    pick(GRADIENTS),
  ]
  const kinds = ['ring', 'disc', 'disc', next() < 0.5 ? 'ring' : 'disc']
  const order = [0, 1, 2, 3].sort(() => next() - 0.5)

  let defs = ''
  let shapes = ''
  for (const [index, slot] of order.entries()) {
    const [cornerX, cornerY, dirX, dirY] = corners[slot]
    const radius = between(kinds[index] === 'ring' ? 95 : 120, kinds[index] === 'ring' ? 150 : 230)
    const cx = Math.round(cornerX + dirX * between(-10, 80))
    const cy = Math.round(cornerY + dirY * between(-10, 70))
    const [from, to] = styles[index]
    const flip = next() < 0.5
    defs += `<linearGradient id="g${index}" x1="${flip ? 1 : 0}" y1="0" x2="${flip ? 0 : 1}" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`
    const opacity = between(0.88, 1).toFixed(2)
    shapes +=
      kinds[index] === 'ring'
        ? `<circle cx="${cx}" cy="${cy}" r="${Math.round(radius)}" fill="none" stroke="url(#g${index})" stroke-width="${Math.round(between(22, 32))}" opacity="${opacity}"/>`
        : `<circle cx="${cx}" cy="${cy}" r="${Math.round(radius)}" fill="url(#g${index})" opacity="${opacity}"/>`
  }

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COLOR.forest50}"/><stop offset="1" stop-color="${COLOR.forest100}"/></linearGradient>
    ${defs}
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#base)"/>
  ${shapes}
</svg>`)
}

async function photoTile(file) {
  const path = join(PRODUCTS, file)
  if (!existsSync(path)) throw new Error(`Нет фото для обложки: ${file}`)
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_WIDTH}" height="${TILE_HEIGHT}"><rect width="${TILE_WIDTH}" height="${TILE_HEIGHT}" rx="${RADIUS}" fill="#fff"/></svg>`,
  )
  const photo = await sharp(readFileSync(path))
    .flatten({ background: '#ffffff' })
    .resize(TILE_WIDTH, TILE_HEIGHT, { fit: 'fill' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
  const frame = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_WIDTH}" height="${TILE_HEIGHT}"><rect x="${BORDER / 2}" y="${BORDER / 2}" width="${TILE_WIDTH - BORDER}" height="${TILE_HEIGHT - BORDER}" rx="${RADIUS - BORDER / 2}" fill="none" stroke="${COLOR.forest200}" stroke-width="${BORDER}"/></svg>`,
  )
  return sharp(photo)
    .composite([{ input: frame }])
    .png()
    .toBuffer()
}

function brandTile() {
  const scale = 5.2
  const size = 64 * scale
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_WIDTH}" height="${TILE_HEIGHT}"><rect x="${BORDER / 2}" y="${BORDER / 2}" width="${TILE_WIDTH - BORDER}" height="${TILE_HEIGHT - BORDER}" rx="${RADIUS - BORDER / 2}" fill="${COLOR.lime50}" stroke="${COLOR.lime200}" stroke-width="${BORDER}"/><g transform="translate(${(TILE_WIDTH - size) / 2} ${(TILE_HEIGHT - size) / 2}) scale(${scale})">${EAR}</g></svg>`,
  )
}

async function main() {
  mkdirSync(OUTPUT, { recursive: true })
  for (const [slug, files] of Object.entries(COVERS)) {
    const layers = []
    for (const [index, file] of files.entries()) {
      const [left, top] = SLOTS[index]
      layers.push({ input: await photoTile(file), left, top })
    }
    const [left, top] = SLOTS[3]
    layers.push({ input: brandTile(), left, top })
    const output = await sharp(makeBackground(slug))
      .composite(layers)
      .webp({ quality: 86, effort: 5 })
      .toBuffer()
    await sharp(output).toFile(join(OUTPUT, `${slug}.webp`))
    console.log(`  ${slug}.webp: ${WIDTH}×${HEIGHT}, ${Math.round(output.length / 1024)} КБ`)
  }
}

main().catch((cause) => {
  console.error(cause)
  process.exit(1)
})
