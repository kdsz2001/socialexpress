import {
  buildFieldDiffs,
  logClientCreated,
  logClientDeleted,
  logClientUpdated,
} from './historyLog'
import { formatHistoryDate } from './historyStore'

export type ClientPhone = {
  number: string
  primary: boolean
  whatsapp: boolean
}

export type ClientMeasure = {
  type: string
  value: string
}

export type ClientGender = 'feminino' | 'masculino' | 'outros' | ''

export type Client = {
  id: string
  cpfCnpj: string
  rg: string
  gender: ClientGender
  nome: string
  sobrenomes: string
  chamado: string
  birthDate: string
  email: string
  phones: ClientPhone[]
  facebook: string
  instagram: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  estado: string
  cidade: string
  bairro: string
  notifyEmail: boolean
  measures: ClientMeasure[]
  observacoes: string
  active: boolean
  createdAt: string
}

const STORAGE_KEY = 'social-express:clients'
const CHANGE_EVENT = 'social-express:clients-changed'

let cache: Client[] | null = null

function normalizeClient(client: Client): Client {
  return {
    ...client,
    active: client.active !== false,
  }
}

function readAll(): Client[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      cache = []
      return cache
    }
    const parsed = JSON.parse(raw) as Client[]
    cache = Array.isArray(parsed) ? parsed.map(normalizeClient) : []
    return cache
  } catch {
    cache = []
    return cache
  }
}

function writeAll(clients: Client[]) {
  cache = clients
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getClients(): Client[] {
  return readAll()
}

type ClientInput = Omit<Client, 'id' | 'createdAt' | 'active'> & {
  id?: string
  createdAt?: string
  active?: boolean
}

/** Insere vários clientes de uma vez (1 write), ignorando CPF já existente. */
export function addClientsBulk(inputs: ClientInput[]): number {
  const current = readAll()
  const seen = new Set(
    current.map((client) => client.cpfCnpj.replace(/\D/g, '')),
  )
  const created: Client[] = []

  for (const input of inputs) {
    const digits = input.cpfCnpj.replace(/\D/g, '')
    if (!digits || seen.has(digits)) continue
    seen.add(digits)
    created.push(
      normalizeClient({
        ...input,
        active: input.active !== false,
        id: input.id ?? crypto.randomUUID(),
        createdAt: input.createdAt ?? new Date().toISOString(),
      }),
    )
  }

  if (!created.length) return 0
  writeAll([...created, ...current])
  for (const client of created) {
    logClientCreated(getClientDisplayName(client))
  }
  return created.length
}

export function addClient(input: ClientInput): Client | null {
  if (isCpfCnpjRegistered(input.cpfCnpj)) {
    return null
  }
  const client: Client = {
    ...input,
    active: input.active !== false,
    id: input.id ?? crypto.randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
  writeAll([client, ...readAll()])
  logClientCreated(getClientDisplayName(client))
  return client
}

export function getClient(id: string): Client | undefined {
  return readAll().find((client) => client.id === id)
}

/** True if another client already has the same CPF/CNPJ (digits only). */
export function isCpfCnpjRegistered(
  cpfCnpj: string,
  exceptClientId?: string,
): boolean {
  const digits = cpfCnpj.replace(/\D/g, '')
  if (!digits) return false
  return readAll().some((client) => {
    if (exceptClientId && client.id === exceptClientId) return false
    return client.cpfCnpj.replace(/\D/g, '') === digits
  })
}

export function updateClient(
  id: string,
  patch: Partial<Omit<Client, 'id' | 'createdAt'>>,
): Client | null {
  const current = readAll()
  const index = current.findIndex((client) => client.id === id)
  if (index < 0) return null
  const before = current[index]
  const updated = normalizeClient({ ...before, ...patch, id })
  const next = [...current]
  next[index] = updated
  writeAll(next)

  const diffs = buildFieldDiffs(
    {
      nome: before.nome,
      sobrenomes: before.sobrenomes,
      chamado: before.chamado,
      birthDate: before.birthDate ? formatHistoryDate(before.birthDate) : '',
      email: before.email,
      cpfCnpj: before.cpfCnpj,
      phones: JSON.stringify(before.phones),
      active: before.active,
      cidade: before.cidade,
      bairro: before.bairro,
    },
    {
      nome: updated.nome,
      sobrenomes: updated.sobrenomes,
      chamado: updated.chamado,
      birthDate: updated.birthDate ? formatHistoryDate(updated.birthDate) : '',
      email: updated.email,
      cpfCnpj: updated.cpfCnpj,
      phones: JSON.stringify(updated.phones),
      active: updated.active,
      cidade: updated.cidade,
      bairro: updated.bairro,
    },
    {
      nome: 'nome',
      sobrenomes: 'sobrenomes',
      chamado: 'chamado',
      birthDate: 'data de nascimento',
      email: 'email',
      cpfCnpj: 'cpf/cnpj',
      phones: 'telefones',
      active: 'ativo',
      cidade: 'cidade',
      bairro: 'bairro',
    },
  )
  logClientUpdated(getClientDisplayName(updated), diffs)
  return updated
}

export function deleteClient(id: string) {
  const client = readAll().find((item) => item.id === id)
  writeAll(readAll().filter((item) => item.id !== id))
  if (client) logClientDeleted(getClientDisplayName(client))
}

export function getClientDisplayName(client: Client) {
  const full = [client.nome, client.sobrenomes].filter(Boolean).join(' ').trim()
  return client.chamado.trim() || full || 'Cliente'
}

export function getClientPrimaryPhone(client: Client): ClientPhone | null {
  if (!client.phones.length) return null
  return (
    client.phones.find((phone) => phone.primary && phone.number.trim()) ||
    client.phones.find((phone) => phone.whatsapp && phone.number.trim()) ||
    client.phones.find((phone) => phone.number.trim()) ||
    null
  )
}

/** Monta link wa.me com DDI 55 quando o número for BR (10/11 dígitos). */
export function buildWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const withCountry =
    digits.length === 10 || digits.length === 11 ? `55${digits}` : digits
  return `https://wa.me/${withCountry}`
}

export function subscribeClients(onChange: () => void) {
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
