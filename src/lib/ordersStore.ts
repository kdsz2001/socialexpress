import {
  buildFieldDiffs,
  logOrderCreated,
  logOrderDeleted,
  logOrderUpdated,
} from './historyLog'
import { formatHistoryDate } from './historyStore'

export type OrderStatus = 'Aberto' | 'Confirmado' | 'Concluído' | 'Anulado'
export type OrderOperation = 'Aluguel' | 'Venda'

export type Order = {
  id: string
  number: number
  clientName: string
  phone: string
  eventDate: string // YYYY-MM-DD
  total: string
  status: OrderStatus
  operation: OrderOperation
  createdAt: string
}

const STORAGE_KEY = 'social-express:orders'

let cachedOrders: Order[] | null = null

function readAll(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Order[]
    return Array.isArray(parsed) ? parsed : []
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

export function addOrder(input: {
  clientName: string
  phone: string
  eventDate: string
  total: string
  status: OrderStatus
  operation: OrderOperation
}): Order {
  const all = readAll()
  const item: Order = {
    id: crypto.randomUUID(),
    number: nextNumber(all),
    clientName: input.clientName.trim(),
    phone: input.phone.trim(),
    eventDate: input.eventDate,
    total: input.total.trim(),
    status: input.status,
    operation: input.operation,
    createdAt: new Date().toISOString(),
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
