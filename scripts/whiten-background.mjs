// Замена тёмного (чёрного) фона товарного фото на белый. Используется скриптом photos.mjs.
// Светлые фото эта функция не трогает: возвращает null, если по углам кадра фон не тёмный.
//
// Как работает: пиксель считается фоном, если он тёмный (максимум по каналам ниже порога) и входит в
// область, которая касается края кадра либо достаточно большая (просвет внутри предмета, например
// щель между трубками лампы). Мелкие тёмные пятна внутри предмета (тени, резьба цоколя) остаются.
// Край предмета сжимается на пару пикселей и смягчается, чтобы не оставалось тёмной каймы.
import sharp from 'sharp'

const DARK = 48 // фон считаем тёмным, если углы кадра темнее этого значения (максимум по каналам)
const BACKGROUND_MARGIN = 2 // порог фона: на столько выше самого яркого пикселя в углах кадра
const MIN_THRESHOLD = 2 // но не ниже: чёрная оболочка шнура на чёрном фоне имеет значения 2–12, а сам фон 0
const SPECK_SHARE = 0.0004 // пятна предмета меньше этой доли кадра (шум JPEG у края) считаем фоном
const CORNER = 12 // сторона квадрата в углу кадра, по которому судим о фоне
const HOLE_SHARE = 0.0008 // доля кадра, начиная с которой тёмная область внутри предмета считается фоном
const SHRINK = 1 // на сколько пикселей отодвигаем границу предмета от тёмного фона
const SOFTEN = 1.2 // сигма смягчения края
const BRIGHT = 14 // пиксели ярче этого остаются предметом всегда: тонкие светлые детали (кончики жил, винты)
const BODY_SMOOTH = 4 // сигма сглаживания контура корпуса
const NEAR_BODY = 4 // сигма: «рядом с корпусом» (расширение маски корпуса примерно на 7 px)
const SMOOTH = 2.5 // сигма сглаживания границы маски
const CLOSE = 3 // сигма замыкания маски: тёмные детали уже примерно 2×CLOSE px не вырезаются как фон

/**
 * Яркость фона по углам кадра (максимум по каналам) или null, если углы не тёмные.
 * Порог фона берётся от неё, а не фиксированный: у светильников корпус почти чёрный, и по порогу 48
 * его принимали за фон.
 */
function darkBackgroundLevel(data, width, height) {
  const corners = [
    [0, 0],
    [width - CORNER, 0],
    [0, height - CORNER],
    [width - CORNER, height - CORNER],
  ]
  let level = 0
  for (const [x0, y0] of corners) {
    for (let y = y0; y < y0 + CORNER; y++) {
      for (let x = x0; x < x0 + CORNER; x++) {
        const i = (y * width + x) * 3
        level = Math.max(level, data[i], data[i + 1], data[i + 2])
      }
    }
  }
  return level < DARK ? level : null
}

/** Результат sharp как один канал: после порога sharp может вернуть три одинаковых канала */
async function singleChannel(image) {
  const { data, info } = await image
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true })
  if (info.channels === 1) return data
  const out = Buffer.alloc(info.width * info.height)
  for (let p = 0; p < out.length; p++) out[p] = data[p * info.channels]
  return out
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
  const level = darkBackgroundLevel(data, width, height)
  if (level === null) return null
  const threshold = Math.min(DARK, Math.max(MIN_THRESHOLD, level + BACKGROUND_MARGIN))

  const dark = new Uint8Array(width * height)
  for (let p = 0; p < dark.length; p++) {
    const i = p * 3
    dark[p] = Math.max(data[i], data[i + 1], data[i + 2]) < threshold ? 1 : 0
  }
  const { label, regions } = darkRegions(dark, width, height)
  const minHole = HOLE_SHARE * width * height

  // Маска предмета: 255 там, где не фон
  const subject = Buffer.alloc(width * height, 255)
  for (let p = 0; p < subject.length; p++) {
    const region = regions[label[p]]
    if (region && (region.touchesEdge || region.size >= minHole)) subject[p] = 0
  }

  const raw = { raw: { width, height, channels: 1 } }
  // Пятна шума JPEG: мелкие островки «предмета» вдали от самого предмета убираем
  const lit = new Uint8Array(subject.length)
  for (let p = 0; p < lit.length; p++) lit[p] = subject[p] ? 1 : 0
  const specks = darkRegions(lit, width, height)
  const minSpeck = SPECK_SHARE * width * height
  for (let p = 0; p < lit.length; p++) {
    const region = specks.regions[specks.label[p]]
    if (region && region.size < minSpeck) subject[p] = 0
  }

  // Замыкание маски: чёрный шнур или щель на чёрном фоне почти неотличимы от фона, но их края видны.
  // Размытие с низким порогом расширяет предмет, затем размытие с высоким сжимает обратно:
  // узкие тёмные участки внутри и у края предмета остаются предметом, а не вырезаются
  const closed = await singleChannel(
    sharp(subject, raw).blur(CLOSE).threshold(10).blur(CLOSE).threshold(245),
  )

  // Контур корпуса определяется по почти чёрным пикселям с шумом JPEG и без сглаживания выходит
  // зубчатым («погрызенным»): сглаживаем сильно, угловатость краёв корпуса при этом не страдает
  const body = await singleChannel(sharp(closed, raw).blur(BODY_SMOOTH).threshold(128))

  // Тонкие светлые детали (кончики жил, винты на отлёте) сглаживание съело бы: добавляем всё яркое,
  // но только за пределами корпуса, иначе по краю возвращаются зубцы
  const nearBody = await singleChannel(sharp(body, raw).blur(NEAR_BODY).threshold(8))
  const bright = Buffer.alloc(width * height)
  for (let p = 0; p < bright.length; p++) {
    const i = p * 3
    if (Math.max(data[i], data[i + 1], data[i + 2]) >= BRIGHT && !nearBody[p]) bright[p] = 255
  }
  // Шнур: лёгкое сглаживание, чтобы не терять узкую оболочку
  const thin = await singleChannel(sharp(closed, raw).blur(SMOOTH).threshold(128))
  const details = await singleChannel(sharp(bright, raw).blur(1.5).threshold(20))
  for (let p = 0; p < body.length; p++) {
    if (details[p] > body[p]) body[p] = details[p]
    // тонкие тёмные детали вне корпуса (шнур): берём из маски замыкания без сильного сглаживания
    if (thin[p] > body[p] && !nearBody[p]) body[p] = thin[p]
  }

  // Сжимаем границу и смягчаем край
  const shrunk = await singleChannel(sharp(body, raw).blur(SHRINK).threshold(250).blur(SOFTEN))

  const out = Buffer.alloc(data.length)
  for (let p = 0; p < width * height; p++) {
    const alpha = shrunk[p] / 255
    for (let c = 0; c < 3; c++) {
      out[p * 3 + c] = Math.round(data[p * 3 + c] * alpha + 255 * (1 - alpha))
    }
  }
  return sharp(out, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer()
}
