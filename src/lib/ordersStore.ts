import {
  buildFieldDiffs,
  logOrderCreated,
  logOrderDeleted,
  logOrderUpdated,
} from './historyLog'
import { formatHistoryDate } from './historyStore'

export type OrderStatus =
  | 'Aberto'
  | 'Confirmado'
  | 'Concluído'
  | 'Anulado'
  | 'Cancelado'
  | 'Adiado'
  | 'Perdido'
  | 'Orçamento'
export type OrderOperation = 'Aluguel' | 'Venda'
export type OrderKind = 'Pedido' | 'Orçamento'
export type OrderLineStatus = 'Aguardando prova' | 'Aguardando retirada' | 'Retirado' | 'Devolvido'

export type OrderLine = {
  id?: string
  productId: string
  name: string
  fullCode: string
  value: number
  size?: string
  status?: OrderLineStatus
  adjustment?: number
}

export type OrderPayment = {
  id: string
  method: string
  amount: number
  date: string
}

export type OrderInstallment = {
  id: string
  number: number
  dueDate: string
  amount: number
}

export type Order = {
  id: string
  number: number
  clientId?: string
  clientName: string
  phone: string
  eventDate: string // YYYY-MM-DD
  total: string
  status: OrderStatus
  operation: OrderOperation
  createdAt: string
  kind?: OrderKind
  origin?: string
  attendant?: string
  lines?: OrderLine[]
  proofDate?: string
  pickupDate?: string
  returnDate?: string
  discount?: number
  orderNotes?: string
  suitNotes?: string
  payments?: OrderPayment[]
  installments?: OrderInstallment[]
}

const STORAGE_KEY = 'social-express:orders'

let cachedOrders: Order[] | null = null

function readAll(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<Partial<Order> & { notes?: string; fittingDate?: string }>
    return Array.isArray(parsed) ? parsed.map((item) => normalizeOrder(item)) : []
  } catch {
    return []
  }
}

function normalizeOrder(raw: Partial<Order> & { notes?: string; fittingDate?: string }): Order {
  const lines = Array.isArray(raw.lines)
    ? raw.lines.map((line) => {
        const legacy = line as OrderLine & { code?: string; price?: number }
        const value = Number.isFinite(Number(legacy.value)) ? Number(legacy.value) : Number(legacy.price) || 0
        return {
          ...legacy,
          fullCode: String(legacy.fullCode || legacy.code || ''),
          value,
        }
      })
    : undefined
  return {
    id: String(raw.id || ''),
    number: Number(raw.number) || 0,
    clientId: raw.clientId,
    clientName: String(raw.clientName || ''),
    phone: String(raw.phone || ''),
    eventDate: String(raw.eventDate || ''),
    total: String(raw.total || ''),
    status: raw.status || 'Aberto',
    operation: raw.operation === 'Venda' ? 'Venda' : 'Aluguel',
    createdAt: String(raw.createdAt || ''),
    kind: raw.kind,
    origin: raw.origin,
    attendant: raw.attendant,
    lines,
    proofDate: raw.proofDate || raw.fittingDate,
    pickupDate: raw.pickupDate,
    returnDate: raw.returnDate,
    discount: Number(raw.discount) || 0,
    orderNotes: raw.orderNotes || raw.notes || '',
    suitNotes: raw.suitNotes || '',
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    installments: Array.isArray(raw.installments) ? raw.installments : [],
  }
}

function writeAll(items: Order[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  cachedOrders = null
  window.dispatchEvent(new Event('social-express:orders-changed'))
}

function nextNumber(items: Order[]): number {
  if (items.length === 0) return 1
  return Math.max(...items.map((item) => item.number)) + 1
}

export function listOrders(): Order[] {
  if (!cachedOrders) {
    cachedOrders = readAll()
      .slice()
      .sort((a, b) => b.number - a.number)
  }
  return cachedOrders
}

function normalizeLines(lines: OrderLine[] | undefined): OrderLine[] | undefined {
  if (!lines?.length) return undefined
  const normalized = lines
    .map((line) => ({
      id: line.id || crypto.randomUUID(),
      productId: String(line.productId || '').trim(),
      name: String(line.name || '').trim(),
      fullCode: String(line.fullCode || '').trim(),
      value: Number.isFinite(Number(line.value)) ? Number(line.value) : 0,
      size: line.size?.trim() || undefined,
      status: line.status || 'Aguardando prova',
      adjustment: Number.isFinite(Number(line.adjustment)) ? Number(line.adjustment) : 0,
    }))
    .filter((line) => line.productId || line.name || line.fullCode)
  return normalized.length > 0 ? normalized : undefined
}

export function addOrder(input: {
  clientId?: string
  clientName: string
  phone: string
  eventDate: string
  total: string
  status: OrderStatus
  operation: OrderOperation
  kind?: OrderKind
  origin?: string
  attendant?: string
  lines?: OrderLine[]
  proofDate?: string
  pickupDate?: string
  returnDate?: string
  discount?: number
  orderNotes?: string
  suitNotes?: string
  payments?: OrderPayment[]
}): Order {
  const all = readAll()
  const item: Order = {
    id: crypto.randomUUID(),
    number: nextNumber(all),
    clientId: input.clientId?.trim() || undefined,
    clientName: input.clientName.trim(),
    phone: input.phone.trim(),
    eventDate: input.eventDate,
    total: input.total.trim(),
    status: input.status,
    operation: input.operation,
    createdAt: new Date().toISOString(),
    kind: input.kind,
    origin: input.origin?.trim() || undefined,
    attendant: input.attendant?.trim() || undefined,
    lines: normalizeLines(input.lines),
    proofDate: input.proofDate || undefined,
    pickupDate: input.pickupDate || undefined,
    returnDate: input.returnDate || undefined,
    discount: Number.isFinite(Number(input.discount)) ? Number(input.discount) : 0,
    orderNotes: input.orderNotes || '',
    suitNotes: input.suitNotes || '',
    payments: input.payments || [],
  }
  writeAll([...all, item])
  logOrderCreated(item.number, item.clientName)
  return item
}

export function updateOrder(
  id: string,
  input: {
    clientName: string
    phone: string
    eventDate: string
    total: string
    status: OrderStatus
    operation: OrderOperation
  },
): Order | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const before = all[index]
  const updated: Order = {
    ...before,
    clientName: input.clientName.trim(),
    phone: input.phone.trim(),
    eventDate: input.eventDate,
    total: input.total.trim(),
    status: input.status,
    operation: input.operation,
  }
  all[index] = updated
  writeAll(all)
  logOrderUpdated(
    updated.number,
    buildFieldDiffs(
      {
        clientName: before.clientName,
        phone: before.phone,
        eventDate: formatHistoryDate(before.eventDate),
        total: before.total,
        status: before.status,
        operation: before.operation,
      },
      {
        clientName: updated.clientName,
        phone: updated.phone,
        eventDate: formatHistoryDate(updated.eventDate),
        total: updated.total,
        status: updated.status,
        operation: updated.operation,
      },
      {
        clientName: 'cliente',
        phone: 'telefone',
        eventDate: 'data do evento',
        total: 'total',
        status: 'status',
        operation: 'operação',
      },
    ),
  )
  return updated
}

export function patchOrder(
  id: string,
  patch: Partial<Omit<Order, 'id' | 'number' | 'createdAt'>>,
): Order | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const before = all[index]
  const updated: Order = {
    ...before,
    ...patch,
    id: before.id,
    number: before.number,
    createdAt: before.createdAt,
  }
  if (patch.lines) updated.lines = normalizeLines(patch.lines)
  all[index] = updated
  writeAll(all)
  logOrderUpdated(
    updated.number,
    buildFieldDiffs(
      { status: before.status, total: before.total },
      { status: updated.status, total: updated.total },
      { status: 'status', total: 'total' },
    ),
  )
  return updated
}

export function deleteOrder(id: string) {
  const item = readAll().find((entry) => entry.id === id)
  writeAll(readAll().filter((entry) => entry.id !== id))
  if (item) logOrderDeleted(item.number)
}

export function subscribeOrders(onChange: () => void) {
  const handler = () => {
    cachedOrders = null
    onChange()
  }
  window.addEventListener('social-express:orders-changed', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('social-express:orders-changed', handler)
    window.removeEventListener('storage', handler)
  }
}
