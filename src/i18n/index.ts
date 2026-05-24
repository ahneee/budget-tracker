import type { Category } from '../types'
import type { Locale, TranslationKey } from './types'
import { LOCALES, LANGUAGE_OPTIONS, DATE_LOCALES } from './locales'

export type { Locale, TranslationKey }
export { LANGUAGE_OPTIONS, DATE_LOCALES }

const SUPPORTED = new Set<string>(LANGUAGE_OPTIONS.map((l) => l.code))

let currentLocale: Locale = 'en'

export function setLocale(locale: string): void {
  currentLocale = SUPPORTED.has(locale) ? (locale as Locale) : 'en'
  document.documentElement.lang = currentLocale
  updateSplashText()
}

export function getLocale(): Locale {
  return currentLocale
}

export function isValidLocale(locale: string): boolean {
  return SUPPORTED.has(locale)
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const map = LOCALES[currentLocale] ?? LOCALES.en
  let text = map[key] ?? LOCALES.en[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }
  return text
}

export function categoryLabel(category: Category): string {
  return t(`cat_${category}`)
}

export function getDateLocale(): string {
  return DATE_LOCALES[currentLocale] ?? 'en-US'
}

export function updateSplashText(): void {
  const title = document.querySelector('.splash__title')
  const tagline = document.querySelector('.splash__tagline')
  if (title) title.textContent = LOCALES[currentLocale].appTitle ?? LOCALES.en.appTitle
  if (tagline) tagline.textContent = t('splashLoading')
}
