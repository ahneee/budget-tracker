import { getDateLocale } from './i18n'
import { getLastSavedAt } from './storage'

export type SaveStatus = 'saved' | 'error'

let status: SaveStatus = 'saved'
let savedAt: string | null = getLastSavedAt()

const listeners = new Set<() => void>()

export function getSaveStatus(): { status: SaveStatus; savedAt: string | null } {
  return { status, savedAt }
}

export function subscribeSaveStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(): void {
  listeners.forEach((l) => l())
}

export function markSaved(at?: string): void {
  status = 'saved'
  savedAt = at ?? new Date().toISOString()
  notify()
}

export function markSaveFailed(): void {
  status = 'error'
  notify()
}

export function formatLastSaved(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(getDateLocale(), {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
