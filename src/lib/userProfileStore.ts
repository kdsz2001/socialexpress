export type UserPhone = {
  number: string
  primary: boolean
  whatsapp: boolean
}

export type CalendarViewPreference = 'mes' | 'semana'

export type QuickShortcutId =
  | 'relatorioIndisponibilidade'
  | 'consultarProdutos'
  | 'criarCliente'
  | 'novaDespesa'
  | 'novaReceita'
  | 'criarPedido'
  | 'criarProduto'
  | 'criarFornecedor'
  | 'criarUsuario'
  | 'relatorioSeparacao'
  | 'relatorioPedidos'

export type UserPreferences = {
  calendarView: CalendarViewPreference
  shortcuts: Record<QuickShortcutId, boolean>
}

export const QUICK_SHORTCUTS: Array<{ id: QuickShortcutId; label: string }> = [
  { id: 'relatorioIndisponibilidade', label: 'Ver relatório de indisponibilidade' },
  { id: 'consultarProdutos', label: 'Consultar produtos' },
  { id: 'criarCliente', label: 'Criar cliente' },
  { id: 'novaDespesa', label: 'Nova despesa' },
  { id: 'novaReceita', label: 'Nova receita' },
  { id: 'criarPedido', label: 'Criar pedido' },
  { id: 'criarProduto', label: 'Criar produto' },
  { id: 'criarFornecedor', label: 'Criar fornecedor' },
  { id: 'criarUsuario', label: 'Criar usuário' },
  { id: 'relatorioSeparacao', label: 'Relatório de separação' },
  { id: 'relatorioPedidos', label: 'Relatório de pedidos' },
]

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  calendarView: 'mes',
  shortcuts: {
    relatorioIndisponibilidade: false,
    consultarProdutos: false,
    criarCliente: false,
    novaDespesa: false,
    novaReceita: false,
    criarPedido: false,
    criarProduto: false,
    criarFornecedor: false,
    criarUsuario: false,
    relatorioSeparacao: false,
    relatorioPedidos: false,
  },
}

export type UserProfile = {
  nome: string
  sobrenomes: string
  chamado: string
  email: string
  cpf: string
  birthDate: string
  login: string
  password: string
  phones: UserPhone[]
  cep: string
  logradouro: string
  numero: string
  complemento: string
  estado: string
  cidade: string
  bairro: string
  /** Data URL da imagem de perfil (JPG/JPEG). */
  avatarDataUrl: string
  preferences: UserPreferences
}

const STORAGE_KEY = 'social-express:user-profile'
const CHANGE_EVENT = 'social-express:user-profile-changed'

export const DEFAULT_USER_PROFILE: UserProfile = {
  nome: 'Kelton Djames Schulze',
  sobrenomes: '',
  chamado: 'Kelton Djames Schulze',
  email: 'keltondjames2k01@gmail.com',
  cpf: '',
  birthDate: '',
  login: 'djamesz',
  password: '',
  phones: [{ number: '', primary: true, whatsapp: true }],
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  estado: '',
  cidade: '',
  bairro: '',
  avatarDataUrl: '',
  preferences: {
    calendarView: DEFAULT_USER_PREFERENCES.calendarView,
    shortcuts: { ...DEFAULT_USER_PREFERENCES.shortcuts },
  },
}

function normalizePhones(raw: Partial<UserProfile> & { phone?: string }): UserPhone[] {
  if (Array.isArray(raw.phones) && raw.phones.length > 0) {
    return raw.phones.map((phone, index) => ({
      number: phone?.number ?? '',
      primary: Boolean(phone?.primary) || index === 0,
      whatsapp: Boolean(phone?.whatsapp),
    }))
  }
  if (typeof raw.phone === 'string' && raw.phone.trim()) {
    return [{ number: raw.phone, primary: true, whatsapp: true }]
  }
  return [{ number: '', primary: true, whatsapp: true }]
}

function normalizePreferences(
  raw: Partial<UserPreferences> | undefined,
): UserPreferences {
  const calendarView =
    raw?.calendarView === 'semana' || raw?.calendarView === 'mes'
      ? raw.calendarView
      : DEFAULT_USER_PREFERENCES.calendarView

  const shortcuts = { ...DEFAULT_USER_PREFERENCES.shortcuts }
  if (raw?.shortcuts && typeof raw.shortcuts === 'object') {
    for (const item of QUICK_SHORTCUTS) {
      if (typeof raw.shortcuts[item.id] === 'boolean') {
        shortcuts[item.id] = raw.shortcuts[item.id]
      }
    }
  }

  return { calendarView, shortcuts }
}

function readProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        ...DEFAULT_USER_PROFILE,
        phones: [...DEFAULT_USER_PROFILE.phones],
        preferences: {
          calendarView: DEFAULT_USER_PREFERENCES.calendarView,
          shortcuts: { ...DEFAULT_USER_PREFERENCES.shortcuts },
        },
      }
    }
    const parsed = JSON.parse(raw) as Partial<UserProfile> & { phone?: string }
    const { phone: _legacyPhone, ...rest } = parsed
    return {
      ...DEFAULT_USER_PROFILE,
      ...rest,
      phones: normalizePhones(parsed),
      preferences: normalizePreferences(parsed.preferences),
    }
  } catch {
    return {
      ...DEFAULT_USER_PROFILE,
      phones: [...DEFAULT_USER_PROFILE.phones],
      preferences: {
        calendarView: DEFAULT_USER_PREFERENCES.calendarView,
        shortcuts: { ...DEFAULT_USER_PREFERENCES.shortcuts },
      },
    }
  }
}

export function getUserProfile(): UserProfile {
  return readProfile()
}

export function getUserDisplayName(profile: UserProfile = readProfile()) {
  const full = [profile.nome, profile.sobrenomes].filter(Boolean).join(' ').trim()
  return profile.chamado.trim() || full || 'Usuário'
}

export function updateUserProfile(patch: Partial<UserProfile>): UserProfile {
  const current = readProfile()
  const next = { ...current, ...patch }
  if (patch.phones) {
    next.phones = normalizePhones({ phones: patch.phones })
  }
  if (patch.preferences) {
    next.preferences = normalizePreferences({
      ...current.preferences,
      ...patch.preferences,
      shortcuts: {
        ...current.preferences.shortcuts,
        ...patch.preferences.shortcuts,
      },
    })
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(CHANGE_EVENT))
  return next
}

export function subscribeUserProfile(onChange: () => void) {
  const handler = () => onChange()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}
