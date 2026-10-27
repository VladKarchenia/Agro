# АгроЭд: сайт-витрина агротехники

Витрина товаров для сельского хозяйства, РБ, только русский язык, цены «по запросу». Главная цель: SEO в Google, ИИ-поиске и Яндексе.
Полный контекст: [docs/00-brief.md](docs/00-brief.md).

## Стек

Монорепозиторий (pnpm): `apps/web` на Nuxt 4 (SSR) + Tailwind 4, Biome, Vitest, TypeScript strict.
Дальше: PostgreSQL и Directus (админка), VPS на hoster.by. Часть решений ещё в статусе «Предложено», см. [docs/adr/](docs/adr/README.md).

## Команды (из корня)

- `pnpm dev`: сервер разработки
- `pnpm lint` / `pnpm lint:fix`: Biome
- `pnpm typecheck`: проверка типов
- `pnpm test`: Vitest
- `pnpm generate`: статическая сборка (для демо на GitHub Pages)

Перед коммитом должны проходить `lint`, `typecheck` и `test`.
В Git Bash на Windows переменные с путём, например `NUXT_APP_BASE_URL=/Agro/`, задавать с `MSYS_NO_PATHCONV=1`.

## Правила

- Документация на русском, код и идентификаторы на английском.
- Решения оформляем в `docs/adr/`, функции описываем в `docs/specs/` до реализации.
- Актуальный статус работ: [docs/01-roadmap.md](docs/01-roadmap.md).
- Дизайн и токены: [docs/brand/brandbook.md](docs/brand/brandbook.md). В компонентах только смысловые токены (`brand`, `ink`, `surface`…), не прямые оттенки палитры.
- Вёрстка mobile-first, проверять на десктопе и на ширине около 390 px.
- Не придумывать данные о компании и товарах. Моковые данные помечать как условные.
- Не коммитить `.env` и секреты.
- Подробнее: [docs/agents/README.md](docs/agents/README.md).
