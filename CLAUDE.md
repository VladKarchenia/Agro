# АгроЭд: сайт-витрина агротехники

Витрина товаров для сельского хозяйства, РБ, только русский язык, цены «по запросу». Главная цель: SEO в Google, ИИ-поиске и Яндексе.
Полный контекст: [docs/00-brief.md](docs/00-brief.md).

## Стек

Монорепозиторий (pnpm): `apps/web` на Nuxt 4 (SSR) + Tailwind 4, Biome, Vitest, TypeScript strict.
PostgreSQL 17 в Docker (`compose.yaml`), VPS на hoster.by. CMS и админка: выбор не завершён, рекомендация Payload 3, Directus под вопросом из-за новой лицензии (ADR-0002). Часть решений ещё в статусе «Предложено», см. [docs/adr/](docs/adr/README.md).

## Команды (из корня)

- `pnpm dev`: сервер разработки
- `pnpm lint` / `pnpm lint:fix`: Biome
- `pnpm typecheck`: проверка типов
- `pnpm test`: Vitest (модульные тесты)
- `pnpm test:e2e`: сквозные тесты Playwright против собранного сайта (сначала `pnpm generate`; локально с Edge: `E2E_BROWSER_CHANNEL=msedge`)
- `pnpm generate`: статическая сборка (для демо на GitHub Pages и для SEO-аудита)
- `pnpm seo:audit`: SEO-аудит собранного HTML (после `pnpm generate`)

База данных (нужен запущенный Docker Desktop): `pnpm env:init` (один раз, создаёт `.env`), `pnpm db:up`, `pnpm db:down`, `pnpm db:psql`, `pnpm db:backup`, `pnpm db:restore <файл>`. `pnpm db:reset` удаляет все данные базы. Подробности: [docs/specs/infrastructure.md](docs/specs/infrastructure.md). Пароли только в `.env`, в git он не попадает.

Перед коммитом должны проходить `lint`, `typecheck` и `test`, а при изменении страниц, данных каталога или шаблонов ещё `pnpm generate && pnpm seo:audit`. При изменении корзины, формы заявки и интерфейса запускать `pnpm test:e2e`, а новое поведение покрывать тестом в `apps/web/e2e/`.
В Git Bash на Windows переменные с путём, например `NUXT_APP_BASE_URL=/Agro/`, задавать с `MSYS_NO_PATHCONV=1`. Перед повторной локальной сборкой на Windows удалять `apps/web/node_modules/.cache` и `apps/web/.output`.

## Правила

- Документация на русском, код и идентификаторы на английском.
- Решения оформляем в `docs/adr/`, функции описываем в `docs/specs/` до реализации.
- Актуальный статус работ: [docs/01-roadmap.md](docs/01-roadmap.md).
- Дизайн и токены: [docs/brand/brandbook.md](docs/brand/brandbook.md). В компонентах только смысловые токены (`brand`, `ink`, `surface`…), не прямые оттенки палитры.
- Вёрстка mobile-first, проверять на десктопе и на ширине около 390 px.
- Не придумывать данные о компании и товарах. Моковые данные помечать как условные.
- Не коммитить `.env` и секреты.
- Подробнее: [docs/agents/README.md](docs/agents/README.md).

## Доступность (WCAG 2.2 AA, правила обязательны)

- Автоматические проверки axe и клавиатуры идут в `pnpm test:e2e` (`apps/web/e2e/a11y.spec.ts`, `keyboard.spec.ts`) и в CI. Падение теста значит реальную проблему, чиним причину.
- Контраст считаем по реальному фону (страница `forest-50`), а не по белому. Лаймовый цвет как цвет текста только на тёмном фоне, на светлом `text-link`.
- Один `h1`, заголовки без пропуска уровней. Поля с `label`, ошибки связаны через `aria-describedby`, иконки с `aria-hidden`, цели нажатия от 44 px.
- Новое поведение, меняющее фокус или порядок действий, покрываем тестом клавиатуры. Правила и ручные проверки: [docs/specs/accessibility.md](docs/specs/accessibility.md).

## SEO (главная цель проекта, правила обязательны)

- SEO страницы задаётся **только** через `usePageSeo()`. Прямые `useSeoMeta` и `useHead` в страницах запрещены (проверяет тест).
- Каждая новая страница вносится в реестр [apps/web/app/seo/entries.ts](apps/web/app/seo/entries.ts). Индексацию, sitemap и llms.txt определяет он, руками их не правим.
- Страницы-заглушки остаются закрытыми от индексации, пока нет содержимого.
- Адреса без завершающего слеша, один адрес на один контент.
- В разметке schema.org и текстах только реальные данные: без выдуманных цен, отзывов, рейтингов, характеристик.
- Любое изменение страниц или данных каталога проверяется `pnpm generate && pnpm seo:audit`. Если аудит упал, чиним причину.
- Правила и обоснования: [docs/specs/seo.md](docs/specs/seo.md), чек-лист: [docs/agents/seo-checklist.md](docs/agents/seo-checklist.md).
