export type ProductAttributeKind =
  | 'cor'
  | 'estilista'
  | 'evento'
  | 'marca'
  | 'modelo'
  | 'tamanho'

export type ProductAttribute = {
  id: string
  kind: ProductAttributeKind
  name: string
  createdAt: string
}

export const ATTRIBUTE_KIND_META: Record<
  ProductAttributeKind,
  { nav: string; title: string; singular: string; createLabel: string }
> = {
  cor: {
    nav: 'Cor',
    title: 'Cores de produtos',
    singular: 'cor',
    createLabel: 'Nova cor',
  },
  estilista: {
    nav: 'Estilista',
    title: 'Estilistas',
    singular: 'estilista',
    createLabel: 'Novo estilista',
  },
  evento: {
    nav: 'Evento',
    title: 'Tipos de evento',
    singular: 'evento',
    createLabel: 'Novo evento',
  },
  marca: {
    nav: 'Marca',
    title: 'Marcas',
    singular: 'marca',
    createLabel: 'Nova marca',
  },
  modelo: {
    nav: 'Modelo',
    title: 'Modelos',
    singular: 'modelo',
    createLabel: 'Novo modelo',
  },
  tamanho: {
    nav: 'Tamanho',
    title: 'Tamanhos',
    singular: 'tamanho',
    createLabel: 'Novo tamanho',
  },
}

const STORAGE_KEY = 'social-express:product-attributes'

const DEFAULT_COLORS = [
  'Areia',
  'Azul',
  'Azul Claro',
  'Azul Marinho',
  'Azul Monaco',
  'Azul Piscina',
  'Azul Royal',
  'Azul Turquesa',
  'Bege',
  'Bordô',
  'Branco',
  'Cinza',
  'Dourado',
  'Marrom',
  'Off White',
  'Preto',
  'Rosa',
  'Verde',
  'Vermelho',
  'Vinho',
]

let cache: ProductAttribute[] | null = null

function seedDefaults(): ProductAttribute[] {
  const now = Date.now()
  return DEFAULT_COLORS.map((name, index) => ({
    id: `attr-cor-${index + 1}`,
    kind: 'cor' as const,
    name,
    createdAt: new Date(now - index * 1000).toISOString(),
  }))
}

function readAll(): ProductAttribute[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = seedDefaults()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw) as ProductAttribute[]
    return Array.isArray(parsed) ? parsed : seedDefaults()
  } catch {
    return seedDefaults()
  }
}

function writeAll(items: ProductAttribute[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  cache = null
  window.dispatchEvent(new Event('social-express:product-attributes-changed'))
}

export function listProductAttributes(kind?: ProductAttributeKind): ProductAttribute[] {
  if (!cache) cache = readAll()
  const list = kind ? cache.filter((item) => item.kind === kind) : cache
  return list.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function addProductAttribute(kind: ProductAttributeKind, name: string): ProductAttribute {
  const item: ProductAttribute = {
    id: crypto.randomUUID(),
    kind,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), item])
  return item
}

export function updateProductAttribute(id: string, name: string): ProductAttribute | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  all[index] = { ...all[index], name: name.trim() }
  writeAll(all)
  return all[index]
}

export function deleteProductAttribute(id: string) {
  writeAll(readAll().filter((item) => item.id !== id))
}

export function subscribeProductAttributes(onChange: () => void) {
  const handler = () => {
    cache = null
    onChange()
  }
  window.addEventListener('social-express:product-attributes-changed', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('social-express:product-attributes-changed', handler)
    window.removeEventListener('storage', handler)
  }
}
