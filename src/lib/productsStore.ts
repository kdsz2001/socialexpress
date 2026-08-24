export type ProductStatus = 'ativo' | 'inativo'

export type Product = {
  id: string
  name: string
  type: string
  rental: string
  attributes: string
  status: ProductStatus
  createdAt: string
}

const STORAGE_KEY = 'social-express:products'

let cachedProducts: Product[] | null = null

function readAll(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Product[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  cachedProducts = null
  window.dispatchEvent(new Event('social-express:products-changed'))
}

export function listProducts(): Product[] {
  if (!cachedProducts) {
    cachedProducts = readAll()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  return cachedProducts
}

export function countActiveProducts(): number {
  return listProducts().filter((item) => item.status === 'ativo').length
}

export function addProduct(input: {
  name: string
  type: string
  rental: string
  attributes: string
  status: ProductStatus
}): Product {
  const item: Product = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    type: input.type.trim(),
    rental: input.rental.trim(),
    attributes: input.attributes.trim(),
    status: input.status,
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), item])
  return item
}

export function updateProduct(
  id: string,
  input: {
    name: string
    type: string
    rental: string
    attributes: string
    status: ProductStatus
  },
): Product | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const updated: Product = {
    ...all[index],
    name: input.name.trim(),
    type: input.type.trim(),
    rental: input.rental.trim(),
    attributes: input.attributes.trim(),
    status: input.status,
  }
  all[index] = updated
  writeAll(all)
  return updated
}

export function deleteProduct(id: string) {
  writeAll(readAll().filter((item) => item.id !== id))
}

export function subscribeProducts(onChange: () => void) {
  const handler = () => {
    cachedProducts = null
    onChange()
  }
  window.addEventListener('social-express:products-changed', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('social-express:products-changed', handler)
    window.removeEventListener('storage', handler)
  }
}
