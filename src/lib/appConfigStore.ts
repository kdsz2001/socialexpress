const STORAGE_KEY = 'social-express:app-config'

export type NamedItem = {
  id: string
  name: string
  locked?: boolean
}

export type OperationsConfig = {
  blockBeforeProofDays: number
  blockAfterReturnDays: number
  showCustomCode: boolean
  allowProductSale: boolean
  allowConsignment: boolean
  allowPublicQr: boolean
  autoMarkProofs: boolean
  useStockControl: boolean
  originRequired: boolean
  outfitNotes: string
  orderNotes: string
  quoteNotes: string
  commissionBase: 'total' | 'paid'
  includeFineInCommission: boolean
}

export type AppConfig = {
  contracts: NamedItem[]
  systemDocuments: NamedItem[]
  operations: OperationsConfig
  paymentMethods: Record<string, boolean>
  terminals: NamedItem[]
  goalsEnabled: boolean
  goalBands: NamedItem[]
  alerts: {
    birthdayEnabled: boolean
    lateReturn: string
    returnReminder: string
    proofReminder: string
    pickupReminder: string
    messages: Record<string, string>
  }
  permissions: NamedItem[]
}

export const PAYMENT_METHODS: { id: string; label: string }[] = [
  { id: 'boleto', label: 'Boleto' },
  { id: 'carne', label: 'Carnê' },
  { id: 'credito', label: 'Cartão de crédito' },
  { id: 'debito', label: 'Cartão de débito' },
  { id: 'cheque', label: 'Cheque' },
  { id: 'credito-cliente', label: 'Crédito cliente' },
  { id: 'deposito', label: 'Depósito bancário' },
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'outros', label: 'Outros' },
  { id: 'pix', label: 'Pix' },
]

export const SYSTEM_DOCUMENTS: NamedItem[] = [
  { id: 'doc-cancelamento', name: 'Contrato de cancelamento de pedido' },
  { id: 'doc-conclusao', name: 'Contrato de conclusão de pedido' },
  { id: 'doc-consignado', name: 'Contrato de consignado' },
  { id: 'doc-promissoria', name: 'Nota promissória' },
  { id: 'doc-devolucao', name: 'Termo de devolução de pedido' },
  { id: 'doc-retirada', name: 'Termo de retirada do pedido' },
]

const DEFAULT_CONTRACTS: NamedItem[] = [
  { id: 'contract-aluguel', name: 'Contrato de aluguel' },
  { id: 'contract-venda', name: 'Contrato de venda' },
]

const DEFAULT_TERMINALS: NamedItem[] = [
  { id: 'terminal-importacao', name: 'Terminal de importação' },
]

const DEFAULT_PERMISSIONS: NamedItem[] = [
  { id: 'perm-admin', name: 'Administrador', locked: true },
  { id: 'perm-caixa', name: 'Caixa' },
  { id: 'perm-noivas', name: 'Consultora de Noivas' },
  { id: 'perm-costureira', name: 'Costureira' },
  { id: 'perm-gerente', name: 'Gerente de vendas / Supervisor' },
  { id: 'perm-limpeza', name: 'Limpeza e organização' },
  { id: 'perm-marketing', name: 'Marketing' },
  { id: 'perm-vendedor', name: 'Vendedor' },
]

const DEFAULT_OPERATIONS: OperationsConfig = {
  blockBeforeProofDays: 2,
  blockAfterReturnDays: 2,
  showCustomCode: true,
  allowProductSale: true,
  allowConsignment: true,
  allowPublicQr: true,
  autoMarkProofs: false,
  useStockControl: false,
  originRequired: false,
  outfitNotes: '',
  orderNotes: '',
  quoteNotes: '',
  commissionBase: 'paid',
  includeFineInCommission: false,
}

function defaultPayments(): Record<string, boolean> {
  return {
    boleto: true,
    carne: true,
    credito: true,
    debito: true,
    cheque: true,
    'credito-cliente': true,
    deposito: true,
    dinheiro: true,
    outros: false,
    pix: true,
  }
}

const DEFAULT_ALERTS: AppConfig['alerts'] = {
  birthdayEnabled: true,
  lateReturn: '1 dia depois',
  returnReminder: '1 dia antes',
  proofReminder: '1 dia antes',
  pickupReminder: '2 dias antes',
  messages: {},
}

function namedList(raw: unknown, fallback: NamedItem[]): NamedItem[] {
  if (!Array.isArray(raw)) {
    return fallback.map((item) => ({ ...item }))
  }
  const items: NamedItem[] = []
  raw.forEach((item, index) => {
    if (!item || typeof item !== 'object') return
    const row = item as Partial<NamedItem>
    const name = typeof row.name === 'string' ? row.name.trim() : ''
    if (!name) return
    items.push({
      id: typeof row.id === 'string' && row.id ? row.id : `item-${index + 1}`,
      name,
      locked: Boolean(row.locked),
    })
  })
  return items
}

function normalizeSystemDocuments(raw: unknown): NamedItem[] {
  const saved = namedList(raw, [])
  const byId = new Map(saved.map((item) => [item.id, item]))
  return SYSTEM_DOCUMENTS.map((item) => ({
    id: item.id,
    name: byId.get(item.id)?.name || item.name,
  }))
}

function normalizePermissions(raw: unknown): NamedItem[] {
  const list = namedList(raw, DEFAULT_PERMISSIONS)
  const admin = list.find((item) => item.id === 'perm-admin') ?? {
    id: 'perm-admin',
    name: 'Administrador',
    locked: true,
  }
  const rest = list.filter((item) => item.id !== 'perm-admin')
  return [{ ...admin, locked: true }, ...rest]
}

function normalizeOperations(raw: unknown): OperationsConfig {
  const item = raw && typeof raw === 'object' ? (raw as Partial<OperationsConfig>) : {}
  const days = (value: unknown, fallback: number) => {
    const number = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(number) || number < 0) return fallback
    return Math.round(number)
  }
  return {
    blockBeforeProofDays: days(item.blockBeforeProofDays, DEFAULT_OPERATIONS.blockBeforeProofDays),
    blockAfterReturnDays: days(item.blockAfterReturnDays, DEFAULT_OPERATIONS.blockAfterReturnDays),
    showCustomCode: typeof item.showCustomCode === 'boolean' ? item.showCustomCode : DEFAULT_OPERATIONS.showCustomCode,
    allowProductSale: typeof item.allowProductSale === 'boolean' ? item.allowProductSale : DEFAULT_OPERATIONS.allowProductSale,
    allowConsignment:
      typeof item.allowConsignment === 'boolean' ? item.allowConsignment : DEFAULT_OPERATIONS.allowConsignment,
    allowPublicQr: typeof item.allowPublicQr === 'boolean' ? item.allowPublicQr : DEFAULT_OPERATIONS.allowPublicQr,
    autoMarkProofs: typeof item.autoMarkProofs === 'boolean' ? item.autoMarkProofs : DEFAULT_OPERATIONS.autoMarkProofs,
    useStockControl: typeof item.useStockControl === 'boolean' ? item.useStockControl : DEFAULT_OPERATIONS.useStockControl,
    originRequired: typeof item.originRequired === 'boolean' ? item.originRequired : DEFAULT_OPERATIONS.originRequired,
    outfitNotes: typeof item.outfitNotes === 'string' ? item.outfitNotes : '',
    orderNotes: typeof item.orderNotes === 'string' ? item.orderNotes : '',
    quoteNotes: typeof item.quoteNotes === 'string' ? item.quoteNotes : '',
    commissionBase: item.commissionBase === 'total' ? 'total' : 'paid',
    includeFineInCommission:
      typeof item.includeFineInCommission === 'boolean'
        ? item.includeFineInCommission
        : DEFAULT_OPERATIONS.includeFineInCommission,
  }
}

function normalizePayments(raw: unknown): Record<string, boolean> {
  const defaults = defaultPayments()
  if (!raw || typeof raw !== 'object') return defaults
  const item = raw as Record<string, unknown>
  for (const method of PAYMENT_METHODS) {
    if (typeof item[method.id] === 'boolean') defaults[method.id] = item[method.id] as boolean
  }
  return defaults
}

function normalizeAlerts(raw: unknown): AppConfig['alerts'] {
  const item = raw && typeof raw === 'object' ? (raw as Partial<AppConfig['alerts']>) : {}
  const text = (value: unknown, fallback: string) => (typeof value === 'string' && value.trim() ? value : fallback)
  const messages: Record<string, string> = {}
  if (item.messages && typeof item.messages === 'object') {
    for (const [key, value] of Object.entries(item.messages)) {
      if (typeof value === 'string') messages[key] = value
    }
  }
  return {
    birthdayEnabled: typeof item.birthdayEnabled === 'boolean' ? item.birthdayEnabled : true,
    lateReturn: text(item.lateReturn, DEFAULT_ALERTS.lateReturn),
    returnReminder: text(item.returnReminder, DEFAULT_ALERTS.returnReminder),
    proofReminder: text(item.proofReminder, DEFAULT_ALERTS.proofReminder),
    pickupReminder: text(item.pickupReminder, DEFAULT_ALERTS.pickupReminder),
    messages,
  }
}

export function normalizeAppConfig(raw: unknown): AppConfig {
  const item = raw && typeof raw === 'object' ? (raw as Partial<AppConfig>) : {}
  return {
    contracts: namedList(item.contracts, DEFAULT_CONTRACTS),
    systemDocuments: normalizeSystemDocuments(item.systemDocuments),
    operations: normalizeOperations(item.operations),
    paymentMethods: normalizePayments(item.paymentMethods),
    terminals: namedList(item.terminals, DEFAULT_TERMINALS),
    goalsEnabled: typeof item.goalsEnabled === 'boolean' ? item.goalsEnabled : false,
    goalBands: namedList(item.goalBands, []),
    alerts: normalizeAlerts(item.alerts),
    permissions: normalizePermissions(item.permissions),
  }
}

let cached: AppConfig | null = null

export function getAppConfig(): AppConfig {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cached = raw ? normalizeAppConfig(JSON.parse(raw)) : normalizeAppConfig(null)
  } catch {
    cached = normalizeAppConfig(null)
  }
  return cached
}

export function updateAppConfig(patch: (current: AppConfig) => AppConfig) {
  const next = normalizeAppConfig(patch(getAppConfig()))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  cached = next
  window.dispatchEvent(new Event('social-express:app-config-changed'))
}

export function subscribeAppConfig(onChange: () => void) {
  const handler = () => {
    cached = null
    onChange()
  }
  window.addEventListener('social-express:app-config-changed', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('social-express:app-config-changed', handler)
    window.removeEventListener('storage', handler)
  }
}
