/** Sessão local do dashboard Social Express (login/senha do perfil). */

import { getUserProfile } from './userProfileStore'

const STORAGE_KEY = 'social-express:auth-session'
const CHANGE_EVENT = 'social-express:auth-changed'
/** Senha padrão enquanto o perfil ainda não define uma. */
export const DEFAULT_LOGIN_PASSWORD = 'socialexpress'

export type AuthSession = {
  loggedIn: boolean
  at: number
  identifier: string
}

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (!parsed?.loggedIn) return null
    return {
      loggedIn: true,
      at: typeof parsed.at === 'number' ? parsed.at : Date.now(),
      identifier: typeof parsed.identifier === 'string' ? parsed.identifier : '',
    }
  } catch {
    return null
  }
}

function writeSession(session: AuthSession | null) {
  if (!session) localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function isAuthenticated() {
  return Boolean(readSession()?.loggedIn)
}

export function getAuthSession() {
  return readSession()
}

export function logout() {
  writeSession(null)
}

export function subscribeAuth(onChange: () => void) {
  const handler = () => onChange()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export type LoginResult = { ok: true } | { ok: false; error: string }

export function attemptLogin(identifierRaw: string, passwordRaw: string): LoginResult {
  const identifier = String(identifierRaw || '').trim()
  const password = String(passwordRaw || '')
  if (!identifier || !password) {
    return { ok: false, error: 'Informe login (ou e-mail) e senha.' }
  }

  const profile = getUserProfile()
  const loginId = profile.login.trim().toLocaleLowerCase('pt-BR')
  const emailId = profile.email.trim().toLocaleLowerCase('pt-BR')
  const typed = identifier.toLocaleLowerCase('pt-BR')

  const idOk = typed === loginId || (emailId && typed === emailId)
  if (!idOk) {
    return { ok: false, error: 'Login ou e-mail não encontrado.' }
  }

  const expected = profile.password.trim() || DEFAULT_LOGIN_PASSWORD
  if (password !== expected) {
    return { ok: false, error: 'Senha incorreta.' }
  }

  writeSession({
    loggedIn: true,
    at: Date.now(),
    identifier,
  })
  return { ok: true }
}
