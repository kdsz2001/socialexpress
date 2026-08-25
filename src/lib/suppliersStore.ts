export type SupplierType = 'Produto' | 'Serviço' | 'Frete' | 'Outro'

export type Supplier = {
  id: string
  name: string
  phone: string
  type: SupplierType
  createdAt: string
}

const STORAGE_KEY = 'social-express:suppliers'

let cached: Supplier[] | null = null

function readAll(): Supplier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Supplier[]
    return Array.isArray(parsed) ? parsed : []
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

export function addSupplier(input: {
  name: string
  phone: string
  type: SupplierType
}): Supplier {
  const item: Supplier = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    type: input.type,
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), item])
  return item
}

export function updateSupplier(
  id: string,
  input: { name: string; phone: string; type: SupplierType },
): Supplier | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const updated: Supplier = {
    ...all[index],
    name: input.name.trim(),
    phone: input.phone.trim(),
    type: input.type,
  }
  all[index] = updated
  writeAll(all)
  return updated
}

export function deleteSupplier(id: string) {
  writeAll(readAll().filter((item) => item.id !== id))
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
