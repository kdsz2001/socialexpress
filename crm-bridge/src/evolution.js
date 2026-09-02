const BASE = () => (process.env.EVOLUTION_BASE_URL || '').replace(/\/$/, '')
const KEY = () => process.env.EVOLUTION_API_KEY || ''
const INSTANCE = () => process.env.EVOLUTION_INSTANCE || 'social-express'

function headers() {
  return {
    apikey: KEY(),
    'Content-Type': 'application/json',
  }
}

export function evolutionConfigured() {
  return Boolean(BASE() && KEY())
}

async function evoFetch(pathname, options = {}) {
  if (!evolutionConfigured()) {
    throw new Error('Evolution não configurada (EVOLUTION_BASE_URL / EVOLUTION_API_KEY)')
  }
  const response = await fetch(`${BASE()}${pathname}`, {
    ...options,
    headers: {
      ...headers(),
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error?.message ||
      data?.response?.message ||
      `Evolution HTTP ${response.status}`
    const error = new Error(typeof message === 'string' ? message : JSON.stringify(message))
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

export async function ensureInstance(webhookUrl) {
  const name = INSTANCE()
  try {
    await evoFetch(`/instance/connectionState/${encodeURIComponent(name)}`)
  } catch (error) {
    if (error.status !== 404) {
      // tenta criar mesmo assim se não existir
    }
    try {
      await evoFetch('/instance/create', {
        method: 'POST',
        body: JSON.stringify({
          instanceName: name,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          webhook: webhookUrl
            ? {
                enabled: true,
                url: webhookUrl,
                webhookByEvents: true,
                webhookBase64: false,
                events: [
                  'QRCODE_UPDATED',
                  'CONNECTION_UPDATE',
                  'MESSAGES_UPSERT',
                  'MESSAGES_UPDATE',
                ],
              }
            : undefined,
        }),
      })
    } catch (createError) {
      // Instância já existe
      if (createError.status !== 403 && createError.status !== 409) {
        const msg = String(createError.message || '')
        if (!/already|exist|existe/i.test(msg)) throw createError
      }
    }
  }

  if (webhookUrl) {
    try {
      await evoFetch(`/webhook/set/${encodeURIComponent(name)}`, {
        method: 'POST',
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: true,
            webhookBase64: false,
            events: [
              'QRCODE_UPDATED',
              'CONNECTION_UPDATE',
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
            ],
          },
        }),
      })
    } catch {
      // webhook opcional se a versão da API diferir
    }
  }

  return name
}

export async function fetchQr() {
  const name = INSTANCE()
  const data = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`)
  const base64 =
    data?.base64 ||
    data?.qrcode?.base64 ||
    data?.qrcode?.code ||
    data?.code ||
    null
  return {
    raw: data,
    base64: typeof base64 === 'string' && base64.startsWith('data:') ? base64 : base64 ? `data:image/png;base64,${base64}` : null,
  }
}

export async function fetchConnectionState() {
  const name = INSTANCE()
  const data = await evoFetch(`/instance/connectionState/${encodeURIComponent(name)}`)
  const state =
    data?.instance?.state ||
    data?.state ||
    data?.status ||
    data?.connectionState ||
    'close'
  return { raw: data, state: String(state).toLowerCase() }
}

export async function logoutInstance() {
  const name = INSTANCE()
  try {
    await evoFetch(`/instance/logout/${encodeURIComponent(name)}`, { method: 'DELETE' })
  } catch {
    try {
      await evoFetch(`/instance/delete/${encodeURIComponent(name)}`, { method: 'DELETE' })
    } catch {
      // ignore
    }
  }
}

export function getInstanceName() {
  return INSTANCE()
}
