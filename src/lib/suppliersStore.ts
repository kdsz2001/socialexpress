import {
  buildFieldDiffs,
  logSupplierCreated,
  logSupplierDeleted,
  logSupplierUpdated,
} from './historyLog'

export type SupplierType = 'Consignado' | 'Empresas'
export type SupplierGender = '' | 'f' | 'm' | 'o'
export type SupplierTransfer = '' | 'pix' | 'common'

export type SupplierPhone = {
  number: string
  principal: boolean
  whatsapp: boolean
}

export type SupplierAccount = {
  bank: string
  accountType: string
  agency: string
  account: string
  operation: string
}

export type SupplierPix = {
  keyType: string
  value: string
}

export type SupplierInput = {
  type: SupplierType
  document: string
  companyName: string
  companyFantasy: string
  ie: string
  im: string
  gender: SupplierGender
  firstName: string
  lastName: string
  niceName: string
  birthDate: string
  facebook: string
  instagram: string
  email: string
  phones: SupplierPhone[]
  cep: string
  street: string
  number: string
  extra: string
  state: string
  city: string
  district: string
  transferType: SupplierTransfer
  accounts: SupplierAccount[]
  pixKeys: SupplierPix[]
}

export type Supplier = SupplierInput & {
  id: string
  name: string
  createdAt: string
}

const STORAGE_KEY = 'social-express:suppliers'

let cached: Supplier[] | null = null

function str(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function normalizeType(value: unknown): SupplierType {
  if (value === 'Consignado' || value === 'Empresas') return value
  return 'Empresas'
}

function normalizeGender(value: unknown): SupplierGender {
  if (value === 'f' || value === 'm' || value === 'o') return value
  return ''
}

function normalizeTransfer(value: unknown): SupplierTransfer {
  if (value === 'pix' || value === 'common') return value
  return ''
}

function normalizePhones(value: unknown): SupplierPhone[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    return [
      {
        number: str(row.number),
        principal: row.principal === true,
        whatsapp: row.whatsapp === true,
      },
    ]
  })
}

function normalizeAccounts(value: unknown): SupplierAccount[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    return [
      {
        bank: str(row.bank),
        accountType: str(row.accountType),
        agency: str(row.agency),
        account: str(row.account),
        operation: str(row.operation),
      },
    ]
  })
}

function normalizePix(value: unknown): SupplierPix[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    return [{ keyType: str(row.keyType), value: str(row.value) }]
  })
}

export function supplierDisplayName(input: {
  firstName?: string
  lastName?: string
  companyName?: string
  name?: string
}) {
  const person = [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean).join(' ')
  return person || input.companyName?.trim() || input.name?.trim() || 'Fornecedor'
}

export function supplierListPhone(supplier: Supplier): SupplierPhone | null {
  const phones = supplier.phones.filter((phone) => phone.number.trim())
  return phones.find((phone) => phone.whatsapp) ?? phones.find((phone) => phone.principal) ?? phones[0] ?? null
}

function normalizeSupplier(raw: unknown): Supplier | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  if (typeof item.id !== 'string') return null
  const legacyName = str(item.name)
  if (!legacyName && typeof item.firstName !== 'string' && typeof item.companyName !== 'string') return null

  const firstName = str(item.firstName) || (item.lastName || item.companyName ? '' : legacyName)
  const input: SupplierInput = {
    type: normalizeType(item.type),
    document: str(item.document),
    companyName: str(item.companyName),
    companyFantasy: str(item.companyFantasy),
    ie: str(item.ie),
    im: str(item.im),
    gender: normalizeGender(item.gender),
    firstName,
    lastName: str(item.lastName),
    niceName: str(item.niceName),
    birthDate: str(item.birthDate),
    facebook: str(item.facebook),
    instagram: str(item.instagram),
    email: str(item.email),
    phones: normalizePhones(item.phones),
    cep: str(item.cep),
    street: str(item.street),
    number: str(item.number),
    extra: str(item.extra),
    state: str(item.state),
    city: str(item.city),
    district: str(item.district),
    transferType: normalizeTransfer(item.transferType),
    accounts: normalizeAccounts(item.accounts),
    pixKeys: normalizePix(item.pixKeys),
  }

  return {
    ...input,
    id: item.id,
    name: supplierDisplayName({ ...input, name: legacyName }),
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

function blank(value: string) {
  return value.trim()
}

function toRecord(item: Supplier): Record<string, string> {
  const phone = supplierListPhone(item)
  return {
    name: item.name,
    type: item.type,
    document: item.document,
    phone: phone?.number ?? '',
    email: item.email,
    city: item.city,
  }
}

const DIFF_LABELS = {
  name: 'nome',
  type: 'tipo',
  document: 'documento',
  phone: 'telefone',
  email: 'email',
  city: 'cidade',
}

export function listSuppliers(): Supplier[] {
  if (!cached) {
    cached = readAll()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  return cached
}

export function getSupplier(id: string): Supplier | null {
  return readAll().find((item) => item.id === id) ?? null
}

function buildSupplier(id: string, createdAt: string, input: SupplierInput): Supplier {
  const next: SupplierInput = {
    ...input,
    type: input.type,
    document: blank(input.document),
    companyName: blank(input.companyName),
    companyFantasy: blank(input.companyFantasy),
    ie: blank(input.ie),
    im: blank(input.im),
    firstName: blank(input.firstName),
    lastName: blank(input.lastName),
    niceName: blank(input.niceName),
    birthDate: blank(input.birthDate),
    facebook: blank(input.facebook),
    instagram: blank(input.instagram),
    email: blank(input.email),
    phones: input.phones.filter((phone) => phone.number.trim()),
    cep: blank(input.cep),
    street: blank(input.street),
    number: blank(input.number),
    extra: blank(input.extra),
    state: input.state,
    city: input.city,
    district: input.district,
    accounts: input.transferType === 'common' ? input.accounts : [],
    pixKeys: input.transferType === 'pix' ? input.pixKeys : [],
  }
  return {
    ...next,
    id,
    createdAt,
    name: supplierDisplayName(next),
  }
}

export function addSupplier(input: SupplierInput): Supplier {
  const item = buildSupplier(crypto.randomUUID(), new Date().toISOString(), input)
  writeAll([...readAll(), item])
  logSupplierCreated(item.name)
  return item
}

export function updateSupplier(id: string, input: SupplierInput): Supplier | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const before = all[index]
  const updated = buildSupplier(before.id, before.createdAt, input)
  all[index] = updated
  writeAll(all)
  logSupplierUpdated(updated.name, buildFieldDiffs(toRecord(before), toRecord(updated), DIFF_LABELS))
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
