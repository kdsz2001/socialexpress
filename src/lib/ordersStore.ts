import {
  buildFieldDiffs,
  logOrderCreated,
  logOrderDeleted,
  logOrderUpdated,
} from './historyLog'
import { formatHistoryDate } from './historyStore'

export type OrderStatus =
  | 'Confirmado'
  | 'Cancelado'
  | 'Orçamento'
  | 'Concluído'
  | 'Aberto'
  | 'Anulado'

export type OrderOperation = 'Aluguel' | 'Venda'
export type OrderKind = 'Pedido' | 'Orçamento'

export type OrderLineStatus =
  | 'Aguardando prova'
  | 'Aguardando retirada'
  | 'Retirado'
  | 'Devolvido'

export type OrderLine = {
  id: string
  productId: string
  code: string
  name: string
  size: string
  price: number
  status: OrderLineStatus
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
  clientId: string
  clientName: string
  phone: string
  eventDate: string
  fittingDate: string
  pickupDate: string
  returnDate: string
  total: string
  status: OrderStatus
  operation: OrderOperation
  kind: OrderKind
  origin: string
  attendant: string
  lines: OrderLine[]
  discount: number
  payments: OrderPayment[]
  installments: OrderInstallment[]
  notes: string
  suitNotes: string
  fittingTime: string
  pickupTime: string
  returnTime: string
  createdAt: string
}

const STORAGE_KEY = 'social-express:orders'
const ORIGIN_KEY = 'social-express:order-origins'
const DEFAULT_ORIGINS = ['Instagram', 'Indicação', 'Loja', 'WhatsApp']

let cachedOrders: Order[] | null = null

export function formatBrl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function orderMoney(order: Order) {
  const subtotal = order.lines.reduce((sum, line) => sum + line.price, 0)
  const discount = Math.min(Math.max(order.discount, 0), subtotal)
  const total = Math.max(0, subtotal - discount)
  const paid = order.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const balance = Math.max(0, total - paid)
  return { subtotal, discount, total, paid, balance }
}

function displayStatus(status: string): OrderStatus {
  if (status === 'Anulado' || status === 'Cancelado') return 'Cancelado'
  if (status === 'Orçamento') return 'Orçamento'
  if (status === 'Concluído') return 'Concluído'
  if (status === 'Aberto') return 'Aberto'
  return 'Confirmado'
}

function normalize(raw: Partial<Order> & { id?: string }): Order {
  const status = displayStatus(String(raw.status || 'Confirmado'))
  const kind: OrderKind = raw.kind === 'Orçamento' || status === 'Orçamento' ? 'Orçamento' : 'Pedido'
  return {
    id: String(raw.id || crypto.randomUUID()),
    number: Number(raw.number) || 1,
    clientId: String(raw.clientId || ''),
    clientName: String(raw.clientName || ''),
    phone: String(raw.phone || ''),
    eventDate: String(raw.eventDate || ''),
    fittingDate: String(raw.fittingDate || ''),
    pickupDate: String(raw.pickupDate || ''),
    returnDate: String(raw.returnDate || ''),
    total: String(raw.total || 'R$ 0,00'),
    status: kind === 'Orçamento' && status === 'Confirmado' ? 'Orçamento' : status,
    operation: raw.operation === 'Venda' ? 'Venda' : 'Aluguel',
    kind,
    origin: String(raw.origin || ''),
    attendant: String(raw.attendant || ''),
    lines: Array.isArray(raw.lines) ? raw.lines : [],
    discount: Number(raw.discount) || 0,
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    installments: Array.isArray(raw.installments) ? raw.installments : [],
    notes: String(raw.notes || ''),
    suitNotes: String(raw.suitNotes || ''),
    fittingTime: String(raw.fittingTime || ''),
    pickupTime: String(raw.pickupTime || ''),
    returnTime: String(raw.returnTime || ''),
    createdAt: String(raw.createdAt || new Date().toISOString()),
  }
}

function syncTotal(order: Order): Order {
  const { total } = orderMoney(order)
  return { ...order, total: formatBrl(total) }
}

function readAll(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<Order>[]
    return Array.isArray(parsed) ? parsed.map((item) => normalize(item)) : []
  } catch {
    return []
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

export function getOrder(id: string): Order | null {
  return readAll().find((item) => item.id === id) ?? null
}

export function listOrderOrigins(): string[] {
  try {
    const raw = localStorage.getItem(ORIGIN_KEY)
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    const names = Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : []
    return names.length ? names : [...DEFAULT_ORIGINS]
  } catch {
    return [...DEFAULT_ORIGINS]
  }
}

export function addOrderOrigin(name: string) {
  const label = name.trim()
  if (!label) return
  const current = listOrderOrigins()
  if (current.some((item) => item.toLocaleLowerCase('pt-BR') === label.toLocaleLowerCase('pt-BR'))) return
  localStorage.setItem(ORIGIN_KEY, JSON.stringify([...current, label]))
}

export function addOrder(input: {
  clientName: string
  phone: string
  eventDate: string
  total: string
  status: OrderStatus
  operation: OrderOperation
  clientId?: string
  kind?: OrderKind
  origin?: string
  attendant?: string
}): Order {
  const all = readAll()
  const kind: OrderKind = input.kind || (input.status === 'Orçamento' ? 'Orçamento' : 'Pedido')
  const item = syncTotal(
    normalize({
      id: crypto.randomUUID(),
      number: nextNumber(all),
      clientId: input.clientId || '',
      clientName: input.clientName.trim(),
      phone: input.phone.trim(),
      eventDate: input.eventDate,
      total: input.total.trim() || 'R$ 0,00',
      status: kind === 'Orçamento' ? 'Orçamento' : input.status || 'Confirmado',
      operation: input.operation,
      kind,
      origin: input.origin || '',
      attendant: input.attendant || '',
      createdAt: new Date().toISOString(),
    }),
  )
  writeAll([...all, item])
  logOrderCreated(item.number, item.clientName)
  return item
}

export function patchOrder(id: string, patch: Partial<Order>): Order | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const before = all[index]
  const updated = syncTotal(normalize({ ...before, ...patch, id: before.id, number: before.number }))
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
  return patchOrder(id, input)
}

export function cancelOrder(id: string): Order | null {
  return patchOrder(id, { status: 'Cancelado' })
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
