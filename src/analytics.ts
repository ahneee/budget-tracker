import { CATEGORY_COLORS } from './constants'
import { t, getDateLocale } from './i18n'
import type { Category, Transaction } from './types'
import {
  categoryLabel,
  formatCurrency,
  monthLabel,
  spendingByCategory,
  sumByType,
} from './utils'

export interface MonthTrend {
  monthKey: string
  income: number
  expenses: number
  net: number
}

export interface AnalyticsData {
  trend: MonthTrend[]
  savingsRate: number
  avgDailySpend: number
  daysInMonth: number
  topCategory: { category: Category; amount: number; percent: number } | null
  expenseChange: number | null
  incomeChange: number | null
  categorySlices: { category: Category; amount: number; percent: number }[]
  monthIncome: number
  monthExpenses: number
}

export function getLastNMonthKeys(endMonthKey: string, count: number): string[] {
  const [year, month] = endMonthKey.split('-').map(Number)
  const keys: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function shortMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(getDateLocale(), { month: 'short' })
}

export function computeAnalytics(
  transactions: Transaction[],
  selectedMonth: string
): AnalyticsData {
  const trend = getLastNMonthKeys(selectedMonth, 6).map((monthKey) => {
    const income = sumByType(transactions, 'income', monthKey)
    const expenses = sumByType(transactions, 'expense', monthKey)
    return { monthKey, income, expenses, net: income - expenses }
  })

  const monthIncome = sumByType(transactions, 'income', selectedMonth)
  const monthExpenses = sumByType(transactions, 'expense', selectedMonth)
  const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpenses) / monthIncome) * 100 : 0

  const [year, month] = selectedMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const avgDailySpend = monthExpenses / daysInMonth

  const spending = spendingByCategory(transactions, selectedMonth)
  const totalExpense = monthExpenses
  const categorySlices = [...spending.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  const topCategory =
    categorySlices.length > 0
      ? {
          category: categorySlices[0].category,
          amount: categorySlices[0].amount,
          percent: categorySlices[0].percent,
        }
      : null

  const trendKeys = getLastNMonthKeys(selectedMonth, 2)
  const prevMonth = trendKeys[0]

  let expenseChange: number | null = null
  let incomeChange: number | null = null
  if (prevMonth !== selectedMonth) {
    const prevExp = sumByType(transactions, 'expense', prevMonth)
    const prevInc = sumByType(transactions, 'income', prevMonth)
    expenseChange = prevExp > 0 ? ((monthExpenses - prevExp) / prevExp) * 100 : null
    incomeChange = prevInc > 0 ? ((monthIncome - prevInc) / prevInc) * 100 : null
  }

  return {
    trend,
    savingsRate,
    avgDailySpend,
    daysInMonth,
    topCategory,
    expenseChange,
    incomeChange,
    categorySlices,
    monthIncome,
    monthExpenses,
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function formatPercent(value: number, signed = false): string {
  const prefix = signed && value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)}%`
}

function renderTrendChart(trend: MonthTrend[]): string {
  const max = Math.max(...trend.flatMap((m) => [m.income, m.expenses]), 1)
  const chartW = 100
  const chartH = 48
  const groupW = chartW / trend.length
  const barW = groupW * 0.32

  const bars = trend
    .map((m, i) => {
      const x = i * groupW + groupW * 0.12
      const incH = (m.income / max) * chartH
      const expH = (m.expenses / max) * chartH
      const incY = chartH - incH
      const expY = chartH - expH
      const expX = x + barW + 2
      return `
        <rect x="${x}" y="${incY}" width="${barW}" height="${incH}" class="chart-bar chart-bar--income" rx="1" />
        <rect x="${expX}" y="${expY}" width="${barW}" height="${expH}" class="chart-bar chart-bar--expense" rx="1" />
      `
    })
    .join('')

  const labels = trend
    .map((m, i) => {
      const x = i * groupW + groupW / 2
      return `<text x="${x}" y="${chartH + 8}" class="chart-label" text-anchor="middle">${escapeHtml(shortMonthLabel(m.monthKey))}</text>`
    })
    .join('')

  return `
    <div class="chart-wrap">
      <svg class="chart-svg" viewBox="0 0 ${chartW} ${chartH + 12}" preserveAspectRatio="xMidYMid meet" aria-label="Income and expenses over six months">
        ${bars}
        ${labels}
      </svg>
      <div class="chart-legend">
        <span class="chart-legend__item"><span class="chart-legend__dot chart-legend__dot--income"></span> ${escapeHtml(t('chartIncome'))}</span>
        <span class="chart-legend__item"><span class="chart-legend__dot chart-legend__dot--expense"></span> ${escapeHtml(t('chartExpenses'))}</span>
      </div>
    </div>
  `
}

function renderDonut(slices: AnalyticsData['categorySlices']): string {
  if (slices.length === 0) {
    return `<div class="empty-state"><p>${escapeHtml(t('noExpenseData'))}</p></div>`
  }

  let gradientStops = 'var(--border) 0% 100%'
  let offset = 0
  const stops: string[] = []
  for (const slice of slices) {
    const color = CATEGORY_COLORS[slice.category]
    const end = offset + slice.percent
    stops.push(`${color} ${offset}% ${end}%`)
    offset = end
  }
  gradientStops = stops.join(', ')

  const legend = slices
    .map(
      (s) => `
      <li class="donut-legend__item">
        <span class="donut-legend__swatch" style="background: ${CATEGORY_COLORS[s.category]}"></span>
        <span class="donut-legend__name">${escapeHtml(categoryLabel(s.category))}</span>
        <span class="donut-legend__value">${formatCurrency(s.amount)} · ${s.percent.toFixed(0)}%</span>
      </li>
    `
    )
    .join('')

  return `
    <div class="donut-layout">
      <div class="donut" style="background: conic-gradient(${gradientStops})" role="img" aria-label="Expense distribution by category">
        <div class="donut__hole"></div>
      </div>
      <ul class="donut-legend">${legend}</ul>
    </div>
  `
}

function renderInsightCards(data: AnalyticsData, selectedMonth: string): string {
  const cards: string[] = []

  if (data.monthIncome > 0) {
    cards.push(`
      <article class="insight-card">
        <span class="insight-card__label">${escapeHtml(t('savingsRate'))}</span>
        <span class="insight-card__value ${data.savingsRate >= 0 ? 'positive' : 'negative'}">${formatPercent(data.savingsRate)}</span>
        <span class="insight-card__hint">${escapeHtml(t('savingsRateHint'))}</span>
      </article>
    `)
  }

  cards.push(`
    <article class="insight-card">
      <span class="insight-card__label">${escapeHtml(t('avgDailySpend'))}</span>
      <span class="insight-card__value">${formatCurrency(data.avgDailySpend)}</span>
      <span class="insight-card__hint">${escapeHtml(t('avgDailySpendHint', { days: data.daysInMonth, month: monthLabel(selectedMonth) }))}</span>
    </article>
  `)

  if (data.topCategory) {
    cards.push(`
      <article class="insight-card">
        <span class="insight-card__label">${escapeHtml(t('topCategory'))}</span>
        <span class="insight-card__value">${escapeHtml(categoryLabel(data.topCategory.category))}</span>
        <span class="insight-card__hint">${escapeHtml(t('percentOfExpenses', { amount: formatCurrency(data.topCategory.amount), percent: data.topCategory.percent.toFixed(0) }))}</span>
      </article>
    `)
  }

  if (data.expenseChange !== null) {
    const up = data.expenseChange > 0
    cards.push(`
      <article class="insight-card">
        <span class="insight-card__label">${escapeHtml(t('expensesVsLastMonth'))}</span>
        <span class="insight-card__value ${up ? 'negative' : 'positive'}">${formatPercent(data.expenseChange, true)}</span>
        <span class="insight-card__hint">${escapeHtml(up ? t('higher') : t('lower'))}</span>
      </article>
    `)
  }

  if (data.incomeChange !== null) {
    const up = data.incomeChange > 0
    cards.push(`
      <article class="insight-card">
        <span class="insight-card__label">${escapeHtml(t('incomeVsLastMonth'))}</span>
        <span class="insight-card__value ${up ? 'positive' : 'negative'}">${formatPercent(data.incomeChange, true)}</span>
        <span class="insight-card__hint">${escapeHtml(up ? t('higher') : t('lower'))}</span>
      </article>
    `)
  }

  return cards.join('')
}

export function renderAnalyticsView(
  transactions: Transaction[],
  selectedMonth: string
): string {
  const data = computeAnalytics(transactions, selectedMonth)
  const hasData = data.monthIncome > 0 || data.monthExpenses > 0 || data.trend.some((m) => m.income || m.expenses)

  if (!hasData) {
    return `
      <section class="analytics panel">
        <h2>${escapeHtml(t('analytics'))}</h2>
        <div class="empty-state">
          <p>${escapeHtml(t('analyticsEmpty', { month: monthLabel(selectedMonth) }))}</p>
          <p class="hint">${escapeHtml(t('analyticsEmptyHint'))}</p>
        </div>
      </section>
    `
  }

  const trendRows = data.trend
    .map(
      (m) => `
      <tr>
        <td>${escapeHtml(monthLabel(m.monthKey))}</td>
        <td class="positive">${formatCurrency(m.income)}</td>
        <td class="negative">${formatCurrency(m.expenses)}</td>
        <td class="${m.net >= 0 ? 'positive' : 'negative'}">${formatCurrency(m.net)}</td>
      </tr>
    `
    )
    .join('')

  return `
    <section class="analytics" aria-label="${escapeHtml(t('analytics'))}">
      <div class="analytics__insights">
        ${renderInsightCards(data, selectedMonth)}
      </div>

      <div class="analytics__grid">
        <article class="panel analytics__card">
          <h2>${escapeHtml(t('trend6Month'))}</h2>
          <p class="hint">${escapeHtml(t('trendHint', { month: monthLabel(selectedMonth) }))}</p>
          ${renderTrendChart(data.trend)}
        </article>

        <article class="panel analytics__card">
          <h2>${escapeHtml(t('expenseMix'))}</h2>
          <p class="hint">${escapeHtml(t('expenseMixHint'))}</p>
          ${renderDonut(data.categorySlices)}
        </article>
      </div>

      <article class="panel analytics__card analytics__card--wide">
        <h2>${escapeHtml(t('monthlySummaryTable'))}</h2>
        <div class="table-wrap">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>${escapeHtml(t('month'))}</th>
                <th>${escapeHtml(t('income'))}</th>
                <th>${escapeHtml(t('expenses'))}</th>
                <th>${escapeHtml(t('net'))}</th>
              </tr>
            </thead>
            <tbody>${trendRows}</tbody>
          </table>
        </div>
      </article>
    </section>
  `
}
