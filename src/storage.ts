import { DEFAULT_SETTINGS, STORAGE_KEY, STORAGE_META_KEY } from './constants'
import { isValidLocale } from './i18n'
import type { AppState, UserSettings } from './types'

const defaultState: AppState = {
  transactions: [],
  budgets: [],
  settings: { ...DEFAULT_SETTINGS },
}

function normalizeSettings(raw: Partial<UserSettings> | undefined): UserSettings {
  return {
    theme: raw?.theme === 'light' ? 'light' : 'dark',
    currency: typeof raw?.currency === 'string' ? raw.currency : DEFAULT_SETTINGS.currency,
    displayName: typeof raw?.displayName === 'string' ? raw.displayName.trim() : '',
    language:
      typeof raw?.language === 'string' && isValidLocale(raw.language)
        ? raw.language
        : DEFAULT_SETTINGS.language,
  }
}

export function getLastSavedAt(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_META_KEY)
    if (!raw) return null
    const meta = JSON.parse(raw) as { savedAt?: string }
    return typeof meta.savedAt === 'string' ? meta.savedAt : null
  } catch {
    return null
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState, settings: { ...DEFAULT_SETTINGS } }
    const parsed = JSON.parse(raw) as AppState
    return {
      transactions: parsed.transactions ?? [],
      budgets: parsed.budgets ?? [],
      settings: normalizeSettings(parsed.settings),
    }
  } catch {
    return { ...defaultState, settings: { ...DEFAULT_SETTINGS } }
  }
}

export function saveState(state: AppState): boolean {
  try {
    const payload = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, payload)
    const savedAt = new Date().toISOString()
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify({ savedAt, version: 1 }))
    return true
  } catch {
    return false
  }
}
