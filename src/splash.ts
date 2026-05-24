const MIN_DISPLAY_MS = 1400
const FADE_OUT_MS = 550

export function dismissSplash(): void {
  const splash = document.getElementById('splash')
  if (!splash) return

  document.body.classList.add('is-loading')

  const start = Number(splash.dataset.startTime) || performance.now()
  const elapsed = performance.now() - start
  const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)

  window.setTimeout(() => {
    splash.classList.add('splash--exit')
    document.body.classList.remove('is-loading')
    document.body.classList.add('is-ready')

    window.setTimeout(() => {
      splash.remove()
    }, FADE_OUT_MS)
  }, remaining)
}
