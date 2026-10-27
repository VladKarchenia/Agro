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
  legalName: null,
  unp: null,
  address: null,
  email: null,
  phone: null,
  hostingProvider: null,
  retentionPeriod: null,
  policyDate: null,
}

export function missingCompanyFields(source: Company): string[] {
  return Object.entries(source)
    .filter(([, value]) => value === null)
    .map(([key]) => key)
}
