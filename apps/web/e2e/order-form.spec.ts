import { expect, test } from './fixtures'
import {
  cartLink,
  FIRST_PRODUCT,
  fillValidOrder,
  openWithCart,
  readCart,
  SECOND_PRODUCT,
} from './helpers'

const ITEMS = [
  { slug: FIRST_PRODUCT.slug, quantity: 2 },
  { slug: SECOND_PRODUCT.slug, quantity: 1 },
]

test.describe('Форма заявки: проверка полей', () => {
  test.beforeEach(async ({ page }) => {
    await openWithCart(page, ITEMS)
  })

  test('пустая форма: ошибки у обязательных полей, фокус на первом, корзина не тронута', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Отправить заявку' }).click()

    await expect(page.getByText('Укажите имя')).toBeVisible()
    await expect(page.getByText('Укажите телефон')).toBeVisible()
    await expect(page.getByText('Укажите email')).toBeVisible()
    await expect(page.getByText('Нужно согласие на обработку персональных данных')).toBeVisible()
    await expect(page.getByLabel('Имя')).toBeFocused()
    await expect(page.getByLabel('Имя')).toHaveAttribute('aria-invalid', 'true')
    expect(await readCart(page)).toEqual(ITEMS)
    await expect(page.getByRole('heading', { name: 'Заявка принята' })).toHaveCount(0)
  })

  test('ошибка появляется после ухода с поля и исчезает после исправления', async ({ page }) => {
    const email = page.getByLabel('Email')
    await expect(page.getByText('Проверьте адрес электронной почты')).toHaveCount(0)

    await email.fill('без-собаки')
    await email.blur()
    await expect(page.getByText('Проверьте адрес электронной почты')).toBeVisible()

    await email.fill('ivan@example.by')
    await expect(page.getByText('Проверьте адрес электронной почты')).toHaveCount(0)
    await expect(email).not.toHaveAttribute('aria-invalid', 'true')
  })

  test('для физлица нет полей организации, для организации они обязательны и УНП проверяется', async ({
    page,
  }) => {
    await expect(page.getByLabel(/Название организации/)).toHaveCount(0)

    await page.getByText('Организация или ИП').click()
    const organization = page.getByLabel(/Название организации/)
    const unp = page.getByLabel(/^УНП/)
    await expect(organization).toBeVisible()

    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText('Укажите название организации')).toBeVisible()
    await expect(page.getByText('Укажите УНП')).toBeVisible()

    await unp.fill('12345')
    await unp.blur()
    await expect(page.getByText('УНП состоит из 9 цифр')).toBeVisible()

    await unp.fill('123456789')
    await expect(page.getByText('УНП состоит из 9 цифр')).toHaveCount(0)
  })

  test('без согласия заявка не отправляется', async ({ page }) => {
    await fillValidOrder(page, { consent: false })
    await page.getByRole('button', { name: 'Отправить заявку' }).click()

    await expect(page.getByText('Нужно согласие на обработку персональных данных')).toBeVisible()
    await expect(page.getByRole('checkbox')).toBeFocused()
    await expect(page.getByRole('heading', { name: 'Заявка принята' })).toHaveCount(0)
  })
})

test.describe('Форма заявки: телефон', () => {
  test.beforeEach(async ({ page }) => {
    await openWithCart(page, ITEMS)
  })

  test('код страны +375 показан всегда и не входит в редактируемое значение', async ({ page }) => {
    const phone = page.getByLabel(/^Телефон/)
    await expect(page.getByText('+375', { exact: true })).toBeVisible()
    await expect(phone).toHaveValue('')
    await expect(phone).toHaveAttribute('placeholder', '(29) 123-45-67')

    await phone.focus()
    for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace')
    await expect(page.getByText('+375', { exact: true })).toBeVisible()
    await expect(phone).toHaveValue('')
  })

  test('скобки и дефисы расставляются по мере ввода, лишние цифры игнорируются', async ({
    page,
  }) => {
    const phone = page.getByLabel(/^Телефон/)
    await phone.focus()

    await page.keyboard.type('2')
    await expect(phone).toHaveValue('(2')
    await page.keyboard.type('9')
    await expect(phone).toHaveValue('(29)')
    await page.keyboard.type('1234567')
    await expect(phone).toHaveValue('(29) 123-45-67')
    await page.keyboard.type('999')
    await expect(phone).toHaveValue('(29) 123-45-67')
  })

  test('Backspace проходит через разделители и стирает номер целиком', async ({ page }) => {
    const phone = page.getByLabel(/^Телефон/)
    await phone.fill('291234567')
    await expect(phone).toHaveValue('(29) 123-45-67')

    for (let i = 0; i < 9; i++) await page.keyboard.press('Backspace')
    await expect(phone).toHaveValue('')
  })

  test('вставка номера в любом виде не дублирует код страны', async ({ page }) => {
    const phone = page.getByLabel(/^Телефон/)
    for (const pasted of ['+375 44 555-66-77', '375445556677', '8 044 555-66-77', '044 5556677']) {
      await phone.fill(pasted)
      await expect(phone, pasted).toHaveValue('(44) 555-66-77')
    }
  })

  test('цифра, вставленная в середину, пересчитывает маску и не превышает девять цифр', async ({
    page,
  }) => {
    const phone = page.getByLabel(/^Телефон/)
    await phone.fill('291234567')
    await phone.press('Home')
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight')
    await page.keyboard.type('0')

    const value = await phone.inputValue()
    expect(value.replace(/\D/g, '')).toHaveLength(9)
    expect(value).toMatch(/^\(\d\d\) \d{3}-\d\d-\d\d$/)
  })

  test('неполный номер даёт ошибку формата, пустой даёт «Укажите телефон»', async ({ page }) => {
    const phone = page.getByLabel(/^Телефон/)
    await phone.focus()
    await phone.blur()
    await expect(page.getByText('Укажите телефон')).toBeVisible()

    await phone.fill('29 123')
    await phone.blur()
    await expect(page.getByText(/Введите номер полностью/)).toBeVisible()

    await phone.fill('291234567')
    await expect(page.getByText(/Введите номер полностью/)).toHaveCount(0)
  })
})

test.describe('Форма заявки: согласие на обработку данных', () => {
  test.beforeEach(async ({ page }) => {
    await openWithCart(page, ITEMS)
  })

  test('на форме только чекбокс со ссылками, подробных условий нет', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Обработка персональных данных' })).toHaveCount(
      0,
    )
    await expect(page.getByText('Ваши права')).toHaveCount(0)

    const label = page
      .getByRole('main')
      .locator('label')
      .filter({ has: page.getByRole('checkbox') })
    const consent = label.getByRole('link', { name: 'согласие на обработку персональных данных' })
    const privacy = label.getByRole('link', { name: 'политикой обработки персональных данных' })
    await expect(consent).toHaveAttribute('target', '_blank')
    await expect(consent).toHaveAttribute('href', '/consent')
    await expect(privacy).toHaveAttribute('target', '_blank')
    await expect(privacy).toHaveAttribute('href', '/privacy')
  })

  test('ссылка открывает страницу согласия в новой вкладке, введённые данные не теряются', async ({
    context,
    page,
  }) => {
    await page.getByLabel('Имя').fill('Иван')

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page
        .getByRole('main')
        .getByRole('link', { name: 'согласие на обработку персональных данных' })
        .click(),
    ])
    await popup.waitForLoadState()

    await expect(
      popup.getByRole('heading', { name: 'Согласие на обработку персональных данных', level: 1 }),
    ).toBeVisible()
    await expect(popup.getByRole('heading', { name: /Ваши права/ })).toBeVisible()
    await expect(page.getByLabel('Имя')).toHaveValue('Иван')
  })
})

test.describe('Форма заявки: отправка', () => {
  test.beforeEach(async ({ page }) => {
    await openWithCart(page, ITEMS)
  })

  test('успешная заявка: подтверждение с пометкой о демо, корзина очищена, счётчик исчез', async ({
    page,
  }) => {
    await fillValidOrder(page)
    await page.getByRole('button', { name: 'Отправить заявку' }).click()

    await expect(page.getByRole('heading', { name: 'Заявка принята' })).toBeVisible()
    await expect(page.getByText('заявка никуда не отправлена')).toBeVisible()
    expect(await readCart(page)).toEqual([])
    await expect(cartLink(page)).toHaveAccessibleName('Корзина, пока пусто')
    await expect(page.getByRole('link', { name: 'Вернуться в каталог' })).toBeVisible()
  })

  test('заявка организации отправляется с названием и УНП', async ({ page }) => {
    await page.getByText('Организация или ИП').click()
    await fillValidOrder(page)
    await page.getByLabel(/Название организации/).fill('ООО Тест')
    await page.getByLabel(/^УНП/).fill('123456789')
    await page.getByRole('button', { name: 'Отправить заявку' }).click()

    await expect(page.getByRole('heading', { name: 'Заявка принята' })).toBeVisible()
  })

  test('во время отправки кнопка блокируется: двойной клик не создаст вторую заявку', async ({
    page,
  }) => {
    await fillValidOrder(page)
    const submit = page.getByRole('button', { name: 'Отправить заявку' })
    await submit.click()

    const sending = page.getByRole('button', { name: 'Отправляем…' })
    await expect(sending).toBeDisabled()
    await expect(page.getByRole('heading', { name: 'Заявка принята' })).toBeVisible()
  })

  test('бот, заполнивший скрытую ловушку, получает «успех» без пометки о демо', async ({
    page,
  }) => {
    await fillValidOrder(page)
    // Человек не видит и не может сфокусировать это поле, поэтому заполняем его напрямую
    await page.locator('input[name="website"]').evaluate((input: HTMLInputElement) => {
      input.value = 'http://spam.example'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await page.getByRole('button', { name: 'Отправить заявку' }).click()

    await expect(page.getByRole('heading', { name: 'Заявка принята' })).toBeVisible()
    await expect(page.getByText('заявка никуда не отправлена')).toHaveCount(0)
  })

  test('ловушка для ботов скрыта от людей и скринридеров', async ({ page }) => {
    const trap = page.locator('input[name="website"]')
    await expect(trap).toHaveAttribute('tabindex', '-1')
    await expect(trap.locator('xpath=ancestor::div[@aria-hidden="true"]')).toHaveCount(1)
  })
})
