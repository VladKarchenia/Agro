#!/usr/bin/env node
// Приводит фото товаров к единому виду и обновляет список файлов для сайта.
// Использование: положите исходники в apps/web/public/images/products/<подкатегория>/<slug-товара>.<ext>
// и запустите `pnpm photos`. Скрипт:
//   1. переводит каждое новое фото в WebP 4:3 на белом фоне, не больше 1200×900 и без растяжения мелких;
//   2. исходник переносит в photos-originals/ (в git не попадает, хранится у вас);
//   3. пересобирает apps/web/app/data/photo-files.ts: список фото, которые знает сайт.
// Уже обработанные файлы (ровно 4:3, не шире 1200) пропускаются, поэтому запуск безопасно повторять.
// `pnpm photos --all` заново обрабатывает всё из photos-originals (после правки настроек скрипта).
// Правила и именование: docs/specs/content.md, раздел «Фото».
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PHOTOS = join(ROOT, 'apps/web/public/images/products')
const ORIGINALS = join(ROOT, 'photos-originals')
const MANIFEST = join(ROOT, 'apps/web/app/data/photo-files.ts')

const MAX_WIDTH = 1200
const RATIO = 4 / 3
const READY_TOLERANCE = 0.004
const LOW_RES_WIDTH = 600
const CONTENT_THRESHOLD = 235 // яркость, ниже которой пиксель считаем предметом, а не фоном
// Если для обрезки пришлось бы потерять больше этой доли кадра, лучше добавить белые поля
const MAX_CROP_LOSS = 0.3
// Отступ от свободных краёв (справа и снизу торчат кончики жил), доля от большей стороны кадра
const EDGE_MARGIN = 0.06
// Доля длины края, которую должен занимать предмет, чтобы считать, что кабель уходит за этот край
const BLEED_SHARE = 0.08
const IMAGE_EXT = /\.(webp|jpe?g|png|avif|tiff?)$/i

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )

/** Где на изображении есть предмет: границы и касание краёв кадра */
function analyse(data, width, height) {
  let minX = width
  let maxX = -1
  let minY = height
  let maxY = -1
  const edge = { top: 0, bottom: 0, left: 0, right: 0 }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (brightness >= CONTENT_THRESHOLD) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      if (y <= 1) edge.top++
      if (y >= height - 2) edge.bottom++
      if (x <= 1) edge.left++
      if (x >= width - 2) edge.right++
    }
  }
  const touches = (count) => count > 3
  return {
    empty: maxX < 0,
    box: { minX, maxX, minY, maxY },
    edge,
    top: touches(edge.top),
    bottom: touches(edge.bottom),
    left: touches(edge.left),
    right: touches(edge.right),
  }
}

/**
 * Начало окна обрезки по одной оси. Срезаем ту сторону, где у края кадра больше предмета: там кабель
 * уходит за кадр толстым телом, а кончики жил (у другого края предмета мало) остаются в кадре.
 * Если обе стороны похожи, центрируем окно по предмету.
 */
function cropStart(startEdge, endEdge, boxStart, boxEnd, size, total) {
  if (startEdge > endEdge * 1.5) return total - size
  if (endEdge > startEdge * 1.5) return 0
  const centre = (boxStart + boxEnd) / 2
  return Math.round(Math.min(Math.max(centre - size / 2, 0), total - size))
}

/**
 * Как предмет касается двух противоположных краёв: 'both' (уходит за оба), 'start', 'end' или 'none'.
 * Слабое касание (кончик жилы едва задевает край) против сильного (толстое тело кабеля) не считаем.
 */
function touching(startCount, endCount) {
  const start = startCount > 3
  const end = endCount > 3
  if (start && end) {
    return Math.min(startCount, endCount) > 0.25 * Math.max(startCount, endCount)
      ? 'both'
      : startCount > endCount
        ? 'start'
        : 'end'
  }
  return start ? 'start' : end ? 'end' : 'none'
}

async function convert(source) {
  const meta = await sharp(source).metadata()
  const flat = () => sharp(source).rotate().flatten({ background: '#ffffff' })
  const look = async (image) => {
    const { data, info } = await image.removeAlpha().raw().toBuffer({ resolveWithObject: true })
    return { seen: analyse(data, info.width, info.height), width: info.width, height: info.height }
  }

  // 1. Срез: только когда кабель уходит за край кадра с обеих сторон по короткой оси, иначе поля.
  //    Срезаем сторону, где у края больше предмета (тело кабеля), а кончики жил оставляем.
  const first = await look(flat())
  const ratio = first.width / first.height
  let region = { left: 0, top: 0, width: first.width, height: first.height }
  if (!first.seen.empty && Math.abs(ratio - RATIO) > READY_TOLERANCE) {
    const { seen, width, height } = first
    if (ratio > RATIO) {
      const cropWidth = Math.round(height * RATIO)
      if (
        touching(seen.edge.top, seen.edge.bottom) === 'both' &&
        1 - cropWidth / width <= MAX_CROP_LOSS
      ) {
        const left = cropStart(
          seen.edge.left,
          seen.edge.right,
          seen.box.minX,
          seen.box.maxX,
          cropWidth,
          width,
        )
        region = { left, top: 0, width: cropWidth, height }
      }
    } else {
      const cropHeight = Math.round(width / RATIO)
      if (
        touching(seen.edge.left, seen.edge.right) === 'both' &&
        1 - cropHeight / height <= MAX_CROP_LOSS
      ) {
        const top = cropStart(
          seen.edge.top,
          seen.edge.bottom,
          seen.box.minY,
          seen.box.maxY,
          cropHeight,
          height,
        )
        region = { left: 0, top, width, height: cropHeight }
      }
    }
  }
  const cropped = region.width !== first.width || region.height !== first.height
  const part = () => (cropped ? flat().extract(region) : flat())

  // 2. Холст 4:3. Края, где кабель уходит за кадр, остаются вплотную к краю холста (шва нет),
  //    а со свободных сторон, особенно справа и снизу, где торчат кончики жил, оставляем отступ.
  const placed = await look(part())
  const { width: w, height: h, seen } = placed
  // Край считаем «уходом кабеля за кадр» только если предмет занимает заметную часть этого края
  // (толстое тело кабеля). Тонкие кончики жил, которые лишь задевают край, отступа не отменяют.
  const bleeds = (startCount, endCount, length) => {
    const start = startCount > BLEED_SHARE * length
    const end = endCount > BLEED_SHARE * length
    return start && end ? 'both' : start ? 'start' : end ? 'end' : 'none'
  }
  const horizontal = seen.empty ? 'none' : bleeds(seen.edge.left, seen.edge.right, h)
  const vertical = seen.empty ? 'none' : bleeds(seen.edge.top, seen.edge.bottom, w)
  const margin = Math.round(EDGE_MARGIN * Math.max(w, h * RATIO))
  // Отступ добавляем со свободных сторон: если кабель уходит за один край, отступ с противоположного
  const extra = (kind) => (kind === 'both' ? 0 : kind === 'none' ? 2 * margin : margin)
  let canvasWidth = w + extra(horizontal)
  let canvasHeight = h + extra(vertical)
  if (canvasWidth / canvasHeight > RATIO) canvasHeight = Math.round(canvasWidth / RATIO)
  else canvasWidth = Math.round(canvasHeight * RATIO)
  const place = (kind, free) =>
    kind === 'start' ? 0 : kind === 'end' ? free : Math.floor(free / 2)
  const left = place(horizontal, canvasWidth - w)
  const top = place(vertical, canvasHeight - h)

  // Размер результата: не больше 1200 и без увеличения мелких фото (ширина кратна 4)
  const outWidth = Math.min(MAX_WIDTH, Math.floor(canvasWidth / 4) * 4)
  const outHeight = (outWidth / 4) * 3

  const photo = await part().png().toBuffer()
  const canvas = await sharp({
    create: { width: canvasWidth, height: canvasHeight, channels: 3, background: '#ffffff' },
  })
    .composite([{ input: photo, left, top }])
    .png()
    .toBuffer()

  const output = await sharp(canvas)
    .resize(outWidth, outHeight, { fit: 'fill' })
    // Почти белый фон делаем чисто белым, чтобы не было шва у белых полей
    .linear(255 / 247, 0)
    .webp({ quality: 86, effort: 5 })
    .toBuffer()
  const plan = cropped ? 'crop' : 'pad'
  return { output, plan, outWidth, outHeight, sourceWidth: meta.width, sourceHeight: meta.height }
}

/** Путь для сохранения исходника: уже лежащий там файл никогда не затирается */
function freeBackupPath(path) {
  if (!existsSync(path)) return path
  const dot = path.lastIndexOf('.')
  return `${path.slice(0, dot)}-${Date.now()}${path.slice(dot)}`
}

async function main() {
  if (!existsSync(PHOTOS)) {
    console.error(`Нет папки ${PHOTOS}`)
    process.exit(2)
  }

  const redo = process.argv.includes('--all')
  const sourceDir = redo ? ORIGINALS : PHOTOS
  if (!existsSync(sourceDir)) {
    console.error(`Нет папки ${sourceDir}`)
    process.exit(2)
  }

  const files = walk(sourceDir).filter((file) => IMAGE_EXT.test(file))
  let converted = 0
  let skipped = 0
  const lowRes = []
  const results = []

  for (const file of files) {
    const rel = relative(sourceDir, file).split(sep).join('/')
    // Читаем в память: на Windows sharp иначе держит файл открытым, и его нельзя перенести
    const source = readFileSync(file)
    const meta = await sharp(source).metadata()
    const ready =
      !redo &&
      /\.webp$/i.test(file) &&
      Math.abs(meta.width / meta.height - RATIO) <= READY_TOLERANCE &&
      meta.width <= MAX_WIDTH &&
      !meta.hasAlpha
    if (ready) {
      skipped++
      continue
    }

    const { output, plan, outWidth, outHeight, sourceWidth, sourceHeight } = await convert(source)
    const target = join(PHOTOS, rel).replace(IMAGE_EXT, '.webp')
    if (!redo) {
      const backup = freeBackupPath(join(ORIGINALS, rel))
      mkdirSync(dirname(backup), { recursive: true })
      renameSync(file, backup)
    }
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, output)
    converted++
    results.push(`${rel}: ${sourceWidth}×${sourceHeight} → ${outWidth}×${outHeight} (${plan})`)
    if (outWidth < LOW_RES_WIDTH) lowRes.push(`${rel} (${sourceWidth}×${sourceHeight})`)
  }

  const names = walk(PHOTOS)
    .filter((file) => /\.webp$/i.test(file))
    .map((file) => relative(PHOTOS, file).split(sep).join('/'))
    .sort()
  const sizes = {}
  for (const name of names) {
    const size = await sharp(readFileSync(join(PHOTOS, name))).metadata()
    sizes[name] = [size.width, size.height]
  }

  // Пишем сразу в стиле Biome (одинарные кавычки, запятая в конце), чтобы lint не ругался на файл
  const entries = Object.entries(sizes)
    .map(([name, [width, height]]) => `  '${name}': [${width}, ${height}],\n`)
    .join('')
  writeFileSync(
    MANIFEST,
    `// Файл создаёт скрипт \`pnpm photos\`, руками не правим.\n// Фото товаров из apps/web/public/images/products/: путь относительно этой папки и размер [ширина, высота].\nexport const PHOTO_FILES: Record<string, [number, number]> = {\n${entries}}\n`,
  )

  for (const line of results) console.log(`  ${line}`)
  console.log(
    `Обработано: ${converted}, уже готовых: ${skipped}, всего в списке сайта: ${names.length}`,
  )
  if (lowRes.length > 0) {
    console.log(
      `Мелкие фото (меньше ${LOW_RES_WIDTH} px по ширине), на больших экранах будут мягкими:`,
    )
    for (const item of lowRes) console.log(`  ${item}`)
  }
}

main().catch((cause) => {
  console.error(cause)
  process.exit(1)
})
