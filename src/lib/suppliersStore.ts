import {
  buildFieldDiffs,
  logSupplierCreated,
  logSupplierDeleted,
  logSupplierUpdated,
} from './historyLog'

export type SupplierType = 'Consignado' | 'Empresas'

export type Supplier = {
  id: string
  name: string
  type: SupplierType
  createdAt: string
}

const STORAGE_KEY = 'social-express:suppliers'

let cached: Supplier[] | null = null

function normalizeType(value: unknown): SupplierType {
  if (value === 'Consignado' || value === 'Empresas') return value
  return 'Empresas'
}

function normalizeSupplier(raw: unknown): Supplier | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  if (typeof item.id !== 'string' || typeof item.name !== 'string') return null
  return {
    id: item.id,
    name: item.name,
    type: normalizeType(item.type),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
  }
}

function readAll(): Supplier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeSupplier).filter((item): item is Supplier => item !== null)
  } catch {
    return []
  }
}

function writeAll(items: Supplier[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  cached = null
  window.dispatchEvent(new Event('social-express:suppliers-changed'))
}

export function listSuppliers(): Supplier[] {
  if (!cached) {
    cached = readAll()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  return cached
}

export function addSupplier(input: { name: string; type: SupplierType }): Supplier {
  const item: Supplier = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    type: input.type,
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), item])
  logSupplierCreated(item.name)
  return item
}

export function updateSupplier(
  id: string,
  input: { name: string; type: SupplierType },
): Supplier | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const before = all[index]
  const updated: Supplier = {
    ...before,
    name: input.name.trim(),
    type: input.type,
  }
  all[index] = updated
  writeAll(all)
  logSupplierUpdated(
    updated.name,
    buildFieldDiffs(
      { name: before.name, type: before.type },
      { name: updated.name, type: updated.type },
      { name: 'nome', type: 'tipo' },
    ),
  )
  return updated
}

export function deleteSupplier(id: string) {
  const item = readAll().find((entry) => entry.id === id)
  writeAll(readAll().filter((entry) => entry.id !== id))
  if (item) logSupplierDeleted(item.name)
}

export function subscribeSuppliers(onChange: () => void) {
  const handler = () => {
    cached = null
    onChange()
  }
  window.addEventListener('social-express:suppliers-changed', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('social-express:suppliers-changed', handler)
    window.removeEventListener('storage', handler)
  }
}
