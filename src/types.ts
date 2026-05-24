export type TransactionType = 'income' | 'expense'

export type Theme = 'dark' | 'light'

export type Category =
  | 'housing'
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'health'
  | 'utilities'
  | 'salary'
  | 'other'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: Category
  description: string
  date: string
}

export interface CategoryBudget {
  category: Category
  limit: number
}

export interface UserSettings {
  theme: Theme
  currency: string
  displayName: string
  language: string
}

export interface AppState {
  transactions: Transaction[]
  budgets: CategoryBudget[]
  settings: UserSettings
}
