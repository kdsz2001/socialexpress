export type ShopPhone = {
  id: string
  number: string
  isPrimary: boolean
  hasWhatsapp: boolean
}

export type ShopSettings = {
  logoDataUrl: string
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  email: string
  phones: ShopPhone[]
  cep: string
  logradouro: string
  numero: string
  complemento: string
  estado: string
  cidade: string
  bairro: string
}

const STORAGE_KEY = 'social-express:shop-settings'

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  logoDataUrl: '',
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  email: '',
  phones: [
    {
      id: 'phone-1',
      number: '',
      isPrimary: true,
      hasWhatsapp: false,
    },
  ],
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  estado: 'Santa Catarina',
  cidade: '',
  bairro: '',
}

let cached: ShopSettings | null = null

function normalize(raw: unknown): ShopSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SHOP_SETTINGS }
  const item = raw as Partial<ShopSettings>
  const phones = Array.isArray(item.phones) && item.phones.length > 0
    ? item.phones.map((phone, index) => ({
        id: typeof phone?.id === 'string' ? phone.id : `phone-${index + 1}`,
        number: typeof phone?.number === 'string' ? phone.number : '',
        isPrimary: Boolean(phone?.isPrimary),
        hasWhatsapp: Boolean(phone?.hasWhatsapp),
      }))
    : DEFAULT_SHOP_SETTINGS.phones.map((phone) => ({ ...phone }))

  if (!phones.some((phone) => phone.isPrimary) && phones[0]) {
    phones[0] = { ...phones[0], isPrimary: true }
  }

  return {
    logoDataUrl: typeof item.logoDataUrl === 'string' ? item.logoDataUrl : '',
    razaoSocial: typeof item.razaoSocial === 'string' ? item.razaoSocial : '',
    nomeFantasia: typeof item.nomeFantasia === 'string' ? item.nomeFantasia : '',
    cnpj: typeof item.cnpj === 'string' ? item.cnpj : '',
    email: typeof item.email === 'string' ? item.email : '',
    phones,
    cep: typeof item.cep === 'string' ? item.cep : '',
    logradouro: typeof item.logradouro === 'string' ? item.logradouro : '',
    numero: typeof item.numero === 'string' ? item.numero : '',
    complemento: typeof item.complemento === 'string' ? item.complemento : '',
    estado: typeof item.estado === 'string' ? item.estado : 'Santa Catarina',
    cidade: typeof item.cidade === 'string' ? item.cidade : '',
    bairro: typeof item.bairro === 'string' ? item.bairro : '',
  }
}

export function getShopSettings(): ShopSettings {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cached = raw ? normalize(JSON.parse(raw)) : { ...DEFAULT_SHOP_SETTINGS, phones: DEFAULT_SHOP_SETTINGS.phones.map((p) => ({ ...p })) }
  } catch {
    cached = { ...DEFAULT_SHOP_SETTINGS, phones: DEFAULT_SHOP_SETTINGS.phones.map((p) => ({ ...p })) }
  }
  return cached
}

export function saveShopSettings(next: ShopSettings) {
  const normalized = normalize(next)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  cached = normalized
  window.dispatchEvent(new Event('social-express:shop-settings-changed'))
}

export function subscribeShopSettings(onChange: () => void) {
  const handler = () => {
    cached = null
    onChange()
  }
  window.addEventListener('social-express:shop-settings-changed', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('social-express:shop-settings-changed', handler)
    window.removeEventListener('storage', handler)
  }
}
