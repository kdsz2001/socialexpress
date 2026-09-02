export type CrmConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export type CrmLabelId =
  | 'novo'
  | 'sem-resposta'
  | 'acompanhar'
  | 'agendamento'
  | 'pago'
  | 'perdido'

export type CrmLabel = {
  id: CrmLabelId
  name: string
  color: string
}

export type CrmMessage = {
  id: string
  from: 'client' | 'store'
  text: string
  at: number
}

export type CrmScoreHit = {
  ruleId: string
  label: string
  points: number
}

export type CrmLead = {
  id: string
  name: string
  phone: string
  labelId: CrmLabelId
  eventType: string
  eventDate: string
  suitInterest: string
  score: number
  scoreHits: CrmScoreHit[]
  aiSummary: string
  messages: CrmMessage[]
  createdAt: number
  updatedAt: number
}

export type CrmScoreRule = {
  id: string
  keyword: string
  points: number
  enabled: boolean
}

export type CrmBackup = {
  id: string
  createdAt: number
  leadCount: number
  note: string
}

export type CrmState = {
  status: CrmConnectionStatus
  connectedAt: number | null
  accountName: string
  accountPhone: string
  qrToken: string
  qrBase64: string | null
  pairingCode: string | null
  connectionMode: 'mock' | 'evolution'
  lastError: string | null
  labels: CrmLabel[]
  leads: CrmLead[]
  scoreRules: CrmScoreRule[]
  backups: CrmBackup[]
  lastSyncAt: number | null
}

const STORAGE_KEY = 'social-express:crm'
const CHANGE_EVENT = 'social-express:crm-changed'

export const DEFAULT_LABELS: CrmLabel[] = [
  { id: 'novo', name: 'Novo', color: '#3699ff' },
  { id: 'sem-resposta', name: 'Sem resposta', color: '#ffa800' },
  { id: 'acompanhar', name: 'Acompanhar', color: '#8950fc' },
  { id: 'agendamento', name: 'Agendamento', color: '#1bc5bd' },
  { id: 'pago', name: 'Pago', color: '#0bb783' },
  { id: 'perdido', name: 'Perdido', color: '#f64e60' },
]

export const DEFAULT_SCORE_RULES: CrmScoreRule[] = [
  { id: 'rule-casamento', keyword: 'casamento', points: 35, enabled: true },
  { id: 'rule-formatura', keyword: 'formatura', points: 25, enabled: true },
  { id: 'rule-terno-azul', keyword: 'terno azul', points: 40, enabled: true },
  { id: 'rule-cinza', keyword: 'cinza', points: 30, enabled: true },
  { id: 'rule-off-white', keyword: 'off white', points: 30, enabled: true },
  { id: 'rule-colorido', keyword: 'colorido', points: 20, enabled: true },
  { id: 'rule-urgente', keyword: 'próximo mês', points: 25, enabled: true },
]

function emptyState(): CrmState {
  return {
    status: 'disconnected',
    connectedAt: null,
    accountName: '',
    accountPhone: '',
    qrToken: createQrToken(),
    qrBase64: null,
    pairingCode: null,
    connectionMode: 'mock',
    lastError: null,
    labels: DEFAULT_LABELS.map((item) => ({ ...item })),
    leads: [],
    scoreRules: DEFAULT_SCORE_RULES.map((item) => ({ ...item })),
    backups: [],
    lastSyncAt: null,
  }
}

function createQrToken() {
  return `qr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeState(raw: unknown): CrmState {
  const base = emptyState()
  if (!raw || typeof raw !== 'object') return base
  const item = raw as Partial<CrmState>
  return {
    ...base,
    status:
      item.status === 'connected' || item.status === 'connecting' || item.status === 'disconnected'
        ? item.status
        : 'disconnected',
    connectedAt: typeof item.connectedAt === 'number' ? item.connectedAt : null,
    accountName: typeof item.accountName === 'string' ? item.accountName : '',
    accountPhone: typeof item.accountPhone === 'string' ? item.accountPhone : '',
    qrToken: typeof item.qrToken === 'string' ? item.qrToken : createQrToken(),
    qrBase64: typeof item.qrBase64 === 'string' ? item.qrBase64 : null,
    pairingCode: typeof item.pairingCode === 'string' ? item.pairingCode : null,
    connectionMode: item.connectionMode === 'evolution' ? 'evolution' : 'mock',
    lastError: typeof item.lastError === 'string' ? item.lastError : null,
    labels: Array.isArray(item.labels) && item.labels.length ? item.labels : base.labels,
    leads: Array.isArray(item.leads) ? item.leads : [],
    scoreRules:
      Array.isArray(item.scoreRules) && item.scoreRules.length ? item.scoreRules : base.scoreRules,
    backups: Array.isArray(item.backups) ? item.backups : [],
    lastSyncAt: typeof item.lastSyncAt === 'number' ? item.lastSyncAt : null,
  }
}

let cache: CrmState | null = null

function readState(): CrmState {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cache = raw ? normalizeState(JSON.parse(raw)) : emptyState()
  } catch {
    cache = emptyState()
  }
  return cache
}

function writeState(next: CrmState) {
  cache = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function update(patch: Partial<CrmState> | ((current: CrmState) => CrmState)) {
  const current = readState()
  const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch }
  writeState(next)
  return next
}

export function getCrmState(): CrmState {
  return readState()
}

export function subscribeCrm(onChange: () => void) {
  const handler = () => {
    cache = null
    onChange()
  }
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function refreshCrmQr() {
  return update({ qrToken: createQrToken(), status: 'disconnected' })
}

export function startCrmConnecting() {
  return update({ status: 'connecting', qrToken: createQrToken() })
}

export function completeCrmConnection(input?: { accountName?: string; accountPhone?: string }) {
  const current = readState()
  const leads = current.leads.length ? current.leads : seedDemoLeads(current.scoreRules)
  return update({
    status: 'connected',
    connectedAt: Date.now(),
    accountName: input?.accountName?.trim() || 'Social Express Atendimento',
    accountPhone: input?.accountPhone?.trim() || '(47) 99999-0000',
    leads,
    lastSyncAt: Date.now(),
  })
}

export function disconnectCrm() {
  return update({
    status: 'disconnected',
    connectedAt: null,
    accountName: '',
    accountPhone: '',
    qrToken: createQrToken(),
    qrBase64: null,
    pairingCode: null,
    lastError: null,
  })
}

/** Mescla snapshot do crm-bridge (Evolution) no estado local do CRM. */
export function hydrateCrmFromBridge(payload: {
  connection?: Partial<{
    status: CrmConnectionStatus
    accountName: string
    accountPhone: string
    connectedAt: number | null
    lastSyncAt: number | null
    qrBase64: string | null
    pairingCode: string | null
    lastError: string | null
    crmOpen?: boolean
    sessionReady?: boolean
    needsConfirm?: boolean
  }>
  labels?: CrmLabel[]
  leads?: CrmLead[]
  scoreRules?: CrmScoreRule[]
  backups?: CrmBackup[]
}) {
  return update((current) => {
    const connection = payload.connection || {}
    const crmOpen = connection.crmOpen === true
    // Sem confirmação do usuário, nunca sobe para connected
    let status = connection.status || current.status
    if (status === 'connected' && !crmOpen) {
      status = 'connecting'
    }
    return {
      ...current,
      connectionMode: 'evolution',
      status,
      accountName: connection.accountName ?? current.accountName,
      accountPhone: connection.accountPhone ?? current.accountPhone,
      connectedAt:
        connection.connectedAt === undefined ? current.connectedAt : connection.connectedAt,
      lastSyncAt: connection.lastSyncAt ?? current.lastSyncAt ?? Date.now(),
      qrBase64: connection.qrBase64 === undefined ? current.qrBase64 : connection.qrBase64,
      pairingCode:
        connection.pairingCode === undefined ? current.pairingCode : connection.pairingCode,
      lastError: connection.lastError === undefined ? current.lastError : connection.lastError,
      labels: payload.labels?.length ? payload.labels : current.labels,
      leads: Array.isArray(payload.leads) ? payload.leads : current.leads,
      scoreRules: payload.scoreRules?.length ? payload.scoreRules : current.scoreRules,
      backups: Array.isArray(payload.backups) ? payload.backups : current.backups,
    }
  })
}

/** Simula reconexão automática ao abrir o CRM se já estava conectado. */
export function ensureCrmSession() {
  const current = readState()
  if (current.status !== 'connected') return current
  return update({ lastSyncAt: Date.now() })
}

export function syncCrmNow() {
  const current = readState()
  if (current.status !== 'connected') return current
  return update({ lastSyncAt: Date.now() })
}

export function setCrmLeadLabel(leadId: string, labelId: CrmLabelId) {
  return update((current) => ({
    ...current,
    leads: current.leads.map((lead) =>
      lead.id === leadId ? { ...lead, labelId, updatedAt: Date.now() } : lead,
    ),
    lastSyncAt: Date.now(),
  }))
}

export function updateCrmScoreRules(rules: CrmScoreRule[]) {
  return update((current) => {
    const leads = current.leads.map((lead) => applyScoreToLead(lead, rules))
    return { ...current, scoreRules: rules, leads, lastSyncAt: Date.now() }
  })
}

export function createCrmBackup(note = 'Backup manual') {
  return update((current) => {
    const backup: CrmBackup = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      leadCount: current.leads.length,
      note,
    }
    return {
      ...current,
      backups: [backup, ...current.backups].slice(0, 20),
    }
  })
}

export function reanalyzeCrmLead(leadId: string) {
  return update((current) => ({
    ...current,
    leads: current.leads.map((lead) => {
      if (lead.id !== leadId) return lead
      const analyzed = analyzeConversation(lead.messages, current.scoreRules, lead)
      return { ...lead, ...analyzed, updatedAt: Date.now() }
    }),
    lastSyncAt: Date.now(),
  }))
}

export function addCrmDemoMessage(leadId: string, text: string, from: 'client' | 'store' = 'client') {
  return update((current) => ({
    ...current,
    leads: current.leads.map((lead) => {
      if (lead.id !== leadId) return lead
      const messages: CrmMessage[] = [
        ...lead.messages,
        { id: crypto.randomUUID(), from, text, at: Date.now() },
      ]
      const analyzed = analyzeConversation(messages, current.scoreRules, lead)
      return { ...lead, messages, ...analyzed, updatedAt: Date.now() }
    }),
    lastSyncAt: Date.now(),
  }))
}

export function applyScoreToLead(lead: CrmLead, rules: CrmScoreRule[]): CrmLead {
  const corpus = [
    lead.eventType,
    lead.suitInterest,
    lead.aiSummary,
    ...lead.messages.map((message) => message.text),
  ]
    .join(' ')
    .toLocaleLowerCase('pt-BR')

  const hits: CrmScoreHit[] = []
  for (const rule of rules) {
    if (!rule.enabled || !rule.keyword.trim()) continue
    const key = rule.keyword.trim().toLocaleLowerCase('pt-BR')
    if (corpus.includes(key)) {
      hits.push({ ruleId: rule.id, label: rule.keyword, points: rule.points })
    }
  }
  const score = hits.reduce((sum, hit) => sum + hit.points, 0)
  return { ...lead, score, scoreHits: hits }
}

export function analyzeConversation(
  messages: CrmMessage[],
  rules: CrmScoreRule[],
  base?: Partial<CrmLead>,
) {
  const clientText = messages
    .filter((message) => message.from === 'client')
    .map((message) => message.text)
    .join(' ')
  const lower = clientText.toLocaleLowerCase('pt-BR')

  let eventType = base?.eventType ?? ''
  if (/\bcasamento\b/.test(lower)) eventType = 'Casamento'
  else if (/\bformatura\b/.test(lower)) eventType = 'Formatura'
  else if (/\bfesta\b/.test(lower)) eventType = 'Festa'
  else if (/\banivers[aá]rio\b/.test(lower)) eventType = 'Aniversário'

  let suitInterest = base?.suitInterest ?? ''
  if (/terno azul|azul marinho|azul/.test(lower)) suitInterest = 'Terno azul'
  else if (/off[\s-]?white|offwhite/.test(lower)) suitInterest = 'Off white'
  else if (/cinza/.test(lower)) suitInterest = 'Cinza'
  else if (/preto/.test(lower)) suitInterest = 'Preto'
  else if (/colorido|colorida/.test(lower)) suitInterest = 'Colorido'

  let eventDate = base?.eventDate ?? ''
  const dateMatch =
    lower.match(/\b(\d{1,2})\s*(?:\/|-|de)\s*(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|\d{1,2})\b/i) ||
    lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (dateMatch) {
    eventDate = dateMatch[0].replace(/\s+/g, ' ')
  }

  let name = base?.name ?? ''
  const nameMatch = clientText.match(/(?:meu nome [eé]|eu sou(?: a| o)?|aqui [eé](?: o| a)?)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç]+)?)/i)
  if (nameMatch?.[1]) name = nameMatch[1].trim()

  const parts = [
    name ? `Lead ${name}` : 'Lead em atendimento',
    eventType ? `evento: ${eventType}` : null,
    eventDate ? `data: ${eventDate}` : null,
    suitInterest ? `interesse: ${suitInterest}` : null,
  ].filter(Boolean)

  const draft: CrmLead = {
    id: base?.id ?? 'temp',
    name: name || base?.name || 'Cliente WhatsApp',
    phone: base?.phone ?? '',
    labelId: base?.labelId ?? 'novo',
    eventType,
    eventDate,
    suitInterest,
    score: 0,
    scoreHits: [],
    aiSummary: parts.join(' · '),
    messages,
    createdAt: base?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  }

  const scored = applyScoreToLead(draft, rules)
  return {
    name: scored.name,
    eventType: scored.eventType,
    eventDate: scored.eventDate,
    suitInterest: scored.suitInterest,
    aiSummary: scored.aiSummary,
    score: scored.score,
    scoreHits: scored.scoreHits,
  }
}

function seedDemoLeads(rules: CrmScoreRule[]): CrmLead[] {
  const now = Date.now()
  const samples: Array<Omit<CrmLead, 'score' | 'scoreHits' | 'aiSummary'> & { aiSummary?: string }> = [
    {
      id: 'lead-1',
      name: 'Rodrigo Alves',
      phone: '(47) 98811-2200',
      labelId: 'pago',
      eventType: 'Casamento',
      eventDate: '15/11/2026',
      suitInterest: 'Terno azul',
      messages: [
        { id: 'm1', from: 'client', text: 'Oi, meu nome é Rodrigo Alves', at: now - 86400000 * 4 },
        { id: 'm2', from: 'store', text: 'Olá! Qual o tipo de evento?', at: now - 86400000 * 4 + 60000 },
        { id: 'm3', from: 'client', text: 'É casamento dia 15/11/2026', at: now - 86400000 * 4 + 120000 },
        { id: 'm4', from: 'store', text: 'E qual ideia de traje?', at: now - 86400000 * 4 + 180000 },
        { id: 'm5', from: 'client', text: 'Tenho interesse em um terno azul', at: now - 86400000 * 4 + 240000 },
      ],
      createdAt: now - 86400000 * 4,
      updatedAt: now - 86400000,
    },
    {
      id: 'lead-2',
      name: 'Camila Souza',
      phone: '(47) 99122-3344',
      labelId: 'agendamento',
      eventType: 'Formatura',
      eventDate: '20 de dezembro',
      suitInterest: 'Off white',
      messages: [
        { id: 'm6', from: 'client', text: 'Boa tarde, aqui é a Camila Souza', at: now - 86400000 * 2 },
        { id: 'm7', from: 'store', text: 'Oi Camila! Qual evento?', at: now - 86400000 * 2 + 50000 },
        { id: 'm8', from: 'client', text: 'Formatura dia 20 de dezembro, pensando em off white', at: now - 86400000 * 2 + 90000 },
      ],
      createdAt: now - 86400000 * 2,
      updatedAt: now - 3600000,
    },
    {
      id: 'lead-3',
      name: 'Lucas Pereira',
      phone: '(48) 98456-7788',
      labelId: 'sem-resposta',
      eventType: 'Festa',
      eventDate: '',
      suitInterest: 'Cinza',
      messages: [
        { id: 'm9', from: 'client', text: 'Queria um terno cinza para uma festa', at: now - 86400000 * 6 },
        { id: 'm10', from: 'store', text: 'Perfeito! Qual a data do evento?', at: now - 86400000 * 6 + 40000 },
        { id: 'm11', from: 'store', text: 'Lucas, conseguiu ver a data pra gente?', at: now - 86400000 * 3 },
        { id: 'm12', from: 'store', text: 'Última tentativa — ainda te ajudamos no traje cinza 😊', at: now - 86400000 },
      ],
      createdAt: now - 86400000 * 6,
      updatedAt: now - 86400000,
    },
    {
      id: 'lead-4',
      name: 'Ana Beatriz',
      phone: '(47) 99770-1122',
      labelId: 'acompanhar',
      eventType: 'Casamento',
      eventDate: '08/03/2027',
      suitInterest: 'Colorido',
      messages: [
        { id: 'm13', from: 'client', text: 'Eu sou a Ana Beatriz', at: now - 86400000 },
        { id: 'm14', from: 'client', text: 'Casamento 08/03/2027, quero algo colorido', at: now - 86400000 + 30000 },
      ],
      createdAt: now - 86400000,
      updatedAt: now - 7200000,
    },
    {
      id: 'lead-5',
      name: 'Cliente WhatsApp',
      phone: '(47) 99900-4455',
      labelId: 'novo',
      eventType: '',
      eventDate: '',
      suitInterest: '',
      messages: [
        { id: 'm15', from: 'client', text: 'Oi, vi o Instagram de vocês', at: now - 1800000 },
        { id: 'm16', from: 'store', text: 'Olá! Seu evento é casamento, formatura ou outro?', at: now - 1700000 },
      ],
      createdAt: now - 1800000,
      updatedAt: now - 1700000,
    },
  ]

  return samples.map((sample) => {
    const analyzed = analyzeConversation(sample.messages, rules, sample)
    return {
      ...sample,
      ...analyzed,
    }
  })
}
