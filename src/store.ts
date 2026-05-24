import type { AppState, Category, Transaction, TransactionType, UserSettings } from './types'
import { loadState, saveState } from './storage'
import { markSaved, markSaveFailed } from './save-status'
import { syncSettings } from './settings'
import { generateId } from './utils'

type Listener = () => void

let state: AppState = loadState()
syncSettings(state.settings)
const listeners = new Set<Listener>()

export function getState(): AppState {
  return state
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function persist(): void {
  if (saveState(state)) markSaved()
  else markSaveFailed()
}

function commit(next: AppState): void {
  state = next
  syncSettings(state.settings)
  persist()
  listeners.forEach((l) => l())
}

export function flushSave(): void {
  persist()
}

export function addTransaction(input: {
  type: TransactionType
  amount: number
  category: Category
  description: string
  date: string
}): void {
  const transaction: Transaction = {
    id: generateId(),
    ...input,
  }
  commit({ ...state, transactions: [transaction, ...state.transactions] })
}

export function deleteTransaction(id: string): void {
  commit({
    ...state,
    transactions: state.transactions.filter((t) => t.id !== id),
  })
}

export function setCategoryBudget(category: Category, limit: number): void {
  const budgets = state.budgets.filter((b) => b.category !== category)
  if (limit > 0) {
    budgets.push({ category, limit })
  }
  commit({ ...state, budgets })
}

export function getCategoryBudget(category: Category): number {
  return state.budgets.find((b) => b.category === category)?.limit ?? 0
}

export function updateSettings(
  partial: Partial<UserSettings>,
  notify = true
): void {
  state = {
    ...state,
    settings: { ...state.settings, ...partial },
  }
  syncSettings(state.settings)
  persist()
  if (notify) listeners.forEach((l) => l())
}

export function clearAllData(): void {
  commit({ ...state, transactions: [], budgets: [] })
}

export function exportData(): string {
  return JSON.stringify(state, null, 2)
}

export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as AppState
    if (!Array.isArray(parsed.transactions)) return false
    const imported = parsed.settings
    commit({
      transactions: parsed.transactions,
      budgets: parsed.budgets ?? [],
      settings: imported
        ? {
            theme: imported.theme === 'light' ? 'light' : 'dark',
            currency:
              typeof imported.currency === 'string'
                ? imported.currency
                : state.settings.currency,
            displayName:
              typeof imported.displayName === 'string' ? imported.displayName : '',
            language:
              typeof imported.language === 'string' ? imported.language : state.settings.language,
          }
        : state.settings,
    })
    return true
  } catch {
    return false
  }
}
