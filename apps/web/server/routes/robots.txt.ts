import { buildRobotsTxt } from '../../app/seo/robots'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return buildRobotsTxt({
    siteUrl: config.public.siteUrl,
    indexable: config.public.siteEnv === 'production',
    aiTraining: config.aiTrainingCrawlers === 'disallow' ? 'disallow' : 'allow',
  })
})
