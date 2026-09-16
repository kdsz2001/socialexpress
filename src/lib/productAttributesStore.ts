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
  {
    nav: string
    title: string
    singular: string
    createLabel: string
    fieldLabel: string
    createModalTitle: string
    updateModalTitle: string
    deleteTitle: string
    deleteMessage: string
    toastCreated: string
    toastUpdated: string
  }
> = {
  cor: {
    nav: 'Cor',
    title: 'Cores de produtos',
    singular: 'cor',
    createLabel: 'Nova cor',
    fieldLabel: 'Cor',
    createModalTitle: 'Cadastrar nova cor de produto',
    updateModalTitle: 'Atualizando cor',
    deleteTitle: 'Excluir cor',
    deleteMessage:
      'Você está prestes a excluir uma cor. Os produtos com esse atributo não serão alterados.',
    toastCreated: 'Nova Cor cadastrada.',
    toastUpdated: 'Cor atualizada.',
  },
  estilista: {
    nav: 'Estilista',
    title: 'Estilistas',
    singular: 'estilista',
    createLabel: 'Novo estilista',
    fieldLabel: 'Estilista',
    createModalTitle: 'Cadastrar novo estilista',
    updateModalTitle: 'Atualizando estilista',
    deleteTitle: 'Excluir estilista',
    deleteMessage:
      'Você está prestes a excluir um estilista. Os produtos com esse atributo não serão alterados.',
    toastCreated: 'Novo Estilista cadastrado.',
    toastUpdated: 'Estilista atualizado.',
  },
  evento: {
    nav: 'Evento',
    title: 'Tipos de evento',
    singular: 'evento',
    createLabel: 'Novo evento',
    fieldLabel: 'Evento',
    createModalTitle: 'Cadastrar novo tipo de evento',
    updateModalTitle: 'Atualizando evento',
    deleteTitle: 'Excluir evento',
    deleteMessage:
      'Você está prestes a excluir um evento. Os produtos com esse atributo não serão alterados.',
    toastCreated: 'Novo Evento cadastrado.',
    toastUpdated: 'Evento atualizado.',
  },
  marca: {
    nav: 'Marca',
    title: 'Marcas',
    singular: 'marca',
    createLabel: 'Nova marca',
    fieldLabel: 'Marca',
    createModalTitle: 'Cadastrar nova marca',
    updateModalTitle: 'Atualizando marca',
    deleteTitle: 'Excluir marca',
    deleteMessage:
      'Você está prestes a excluir uma marca. Os produtos com esse atributo não serão alterados.',
    toastCreated: 'Nova Marca cadastrada.',
    toastUpdated: 'Marca atualizada.',
  },
  modelo: {
    nav: 'Modelo',
    title: 'Modelos de produtos',
    singular: 'modelo',
    createLabel: 'Novo modelo',
    fieldLabel: 'Modelo',
    createModalTitle: 'Cadastrar novo modelo de produto',
    updateModalTitle: 'Atualizando modelo',
    deleteTitle: 'Excluir modelo',
    deleteMessage:
      'Você está prestes a excluir um modelo. Os produtos com esse atributo não serão alterados.',
    toastCreated: 'Novo Modelo cadastrado.',
    toastUpdated: 'Modelo atualizado.',
  },
  tamanho: {
    nav: 'Tamanho',
    title: 'Tamanhos',
    singular: 'tamanho',
    createLabel: 'Novo tamanho',
    fieldLabel: 'Tamanho',
    createModalTitle: 'Cadastrar novo tamanho',
    updateModalTitle: 'Atualizando tamanho',
    deleteTitle: 'Excluir tamanho',
    deleteMessage:
      'Você está prestes a excluir um tamanho. Os produtos com esse atributo não serão alterados.',
    toastCreated: 'Novo Tamanho cadastrado.',
    toastUpdated: 'Tamanho atualizado.',
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
  'Bronze',
  'Champanhe',
  'Chumbo',
  'Cinza',
  'Cinza Prateado',
  'Cobre',
  'Coral',
  'Dourado',
  'Estampado',
  'Fúcsia',
  'Goiaba',
  'Grafite',
  'Hortência',
  'Laranja',
  'Lilás',
  'Magenta',
  'Marrom',
  'Marsala',
  'Nude',
  'Off White',
  'Preto',
  'Rosa',
  'Verde',
  'Vermelho',
  'Vinho',
]

/** Tamanhos padrão do Clarial (conta iarak). */
const DEFAULT_SIZES = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '10',
  '12',
  '14',
  '16',
  '18',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '48',
  '50',
  '52',
  '54',
  '56',
  '58',
  '60',
  '62',
  '64',
  '66',
  '68',
  '70',
  '72',
  '74',
  '100',
  '222',
  '65 cm',
  'PP',
  'P',
  'M',
  'G',
  'GG',
  'XG',
  'S',
  'XL',
  'XXL',
  'Único',
]

let cache: ProductAttribute[] | null = null

function makeSeeded(
  kind: ProductAttributeKind,
  names: string[],
  idPrefix: string,
  baseTime: number,
): ProductAttribute[] {
  return names.map((name, index) => ({
    id: `${idPrefix}-${index + 1}`,
    kind,
    name,
    createdAt: new Date(baseTime - index * 1000).toISOString(),
  }))
}

function seedDefaults(): ProductAttribute[] {
  const now = Date.now()
  return [
    ...makeSeeded('cor', DEFAULT_COLORS, 'attr-cor', now),
    ...makeSeeded('tamanho', DEFAULT_SIZES, 'attr-tamanho', now - 100_000),
  ]
}

/** Garante tamanhos padrão mesmo em bases antigas que só tinham cores. */
function ensureDefaultSizes(items: ProductAttribute[]): ProductAttribute[] {
  if (items.some((item) => item.kind === 'tamanho')) return items
  const now = Date.now()
  return [...items, ...makeSeeded('tamanho', DEFAULT_SIZES, 'attr-tamanho', now)]
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
    if (!Array.isArray(parsed)) {
      const seeded = seedDefaults()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const withSizes = ensureDefaultSizes(parsed)
    if (withSizes !== parsed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withSizes))
    }
    return withSizes
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
