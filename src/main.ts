import './style.css'
import { renderAnalyticsView } from './analytics'
import { dismissSplash } from './splash'
import {
  renderSettingsModal,
  SETTINGS_ICON_SVG,
  patchThemeButtons,
  patchCurrencyButtons,
} from './settings-ui'
import { initDeveloperCredit } from './developer'
import { renderLogoImg } from './logo'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './constants'
import { t } from './i18n'
import { initPersistence, isStorageAvailable } from './persistence'
import {
  formatLastSaved,
  getSaveStatus,
  markSaveFailed,
  subscribeSaveStatus,
} from './save-status'
import {
  addTransaction,
  clearAllData,
  deleteTransaction,
  exportData,
  getCategoryBudget,
  getState,
  importData,
  setCategoryBudget,
  subscribe,
  updateSettings,
} from './store'
import type { Category, Theme, TransactionType } from './types'
import {
  categoryLabel,
  currentMonthKey,
  formatCurrency,
  formatDate,
  monthLabel,
  spendingByCategory,
  sumByType,
  todayISO,
  transactionInMonth,
} from './utils'

const app = document.querySelector<HTMLDivElement>('#app')!
const settingsRoot = document.querySelector<HTMLDivElement>('#settings-root')!

type AppView = 'dashboard' | 'analytics'

let selectedMonth = currentMonthKey()
let formType: TransactionType = 'expense'
let filterType: 'all' | TransactionType = 'all'
let activeView: AppView = 'dashboard'
let settingsOpen = false

function onSettingsKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && settingsOpen) closeSettings()
}

function updateHeaderBrand(): void {
  const { displayName } = getState().settings
  const h1 = document.querySelector('.header h1')
  if (h1) h1.textContent = displayName || t('appTitle')
}

function renderSettingsPortal(): void {
  settingsRoot.innerHTML = renderSettingsModal()
  bindSettingsEvents()
}

function openSettings(): void {
  settingsOpen = true
  renderSettingsPortal()
  document.addEventListener('keydown', onSettingsKeydown)
}

function saveDisplayNameFromInput(): void {
  const input = document.querySelector<HTMLInputElement>('#settings-name')
  if (!input) return
  const value = input.value.trim()
  if (value === getState().settings.displayName) return
  updateSettings({ displayName: value }, false)
  updateHeaderBrand()
}

function closeSettings(): void {
  saveDisplayNameFromInput()
  settingsOpen = false
  settingsRoot.innerHTML = ''
  document.removeEventListener('keydown', onSettingsKeydown)
}

function bindSettingsEvents(): void {
  const modal = document.querySelector('.modal')
  modal?.addEventListener('mousedown', (e) => e.stopPropagation())

  document.querySelector('#settings-close')?.addEventListener('click', closeSettings)
  document.querySelector('#settings-backup')?.addEventListener('click', downloadBackup)

  const nameInput = document.querySelector<HTMLInputElement>('#settings-name')
  nameInput?.addEventListener('blur', saveDisplayNameFromInput)
  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nameInput.blur()
    }
  })

  document.querySelectorAll('[data-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme') as Theme
      if (!theme || theme === getState().settings.theme) return
      updateSettings({ theme }, false)
      patchThemeButtons(theme)
    })
  })

  document.querySelectorAll('[data-currency]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-currency')
      if (!code || code === getState().settings.currency) return
      updateSettings({ currency: code }, false)
      updateHeaderBrand()
      render()
      patchCurrencyButtons(code)
    })
  })

  document.querySelectorAll('[data-language]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-language')
      if (!lang || lang === getState().settings.language) return
      saveDisplayNameFromInput()
      updateSettings({ language: lang }, false)
      updateHeaderBrand()
      render()
      renderSettingsPortal()
    })
  })
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function renderSaveStatusMarkup(): string {
  const { status, savedAt } = getSaveStatus()
  const time = formatLastSaved(savedAt)
  const modifier = status === 'error' ? 'save-status--error' : 'save-status--saved'
  const label = status === 'error' ? t('saveError') : t('autoSaveEnabled')
  const timeLine =
    status === 'saved' && time
      ? `<span class="save-status__time">${escapeHtml(t('lastSavedAt', { time }))}</span>`
      : ''

  return `
    <div class="save-status ${modifier}" id="save-status" role="status" aria-live="polite">
      <span class="save-status__dot" aria-hidden="true"></span>
      <div class="save-status__text">
        <span class="save-status__label">${escapeHtml(label)}</span>
        ${timeLine}
      </div>
    </div>
  `
}

function updateSaveStatusUI(): void {
  const host = document.querySelector('#save-status-host')
  if (host) host.innerHTML = renderSaveStatusMarkup()

  const settingsLine = document.querySelector('#settings-save-status')
  if (settingsLine) {
    const { status, savedAt } = getSaveStatus()
    const time = formatLastSaved(savedAt)
    if (status === 'error') {
      settingsLine.className = 'save-status-inline save-status-inline--error'
      settingsLine.textContent = t('saveError')
    } else {
      settingsLine.className = 'save-status-inline'
      settingsLine.textContent = time
        ? `${t('autoSaveEnabled')} · ${t('lastSavedAt', { time })}`
        : t('autoSaveEnabled')
    }
  }
}

function downloadBackup(): void {
  const blob = new Blob([exportData()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `budget-tracker-${todayISO()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function renderCategoryOptions(categories: Category[], selected?: Category): string {
  return categories
    .map(
      (c) =>
        `<option value="${c}" ${c === selected ? 'selected' : ''}>${escapeHtml(categoryLabel(c))}</option>`
    )
    .join('')
}

function render(): void {
  const state = getState()
  const { displayName } = state.settings
  const monthTransactions = state.transactions.filter((t) =>
    transactionInMonth(t, selectedMonth)
  )
  const filtered =
    filterType === 'all'
      ? monthTransactions
      : monthTransactions.filter((t) => t.type === filterType)

  const income = sumByType(state.transactions, 'income', selectedMonth)
  const expenses = sumByType(state.transactions, 'expense', selectedMonth)
  const balance = income - expenses
  const spending = spendingByCategory(state.transactions, selectedMonth)
  const maxSpend = Math.max(...spending.values(), 1)

  const months = [
    ...new Set(state.transactions.map((t) => t.date.slice(0, 7))),
    currentMonthKey(),
  ]
    .sort()
    .reverse()

  app.innerHTML = `
    <div class="app">
      <header class="header">
        <div class="header__brand">
          <span class="header__logo" aria-hidden="true">${renderLogoImg('header__logo-img', 48)}</span>
          <div>
            <h1>${displayName ? escapeHtml(displayName) : escapeHtml(t('appTitle'))}</h1>
            <p class="header__tagline">${escapeHtml(t('tagline'))}</p>
          </div>
        </div>
        <div class="header__actions">
          <button type="button" class="btn-settings" id="settings-open" aria-label="${escapeHtml(t('openSettings'))}" title="${escapeHtml(t('settingsTitle'))}">
            ${SETTINGS_ICON_SVG}
          </button>
          <nav class="view-nav" aria-label="App views">
            <button type="button" class="view-nav__btn ${activeView === 'dashboard' ? 'active' : ''}" data-view="dashboard">${escapeHtml(t('dashboard'))}</button>
            <button type="button" class="view-nav__btn ${activeView === 'analytics' ? 'active' : ''}" data-view="analytics">${escapeHtml(t('analytics'))}</button>
          </nav>
          <label class="month-picker">
            <span class="sr-only">${escapeHtml(t('selectMonth'))}</span>
            <select id="month-select" class="select">
              ${months.map((m) => `<option value="${m}" ${m === selectedMonth ? 'selected' : ''}>${escapeHtml(monthLabel(m))}</option>`).join('')}
            </select>
          </label>
        </div>
      </header>

      <section class="stats" aria-label="${escapeHtml(t('monthlySummary'))}">
        <article class="stat-card stat-card--balance">
          <span class="stat-card__label">${escapeHtml(t('netBalance'))}</span>
          <span class="stat-card__value ${balance >= 0 ? 'positive' : 'negative'}">${formatCurrency(balance)}</span>
        </article>
        <article class="stat-card stat-card--income">
          <span class="stat-card__label">${escapeHtml(t('income'))}</span>
          <span class="stat-card__value positive">+${formatCurrency(income)}</span>
        </article>
        <article class="stat-card stat-card--expense">
          <span class="stat-card__label">${escapeHtml(t('expenses'))}</span>
          <span class="stat-card__value negative">−${formatCurrency(expenses)}</span>
        </article>
        <article class="stat-card stat-card--count">
          <span class="stat-card__label">${escapeHtml(t('transactions'))}</span>
          <span class="stat-card__value">${monthTransactions.length}</span>
        </article>
      </section>

      ${
        activeView === 'analytics'
          ? renderAnalyticsView(state.transactions, selectedMonth)
          : `<div class="layout">
        <aside class="panel panel--form">
          <h2>${escapeHtml(t('addTransaction'))}</h2>
          <div class="type-toggle" role="group" aria-label="${escapeHtml(t('transactionType'))}">
            <button type="button" class="type-toggle__btn ${formType === 'expense' ? 'active' : ''}" data-form-type="expense">${escapeHtml(t('expense'))}</button>
            <button type="button" class="type-toggle__btn ${formType === 'income' ? 'active' : ''}" data-form-type="income">${escapeHtml(t('income'))}</button>
          </div>
          <form id="transaction-form" class="form">
            <label class="field">
              <span>${escapeHtml(t('description'))}</span>
              <input type="text" name="description" required placeholder="${escapeHtml(t('descPlaceholder'))}" maxlength="80" />
            </label>
            <label class="field">
              <span>${escapeHtml(t('amount'))}</span>
              <input type="number" name="amount" required min="0.01" step="0.01" placeholder="0.00" />
            </label>
            <label class="field">
              <span>${escapeHtml(t('category'))}</span>
              <select name="category" class="select" id="category-select">
                ${renderCategoryOptions(formType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)}
              </select>
            </label>
            <label class="field">
              <span>${escapeHtml(t('date'))}</span>
              <input type="date" name="date" required value="${todayISO()}" />
            </label>
            <button type="submit" class="btn btn--primary">${escapeHtml(formType === 'income' ? t('addIncome') : t('addExpense'))}</button>
          </form>

          <hr class="divider" />

          <h2>${escapeHtml(t('categoryBudgets'))}</h2>
          <p class="hint">${escapeHtml(t('categoryBudgetsHint'))}</p>
          <div class="budget-list">
            ${EXPENSE_CATEGORIES.map((cat) => {
              const spent = spending.get(cat) ?? 0
              const limit = getCategoryBudget(cat)
              const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
              const over = limit > 0 && spent > limit
              return `
                <div class="budget-item">
                  <div class="budget-item__header">
                    <span>${escapeHtml(categoryLabel(cat))}</span>
                    <span class="budget-item__spent ${over ? 'negative' : ''}">${formatCurrency(spent)}${limit > 0 ? ` / ${formatCurrency(limit)}` : ''}</span>
                  </div>
                  ${limit > 0 ? `<div class="progress"><div class="progress__bar ${over ? 'progress__bar--over' : ''}" style="width: ${pct}%"></div></div>` : ''}
                  <label class="budget-input">
                    <span class="sr-only">${escapeHtml(t('budgetLimitFor'))} ${escapeHtml(categoryLabel(cat))}</span>
                    <input type="number" data-budget-category="${cat}" min="0" step="1" placeholder="${escapeHtml(t('noLimit'))}" value="${limit > 0 ? limit : ''}" />
                  </label>
                </div>
              `
            }).join('')}
          </div>
        </aside>

        <main class="panel panel--main">
          <div class="panel__toolbar">
            <h2>${escapeHtml(t('transactions'))}</h2>
            <div class="filter-tabs" role="tablist">
              <button type="button" class="filter-tabs__btn ${filterType === 'all' ? 'active' : ''}" data-filter="all">${escapeHtml(t('all'))}</button>
              <button type="button" class="filter-tabs__btn ${filterType === 'income' ? 'active' : ''}" data-filter="income">${escapeHtml(t('income'))}</button>
              <button type="button" class="filter-tabs__btn ${filterType === 'expense' ? 'active' : ''}" data-filter="expense">${escapeHtml(t('expenses'))}</button>
            </div>
          </div>

          ${
            filtered.length === 0
              ? `<div class="empty-state"><p>${escapeHtml(t('noTransactions', { month: monthLabel(selectedMonth) }))}</p><p class="hint">${escapeHtml(t('noTransactionsHint'))}</p></div>`
              : `<ul class="transaction-list">
                  ${filtered
                    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
                    .map(
                      (tx) => `
                    <li class="transaction-item transaction-item--${tx.type}">
                      <div class="transaction-item__info">
                        <span class="transaction-item__desc">${escapeHtml(tx.description)}</span>
                        <span class="transaction-item__meta">${escapeHtml(categoryLabel(tx.category))} · ${formatDate(tx.date)}</span>
                      </div>
                      <div class="transaction-item__actions">
                        <span class="transaction-item__amount ${tx.type === 'income' ? 'positive' : 'negative'}">
                          ${tx.type === 'income' ? '+' : '−'}${formatCurrency(tx.amount)}
                        </span>
                        <button type="button" class="btn-icon" data-delete="${tx.id}" aria-label="${escapeHtml(t('deleteTransaction'))}">×</button>
                      </div>
                    </li>
                  `
                    )
                    .join('')}
                </ul>`
          }

          ${
            spending.size > 0
              ? `
            <section class="breakdown">
              <h2>${escapeHtml(t('spendingBreakdown'))}</h2>
              <ul class="breakdown-list">
                ${[...spending.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => `
                    <li class="breakdown-item">
                      <div class="breakdown-item__label">
                        <span>${escapeHtml(categoryLabel(cat))}</span>
                        <span>${formatCurrency(amount)}</span>
                      </div>
                      <div class="progress">
                        <div class="progress__bar" style="width: ${(amount / maxSpend) * 100}%"></div>
                      </div>
                    </li>
                  `)
                  .join('')}
              </ul>
            </section>
          `
              : ''
          }
        </main>
      </div>`
      }

      <footer class="footer">
        <div class="footer__save" id="save-status-host">
          ${renderSaveStatusMarkup()}
        </div>
        <div class="footer__actions">
        <button type="button" class="btn btn--ghost" id="export-btn">${escapeHtml(t('exportData'))}</button>
        <label class="btn btn--ghost import-label">
          ${escapeHtml(t('importData'))}
          <input type="file" id="import-input" accept="application/json" hidden />
        </label>
        <button type="button" class="btn btn--danger-ghost" id="clear-btn">${escapeHtml(t('clearData'))}</button>
        </div>
      </footer>

    </div>
  `

  bindEvents()
  updateHeaderBrand()
}

function bindEvents(): void {
  document.querySelector('#month-select')?.addEventListener('change', (e) => {
    selectedMonth = (e.target as HTMLSelectElement).value
    render()
  })

  document.querySelectorAll('[data-form-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      formType = btn.getAttribute('data-form-type') as TransactionType
      render()
    })
  })

  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      filterType = btn.getAttribute('data-filter') as typeof filterType
      render()
    })
  })

  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeView = btn.getAttribute('data-view') as AppView
      render()
    })
  })

  document.querySelector('#settings-open')?.addEventListener('click', openSettings)

  document.querySelector('#transaction-form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data = new FormData(form)
    const amount = Number(data.get('amount'))
    if (!amount || amount <= 0) return

    addTransaction({
      type: formType,
      amount,
      category: data.get('category') as Category,
      description: String(data.get('description')).trim(),
      date: String(data.get('date')),
    })

    form.reset()
    const dateInput = form.querySelector<HTMLInputElement>('input[name="date"]')
    if (dateInput) dateInput.value = todayISO()
    render()
  })

  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete')
      if (id) deleteTransaction(id)
    })
  })

  document.querySelectorAll('[data-budget-category]').forEach((input) => {
    input.addEventListener('change', (e) => {
      const cat = (e.target as HTMLInputElement).getAttribute('data-budget-category') as Category
      const limit = Number((e.target as HTMLInputElement).value) || 0
      setCategoryBudget(cat, limit)
    })
  })

  document.querySelector('#export-btn')?.addEventListener('click', downloadBackup)

  document.querySelector('#import-input')?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const text = await file.text()
    if (importData(text)) {
      alert(t('importSuccess'))
      render()
    } else {
      alert(t('importError'))
    }
    ;(e.target as HTMLInputElement).value = ''
  })

  document.querySelector('#clear-btn')?.addEventListener('click', () => {
    if (confirm(t('clearConfirm'))) {
      clearAllData()
    }
  })
}

subscribe(render)
subscribeSaveStatus(updateSaveStatusUI)

if (!isStorageAvailable()) markSaveFailed()

initPersistence(getState)
initDeveloperCredit()
render()
dismissSplash()
