export type ProductType = {
  id: string
  code: number
  name: string
  description: string
  createdAt: string
}

const STORAGE_KEY = 'social-express:product-types'

let cache: ProductType[] | null = null

function seedDefaults(): ProductType[] {
  return [
    {
      id: 'ptype-1',
      code: 1,
      name: 'Calça',
      description: '',
      createdAt: new Date().toISOString(),
    },
  ]
}

function normalize(item: Partial<ProductType> & { name: string }, index: number): ProductType {
  const code =
    typeof item.code === 'number' && item.code > 0
      ? item.code
      : Number.parseInt(String(item.name).match(/^(\d+)/)?.[1] ?? '', 10) || index + 1
  const name = String(item.name)
    .replace(/^\d+\s*-\s*/, '')
    .trim() || String(item.name).trim()
  return {
    id: item.id || crypto.randomUUID(),
    code,
    name,
    description: item.description || '',
    createdAt: item.createdAt || new Date().toISOString(),
  }
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
    if (!Array.isArray(parsed) || parsed.length === 0) return seedDefaults()
    return parsed.map((item, index) => normalize(item, index))
  } catch {
    return seedDefaults()
  }
}

function writeAll(items: ProductType[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  cache = null
  window.dispatchEvent(new Event('social-express:product-types-changed'))
}

export function formatProductTypeLabel(item: ProductType): string {
  return `${String(item.code).padStart(2, '0')} - ${item.name}`
}

export function formatProductTypeCode(code: number): string {
  return String(code).padStart(2, '0')
}

export function nextProductTypeCode(): number {
  const codes = readAll().map((item) => item.code)
  return codes.length === 0 ? 1 : Math.max(...codes) + 1
}

export function listProductTypes(): ProductType[] {
  if (!cache) {
    cache = readAll()
      .slice()
      .sort((a, b) => a.code - b.code || a.name.localeCompare(b.name, 'pt-BR'))
  }
  return cache
}

export function addProductType(name: string, description = ''): ProductType {
  const item: ProductType = {
    id: crypto.randomUUID(),
    code: nextProductTypeCode(),
    name: name.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), item])
  return item
}

export function updateProductType(
  id: string,
  name: string,
  description?: string,
): ProductType | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  all[index] = {
    ...all[index],
    name: name.trim(),
    description:
      description === undefined ? all[index].description : description.trim(),
  }
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
