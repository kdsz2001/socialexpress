import {
  buildFieldDiffs,
  logEmployeeCreated,
  logEmployeeDeleted,
  logEmployeeUpdated,
} from './historyLog'
import { getUserProfile, updateUserProfile } from './userProfileStore'

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

export const MASTER_EMPLOYEE_ID = 'emp-master'

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

function readStored(): Employee[] {
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

function buildMaster(stored?: Employee): Employee {
  const profile = getUserProfile()
  const phones = profile.phones.map((phone) => ({
    number: phone.number,
    principal: phone.primary,
    whatsapp: phone.whatsapp,
  }))
  const firstName = profile.nome.trim()
  const lastName = profile.sobrenomes.trim()
  return {
    id: MASTER_EMPLOYEE_ID,
    firstName,
    lastName,
    name: displayName(firstName, lastName, profile.chamado),
    nickname: profile.chamado.trim(),
    phones: phones.length > 0 ? phones : [{ number: '', principal: false, whatsapp: false }],
    phone: primaryPhone(phones),
    username: profile.login.trim(),
    password: profile.password,
    email: profile.email.trim(),
    cpf: profile.cpf.trim(),
    birthDate: profile.birthDate.trim(),
    gender: stored?.gender ?? '',
    level: 'Master',
    unit: stored?.unit || '',
    active: stored ? stored.active : true,
    avatarDataUrl: profile.avatarDataUrl,
    createdAt: stored?.createdAt || '2020-01-01T00:00:00.000Z',
  }
}

function withMaster(items: Employee[]): Employee[] {
  const login = getUserProfile().login.trim().toLocaleLowerCase('pt-BR')
  const stored = items.find((item) => item.id === MASTER_EMPLOYEE_ID)
  const others = items.filter((item) => item.id !== MASTER_EMPLOYEE_ID)
  if (
    !stored &&
    login &&
    others.some((item) => item.username.trim().toLocaleLowerCase('pt-BR') === login)
  ) {
    return others
  }
  return [buildMaster(stored), ...others]
}

function readAll(): Employee[] {
  return withMaster(readStored())
}

function syncMasterProfile(employee: Employee) {
  if (employee.id !== MASTER_EMPLOYEE_ID) return
  updateUserProfile({
    nome: employee.firstName,
    sobrenomes: employee.lastName,
    chamado: employee.nickname,
    email: employee.email,
    cpf: employee.cpf,
    birthDate: employee.birthDate,
    login: employee.username,
    password: employee.password,
    phones: employee.phones.map((phone) => ({
      number: phone.number,
      primary: phone.principal,
      whatsapp: phone.whatsapp,
    })),
    avatarDataUrl: employee.avatarDataUrl,
  })
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
  syncMasterProfile(updated)
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
