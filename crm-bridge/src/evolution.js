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
  try {
    const data = await evoFetch(`/chat/findChats/${encodeURIComponent(name)}`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.chats)) return data.chats
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.records)) return data.records
  } catch {
    // ignore
  }
  return []
}

export async function findContacts() {
  const name = INSTANCE()
  try {
    const data = await evoFetch(`/chat/findContacts/${encodeURIComponent(name)}`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.contacts)) return data.contacts
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.records)) return data.records
  } catch {
    // ignore
  }
  return []
}

export async function findMessages(remoteJid, limit = 40) {
  const name = INSTANCE()
  try {
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
  } catch {
    // ignore
  }
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
    item?.message?.templateButtonReplyMessage?.selectedDisplayText ||
    item?.body ||
    item?.text ||
    item?.lastMessage?.message?.conversation ||
    item?.lastMessage?.message?.extendedTextMessage?.text ||
    ''
  )
}

function messageTimestampMs(item) {
  const raw =
    item?.messageTimestamp ||
    item?.timestamp ||
    item?.updateAt ||
    item?.updatedAt ||
    item?.conversationTimestamp ||
    Date.now()
  const num = Number(raw)
  if (!Number.isFinite(num)) return Date.now()
  return String(Math.trunc(num)).length < 13 ? num * 1000 : num
}

function isIndividualJid(jid) {
  const value = String(jid || '')
  if (!value) return false
  if (value.endsWith('@g.us')) return false
  if (value.includes('status@')) return false
  if (value.includes('broadcast')) return false
  if (value.includes('@lid')) return false
  return value.includes('@s.whatsapp.net') || /^\d+$/.test(value.split('@')[0])
}

function jidPhone(jid) {
  return String(jid || '')
    .split('@')[0]
    .replace(/\D/g, '')
}

/** Importa conversas/contatos recentes do WhatsApp (sem grupos). */
export async function syncRecentConversations({ maxChats = 50, maxMessages = 25 } = {}) {
  const chats = await findChats()
  const contacts = await findContacts()

  const byPhone = new Map()

  for (const chat of chats) {
    const remoteJid = chat?.remoteJid || chat?.id || chat?.key?.remoteJid || ''
    if (!isIndividualJid(remoteJid)) continue
    const phone = jidPhone(remoteJid)
    if (!phone || phone.length < 10) continue
    byPhone.set(phone, {
      remoteJid: remoteJid.includes('@') ? remoteJid : `${phone}@s.whatsapp.net`,
      pushName: chat?.pushName || chat?.name || chat?.notify || '',
      chat,
      messagesRaw: chat?.lastMessage ? [chat.lastMessage] : [],
    })
  }

  for (const contact of contacts) {
    const remoteJid = contact?.remoteJid || contact?.id || contact?.whatsappId || ''
    if (!isIndividualJid(remoteJid)) continue
    const phone = jidPhone(remoteJid)
    if (!phone || phone.length < 10) continue
    const current = byPhone.get(phone)
    if (!current) {
      byPhone.set(phone, {
        remoteJid: remoteJid.includes('@') ? remoteJid : `${phone}@s.whatsapp.net`,
        pushName: contact?.pushName || contact?.name || contact?.notify || '',
        chat: contact,
        messagesRaw: [],
      })
    } else if (!current.pushName) {
      current.pushName = contact?.pushName || contact?.name || contact?.notify || current.pushName
    }
  }

  const ordered = [...byPhone.values()]
    .sort((a, b) => {
      const ta = messageTimestampMs(a.chat)
      const tb = messageTimestampMs(b.chat)
      return tb - ta
    })
    .slice(0, maxChats)

  const imported = []
  for (const entry of ordered) {
    let messages = []
    try {
      messages = await findMessages(entry.remoteJid, maxMessages)
    } catch {
      messages = []
    }
    if (!messages.length && entry.messagesRaw.length) {
      messages = entry.messagesRaw
    }

    const normalized = messages
      .map((item) => {
        const text = extractTextFromMessage(item)
        if (!text) return null
        const phone = jidPhone(entry.remoteJid)
        return {
          id:
            item?.key?.id ||
            item?.id ||
            `msg-${phone}-${messageTimestampMs(item)}-${Math.random().toString(36).slice(2, 6)}`,
          phone,
          pushName: entry.pushName || item?.pushName || '',
          text,
          fromMe: Boolean(item?.key?.fromMe ?? item?.fromMe),
          at: messageTimestampMs(item),
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.at - b.at)
      .slice(-maxMessages)

    imported.push({
      phone: jidPhone(entry.remoteJid),
      pushName:
        entry.pushName ||
        normalized.find((m) => !m.fromMe)?.pushName ||
        'Contato WhatsApp',
      messages: normalized,
    })
  }

  return {
    imported,
    stats: {
      chatsFound: chats.length,
      contactsFound: contacts.length,
      individualFound: byPhone.size,
      importedChats: imported.length,
      importedMessages: imported.reduce((sum, item) => sum + (item.messages?.length || 0), 0),
    },
  }
}
