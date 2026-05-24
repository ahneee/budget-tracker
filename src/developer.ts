const DEVELOPER_PHOTO = '/icon/me.jfif'
const DEVELOPER_NAME = 'Yuina Nakada'
const DEVELOPER_EMAIL = 'yuinakada180@gmail.com'

const FAB_ICON = `<svg class="dev-fab__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.15"/>
  <circle cx="8.5" cy="10" r="1.25" fill="currentColor"/>
  <circle cx="15.5" cy="10" r="1.25" fill="currentColor"/>
  <path d="M8 14.5c1.2 1.5 6.8 1.5 8 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`

export function initDeveloperCredit(): void {
  if (document.getElementById('dev-fab')) return

  const fab = document.createElement('button')
  fab.type = 'button'
  fab.id = 'dev-fab'
  fab.className = 'dev-fab'
  fab.setAttribute('aria-label', 'About the developer')
  fab.setAttribute('aria-expanded', 'false')
  fab.innerHTML = FAB_ICON

  const card = document.createElement('div')
  card.id = 'dev-card'
  card.className = 'dev-card'
  card.hidden = true
  card.setAttribute('role', 'dialog')
  card.setAttribute('aria-label', 'Developer')
  card.innerHTML = `
    <button type="button" class="dev-card__close" id="dev-card-close" aria-label="Close">×</button>
    <div class="dev-card__inner">
      <img src="${DEVELOPER_PHOTO}" alt="${DEVELOPER_NAME}" class="dev-card__photo" width="72" height="72" />
      <div class="dev-card__info">
        <p class="dev-card__label">Developer</p>
        <p class="dev-card__name">${DEVELOPER_NAME}</p>
        <p class="dev-card__app">Budget Tracker · v1.0</p>
        <a class="dev-card__email" href="mailto:${DEVELOPER_EMAIL}">${DEVELOPER_EMAIL}</a>
      </div>
    </div>
  `

  document.body.append(fab, card)

  const open = (): void => {
    card.hidden = false
    fab.setAttribute('aria-expanded', 'true')
  }

  const close = (): void => {
    card.hidden = true
    fab.setAttribute('aria-expanded', 'false')
  }

  fab.addEventListener('click', (e) => {
    e.stopPropagation()
    if (card.hidden) open()
    else close()
  })

  document.getElementById('dev-card-close')?.addEventListener('click', close)

  document.addEventListener('click', (e) => {
    if (card.hidden) return
    const target = e.target as Node
    if (!card.contains(target) && !fab.contains(target)) close()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !card.hidden) close()
  })
}
