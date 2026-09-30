/** Sessão local do dashboard Social Express (login/senha do perfil). */

import { findEmployeeForLogin, MASTER_EMPLOYEE_ID } from './employeesStore'
import { getUserProfile } from './userProfileStore'

const STORAGE_KEY = 'social-express:auth-session'
const CHANGE_EVENT = 'social-express:auth-changed'
/** Senha padrão do login djamesz. */
export const DEFAULT_LOGIN_PASSWORD = 'Adsl500b@'

export type AuthSession = {
  loggedIn: boolean
  at: number
  identifier: string
  unit: string
  employeeId?: string
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
      unit: typeof parsed.unit === 'string' ? parsed.unit : '',
      employeeId: typeof parsed.employeeId === 'string' ? parsed.employeeId : undefined,
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

export function attemptLogin(
  identifierRaw: string,
  passwordRaw: string,
  unitRaw: string,
): LoginResult {
  const identifier = String(identifierRaw || '').trim()
  const password = String(passwordRaw || '')
  const unit = String(unitRaw || '').trim()
  if (!unit) {
    return { ok: false, error: 'Selecione a unidade.' }
  }
  if (!identifier || !password) {
    return { ok: false, error: 'Informe login (ou e-mail) e senha.' }
  }

  const employee = findEmployeeForLogin(identifier)
  if (employee) {
    if (!employee.active) {
      return { ok: false, error: 'Este funcionário está inativo.' }
    }
    const masterPassword = employee.password.trim() || DEFAULT_LOGIN_PASSWORD
    const expected = employee.id === MASTER_EMPLOYEE_ID ? masterPassword : employee.password
    if (password !== expected) {
      return { ok: false, error: 'Senha incorreta.' }
    }
    if (
      employee.id !== MASTER_EMPLOYEE_ID &&
      employee.unit !== 'Todas' &&
      employee.unit !== unit
    ) {
      return { ok: false, error: 'A unidade selecionada não é a deste funcionário.' }
    }
    writeSession({
      loggedIn: true,
      at: Date.now(),
      identifier,
      unit,
      employeeId: employee.id,
    })
    return { ok: true }
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
    unit,
  })
  return { ok: true }
}
