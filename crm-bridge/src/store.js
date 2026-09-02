import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeConversation } from './ai.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'crm-bridge.json')

const DEFAULT_LABELS = [
  { id: 'novo', name: 'Novo', color: '#3699ff' },
  { id: 'sem-resposta', name: 'Sem resposta', color: '#ffa800' },
  { id: 'acompanhar', name: 'Acompanhar', color: '#8950fc' },
  { id: 'agendamento', name: 'Agendamento', color: '#1bc5bd' },
  { id: 'pago', name: 'Pago', color: '#0bb783' },
  { id: 'perdido', name: 'Perdido', color: '#f64e60' },
]

function emptyState() {
  return {
    connection: {
      status: 'disconnected',
      accountName: '',
      accountPhone: '',
      connectedAt: null,
      lastSyncAt: null,
      qrBase64: null,
      pairingCode: null,
      lastError: null,
    },
    labels: DEFAULT_LABELS,
    leads: [],
    scoreRules: [
      { id: 'rule-casamento', keyword: 'casamento', points: 35, enabled: true },
      { id: 'rule-formatura', keyword: 'formatura', points: 25, enabled: true },
      { id: 'rule-terno-azul', keyword: 'terno azul', points: 40, enabled: true },
      { id: 'rule-cinza', keyword: 'cinza', points: 30, enabled: true },
      { id: 'rule-off-white', keyword: 'off white', points: 30, enabled: true },
    ],
    backups: [],
  }
}

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(emptyState(), null, 2))
  }
}

export function readBridgeState() {
  ensureFile()
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    return { ...emptyState(), ...parsed }
  } catch {
    return emptyState()
  }
}

export function writeBridgeState(next) {
  ensureFile()
  fs.writeFileSync(DATA_FILE, JSON.stringify(next, null, 2))
  return next
}

export function patchConnection(patch) {
  const state = readBridgeState()
  state.connection = { ...state.connection, ...patch, lastSyncAt: Date.now() }
  return writeBridgeState(state)
}

export function upsertIncomingMessage({ phone, pushName, text, fromMe, at, id }) {
  const state = readBridgeState()
  const cleanPhone = String(phone || '').replace(/\D/g, '')
  if (!cleanPhone || !text) return state

  let lead = state.leads.find((item) => item.phoneDigits === cleanPhone)
  const message = {
    id: id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    from: fromMe ? 'store' : 'client',
    text: String(text),
    at: at || Date.now(),
  }

  if (!lead) {
    lead = {
      id: `lead-${cleanPhone}`,
      name: pushName || 'Cliente WhatsApp',
      phone: formatBrPhone(cleanPhone),
      phoneDigits: cleanPhone,
      labelId: 'novo',
      eventType: '',
      eventDate: '',
      suitInterest: '',
      score: 0,
      scoreHits: [],
      aiSummary: '',
      messages: [message],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    state.leads.unshift(lead)
  } else {
    const exists = (lead.messages || []).some((item) => item.id === message.id)
    if (!exists) {
      lead.messages = [...(lead.messages || []), message]
        .sort((a, b) => a.at - b.at)
        .slice(-200)
    }
    if (pushName && (lead.name === 'Cliente WhatsApp' || lead.name === 'Contato WhatsApp')) {
      lead.name = pushName
    }
    lead.updatedAt = Math.max(lead.updatedAt || 0, message.at)
  }

  if ((lead.messages || []).length) {
    const analyzed = analyzeConversation(lead.messages, state.scoreRules, lead)
    Object.assign(lead, analyzed)
  }
  state.connection.lastSyncAt = Date.now()
  return writeBridgeState(state)
}

/** Importa lote de conversas (sync histórico). */
export function importConversations(conversations = []) {
  let state = readBridgeState()
  for (const conversation of conversations) {
    const phone = String(conversation.phone || '').replace(/\D/g, '')
    if (!phone) continue

    if (!conversation.messages?.length) {
      let lead = state.leads.find((item) => item.phoneDigits === phone)
      if (!lead) {
        lead = {
          id: `lead-${phone}`,
          name: conversation.pushName || 'Contato WhatsApp',
          phone: formatBrPhone(phone),
          phoneDigits: phone,
          labelId: 'novo',
          eventType: '',
          eventDate: '',
          suitInterest: '',
          score: 0,
          scoreHits: [],
          aiSummary: '',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        state.leads.unshift(lead)
        state = writeBridgeState(state)
      }
      continue
    }

    for (const message of conversation.messages) {
      state = upsertIncomingMessage({
        phone,
        pushName: conversation.pushName || message.pushName || '',
        text: message.text,
        fromMe: message.fromMe,
        at: message.at,
        id: message.id,
      })
    }
  }
  return readBridgeState()
}

export function setLeadLabel(leadId, labelId) {
  const state = readBridgeState()
  state.leads = state.leads.map((lead) =>
    lead.id === leadId ? { ...lead, labelId, updatedAt: Date.now() } : lead,
  )
  return writeBridgeState(state)
}

export function createBackup(note = 'Backup bridge') {
  const state = readBridgeState()
  state.backups = [
    {
      id: `bkp-${Date.now()}`,
      createdAt: Date.now(),
      leadCount: state.leads.length,
      note,
    },
    ...state.backups,
  ].slice(0, 30)
  return writeBridgeState(state)
}

function formatBrPhone(digits) {
  if (digits.length === 13 && digits.startsWith('55')) {
    const local = digits.slice(2)
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  return digits
}
