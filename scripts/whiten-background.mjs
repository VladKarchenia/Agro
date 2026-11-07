// Замена тёмного (чёрного) фона товарного фото на белый. Используется скриптом photos.mjs.
// Светлые фото эта функция не трогает: возвращает null, если по углам кадра фон не тёмный.
//
// Как работает: пиксель считается фоном, если он тёмный (максимум по каналам ниже порога) и входит в
// область, которая касается края кадра либо достаточно большая (просвет внутри предмета, например
// щель между трубками лампы). Мелкие тёмные пятна внутри предмета (тени, резьба цоколя) остаются.
// Край предмета сжимается на пару пикселей и смягчается, чтобы не оставалось тёмной каймы.
import sharp from 'sharp'

const DARK = 48 // максимум по каналам, ниже которого пиксель считается тёмным
const CORNER = 12 // сторона квадрата в углу кадра, по которому судим о фоне
const HOLE_SHARE = 0.0008 // доля кадра, начиная с которой тёмная область внутри предмета считается фоном
const SHRINK = 2 // на сколько пикселей отодвигаем границу предмета от тёмного фона
const SOFTEN = 1 // сигма смягчения края

/** Угловые пятна кадра тёмные: фон, который стоит заменить */
function hasDarkBackground(data, width, height) {
  const corners = [
    [0, 0],
    [width - CORNER, 0],
    [0, height - CORNER],
    [width - CORNER, height - CORNER],
  ]
  return corners.every(([x0, y0]) => {
    let peak = 0
    for (let y = y0; y < y0 + CORNER; y++) {
      for (let x = x0; x < x0 + CORNER; x++) {
        const i = (y * width + x) * 3
        peak = Math.max(peak, data[i], data[i + 1], data[i + 2])
      }
    }
    return peak < DARK
  })
}

/** Метки связных тёмных областей: возвращает для каждой область, касается ли она края, и её размер */
function darkRegions(dark, width, height) {
  const label = new Int32Array(width * height).fill(-1)
  const regions = []
  const queue = new Int32Array(width * height)
  for (let start = 0; start < dark.length; start++) {
    if (!dark[start] || label[start] !== -1) continue
    const id = regions.length
    let head = 0
    let tail = 0
    queue[tail++] = start
    label[start] = id
    let touchesEdge = false
    while (head < tail) {
      const index = queue[head++]
      const x = index % width
      const y = (index - x) / width
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge = true
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const next = ny * width + nx
        if (dark[next] && label[next] === -1) {
          label[next] = id
          queue[tail++] = next
        }
      }
    }
    regions.push({ touchesEdge, size: tail })
  }
  return { label, regions }
}

/**
 * Возвращает PNG с белым фоном или null, если фон не тёмный.
 * @param {Buffer} source исходный файл
 */
export default async function whitenDarkBackground(source) {
  const { data, info } = await sharp(source)
    .rotate()
    .flatten({ background: '#000000' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height } = info
  if (!hasDarkBackground(data, width, height)) return null

  const dark = new Uint8Array(width * height)
  for (let p = 0; p < dark.length; p++) {
    const i = p * 3
    dark[p] = Math.max(data[i], data[i + 1], data[i + 2]) < DARK ? 1 : 0
  }
  const { label, regions } = darkRegions(dark, width, height)
  const minHole = HOLE_SHARE * width * height

  // Маска предмета: 255 там, где не фон
  const subject = Buffer.alloc(width * height, 255)
  for (let p = 0; p < subject.length; p++) {
    const region = regions[label[p]]
    if (region && (region.touchesEdge || region.size >= minHole)) subject[p] = 0
  }

  // Сжимаем границу (размытие и порог) и смягчаем край
  const raw = { raw: { width, height, channels: 1 } }
  const { data: shrunk, info: maskInfo } = await sharp(subject, raw)
    .blur(SHRINK)
    .threshold(250)
    .blur(SOFTEN)
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true })
  // sharp может вернуть несколько одинаковых каналов: читаем только первый
  const step = maskInfo.channels

  const out = Buffer.alloc(data.length)
  for (let p = 0; p < width * height; p++) {
    const alpha = shrunk[p * step] / 255
    for (let c = 0; c < 3; c++) {
      out[p * 3 + c] = Math.round(data[p * 3 + c] * alpha + 255 * (1 - alpha))
    }
  }
  return sharp(out, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer()
}
