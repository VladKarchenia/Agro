// Читаем корзину из localStorage только после завершения гидратации, иначе HTML с сервера
// (пустая корзина) не совпадёт с первым клиентским рендером. Хук `app:mounted` для этого
// слишком ранний: страница гидрируется позже, после разрешения Suspense.
export default defineNuxtPlugin((nuxtApp) => {
  const { hydrate } = useCart()

  if (nuxtApp.isHydrating) nuxtApp.hooks.hookOnce('app:suspense:resolve', hydrate)
  else hydrate()

  // Корзина синхронизируется между вкладками
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key.startsWith('agroed:cart:')) hydrate()
  })
})
