// Метка «страница готова к взаимодействию». Нужна сквозным тестам: пока Vue не подключил обработчики,
// клик по серверному HTML ничего не делает, и тест становится нестабильным.
export default defineNuxtPlugin((nuxtApp) => {
  const mark = () => document.documentElement.setAttribute('data-hydrated', 'true')

  if (nuxtApp.isHydrating) nuxtApp.hooks.hookOnce('app:suspense:resolve', mark)
  else mark()
})
