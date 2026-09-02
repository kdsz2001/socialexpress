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
  } catch {
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizePhone(number) {
  const digits = String(number || '').replace(/\D/g, '')
  if (!digits) return ''

  let local = digits
  if (local.startsWith('55') && local.length >= 12) local = local.slice(2)
  if (local.length > 11) local = local.slice(-11)

  // Celular BR antigo sem o 9
  if (local.length === 10 && /^[1-9]{2}[6-9]/.test(local)) {
    local = `${local.slice(0, 2)}9${local.slice(2)}`
  }

  if (local.length < 10 || local.length > 11) return ''
  return `55${local}`
}

function extractQrBase64(data) {
  const base64 =
    data?.base64 ||
    data?.qrcode?.base64 ||
    data?.qrcode?.code ||
    (typeof data?.code === 'string' && data.code.startsWith('data:') ? data.code : null) ||
    null
  if (!base64 || typeof base64 !== 'string') return null
  return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
}

function extractPairingCode(data) {
  const code =
    data?.pairingCode ||
    data?.qrcode?.pairingCode ||
    data?.pair?.code ||
    null
  return typeof code === 'string' && code.trim() ? code.trim().toUpperCase() : null
}

export async function fetchQr() {
  const name = INSTANCE()
  let data = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`)
  let base64 = extractQrBase64(data)
  // Evolution às vezes demora 1–2s para montar o QR
  for (let i = 0; !base64 && i < 2; i += 1) {
    await sleep(900)
    data = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`)
    base64 = extractQrBase64(data)
  }
  return {
    raw: data,
    base64,
    pairingCode: extractPairingCode(data),
  }
}

/** Gera código de pareamento (WhatsApp → Conectar com número). */
export async function fetchPairingCode(phoneNumber) {
  const name = INSTANCE()
  const number = normalizePhone(phoneNumber)
  if (!number || number.length < 12 || number.length > 13) {
    throw new Error('Informe o WhatsApp com DDD (11 dígitos). Ex: 48988650977')
  }

  // Se a instância ficou "connecting" no QR, pairing code não sai — reinicia sessão
  try {
    const state = await fetchConnectionState()
    if (state.state === 'connecting' || state.state === 'open') {
      await logoutInstance()
      await sleep(800)
    }
  } catch {
    // segue mesmo assim
  }

  await ensureInstance()
  const data = await evoFetch(
    `/instance/connect/${encodeURIComponent(name)}?number=${encodeURIComponent(number)}`,
  )
  let pairingCode = extractPairingCode(data)
  let base64 = extractQrBase64(data)
  let raw = data

  if (!pairingCode) {
    await sleep(1000)
    raw = await evoFetch(
      `/instance/connect/${encodeURIComponent(name)}?number=${encodeURIComponent(number)}`,
    )
    pairingCode = extractPairingCode(raw)
    base64 = extractQrBase64(raw) || base64
  }

  if (!pairingCode) {
    throw new Error(
      'Não foi possível gerar o código. Confira o número (11 dígitos) ou use o QR ao lado.',
    )
  }

  return {
    raw,
    pairingCode,
    base64,
    number,
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
    // ignore
  }
  try {
    await evoFetch(`/instance/delete/${encodeURIComponent(name)}`, { method: 'DELETE' })
  } catch {
    // ignore
  }
}

/** Apaga a sessão e gera um QR novo (base64 diferente). */
export async function recreateFreshQr(webhookUrl, previousBase64 = null) {
  await logoutInstance()
  await sleep(700)
  await ensureInstance(webhookUrl)
  await sleep(500)

  let qr = await fetchQr()
  for (let i = 0; i < 2 && (!qr.base64 || (previousBase64 && qr.base64 === previousBase64)); i += 1) {
    await sleep(800)
    qr = await fetchQr()
  }
  return qr
}

export function getInstanceName() {
  return INSTANCE()
}
