import {
  buildFieldDiffs,
  logEmployeeCreated,
  logEmployeeDeleted,
  logEmployeeUpdated,
} from './historyLog'

export const EMPLOYEE_UNITS = [
  'Canoas',
  'Zona Sul',
  'Moinhos de Vento',
  'Caxias do Sul',
  'Joinville/SC',
  'Pinheiros/SP',
  'São José',
] as const

export type EmployeeUnit = (typeof EMPLOYEE_UNITS)[number]

export type EmployeeGender = '' | 'feminino' | 'masculino' | 'outros'

export type EmployeePhone = {
  number: string
  principal: boolean
  whatsapp: boolean
}

export type Employee = {
  id: string
  name: string
  firstName: string
  lastName: string
  nickname: string
  phone: string
  phones: EmployeePhone[]
  username: string
  password: string
  email: string
  cpf: string
  birthDate: string
  gender: EmployeeGender
  level: string
  unit: string
  active: boolean
  avatarDataUrl: string
  createdAt: string
}

export type EmployeeInput = {
  firstName: string
  lastName: string
  nickname: string
  phones: EmployeePhone[]
  username: string
  password: string
  email: string
  cpf: string
  birthDate: string
  gender: EmployeeGender
  level: string
  unit: string
  active: boolean
  avatarDataUrl: string
}

const STORAGE_KEY = 'social-express:employees'

let cachedEmployees: Employee[] | null = null

function displayName(firstName: string, lastName: string, fallback = '') {
  const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
  return name || fallback.trim()
}

function primaryPhone(phones: EmployeePhone[]) {
  const marked = phones.find((item) => item.principal && item.number.trim())
  if (marked) return marked.number.trim()
  return phones.find((item) => item.number.trim())?.number.trim() || ''
}

function normalizePhone(raw: unknown): EmployeePhone {
  const item = raw && typeof raw === 'object' ? (raw as Partial<EmployeePhone>) : {}
  return {
    number: String(item.number || ''),
    principal: Boolean(item.principal),
    whatsapp: Boolean(item.whatsapp),
  }
}

function normalize(raw: Partial<Employee> & { name?: string }): Employee {
  const legacyName = String(raw.name || '')
  const firstName = String(raw.firstName || legacyName)
  const lastName = String(raw.lastName || '')
  const phones = Array.isArray(raw.phones) && raw.phones.length > 0
    ? raw.phones.map(normalizePhone)
    : [{ number: String(raw.phone || ''), principal: false, whatsapp: false }]
  const gender = raw.gender === 'feminino' || raw.gender === 'masculino' || raw.gender === 'outros'
    ? raw.gender
    : ''
  return {
    id: String(raw.id || crypto.randomUUID()),
    firstName,
    lastName,
    name: displayName(firstName, lastName, legacyName),
    nickname: String(raw.nickname || ''),
    phones,
    phone: primaryPhone(phones),
    username: String(raw.username || ''),
    password: String(raw.password || ''),
    email: String(raw.email || ''),
    cpf: String(raw.cpf || ''),
    birthDate: String(raw.birthDate || ''),
    gender,
    level: String(raw.level || ''),
    unit: String(raw.unit || ''),
    active: raw.active !== false,
    avatarDataUrl: String(raw.avatarDataUrl || ''),
    createdAt: String(raw.createdAt || new Date().toISOString()),
  }
}

function readAll(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<Employee>[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => normalize(item))
  } catch {
    return []
  }
}

function writeAll(items: Employee[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  cachedEmployees = null
  window.dispatchEvent(new Event('social-express:employees-changed'))
}

function toStored(input: EmployeeInput, base?: Employee): Employee {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const phones = input.phones.map(normalizePhone)
  return {
    id: base?.id || crypto.randomUUID(),
    firstName,
    lastName,
    name: displayName(firstName, lastName),
    nickname: input.nickname.trim(),
    phones,
    phone: primaryPhone(phones),
    username: input.username.trim(),
    password: input.password,
    email: input.email.trim(),
    cpf: input.cpf.trim(),
    birthDate: input.birthDate.trim(),
    gender: input.gender,
    level: input.level,
    unit: input.unit,
    active: input.active,
    avatarDataUrl: input.avatarDataUrl,
    createdAt: base?.createdAt || new Date().toISOString(),
  }
}

export function listEmployees(): Employee[] {
  if (!cachedEmployees) {
    cachedEmployees = readAll()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  return cachedEmployees
}

export function getEmployee(id: string) {
  return readAll().find((item) => item.id === id) ?? null
}

export function findEmployeeForLogin(identifierRaw: string) {
  const typed = identifierRaw.trim().toLocaleLowerCase('pt-BR')
  if (!typed) return null
  return (
    readAll().find((item) => {
      const login = item.username.trim().toLocaleLowerCase('pt-BR')
      const email = item.email.trim().toLocaleLowerCase('pt-BR')
      return typed === login || (email && typed === email)
    }) ?? null
  )
}

export function addEmployee(input: EmployeeInput): Employee {
  const item = toStored(input)
  writeAll([...readAll(), item])
  logEmployeeCreated(item.name)
  return item
}

export function updateEmployee(id: string, input: EmployeeInput): Employee | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const before = all[index]
  const updated = toStored(input, before)
  all[index] = updated
  writeAll(all)
  logEmployeeUpdated(
    updated.name,
    buildFieldDiffs(
      {
        name: before.name,
        phone: before.phone,
        username: before.username,
        email: before.email,
        level: before.level,
        unit: before.unit,
        active: before.active,
        password: before.password ? 'definida' : '',
      },
      {
        name: updated.name,
        phone: updated.phone,
        username: updated.username,
        email: updated.email,
        level: updated.level,
        unit: updated.unit,
        active: updated.active,
        password: updated.password ? 'definida' : '',
      },
      {
        name: 'nome',
        phone: 'telefone',
        username: 'login',
        email: 'e-mail',
        level: 'nível',
        unit: 'unidade',
        active: 'ativo',
        password: 'senha',
      },
    ),
  )
  return updated
}

export function setEmployeeActive(id: string, active: boolean): Employee | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const before = all[index]
  all[index] = { ...before, active }
  writeAll(all)
  logEmployeeUpdated(
    before.name,
    buildFieldDiffs({ active: before.active }, { active }, { active: 'ativo' }),
  )
  return all[index]
}

export function deleteEmployee(id: string) {
  const item = readAll().find((entry) => entry.id === id)
  writeAll(readAll().filter((entry) => entry.id !== id))
  if (item) logEmployeeDeleted(item.name)
}

export function subscribeEmployees(onChange: () => void) {
  const handler = () => {
    cachedEmployees = null
    onChange()
  }
  window.addEventListener('social-express:employees-changed', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('social-express:employees-changed', handler)
    window.removeEventListener('storage', handler)
  }
}
