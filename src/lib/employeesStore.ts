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
  const updated: Employee = {
    ...all[index],
    name: input.name.trim(),
    phone: input.phone.trim(),
    username: input.username.trim(),
    level: input.level,
    active: input.active,
  }
  all[index] = updated
  writeAll(all)
  return updated
}

export function setEmployeeActive(id: string, active: boolean): Employee | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  all[index] = { ...all[index], active }
  writeAll(all)
  return all[index]
}

export function deleteEmployee(id: string) {
  writeAll(readAll().filter((item) => item.id !== id))
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
