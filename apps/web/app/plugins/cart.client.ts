// Читаем корзину из localStorage только после завершения гидратации, иначе HTML с сервера
// (пустая корзина) не совпадёт с первым клиентским рендером. Хук `app:mounted` для этого
// слишком ранний: страница гидрируется позже, после разрешения Suspense.
export default defineNuxtPlugin((nuxtApp) => {
  const { hydrate } = useCart()

  if (nuxtApp.isHydrating) nuxtApp.hooks.hookOnce('app:suspense:resolve', hydrate)
  else hydrate()

  // Корзина синхронизируется между вкладками. Событие storage приходит сразу, но браузеры не всегда
  // доставляют его фоновой вкладке (особенно мобильные), поэтому при возврате на вкладку читаем заново
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key.startsWith('agroed:cart:')) hydrate()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') hydrate()
  })
})
