// Читаем выбор из localStorage только после гидратации, иначе HTML с сервера (баннера нет)
// не совпадёт с первым клиентским рендером. Тот же приём, что и у корзины (plugins/cart.client.ts).
export default defineNuxtPlugin((nuxtApp) => {
  const { hydrate } = useCookieConsent()

  if (nuxtApp.isHydrating) nuxtApp.hooks.hookOnce('app:suspense:resolve', hydrate)
  else hydrate()

  // Выбор, сделанный в другой вкладке, действует сразу и здесь: баннер закрывается
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === CONSENT_STORAGE_KEY) hydrate()
  })
})
