export type UserPhone = {
  number: string
  primary: boolean
  whatsapp: boolean
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

function readProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_USER_PROFILE, phones: [...DEFAULT_USER_PROFILE.phones] }
    const parsed = JSON.parse(raw) as Partial<UserProfile> & { phone?: string }
    const { phone: _legacyPhone, ...rest } = parsed
    return {
      ...DEFAULT_USER_PROFILE,
      ...rest,
      phones: normalizePhones(parsed),
    }
  } catch {
    return { ...DEFAULT_USER_PROFILE, phones: [...DEFAULT_USER_PROFILE.phones] }
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
  const next = { ...readProfile(), ...patch }
  if (patch.phones) {
    next.phones = normalizePhones({ phones: patch.phones })
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
