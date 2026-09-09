import {
  buildFieldDiffs,
  logEmployeeCreated,
  logEmployeeDeleted,
  logEmployeeUpdated,
} from './historyLog'

export type EmployeeLevel = 'Master' | 'Administrador' | 'Funcionário'

export type Employee = {
  id: string
  name: string
  phone: string
  username: string
  level: EmployeeLevel
  active: boolean
  createdAt: string
}

const STORAGE_KEY = 'social-express:employees'

let cachedEmployees: Employee[] | null = null

function readAll(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Employee[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: Employee[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  cachedEmployees = null
  window.dispatchEvent(new Event('social-express:employees-changed'))
}

export function listEmployees(): Employee[] {
  if (!cachedEmployees) {
    cachedEmployees = readAll()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  return cachedEmployees
}

export function addEmployee(input: {
  name: string
  phone: string
  username: string
  level: EmployeeLevel
  active: boolean
}): Employee {
  const item: Employee = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    username: input.username.trim(),
    level: input.level,
    active: input.active,
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), item])
  logEmployeeCreated(item.name)
  return item
}

export function updateEmployee(
  id: string,
  input: {
    name: string
    phone: string
    username: string
    level: EmployeeLevel
    active: boolean
  },
): Employee | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const before = all[index]
  const updated: Employee = {
    ...before,
    name: input.name.trim(),
    phone: input.phone.trim(),
    username: input.username.trim(),
    level: input.level,
    active: input.active,
  }
  all[index] = updated
  writeAll(all)
  logEmployeeUpdated(
    updated.name,
    buildFieldDiffs(
      {
        name: before.name,
        phone: before.phone,
        username: before.username,
        level: before.level,
        active: before.active,
      },
      {
        name: updated.name,
        phone: updated.phone,
        username: updated.username,
        level: updated.level,
        active: updated.active,
      },
      {
        name: 'nome',
        phone: 'telefone',
        username: 'usuário',
        level: 'nível',
        active: 'ativo',
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
    buildFieldDiffs(
      { active: before.active },
      { active },
      { active: 'ativo' },
    ),
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
