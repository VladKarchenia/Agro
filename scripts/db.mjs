#!/usr/bin/env node
// Резервные копии локальной базы: pnpm db:backup и pnpm db:restore <файл>
// Формат pg_dump -Fc (сжатый, восстанавливается pg_restore). Копии лежат в backups/ и не попадают в git.
import { spawn } from 'node:child_process'
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

function readEnv() {
  const path = resolve(root, '.env')
  if (!existsSync(path)) {
    console.error('Нет файла .env. Выполните pnpm env:init')
    process.exit(1)
  }
  const env = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match) env[match[1]] = match[2]
  }
  return env
}

const env = readEnv()
const user = env.DB_USER || 'agroed'
const database = env.DB_NAME || 'agroed'

/** Запускает команду внутри контейнера db, передавая вход и выход потоками (без оболочки и кавычек) */
function inDb(args, { input, output } = {}) {
  return new Promise((done, fail) => {
    const child = spawn('docker', ['compose', 'exec', '-T', 'db', ...args], {
      cwd: root,
      stdio: [input ? 'pipe' : 'ignore', output ? 'pipe' : 'inherit', 'inherit'],
    })
    if (input) createReadStream(input).pipe(child.stdin)
    if (output) child.stdout.pipe(createWriteStream(output))
    child.on('error', fail)
    child.on('close', (code) =>
      code === 0 ? done() : fail(new Error(`команда завершилась с кодом ${code}`)),
    )
  })
}

const [command, file] = process.argv.slice(2)

if (command === 'backup') {
  mkdirSync(resolve(root, 'backups'), { recursive: true })
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
  const target = resolve(root, 'backups', `${database}-${stamp}.dump`)
  await inDb(['pg_dump', '-U', user, '-Fc', database], { output: target })
  console.log(`Копия сохранена: ${target}`)
} else if (command === 'restore' && file) {
  const source = resolve(file)
  if (!existsSync(source)) {
    console.error(`Файл не найден: ${source}`)
    process.exit(1)
  }
  // --clean --if-exists заменяет объекты в базе содержимым копии
  await inDb(['pg_restore', '-U', user, '-d', database, '--clean', '--if-exists', '--no-owner'], {
    input: source,
  })
  console.log(`База восстановлена из ${source}`)
} else {
  console.error('Использование: node scripts/db.mjs backup | restore <файл>')
  process.exit(1)
}
