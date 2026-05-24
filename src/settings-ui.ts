import { CURRENCY_OPTIONS } from './constants'
import { LANGUAGE_OPTIONS, t } from './i18n'
import { formatLastSaved, getSaveStatus } from './save-status'
import { getSettings, getCurrencySymbol } from './settings'
import type { Theme } from './types'

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function currencyPreviewText(currency: string): string {
  const sample = `${getCurrencySymbol(currency)}1,234.56`
  return t('currencyPreview', { preview: sample })
}

function renderSaveStatusLine(): string {
  const { status, savedAt } = getSaveStatus()
  const time = formatLastSaved(savedAt)
  if (status === 'error') {
    return `<p class="save-status-inline save-status-inline--error">${escapeHtml(t('saveError'))}</p>`
  }
  const parts = [escapeHtml(t('autoSaveEnabled'))]
  if (time) parts.push(escapeHtml(t('lastSavedAt', { time })))
  return `<p class="save-status-inline" id="settings-save-status">${parts.join(' · ')}</p>`
}

export function renderSettingsModal(): string {
  const { theme, currency, displayName, language } = getSettings()

  return `
    <div class="modal-overlay" id="settings-modal" role="presentation">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header class="modal__header">
          <h2 id="settings-title">${escapeHtml(t('settingsTitle'))}</h2>
          <button type="button" class="btn-icon modal__close" id="settings-close" aria-label="${escapeHtml(t('settingsTitle'))}">×</button>
        </header>

        <div class="modal__body" id="settings-modal-body">
          <section class="settings-section">
            <h3>${escapeHtml(t('dataAndBackup'))}</h3>
            <p class="hint">${escapeHtml(t('autoSaveHint'))}</p>
            ${renderSaveStatusLine()}
            <button type="button" class="btn btn--ghost btn--block" id="settings-backup">${escapeHtml(t('backupNow'))}</button>
          </section>

          <section class="settings-section">
            <h3>${escapeHtml(t('profile'))}</h3>
            <label class="field">
              <span>${escapeHtml(t('displayName'))}</span>
              <input type="text" id="settings-name" maxlength="40" placeholder="${escapeHtml(t('displayName'))}" autocomplete="name" value="${escapeHtml(displayName)}" />
            </label>
            <p class="hint">${escapeHtml(t('displayNameHint'))}</p>
          </section>

          <section class="settings-section">
            <h3>${escapeHtml(t('language'))}</h3>
            <p class="hint">${escapeHtml(t('tapLanguage'))}</p>
            <ul class="language-list" role="listbox" aria-label="${escapeHtml(t('language'))}">
              ${LANGUAGE_OPTIONS.map(
                (lang) =>
                  `<li>
                  <button
                    type="button"
                    class="language-option ${lang.code === language ? 'active' : ''}"
                    data-language="${lang.code}"
                    role="option"
                    aria-selected="${lang.code === language}"
                  >
                    <span class="language-option__label">${escapeHtml(lang.label)}</span>
                    ${lang.code === language ? '<span class="language-option__check" aria-hidden="true">✓</span>' : ''}
                  </button>
                </li>`
              ).join('')}
            </ul>
          </section>

          <section class="settings-section">
            <h3>${escapeHtml(t('appearance'))}</h3>
            <div class="theme-toggle" role="group" aria-label="${escapeHtml(t('appearance'))}">
              <button type="button" class="theme-toggle__btn ${theme === 'light' ? 'active' : ''}" data-theme="light" aria-pressed="${theme === 'light'}">
                <span class="theme-toggle__icon" aria-hidden="true">☀️</span>
                ${escapeHtml(t('light'))}
              </button>
              <button type="button" class="theme-toggle__btn ${theme === 'dark' ? 'active' : ''}" data-theme="dark" aria-pressed="${theme === 'dark'}">
                <span class="theme-toggle__icon" aria-hidden="true">🌙</span>
                ${escapeHtml(t('dark'))}
              </button>
            </div>
          </section>

          <section class="settings-section">
            <h3>${escapeHtml(t('currency'))}</h3>
            <p class="hint">${escapeHtml(t('tapCurrency'))}</p>
            <ul class="currency-list" role="listbox" aria-label="${escapeHtml(t('currency'))}">
              ${CURRENCY_OPTIONS.map(
                (c) =>
                  `<li>
                  <button
                    type="button"
                    class="currency-option ${c.code === currency ? 'active' : ''}"
                    data-currency="${c.code}"
                    role="option"
                    aria-selected="${c.code === currency}"
                  >
                    <span class="currency-option__label">${escapeHtml(c.label)}</span>
                    ${c.code === currency ? '<span class="currency-option__check" aria-hidden="true">✓</span>' : ''}
                  </button>
                </li>`
              ).join('')}
            </ul>
            <p class="hint" id="settings-currency-preview">${escapeHtml(currencyPreviewText(currency))}</p>
          </section>
        </div>
      </div>
    </div>
  `
}

export function patchThemeButtons(theme: Theme): void {
  document.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((btn) => {
    const active = btn.dataset.theme === theme
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-pressed', String(active))
  })
}

export function patchCurrencyButtons(currency: string): void {
  document.querySelectorAll<HTMLButtonElement>('[data-currency]').forEach((btn) => {
    const active = btn.dataset.currency === currency
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-selected', String(active))
    let check = btn.querySelector('.currency-option__check')
    if (active && !check) {
      check = document.createElement('span')
      check.className = 'currency-option__check'
      check.setAttribute('aria-hidden', 'true')
      check.textContent = '✓'
      btn.appendChild(check)
    } else if (!active && check) {
      check.remove()
    }
  })
  const preview = document.querySelector('#settings-currency-preview')
  if (preview) preview.textContent = currencyPreviewText(currency)
}

export function patchLanguageButtons(language: string): void {
  document.querySelectorAll<HTMLButtonElement>('[data-language]').forEach((btn) => {
    const active = btn.dataset.language === language
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-selected', String(active))
    let check = btn.querySelector('.language-option__check')
    if (active && !check) {
      check = document.createElement('span')
      check.className = 'language-option__check'
      check.setAttribute('aria-hidden', 'true')
      check.textContent = '✓'
      btn.appendChild(check)
    } else if (!active && check) {
      check.remove()
    }
  })
}

export const SETTINGS_ICON_SVG = `<svg class="icon-settings" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
