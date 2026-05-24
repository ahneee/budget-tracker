import { getSettings, getCurrencyLocale } from './settings'
import { categoryLabel as translateCategory, getDateLocale } from './i18n'
import type { Category, Transaction, TransactionType } from './types'

export function formatCurrency(amount: number): string {
  const { currency } = getSettings()
  return new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(getDateLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function categoryLabel(category: Category): string {
  return translateCategory(category)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(getDateLocale(), {
    month: 'long',
    year: 'numeric',
  })
}

export function transactionInMonth(t: Transaction, monthKey: string): boolean {
  return t.date.startsWith(monthKey)
}

export function sumByType(
  transactions: Transaction[],
  type: TransactionType,
  monthKey?: string
): number {
  return transactions
    .filter((t) => t.type === type && (!monthKey || transactionInMonth(t, monthKey)))
    .reduce((sum, t) => sum + t.amount, 0)
}

export function spendingByCategory(
  transactions: Transaction[],
  monthKey: string
): Map<Category, number> {
  const map = new Map<Category, number>()
  for (const t of transactions) {
    if (t.type !== 'expense' || !transactionInMonth(t, monthKey)) continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  }
  return map
}

export function generateId(): string {
  return crypto.randomUUID()
}
