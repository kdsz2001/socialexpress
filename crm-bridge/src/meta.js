/**
 * WhatsApp Cloud API (Meta) — canal oficial.
 * Sem QR / Evolution: mensagens chegam por webhook da Meta.
 */

const GRAPH = 'https://graph.facebook.com/v21.0'

export function metaConfigured() {
  return Boolean(
    process.env.META_ACCESS_TOKEN &&
      process.env.META_PHONE_NUMBER_ID &&
      process.env.META_VERIFY_TOKEN,
  )
}

export function metaVerifyToken() {
  return process.env.META_VERIFY_TOKEN || ''
}

export function metaPhoneNumberId() {
  return process.env.META_PHONE_NUMBER_ID || ''
}

export function metaAppSecret() {
  return process.env.META_APP_SECRET || ''
}

async function graphFetch(pathname, options = {}) {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN não configurado')

  const url = pathname.startsWith('http')
    ? pathname
    : `${GRAPH}${pathname.startsWith('/') ? pathname : `/${pathname}`}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const msg =
      data?.error?.message || data?.error?.error_user_msg || `Meta Graph HTTP ${response.status}`
    throw new Error(msg)
  }
  return data
}

/** Confirma token + número Business e devolve dados de exibição. */
export async function fetchMetaPhoneProfile() {
  const id = metaPhoneNumberId()
  const data = await graphFetch(
    `/${encodeURIComponent(id)}?fields=display_phone_number,verified_name,quality_rating`,
  )
  return {
    phoneNumberId: id,
    displayPhone: data.display_phone_number || '',
    verifiedName: data.verified_name || 'WhatsApp Business',
    qualityRating: data.quality_rating || null,
    raw: data,
  }
}

/** Extrai mensagens de texto (e caption) do payload de webhook da Meta. */
export function parseMetaWebhookMessages(body) {
  const out = []
  const entries = Array.isArray(body?.entry) ? body.entry : []
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : []
    for (const change of changes) {
      const value = change?.value || {}
      if (change?.field && change.field !== 'messages') continue
      const contacts = Array.isArray(value.contacts) ? value.contacts : []
      const nameByWa = new Map(
        contacts.map((c) => [String(c?.wa_id || ''), c?.profile?.name || '']),
      )
      const messages = Array.isArray(value.messages) ? value.messages : []
      for (const msg of messages) {
        const from = String(msg?.from || '').replace(/\D/g, '')
        if (!from) continue
        let text = ''
        if (msg?.type === 'text') text = msg?.text?.body || ''
        else if (msg?.type === 'button') text = msg?.button?.text || ''
        else if (msg?.type === 'interactive') {
          text =
            msg?.interactive?.button_reply?.title ||
            msg?.interactive?.list_reply?.title ||
            ''
        } else if (msg?.image?.caption) text = msg.image.caption
        else if (msg?.video?.caption) text = msg.video.caption
        else if (msg?.document?.caption) text = msg.document.caption
        else if (msg?.type) text = `[${msg.type}]`
        if (!text) continue
        const ts = Number(msg.timestamp)
        out.push({
          id: msg.id || `meta-${from}-${ts || Date.now()}`,
          phone: from,
          pushName: nameByWa.get(from) || nameByWa.get(String(msg.from)) || '',
          text,
          fromMe: false,
          at: Number.isFinite(ts) ? ts * 1000 : Date.now(),
        })
      }
    }
  }
  return out
}
