import type { Category } from './types'

export const CATEGORY_LABELS: Record<Category, string> = {
  housing: 'Housing',
  food: 'Food & Dining',
  transport: 'Transport',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  health: 'Health',
  utilities: 'Utilities',
  salary: 'Salary',
  other: 'Other',
}

export const EXPENSE_CATEGORIES: Category[] = [
  'housing',
  'food',
  'transport',
  'entertainment',
  'shopping',
  'health',
  'utilities',
  'other',
]

export const INCOME_CATEGORIES: Category[] = ['salary', 'other']

export const CATEGORY_COLORS: Record<Category, string> = {
  housing: '#818cf8',
  food: '#f472b6',
  transport: '#38bdf8',
  entertainment: '#a78bfa',
  shopping: '#fb923c',
  health: '#4ade80',
  utilities: '#fbbf24',
  salary: '#34d399',
  other: '#94a3b8',
}

export const STORAGE_KEY = 'budget-tracker-data'
export const STORAGE_META_KEY = 'budget-tracker-meta'

export const DEFAULT_SETTINGS = {
  theme: 'dark' as const,
  currency: 'PHP',
  displayName: '',
  language: 'en',
}

export const CURRENCY_OPTIONS = [
  { code: 'PHP', label: 'Philippine Peso (₱)', locale: 'en-PH' },
  { code: 'USD', label: 'US Dollar ($)', locale: 'en-US' },
  { code: 'EUR', label: 'Euro (€)', locale: 'de-DE' },
  { code: 'GBP', label: 'British Pound (£)', locale: 'en-GB' },
  { code: 'JPY', label: 'Japanese Yen (¥)', locale: 'ja-JP' },
  { code: 'MXN', label: 'Mexican Peso ($)', locale: 'es-MX' },
  { code: 'AUD', label: 'Australian Dollar (A$)', locale: 'en-AU' },
  { code: 'CAD', label: 'Canadian Dollar (C$)', locale: 'en-CA' },
  { code: 'INR', label: 'Indian Rupee (₹)', locale: 'en-IN' },
  { code: 'SGD', label: 'Singapore Dollar (S$)', locale: 'en-SG' },
] as const
