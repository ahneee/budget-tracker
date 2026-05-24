/** Brand logo used in header and splash (served from /logo.svg). */
export const LOGO_SRC = '/logo.svg'
export const LOGO_ALT = 'Budget Tracker'

export function renderLogoImg(className: string, size: number): string {
  return `<img src="${LOGO_SRC}" alt="" class="${className}" width="${size}" height="${size}" decoding="async" />`
}
