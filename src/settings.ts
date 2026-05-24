import { CURRENCY_OPTIONS, DEFAULT_SETTINGS } from './constants'
import { isValidLocale, setLocale } from './i18n'
import type { Theme, UserSettings } from './types'

let activeSettings: UserSettings = { ...DEFAULT_SETTINGS }

export function getSettings(): UserSettings {
  return activeSettings
}

export function syncSettings(settings: UserSettings): void {
  activeSettings = {
    theme: settings.theme === 'light' ? 'light' : 'dark',
    currency: CURRENCY_OPTIONS.some((c) => c.code === settings.currency)
      ? settings.currency
      : DEFAULT_SETTINGS.currency,
    displayName: settings.displayName?.trim() ?? '',
    language: isValidLocale(settings.language) ? settings.language : DEFAULT_SETTINGS.language,
  }
  applyTheme(activeSettings.theme)
  setLocale(activeSettings.language)
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  const splash = document.getElementById('splash')
  if (splash) {
    splash.style.background =
      theme === 'light' ? '#f4f6f9' : '#0f1419'
  }
}

export function getCurrencyLocale(code: string): string {
  return CURRENCY_OPTIONS.find((c) => c.code === code)?.locale ?? 'en-PH'
}

export function getCurrencySymbol(code: string): string {
  try {
    const parts = new Intl.NumberFormat(getCurrencyLocale(code), {
      style: 'currency',
      currency: code,
    }).formatToParts(0)
    return parts.find((p) => p.type === 'currency')?.value ?? code
  } catch {
    return code
  }
}
