import {
  buildFieldDiffs,
  logProductCreated,
  logProductDeleted,
  logProductUpdated,
} from './historyLog'
import { getUserProfile } from './userProfileStore'

export type ProductStatus = 'ativo' | 'inativo'

export type Product = {
  id: string
  name: string
  type: string
  rental: string
  attributes: string
  status: ProductStatus
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  fullCode: string
  storeCode: string
  quantity: string
  color: string
  size: string
  model: string
  brand: string
  stylist: string
  eventType: string
  cost: string
  firstRental: string
  salePrice: string
  ncm: string
  cfop: string
  cfopInter: string
  commission: string
  description: string
  consigned: string
  consignedCommission: string
  serviceFee: string
  productState: string
  photoName: string
  photoDataUrl: string
}

export type ProductInput = {
  name: string
  type: string
  rental: string
  attributes?: string
  status?: ProductStatus
  fullCode?: string
  storeCode?: string
  quantity?: string
  color?: string
  size?: string
  model?: string
  brand?: string
  stylist?: string
  eventType?: string
  cost?: string
  firstRental?: string
  salePrice?: string
  ncm?: string
  cfop?: string
  cfopInter?: string
  commission?: string
  description?: string
  consigned?: string
  consignedCommission?: string
  serviceFee?: string
  productState?: string
  photoName?: string
  photoDataUrl?: string
}

const STORAGE_KEY = 'social-express:products'

let cachedProducts: Product[] | null = null

function actorName() {
  const profile = getUserProfile()
  return (profile.chamado || profile.nome || profile.login || 'Usuário').trim()
}

export function buildAttributeSummary(parts: {
  color?: string
  size?: string
  model?: string
  brand?: string
  stylist?: string
  eventType?: string
}) {
  return [parts.color, parts.size, parts.model, parts.brand, parts.stylist, parts.eventType]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ')
}

export function productAttributeChips(item: Product): { label: string; value: string }[] {
  const chips: { label: string; value: string }[] = []
  if (item.color.trim()) chips.push({ label: 'Cor', value: item.color.trim() })
  if (item.size.trim()) chips.push({ label: 'Tamanho', value: item.size.trim() })
  if (item.model.trim()) chips.push({ label: 'Modelo', value: item.model.trim() })
  if (item.brand.trim()) chips.push({ label: 'Marca', value: item.brand.trim() })
  if (item.stylist.trim()) chips.push({ label: 'Estilista', value: item.stylist.trim() })
  if (item.eventType.trim()) chips.push({ label: 'Evento', value: item.eventType.trim() })

  if (chips.length > 0) return chips

  const raw = item.attributes.trim()
  if (!raw) return []
  return raw.split(',').map((part) => part.trim()).filter(Boolean).map((value) => ({
    label: '',
    value,
  }))
}

export function formatProductCodes(item: Product) {
  const full = item.fullCode.trim()
  const store = item.storeCode.trim()
  if (full && store) return `${full} | ${store}`
  return full || store || ''
}

function nextSequentialCode(existing: Product[]) {
  let max = 20000
  for (const item of existing) {
    const digits = item.fullCode.replace(/\D/g, '')
    if (!digits) continue
    const n = Number(digits)
    if (Number.isFinite(n) && n > max) max = n
  }
  return String(max + 1).padStart(6, '0')
}

function normalizeProduct(raw: Partial<Product> & { id?: string }): Product | null {
  if (!raw || typeof raw.id !== 'string' || !raw.id) return null
  const createdAt =
    typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : new Date().toISOString()
  const updatedAt =
    typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : createdAt
  const color = String(raw.color || '').trim()
  const size = String(raw.size || '').trim()
  const model = String(raw.model || '').trim()
  const brand = String(raw.brand || '').trim()
  const stylist = String(raw.stylist || '').trim()
  const eventType = String(raw.eventType || '').trim()
  const attributes =
    String(raw.attributes || '').trim() ||
    buildAttributeSummary({ color, size, model, brand, stylist, eventType })

  return {
    id: raw.id,
    name: String(raw.name || '').trim(),
    type: String(raw.type || '').trim(),
    rental: String(raw.rental || '').trim(),
    attributes,
    status: raw.status === 'inativo' ? 'inativo' : 'ativo',
    createdAt,
    updatedAt,
    createdBy: String(raw.createdBy || '').trim() || 'Usuário',
    updatedBy: String(raw.updatedBy || '').trim() || String(raw.createdBy || '').trim() || 'Usuário',
    fullCode: String(raw.fullCode || '').trim(),
    storeCode: String(raw.storeCode || '').trim(),
    quantity: String(raw.quantity || '1').trim() || '1',
    color,
    size,
    model,
    brand,
    stylist,
    eventType,
    cost: String(raw.cost || '').trim(),
    firstRental: String(raw.firstRental || '').trim(),
    salePrice: String(raw.salePrice || '').trim(),
    ncm: String(raw.ncm || '').trim(),
    cfop: String(raw.cfop || '').trim(),
    cfopInter: String(raw.cfopInter || '').trim(),
    commission: String(raw.commission || '').trim(),
    description: String(raw.description || '').trim(),
    consigned: String(raw.consigned || '').trim(),
    consignedCommission: String(raw.consignedCommission || '').trim(),
    serviceFee: String(raw.serviceFee || '').trim(),
    productState: String(raw.productState || '').trim(),
    photoName: String(raw.photoName || '').trim(),
    photoDataUrl: String(raw.photoDataUrl || '').trim(),
  }
}

function readAll(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => normalizeProduct(item as Partial<Product>))
      .filter((item): item is Product => Boolean(item))
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

export function getProduct(id: string): Product | null {
  return listProducts().find((item) => item.id === id) ?? null
}

export function countActiveProducts(): number {
  return listProducts().filter((item) => item.status === 'ativo').length
}

function fromInput(input: ProductInput, base?: Product): Omit<Product, 'id' | 'createdAt' | 'createdBy'> {
  const color = String(input.color ?? base?.color ?? '').trim()
  const size = String(input.size ?? base?.size ?? '').trim()
  const model = String(input.model ?? base?.model ?? '').trim()
  const brand = String(input.brand ?? base?.brand ?? '').trim()
  const stylist = String(input.stylist ?? base?.stylist ?? '').trim()
  const eventType = String(input.eventType ?? base?.eventType ?? '').trim()
  const attributes =
    String(input.attributes ?? '').trim() ||
    buildAttributeSummary({ color, size, model, brand, stylist, eventType })

  return {
    name: input.name.trim(),
    type: input.type.trim(),
    rental: input.rental.trim(),
    attributes,
    status: input.status ?? base?.status ?? 'ativo',
    updatedAt: new Date().toISOString(),
    updatedBy: actorName(),
    fullCode: String(input.fullCode ?? base?.fullCode ?? '').trim(),
    storeCode: String(input.storeCode ?? base?.storeCode ?? '').trim(),
    quantity: String(input.quantity ?? base?.quantity ?? '1').trim() || '1',
    color,
    size,
    model,
    brand,
    stylist,
    eventType,
    cost: String(input.cost ?? base?.cost ?? '').trim(),
    firstRental: String(input.firstRental ?? base?.firstRental ?? '').trim(),
    salePrice: String(input.salePrice ?? base?.salePrice ?? '').trim(),
    ncm: String(input.ncm ?? base?.ncm ?? '').trim(),
    cfop: String(input.cfop ?? base?.cfop ?? '').trim(),
    cfopInter: String(input.cfopInter ?? base?.cfopInter ?? '').trim(),
    commission: String(input.commission ?? base?.commission ?? '').trim(),
    description: String(input.description ?? base?.description ?? '').trim(),
    consigned: String(input.consigned ?? base?.consigned ?? '').trim(),
    consignedCommission: String(input.consignedCommission ?? base?.consignedCommission ?? '').trim(),
    serviceFee: String(input.serviceFee ?? base?.serviceFee ?? '').trim(),
    productState: String(input.productState ?? base?.productState ?? '').trim(),
    photoName: String(input.photoName ?? base?.photoName ?? '').trim(),
    photoDataUrl: String(input.photoDataUrl ?? base?.photoDataUrl ?? '').trim(),
  }
}

export function addProduct(input: ProductInput): Product {
  const existing = readAll()
  const now = new Date().toISOString()
  const who = actorName()
  const fields = fromInput(input)
  const item: Product = {
    id: crypto.randomUUID(),
    ...fields,
    fullCode: fields.fullCode || nextSequentialCode(existing),
    createdAt: now,
    updatedAt: now,
    createdBy: who,
    updatedBy: who,
  }
  writeAll([...existing, item])
  logProductCreated(item.name)
  return item
}

export function updateProduct(id: string, input: ProductInput): Product | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const before = all[index]
  const fields = fromInput(input, before)
  const updated: Product = {
    ...before,
    ...fields,
    // Código completo não muda após cadastro
    fullCode: before.fullCode || fields.fullCode,
    createdAt: before.createdAt,
    createdBy: before.createdBy,
  }
  all[index] = updated
  writeAll(all)
  logProductUpdated(
    updated.name,
    buildFieldDiffs(
      {
        name: before.name,
        type: before.type,
        rental: before.rental,
        attributes: before.attributes,
        status: before.status,
        storeCode: before.storeCode,
      },
      {
        name: updated.name,
        type: updated.type,
        rental: updated.rental,
        attributes: updated.attributes,
        status: updated.status,
        storeCode: updated.storeCode,
      },
      {
        name: 'nome',
        type: 'tipo',
        rental: 'aluguel',
        attributes: 'atributos',
        status: 'status',
        storeCode: 'código loja',
      },
    ),
  )
  return updated
}

export function deleteProduct(id: string) {
  const item = readAll().find((entry) => entry.id === id)
  writeAll(readAll().filter((entry) => entry.id !== id))
  if (item) logProductDeleted(item.name)
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

export function formatProductRegisteredMeta(item: Product) {
  const created = formatLongPtDate(item.createdAt)
  const relative = formatRelativePt(item.updatedAt)
  return `Produto cadastrado em ${created} por ${item.createdBy}. Atualizado última vez ${relative} por ${item.updatedBy}.`
}

function formatLongPtDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatRelativePt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'há pouco'
  const diffMs = Date.now() - date.getTime()
  const mins = Math.max(0, Math.round(diffMs / 60000))
  if (mins < 1) return 'agora'
  if (mins === 1) return 'há 1 minuto'
  if (mins < 60) return `há ${mins} minutos`
  const hours = Math.round(mins / 60)
  if (hours === 1) return 'há 1 hora'
  if (hours < 24) return `há ${hours} horas`
  const days = Math.round(hours / 24)
  if (days === 1) return 'há 1 dia'
  return `há ${days} dias`
}
