export type CashMovementType = 'entrada' | 'saida'
export type PaymentMethod =
  | 'Dinheiro'
  | 'PIX'
  | 'Cartão de crédito'
  | 'Cartão de débito'
  | 'Transferência'
  | 'Boleto'
export type CashOperation = 'Aluguel' | 'Venda' | 'Outro'

export type CashMovement = {
  id: string
  date: string // YYYY-MM-DD
  description: string
  paymentMethod: PaymentMethod
  value: number
  type: CashMovementType
  operation: CashOperation
  attendant: string
  canceled: boolean
  createdAt: string
}

const STORAGE_KEY = 'social-express:cash-movements'

let cached: CashMovement[] | null = null

function readAll(): CashMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CashMovement[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: CashMovement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  cached = null
  window.dispatchEvent(new Event('social-express:cash-movements-changed'))
}

export function listCashMovements(): CashMovement[] {
  if (!cached) {
    cached = readAll()
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }
  return cached
}

export function addCashMovement(input: {
  date: string
  description: string
  paymentMethod: PaymentMethod
  value: number
  type: CashMovementType
  operation: CashOperation
  attendant: string
}): CashMovement {
  const item: CashMovement = {
    id: crypto.randomUUID(),
    date: input.date,
    description: input.description.trim(),
    paymentMethod: input.paymentMethod,
    value: input.value,
    type: input.type,
    operation: input.operation,
    attendant: input.attendant.trim(),
    canceled: false,
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), item])
  return item
}

export function updateCashMovement(
  id: string,
  input: {
    date: string
    description: string
    paymentMethod: PaymentMethod
    value: number
    type: CashMovementType
    operation: CashOperation
    attendant: string
  },
): CashMovement | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const updated: CashMovement = {
    ...all[index],
    date: input.date,
    description: input.description.trim(),
    paymentMethod: input.paymentMethod,
    value: input.value,
    type: input.type,
    operation: input.operation,
    attendant: input.attendant.trim(),
  }
  all[index] = updated
  writeAll(all)
  return updated
}

export function deleteCashMovement(id: string) {
  writeAll(readAll().filter((item) => item.id !== id))
}

export function subscribeCashMovements(onChange: () => void) {
  const handler = () => {
    cached = null
    onChange()
  }
  window.addEventListener('social-express:cash-movements-changed', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('social-express:cash-movements-changed', handler)
    window.removeEventListener('storage', handler)
  }
}
