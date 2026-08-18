export type UserProfile = {
  nome: string
  sobrenomes: string
  chamado: string
  email: string
  cpf: string
  birthDate: string
  login: string
  password: string
  phone: string
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
  phone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  estado: '',
  cidade: '',
  bairro: '',
  avatarDataUrl: '',
}

function readProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_USER_PROFILE }
    const parsed = JSON.parse(raw) as Partial<UserProfile>
    return { ...DEFAULT_USER_PROFILE, ...parsed }
  } catch {
    return { ...DEFAULT_USER_PROFILE }
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
