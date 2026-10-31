import { absoluteUrl } from '../utils/seo'

export type AiTrainingPolicy = 'allow' | 'disallow'

// Боты, которые ищут и отвечают пользователям: от них зависит упоминание сайта в ответах ИИ.
// Названия взяты из публичных справочников, перед запуском сверить с документацией вендоров.
export const AI_SEARCH_BOTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
]

// Боты, которые собирают данные для обучения моделей. Их запрет не влияет на поисковую выдачу.
export const AI_TRAINING_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'CCBot',
  'Applebot-Extended',
  'Meta-ExternalAgent',
]

// Служебные страницы без ценности для поиска
export const DISALLOWED_PATHS = ['/cart', '/api/']

// Параметры, которые не меняют содержимое страницы. Директива Clean-param понятна только Яндексу.
export const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'yclid',
  'gclid',
  'fbclid',
  '_openstat',
]

export interface RobotsOptions {
  siteUrl: string
  /** false: демо и закрытые окружения, всё запрещено */
  indexable: boolean
  aiTraining: AiTrainingPolicy
}

const group = (agents: string[], rules: string[]) =>
  [...agents.map((agent) => `User-agent: ${agent}`), ...rules].join('\n')

export function buildRobotsTxt({ siteUrl, indexable, aiTraining }: RobotsOptions): string {
  if (!indexable) return 'User-agent: *\nDisallow: /\n'

  const disallow = DISALLOWED_PATHS.map((path) => `Disallow: ${path}`)
  const sections = [
    group(['*'], ['Allow: /', ...disallow]),
    // У бота с отдельной группой нет наследования от «*», поэтому запреты повторяем
    group(AI_SEARCH_BOTS, ['Allow: /', ...disallow]),
    group(['Yandex'], [...disallow, `Clean-param: ${TRACKING_PARAMS.join('&')}`]),
  ]

  if (aiTraining === 'disallow') sections.push(group(AI_TRAINING_BOTS, ['Disallow: /']))

  sections.push(`Sitemap: ${absoluteUrl(siteUrl, '/sitemap.xml')}`)
  return `${sections.join('\n\n')}\n`
}
