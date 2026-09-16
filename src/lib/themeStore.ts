/** Tema claro/escuro do dashboard (persistido no navegador). */

export type AppTheme = 'light' | 'dark'

const STORAGE_KEY = 'social-express:theme'
const CHANGE_EVENT = 'social-express:theme-changed'

function readTheme(): AppTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'dark' || raw === 'light') return raw
  } catch {
    /* ignore */
  }
  return 'light'
}

function writeTheme(theme: AppTheme) {
  localStorage.setItem(STORAGE_KEY, theme)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getTheme(): AppTheme {
  return readTheme()
}

export function setTheme(theme: AppTheme) {
  writeTheme(theme)
  applyTheme(theme)
}

export function toggleTheme() {
  const next: AppTheme = readTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

export function applyTheme(theme: AppTheme = readTheme()) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.toggle('theme-dark', theme === 'dark')
  root.classList.toggle('theme-light', theme === 'light')
}

export function bootTheme() {
  applyTheme(readTheme())
}

export function subscribeTheme(onChange: () => void) {
  const handler = () => onChange()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}
