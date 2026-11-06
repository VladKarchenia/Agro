// Данные организации. Единый источник для политики, контактов и подвала.
// null означает «не заполнено»: в тексте остаётся пометка в квадратных скобках,
// страница политики показывает уведомление «черновик». Не придумываем данные: заполняет заказчик.
export interface Company {
  brand: string
  /** Домен сайта, предварительно */
  siteUrl: string
  legalName: string | null
  /** УНП, 9 цифр */
  unp: string | null
  /** Место нахождения оператора */
  address: string | null
  email: string | null
  phone: string | null
  /** Наименование хостинг-провайдера */
  hostingProvider: string | null
  /** Срок хранения данных заявок, например «3 года с даты последнего обращения» */
  retentionPeriod: string | null
  /** Дата вступления политики в силу, формат «ДД.ММ.ГГГГ» */
  policyDate: string | null
}

export const company: Company = {
  brand: 'АгроЭд',
  siteUrl: 'agroed.by',
  // Реквизиты по данным ЕГР (kartoteka.by/unp-591753004), адрес регистрации. Юридическую проверку проходят вместе с политикой
  legalName: 'Общество с ограниченной ответственностью «Агроэд»',
  unp: '591753004',
  address:
    '231800, Гродненская область, Слонимский район, г. Слоним, ул. Минский тракт, 30, пом. 7',
  email: null,
  phone: null,
  hostingProvider: null,
  retentionPeriod: null,
  policyDate: null,
}

export interface Phone {
  /** Как показываем на странице */
  display: string
  /** Для ссылки `tel:`, в международном формате без пробелов */
  tel: string
}

export interface WorkingHours {
  /** Как показываем на странице, например «Пн–Пт» */
  label: string
  /** Дни недели для разметки schema.org */
  days: string[]
  /** null: в эти дни не работаем */
  time: { opens: string; closes: string } | null
}

/**
 * Контакты для посетителей: страница «Контакты» и разметка LocalBusiness.
 * Отдельно от `company`, потому что юридические реквизиты (место нахождения оператора, УНП) для
 * политики вносит заказчик после проверки, а офис для посетителей известен уже сейчас.
 * Источник: карточка организации на Яндекс Картах и данные заказчика.
 */
export interface Contacts {
  address: { street: string; locality: string; region: string; postalCode: string }
  phones: Phone[]
  email: string | null
  /** null: режим работы не известен, строка не показывается */
  hours: WorkingHours[] | null
  /** Мессенджеры и соцсети */
  channels: { name: string; url: string }[]
  map: {
    /** Карточка организации на Яндекс Картах */
    orgUrl: string
    /** Карточка организации на Google Картах, без служебных параметров отслеживания */
    googleUrl: string
    /** Адрес для iframe: карта с меткой и карточкой организации */
    widgetUrl: string
    /** Официальный виджет отзывов Яндекса для iframe */
    reviewsWidgetUrl: string
    /** Отзывы на Яндекс Картах: там же оставляют новые */
    reviewsUrl: string
  }
}

export const contacts: Contacts = {
  address: {
    street: 'Минский тракт, 30, офис 7',
    locality: 'Слоним',
    region: 'Гродненская область',
    postalCode: '231800',
  },
  phones: [
    { display: '+375 44 790-93-10', tel: '+375447909310' },
    { display: '+375 15 626-68-49', tel: '+375156266849' },
  ],
  email: null,
  hours: [
    {
      label: 'Пн–Пт',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      time: { opens: '08:00', closes: '17:00' },
    },
    { label: 'Сб–Вс', days: ['Saturday', 'Sunday'], time: null },
  ],
  channels: [
    { name: 'Telegram', url: 'https://t.me/+375447909310' },
    { name: 'Viber', url: 'https://viber.click/+375447909310' },
    { name: 'Instagram', url: 'https://www.instagram.com/agroed_slonim/' },
  ],
  map: {
    orgUrl: 'https://yandex.by/maps/org/agroed/71398902769/',
    googleUrl:
      'https://www.google.com/maps/place/%D0%9E%D0%9E%D0%9E+%C2%AB%D0%90%D0%B3%D1%80%D0%BE%D0%AD%D0%B4%C2%BB/@53.0929473,25.3594251,18.75z/data=!4m6!3m5!1s0x46df47ad53c1c9a9:0xe5cc68ac7a645144!8m2!3d53.0930702!4d25.359206!16s%2Fg%2F11h8k2d7s7?hl=ru',
    widgetUrl:
      'https://yandex.by/map-widget/v1/org/agroed/71398902769/?ll=25.358989%2C53.093212&z=17',
    reviewsWidgetUrl: 'https://yandex.by/maps-reviews-widget/71398902769?comments',
    reviewsUrl: 'https://yandex.by/maps/org/agroed/71398902769/reviews/',
  },
}

/** «Гродненская область, г. Слоним, Минский тракт, 30, офис 7» */
export function formatAddress(address: Contacts['address']): string {
  return `${address.region}, г. ${address.locality}, ${address.street}`
}

/** «Пн–Пт: 08:00–17:00» или «Сб–Вс: выходной» */
export function formatHours(item: WorkingHours): string {
  return item.time
    ? `${item.label}: ${item.time.opens}–${item.time.closes}`
    : `${item.label}: выходной`
}

export function missingCompanyFields(source: Company): string[] {
  return Object.entries(source)
    .filter(([, value]) => value === null)
    .map(([key]) => key)
}
