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
  const code = data?.pairingCode || data?.qrcode?.pairingCode || data?.pair?.code || null
  return typeof code === 'string' && code.trim() ? code.trim().toUpperCase() : null
}

export async function fetchQr() {
  const name = INSTANCE()
  let data = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`)
  let base64 = extractQrBase64(data)
  if (!base64) {
    await sleep(600)
    data = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`)
    base64 = extractQrBase64(data)
  }
  return {
    raw: data,
    base64,
    pairingCode: extractPairingCode(data),
  }
}

async function softLogout() {
  const name = INSTANCE()
  try {
    await evoFetch(`/instance/logout/${encodeURIComponent(name)}`, { method: 'DELETE' })
  } catch {
    // ignore
  }
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

/**
 * QR novo rápido:
 * 1) reconnect leve
 * 2) logout (sem apagar)
 * 3) delete + recreate só se falhar
 */
export async function refreshQrFast(webhookUrl, previousBase64 = null) {
  await ensureInstance(webhookUrl)

  let qr = await fetchQr()
  if (qr.base64 && qr.base64 !== previousBase64) {
    return { ...qr, strategy: 'soft' }
  }

  await softLogout()
  await sleep(400)
  await ensureInstance(webhookUrl)
  qr = await fetchQr()
  if (qr.base64) {
    return { ...qr, strategy: 'logout' }
  }

  await logoutInstance()
  await sleep(500)
  await ensureInstance(webhookUrl)
  qr = await fetchQr()
  return { ...qr, strategy: 'recreate' }
}

export async function recreateFreshQr(webhookUrl, previousBase64 = null) {
  return refreshQrFast(webhookUrl, previousBase64)
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

export async function fetchPairingCode(phoneNumber) {
  const name = INSTANCE()
  const number = normalizePhone(phoneNumber)
  if (!number || number.length < 12 || number.length > 13) {
    throw new Error('Informe o WhatsApp com DDD (11 dígitos). Ex: 48988650977')
  }

  try {
    const state = await fetchConnectionState()
    if (state.state === 'connecting' || state.state === 'open') {
      await softLogout()
      await sleep(500)
    }
  } catch {
    // segue
  }

  await ensureInstance()
  const data = await evoFetch(
    `/instance/connect/${encodeURIComponent(name)}?number=${encodeURIComponent(number)}`,
  )
  let pairingCode = extractPairingCode(data)
  let base64 = extractQrBase64(data)
  let raw = data

  if (!pairingCode) {
    await sleep(800)
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

export function getInstanceName() {
  return INSTANCE()
}

export async function findChats() {
  const name = INSTANCE()
  const data = await evoFetch(`/chat/findChats/${encodeURIComponent(name)}`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.chats)) return data.chats
  if (Array.isArray(data?.data)) return data.data
  return []
}

export async function findMessages(remoteJid, limit = 40) {
  const name = INSTANCE()
  const data = await evoFetch(`/chat/findMessages/${encodeURIComponent(name)}`, {
    method: 'POST',
    body: JSON.stringify({
      where: {
        key: {
          remoteJid,
        },
      },
      limit,
    }),
  })
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.messages)) return data.messages
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.data)) return data.data
  return []
}

function extractTextFromMessage(item) {
  return (
    item?.message?.conversation ||
    item?.message?.extendedTextMessage?.text ||
    item?.message?.imageMessage?.caption ||
    item?.message?.videoMessage?.caption ||
    item?.message?.documentMessage?.caption ||
    item?.message?.buttonsResponseMessage?.selectedDisplayText ||
    item?.message?.listResponseMessage?.title ||
    item?.body ||
    item?.text ||
    ''
  )
}

function messageTimestampMs(item) {
  const raw = item?.messageTimestamp || item?.timestamp || item?.updateAt || Date.now()
  const num = Number(raw)
  if (!Number.isFinite(num)) return Date.now()
  return String(Math.trunc(num)).length < 13 ? num * 1000 : num
}

/** Importa conversas recentes do WhatsApp (sem grupos). */
export async function syncRecentConversations({ maxChats = 40, maxMessages = 30 } = {}) {
  const chats = await findChats()
  const individual = chats
    .filter((chat) => {
      const jid = chat?.remoteJid || chat?.id || chat?.key?.remoteJid || ''
      return jid && !String(jid).endsWith('@g.us') && !String(jid).includes('status@') && !String(jid).includes('broadcast')
    })
    .sort((a, b) => {
      const ta = Number(a?.updatedAt || a?.conversationTimestamp || a?.lastMsgTimestamp || 0)
      const tb = Number(b?.updatedAt || b?.conversationTimestamp || b?.lastMsgTimestamp || 0)
      return tb - ta
    })
    .slice(0, maxChats)

  const imported = []
  for (const chat of individual) {
    const remoteJid = chat?.remoteJid || chat?.id || chat?.key?.remoteJid
    if (!remoteJid) continue
    const phone = String(remoteJid).split('@')[0].replace(/\D/g, '')
    if (!phone) continue

    let messages = []
    try {
      messages = await findMessages(remoteJid, maxMessages)
    } catch {
      messages = []
    }

    // Alguns retornos trazem lastMessage no chat sem findMessages
    if (!messages.length && chat?.lastMessage) {
      messages = [chat.lastMessage]
    }

    const normalized = messages
      .map((item) => {
        const text = extractTextFromMessage(item)
        if (!text) return null
        return {
          id:
            item?.key?.id ||
            item?.id ||
            `msg-${phone}-${messageTimestampMs(item)}-${Math.random().toString(36).slice(2, 6)}`,
          phone,
          pushName: chat?.pushName || chat?.name || item?.pushName || '',
          text,
          fromMe: Boolean(item?.key?.fromMe ?? item?.fromMe),
          at: messageTimestampMs(item),
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.at - b.at)
      .slice(-maxMessages)

    if (!normalized.length) {
      // Ainda cria lead “vazio” com nome do chat para aparecer na lista
      imported.push({
        phone,
        pushName: chat?.pushName || chat?.name || 'Contato WhatsApp',
        messages: [],
      })
      continue
    }

    imported.push({
      phone,
      pushName: chat?.pushName || chat?.name || normalized.find((m) => !m.fromMe)?.pushName || 'Contato WhatsApp',
      messages: normalized,
    })
  }

  return imported
}
