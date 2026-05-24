import { markSaved, markSaveFailed } from './save-status'
import { saveState } from './storage'
import type { AppState } from './types'

export function initPersistence(getState: () => AppState): void {
  const flush = (): void => {
    const ok = saveState(getState())
    if (ok) markSaved()
    else markSaveFailed()
  }

  window.addEventListener('pagehide', flush)
  window.addEventListener('beforeunload', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}
