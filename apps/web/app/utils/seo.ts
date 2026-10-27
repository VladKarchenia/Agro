export const SITE_NAME = 'АгроЭд'

export function buildTitle(title?: string | null): string {
  const clean = title?.trim()
  return clean ? `${clean} | ${SITE_NAME}` : SITE_NAME
}
