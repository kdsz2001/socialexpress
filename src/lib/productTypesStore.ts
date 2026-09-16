export type ProductType = {
  id: string
  name: string
  createdAt: string
}

const STORAGE_KEY = 'social-express:product-types'
const DEFAULT_TYPES = ['01 - Calça']

let cache: ProductType[] | null = null

function seedDefaults(): ProductType[] {
  const now = Date.now()
  return DEFAULT_TYPES.map((name, index) => ({
    id: `ptype-${index + 1}`,
    name,
    createdAt: new Date(now - index * 1000).toISOString(),
  }))
}

function readAll(): ProductType[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = seedDefaults()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw) as ProductType[]
    return Array.isArray(parsed) ? parsed : seedDefaults()
  } catch {
    return seedDefaults()
  }
}

function writeAll(items: ProductType[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  cache = null
  window.dispatchEvent(new Event('social-express:product-types-changed'))
}

export function listProductTypes(): ProductType[] {
  if (!cache) {
    cache = readAll()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  return cache
}

export function addProductType(name: string): ProductType {
  const item: ProductType = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), item])
  return item
}

export function updateProductType(id: string, name: string): ProductType | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  all[index] = { ...all[index], name: name.trim() }
  writeAll(all)
  return all[index]
}

export function deleteProductType(id: string) {
  writeAll(readAll().filter((item) => item.id !== id))
}

export function subscribeProductTypes(onChange: () => void) {
  const handler = () => {
    cache = null
    onChange()
  }
  window.addEventListener('social-express:product-types-changed', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('social-express:product-types-changed', handler)
    window.removeEventListener('storage', handler)
  }
}
