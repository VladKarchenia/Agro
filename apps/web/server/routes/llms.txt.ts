import { buildLlmsTxt } from '../../app/seo/llms'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return buildLlmsTxt(config.public.siteUrl)
})
