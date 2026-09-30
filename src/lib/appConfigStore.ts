const STORAGE_KEY = 'social-express:app-config'

export type NamedItem = {
  id: string
  name: string
  locked?: boolean
}

export type DocumentModel = {
  id: string
  name: string
  body: string
  dueDate?: 'return' | 'event'
  noteValue?: 'rental' | 'paid'
  multiply?: string
}

export type TerminalConfig = {
  id: string
  name: string
  rental: 'with' | 'without'
  receipt: 'advance' | 'installment'
  creditInstallment: string
  creditSight: string
  debitFee: string
  fee2to6: string
  fee7to12: string
  daysToReceive: string
  anticipationFee: string
}

export type GoalBand = {
  id: string
  title: string
  ceiling: string
  commission: string
}

export type GoalGroup = {
  id: string
  name: string
  bands: GoalBand[]
  userIds: string[]
}

export type PermissionLevel = {
  id: string
  name: string
  locked?: boolean
  grants: Record<string, boolean>
}

export type AlertsConfig = {
  birthdayEnabled: boolean
  lateEnabled: boolean
  returnEnabled: boolean
  proofEnabled: boolean
  pickupEnabled: boolean
  lateReturn: string
  returnReminder: string
  proofReminder: string
  pickupReminder: string
  messages: Record<string, string>
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
  documentHeader: 'detailed' | 'simple'
  contracts: DocumentModel[]
  systemDocuments: DocumentModel[]
  operations: OperationsConfig
  paymentMethods: Record<string, boolean>
  terminals: TerminalConfig[]
  goalsEnabled: boolean
  goalGroups: GoalGroup[]
  alerts: AlertsConfig
  permissions: PermissionLevel[]
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

export const SYSTEM_DOCUMENTS: DocumentModel[] = [
  { id: 'doc-cancelamento', name: 'Contrato de cancelamento de pedido', body: '' },
  { id: 'doc-conclusao', name: 'Contrato de conclusão de pedido', body: '' },
  { id: 'doc-consignado', name: 'Contrato de consignado', body: '' },
  {
    id: 'doc-promissoria',
    name: 'Nota promissória',
    body: '',
    dueDate: 'return',
    noteValue: 'rental',
    multiply: '2',
  },
  { id: 'doc-devolucao', name: 'Termo de devolução de pedido', body: '' },
  { id: 'doc-retirada', name: 'Termo de retirada do pedido', body: '' },
]

const DEFAULT_CONTRACTS: DocumentModel[] = [
  { id: 'contract-aluguel', name: 'Contrato de aluguel', body: '' },
  { id: 'contract-venda', name: 'Contrato de venda', body: '' },
]

function blankTerminal(name: string, id: string): TerminalConfig {
  return {
    id,
    name,
    rental: 'with',
    receipt: 'advance',
    creditInstallment: '0,00',
    creditSight: '0,00',
    debitFee: '0,00',
    fee2to6: '0,00',
    fee7to12: '0,00',
    daysToReceive: '0',
    anticipationFee: '0,00',
  }
}

const DEFAULT_TERMINALS: TerminalConfig[] = [blankTerminal('Terminal de importação', 'terminal-importacao')]

export function createTerminalDraft(): TerminalConfig {
  return {
    id: crypto.randomUUID(),
    name: '',
    rental: 'with',
    receipt: 'advance',
    creditInstallment: '',
    creditSight: '',
    debitFee: '',
    fee2to6: '',
    fee7to12: '',
    daysToReceive: '',
    anticipationFee: '',
  }
}

export function createGoalDraft(): GoalGroup {
  return {
    id: crypto.randomUUID(),
    name: '',
    bands: [{ id: crypto.randomUUID(), title: '', ceiling: '', commission: '' }],
    userIds: [],
  }
}

export const PERMISSION_GROUPS: { id: string; label: string; items: { id: string; label: string }[] }[] = [
  {
    id: 'agenda',
    label: 'Agenda',
    items: [
      { id: 'agenda.create-event', label: 'Cadastrar evento' },
      { id: 'agenda.manage-event', label: 'Cadastrar, editar e remover evento' },
      { id: 'agenda.update-item', label: 'Atualizar item da agenda' },
      { id: 'agenda.edit-event', label: 'Editar evento' },
      { id: 'agenda.view-event', label: 'Visualizar detalhes do evento' },
    ],
  },
  {
    id: 'config',
    label: 'Configurações',
    items: [
      { id: 'config.system', label: 'Configurar sistema' },
      { id: 'config.log', label: 'Log do sistema' },
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    items: [
      { id: 'clientes.create', label: 'Cadastrar cliente' },
      { id: 'clientes.delete', label: 'Excluir cliente' },
      { id: 'clientes.export', label: 'Exportar clientes' },
      { id: 'clientes.import', label: 'Importar cliente' },
      { id: 'clientes.manage', label: 'Cadastrar e editar cliente' },
      { id: 'clientes.email', label: 'Enviar email para cliente' },
      { id: 'clientes.transfer-credit', label: 'Transferir créditos de cliente' },
      { id: 'clientes.edit', label: 'Editar cliente' },
      { id: 'clientes.view', label: 'Visualizar detalhes do cliente' },
    ],
  },
  {
    id: 'funcionarios',
    label: 'Funcionários',
    items: [
      { id: 'funcionarios.toggle', label: 'Ativar e desativar funcionário' },
      { id: 'funcionarios.create', label: 'Cadastrar funcionário' },
      { id: 'funcionarios.user', label: 'Cadastrar usuário' },
      { id: 'funcionarios.manage', label: 'Cadastrar, editar, ativar funcionário' },
      { id: 'funcionarios.edit', label: 'Editar funcionário' },
      { id: 'funcionarios.view', label: 'Visualizar detalhes do funcionário' },
      { id: 'funcionarios.goals', label: 'Visualizar metas do funcionário' },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    items: [
      { id: 'financeiro.cash', label: 'Visualizar caixa do dia' },
      { id: 'financeiro.expenses', label: 'Visualizar despesas avulsas' },
      { id: 'financeiro.revenues', label: 'Visualizar receitas avulsas' },
      { id: 'financeiro.manage-expense', label: 'Cadastrar, editar e remover despesa' },
      { id: 'financeiro.manage-revenue', label: 'Cadastrar, editar e remover receita' },
      { id: 'financeiro.create-expense', label: 'Cadastrar despesa avulsa' },
      { id: 'financeiro.create-revenue', label: 'Cadastrar receita avulsa' },
      { id: 'financeiro.panel', label: 'Visualizar painel financeiro' },
      { id: 'financeiro.dashboard-sales', label: 'Visualizar vendas no dashboard' },
    ],
  },
  {
    id: 'pedidos',
    label: 'Pedidos',
    items: [
      { id: 'pedidos.add-product', label: 'Adicionar produto ao pedido' },
      { id: 'pedidos.cancel', label: 'Cancelar pedido' },
      { id: 'pedidos.cancel-payment', label: 'Cancelar pagamento de pedido' },
      { id: 'pedidos.discount', label: 'Criar descontos no pedido' },
      { id: 'pedidos.create', label: 'Cadastrar pedido' },
      { id: 'pedidos.carne', label: 'Vincular carnê ao pedido' },
      { id: 'pedidos.payments', label: 'Registrar pagamentos no pedido' },
      { id: 'pedidos.swap', label: 'Trocar produto no pedido' },
      { id: 'pedidos.remove-product', label: 'Remover produto do pedido' },
      { id: 'pedidos.unlock', label: 'Desbloquear produtos em datas concorrentes' },
      { id: 'pedidos.edit', label: 'Editar pedido' },
      { id: 'pedidos.contract', label: 'Reconfigurar opções de contrato' },
      { id: 'pedidos.pay-date', label: 'Atualizar data efetiva de pagamento' },
      { id: 'pedidos.owner', label: 'Atualizar responsável do pedido' },
      { id: 'pedidos.view', label: 'Visualizar detalhes do pedido' },
    ],
  },
  {
    id: 'produtos',
    label: 'Produtos',
    items: [
      { id: 'produtos.toggle', label: 'Ativar e desativar produto' },
      { id: 'produtos.bulk', label: 'Alterar produtos em massa' },
      { id: 'produtos.view', label: 'Consultar produtos' },
      { id: 'produtos.export', label: 'Exportar produtos' },
      { id: 'produtos.import', label: 'Importar produto' },
      { id: 'produtos.manage', label: 'Cadastrar, editar e remover produto' },
      { id: 'produtos.attribute', label: 'Cadastrar, editar e remover atributo de produto' },
      { id: 'produtos.type', label: 'Cadastrar, editar e remover tipo de produto' },
      { id: 'produtos.labels', label: 'Imprimir etiquetas' },
      { id: 'produtos.cost', label: 'Visualizar e editar custo do produto' },
      { id: 'produtos.profit', label: 'Visualizar informações de lucro do produto' },
    ],
  },
  {
    id: 'fornecedores',
    label: 'Fornecedores',
    items: [
      { id: 'fornecedores.import', label: 'Importar fornecedores' },
      { id: 'fornecedores.manage', label: 'Cadastrar, editar e remover fornecedor' },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    items: [
      { id: 'relatorios.unavailable', label: 'Indisponibilidade' },
      { id: 'relatorios.commission', label: 'Comissões' },
      { id: 'relatorios.consignment', label: 'Consignados' },
      { id: 'relatorios.credits', label: 'Créditos' },
      { id: 'relatorios.clients', label: 'Análise de clientes' },
      { id: 'relatorios.orders', label: 'Pedidos' },
      { id: 'relatorios.separation', label: 'Separação' },
      { id: 'relatorios.turnover', label: 'Rotatividade de produtos' },
      { id: 'relatorios.team', label: 'Ver comissionamento da equipe' },
    ],
  },
]

const ALL_GRANT_IDS = PERMISSION_GROUPS.flatMap((group) => group.items.map((item) => item.id))

const ROLE_GRANTS: Record<string, string[]> = {
  'perm-caixa': [
    'agenda.view-event',
    'clientes.create',
    'clientes.view',
    'financeiro.cash',
    'financeiro.expenses',
    'financeiro.revenues',
    'financeiro.panel',
    'pedidos.view',
    'pedidos.payments',
  ],
  'perm-noivas': [
    'agenda.create-event',
    'agenda.edit-event',
    'agenda.view-event',
    'clientes.create',
    'clientes.manage',
    'clientes.view',
    'pedidos.create',
    'pedidos.edit',
    'pedidos.view',
    'produtos.view',
  ],
  'perm-costureira': ['agenda.view-event', 'pedidos.view', 'pedidos.owner', 'produtos.view'],
  'perm-gerente': ALL_GRANT_IDS.filter((id) => id !== 'config.system' && id !== 'funcionarios.manage'),
  'perm-limpeza': ['agenda.view-event', 'produtos.view'],
  'perm-marketing': ['clientes.view', 'clientes.email', 'produtos.view', 'relatorios.clients', 'relatorios.orders'],
  'perm-vendedor': [
    'agenda.create-event',
    'agenda.view-event',
    'clientes.create',
    'clientes.edit',
    'clientes.view',
    'pedidos.create',
    'pedidos.edit',
    'pedidos.view',
    'produtos.view',
  ],
}

const DEFAULT_PERMISSIONS: PermissionLevel[] = [
  { id: 'perm-admin', name: 'Administrador', locked: true, grants: {} },
  { id: 'perm-caixa', name: 'Caixa', grants: {} },
  { id: 'perm-noivas', name: 'Consultora de Noivas', grants: {} },
  { id: 'perm-costureira', name: 'Costureira', grants: {} },
  { id: 'perm-gerente', name: 'Gerente de vendas / Supervisor', grants: {} },
  { id: 'perm-limpeza', name: 'Limpeza e organização', grants: {} },
  { id: 'perm-marketing', name: 'Marketing', grants: {} },
  { id: 'perm-vendedor', name: 'Vendedor', grants: {} },
]

export const ALERT_TEMPLATES: Record<string, string> = {
  birthday:
    'Olá, {nome}, tudo bem? A equipe da {loja} deseja um feliz aniversário. Se precisar de algo, fale com a gente no {telefone}.',
  'late-return':
    'Olá, {nome}, tudo bem? O pedido #{pedido} passou da data de devolução. Entre em contato pelo {telefone} para combinarmos a entrega do {produto}.',
  return:
    'Olá, {nome}, tudo bem? Passando para lembrar da devolução do pedido #{pedido} na {loja}. Qualquer dúvida, chame no {telefone}.',
  proof:
    'Olá, {nome}, tudo bem?\n\nEstamos passando aqui rapidinho só pra lembrar que você tem a prova do pedido {pedido} {data_prova}.\n\nSe você tiver qualquer dúvida, basta nos chamar no telefone {telefone}, tá bem?\n\nAbraço da equipe da {loja}.',
  pickup:
    'Olá, {nome}, tudo bem? Não esqueça sua retirada aqui na {loja} no dia {data_retirada}. Se você tiver qualquer dúvida, basta nos chamar no telefone {telefone}, tá bem? Abraço da equipe da {loja}.',
}

export const DOCUMENT_VARIABLES: { token: string; label: string }[] = [
  { token: '[razaoSocial]', label: 'Nome da loja' },
  { token: '[documentoLoja]', label: 'Documento da loja' },
  { token: '[enderecoLoja]', label: 'Endereço da loja' },
  { token: '[nomeCliente]', label: 'Nome completo do cliente' },
  { token: '[cpfCliente]', label: 'CPF do cliente' },
  { token: '[rgCliente]', label: 'RG do cliente' },
  { token: '[enderecoCliente]', label: 'Endereço completo do cliente' },
  { token: '[contrato]', label: 'Código do pedido' },
  { token: '[credito]', label: 'Crédito do cliente' },
  { token: '[dataDeCadastro]', label: 'Data de cadastro do cliente' },
  { token: '[vendedor]', label: 'Nome do(a) vendedor(a)' },
  { token: '[dataEvento]', label: 'Data do evento' },
  { token: '[dataRetirada]', label: 'Data de retirada' },
  { token: '[dataDevolucao]', label: 'Data de devolução' },
  { token: '[dataProva]', label: 'Data da prova' },
  { token: '[horarioProva]', label: 'Horário da prova' },
  { token: '[vencimentoPromissoria]', label: 'Vencimento da promissória' },
]

const DEFAULT_OPERATIONS: OperationsConfig = {
  blockBeforeProofDays: 2,
  blockAfterReturnDays: 2,
  showCustomCode: true,
  allowProductSale: true,
  allowConsignment: true,
  allowPublicQr: true,
  autoMarkProofs: true,
  useStockControl: false,
  originRequired: false,
  outfitNotes: '',
  orderNotes: '',
  quoteNotes: '',
  commissionBase: 'total',
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

const DEFAULT_ALERTS: AlertsConfig = {
  birthdayEnabled: true,
  lateEnabled: true,
  returnEnabled: true,
  proofEnabled: true,
  pickupEnabled: true,
  lateReturn: '1 dia depois',
  returnReminder: '1 dia antes',
  proofReminder: '1 dia antes',
  pickupReminder: '1 dia antes',
  messages: { ...ALERT_TEMPLATES },
}

function textField(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function normalizeDocument(raw: unknown, fallback?: DocumentModel): DocumentModel | null {
  if (!raw || typeof raw !== 'object') return fallback ? { ...fallback } : null
  const row = raw as Partial<DocumentModel>
  const name = typeof row.name === 'string' ? row.name.trim() : fallback?.name || ''
  if (!name) return null
  const dueDate = row.dueDate === 'event' || row.dueDate === 'return' ? row.dueDate : fallback?.dueDate
  const noteValue = row.noteValue === 'paid' || row.noteValue === 'rental' ? row.noteValue : fallback?.noteValue
  return {
    id: typeof row.id === 'string' && row.id ? row.id : fallback?.id || crypto.randomUUID(),
    name,
    body: textField(row.body, fallback?.body || ''),
    dueDate,
    noteValue,
    multiply: textField(row.multiply, fallback?.multiply || ''),
  }
}

function normalizeContracts(raw: unknown): DocumentModel[] {
  if (!Array.isArray(raw)) return DEFAULT_CONTRACTS.map((item) => ({ ...item }))
  const items = raw.map((item) => normalizeDocument(item)).filter((item): item is DocumentModel => item !== null)
  return items.length > 0 ? items : DEFAULT_CONTRACTS.map((item) => ({ ...item }))
}

function normalizeSystemDocuments(raw: unknown): DocumentModel[] {
  const saved = Array.isArray(raw) ? raw : []
  const byId = new Map<string, DocumentModel>()
  saved.forEach((item) => {
    const doc = normalizeDocument(item)
    if (doc) byId.set(doc.id, doc)
  })
  return SYSTEM_DOCUMENTS.map((item) => normalizeDocument(byId.get(item.id) ?? item, item) as DocumentModel)
}

function normalizeTerminal(raw: unknown, fallback?: TerminalConfig): TerminalConfig | null {
  if (!raw || typeof raw !== 'object') return fallback ? { ...fallback } : null
  const row = raw as Partial<TerminalConfig>
  const name = typeof row.name === 'string' ? row.name.trim() : ''
  if (!name) return null
  const base = fallback ?? blankTerminal(name, typeof row.id === 'string' ? row.id : crypto.randomUUID())
  return {
    ...base,
    id: typeof row.id === 'string' && row.id ? row.id : base.id,
    name,
    rental: row.rental === 'without' ? 'without' : 'with',
    receipt: row.receipt === 'installment' ? 'installment' : 'advance',
    creditInstallment: textField(row.creditInstallment, base.creditInstallment),
    creditSight: textField(row.creditSight, base.creditSight),
    debitFee: textField(row.debitFee, base.debitFee),
    fee2to6: textField(row.fee2to6, base.fee2to6),
    fee7to12: textField(row.fee7to12, base.fee7to12),
    daysToReceive: textField(row.daysToReceive, base.daysToReceive),
    anticipationFee: textField(row.anticipationFee, base.anticipationFee),
  }
}

function normalizeTerminals(raw: unknown): TerminalConfig[] {
  if (!Array.isArray(raw)) return DEFAULT_TERMINALS.map((item) => ({ ...item }))
  const items = raw
    .map((item) => normalizeTerminal(item))
    .filter((item): item is TerminalConfig => item !== null)
  return items
}

function blankBand(): GoalBand {
  return { id: crypto.randomUUID(), title: '', ceiling: '', commission: '' }
}

function normalizeGoalGroups(rawGroups: unknown, rawBands: unknown): GoalGroup[] {
  if (Array.isArray(rawGroups)) {
    return rawGroups
      .map((item): GoalGroup | null => {
        if (!item || typeof item !== 'object') return null
        const row = item as Partial<GoalGroup>
        const name = typeof row.name === 'string' ? row.name.trim() : ''
        if (!name) return null
        const bands = Array.isArray(row.bands)
          ? row.bands
              .map((band): GoalBand | null => {
                if (!band || typeof band !== 'object') return null
                const entry = band as Partial<GoalBand>
                return {
                  id: typeof entry.id === 'string' && entry.id ? entry.id : crypto.randomUUID(),
                  title: textField(entry.title),
                  ceiling: textField(entry.ceiling),
                  commission: textField(entry.commission),
                }
              })
              .filter((band): band is GoalBand => band !== null)
          : [blankBand()]
        return {
          id: typeof row.id === 'string' && row.id ? row.id : crypto.randomUUID(),
          name,
          bands: bands.length > 0 ? bands : [blankBand()],
          userIds: Array.isArray(row.userIds) ? row.userIds.filter((id): id is string => typeof id === 'string') : [],
        }
      })
      .filter((item): item is GoalGroup => item !== null)
  }
  if (!Array.isArray(rawBands)) return []
  return rawBands
    .map((item): GoalGroup | null => {
      if (!item || typeof item !== 'object') return null
      const row = item as { id?: string; name?: string }
      const name = typeof row.name === 'string' ? row.name.trim() : ''
      if (!name) return null
      return {
        id: typeof row.id === 'string' && row.id ? row.id : crypto.randomUUID(),
        name,
        bands: [blankBand()],
        userIds: [],
      }
    })
    .filter((item): item is GoalGroup => item !== null)
}

function grantsFrom(raw: unknown, roleId: string): Record<string, boolean> {
  const grants: Record<string, boolean> = {}
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value === 'boolean') grants[key] = value
    }
    if (Object.keys(grants).length > 0) return grants
  }
  const preset = ROLE_GRANTS[roleId] ?? []
  for (const id of preset) grants[id] = true
  return grants
}

function normalizePermissions(raw: unknown): PermissionLevel[] {
  const saved = Array.isArray(raw) ? raw : []
  const byId = new Map<string, Partial<PermissionLevel>>()
  const extras: PermissionLevel[] = []
  saved.forEach((item, index) => {
    if (!item || typeof item !== 'object') return
    const row = item as Partial<PermissionLevel>
    const name = typeof row.name === 'string' ? row.name.trim() : ''
    if (!name) return
    const id = typeof row.id === 'string' && row.id ? row.id : `perm-${index + 1}`
    const level: PermissionLevel = {
      id,
      name,
      locked: id === 'perm-admin' || Boolean(row.locked),
      grants: grantsFrom(row.grants, id),
    }
    if (DEFAULT_PERMISSIONS.some((entry) => entry.id === id) || id === 'perm-admin') byId.set(id, level)
    else extras.push(level)
  })
  const defaults = DEFAULT_PERMISSIONS.map((item) => {
    const savedItem = byId.get(item.id)
    if (!savedItem) {
      return { ...item, locked: item.id === 'perm-admin', grants: grantsFrom(undefined, item.id) }
    }
    return {
      id: item.id,
      name: savedItem.name || item.name,
      locked: item.id === 'perm-admin',
      grants: grantsFrom(savedItem.grants, item.id),
    }
  })
  return [...defaults, ...extras]
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
    commissionBase: item.commissionBase === 'paid' ? 'paid' : 'total',
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

function normalizeAlerts(raw: unknown): AlertsConfig {
  const item = raw && typeof raw === 'object' ? (raw as Partial<AlertsConfig>) : {}
  const text = (value: unknown, fallback: string) => (typeof value === 'string' && value.trim() ? value : fallback)
  const flag = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback)
  const messages: Record<string, string> = { ...ALERT_TEMPLATES }
  if (item.messages && typeof item.messages === 'object') {
    for (const [key, value] of Object.entries(item.messages)) {
      if (typeof value === 'string' && value.trim()) messages[key] = value
    }
  }
  return {
    birthdayEnabled: flag(item.birthdayEnabled, true),
    lateEnabled: flag(item.lateEnabled, true),
    returnEnabled: flag(item.returnEnabled, true),
    proofEnabled: flag(item.proofEnabled, true),
    pickupEnabled: flag(item.pickupEnabled, true),
    lateReturn: text(item.lateReturn, DEFAULT_ALERTS.lateReturn),
    returnReminder: text(item.returnReminder, DEFAULT_ALERTS.returnReminder),
    proofReminder: text(item.proofReminder, DEFAULT_ALERTS.proofReminder),
    pickupReminder: text(item.pickupReminder, DEFAULT_ALERTS.pickupReminder),
    messages,
  }
}

export function normalizeAppConfig(raw: unknown): AppConfig {
  const item = raw && typeof raw === 'object' ? (raw as Partial<AppConfig> & { goalBands?: unknown }) : {}
  return {
    documentHeader: item.documentHeader === 'simple' ? 'simple' : 'detailed',
    contracts: normalizeContracts(item.contracts),
    systemDocuments: normalizeSystemDocuments(item.systemDocuments),
    operations: normalizeOperations(item.operations),
    paymentMethods: normalizePayments(item.paymentMethods),
    terminals: normalizeTerminals(item.terminals),
    goalsEnabled: typeof item.goalsEnabled === 'boolean' ? item.goalsEnabled : false,
    goalGroups: normalizeGoalGroups(item.goalGroups, item.goalBands),
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
