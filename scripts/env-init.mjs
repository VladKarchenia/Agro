#!/usr/bin/env node
// Создаёт локальный `.env` из `.env.example` и подставляет случайный пароль базы.
// Существующий `.env` не трогает, чтобы не потерять пароль от уже созданной базы.
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const target = resolve(root, '.env')

if (existsSync(target)) {
  console.log('.env уже существует, ничего не меняю.')
  process.exit(0)
}

const password = randomBytes(18).toString('base64url')
const template = readFileSync(resolve(root, '.env.example'), 'utf8')
writeFileSync(target, template.replace(/^DB_PASSWORD=.*$/m, `DB_PASSWORD=${password}`))
console.log('.env создан, пароль базы сгенерирован. Запустите: pnpm db:up')
