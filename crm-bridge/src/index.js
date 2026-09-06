import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import {
  createBackup,
  importConversations,
  patchConnection,
  readBridgeState,
  setLeadLabel,
  upsertIncomingMessage,
  writeBridgeState,
} from './store.js'
import {
  ensureInstance,
  evolutionConfigured,
  fetchConnectionState,
  fetchPairingCode,
  fetchQr,
  getInstanceName,
  logoutInstance,
  refreshQrFast,
  syncRecentConversations,
} from './evolution.js'
import {
  fetchMetaPhoneProfile,
  metaConfigured,
  metaVerifyToken,
  parseMetaWebhookMessages,
} from './meta.js'

const app = express()
const PORT = Number(process.env.PORT || 3333)
const PUBLIC_URL = (process.env.PUBLIC_BRIDGE_URL || `http://localhost:${PORT}`).replace(/\/$/, '')

function activeProvider() {
  if (metaConfigured()) return 'meta'
  if (evolutionConfigured()) return 'evolution'
  return 'mock'
}

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', (_req, res) => {
  const provider = activeProvider()
  res.json({
    ok: true,
    provider,
    metaConfigured: metaConfigured(),
    evolutionConfigured: evolutionConfigured(),
    instance: getInstanceName(),
    publicUrl: PUBLIC_URL,
    webhookMeta: `${PUBLIC_URL}/api/webhook/meta`,
    webhookEvolution: `${PUBLIC_URL}/api/webhook/evolution`,
  })
})

app.get('/api/crm/state', (_req, res) => {
  const state = readBridgeState()
  res.json({
    ...state,
    connection: { ...state.connection, mode: activeProvider() },
  })
})

/** ——— Meta Cloud API (oficial) ——— */

app.get('/api/webhook/meta', (req, res) => {
  const mode = String(req.query['hub.mode'] || '')
  const token = String(req.query['hub.verify_token'] || '')
  const challenge = String(req.query['hub.challenge'] || '')
  if (mode === 'subscribe' && token && token === metaVerifyToken()) {
    return res.status(200).send(challenge)
  }
  return res.sendStatus(403)
})

app.post('/api/webhook/meta', (req, res) => {
  try {
    // Responde 200 rápido (exigência da Meta)
    res.json({ ok: true })
    const current = readBridgeState().connection
    if (!current.crmOpen) return

    const messages = parseMetaWebhookMessages(req.body || {})
    for (const msg of messages) {
      upsertIncomingMessage(msg)
    }
    if (messages.length) {
      patchConnection({ lastSyncAt: Date.now(), status: 'connected' })
    }
  } catch (error) {
    console.error('[crm-bridge] webhook meta', error.message)
  }
})

async function connectMeta(_req, res) {
  try {
    const profile = await fetchMetaPhoneProfile()
    const next = patchConnection({
      status: 'connected',
      crmOpen: true,
      awaitingQrScan: false,
      evolutionState: null,
      connectedAt: Date.now(),
      qrBase64: null,
      pairingCode: null,
      accountName: profile.verifiedName,
      accountPhone: profile.displayPhone,
      lastError: null,
    })
    createBackup('CRM aberto com WhatsApp Cloud API (Meta)')
    return res.json({
      ...next.connection,
      mode: 'meta',
      sessionReady: true,
      needsConfirm: false,
      webhookUrl: `${PUBLIC_URL}/api/webhook/meta`,
      tip: 'Canal oficial ativo. Mensagens novas no número Business viram leads no CRM.',
    })
  } catch (error) {
    patchConnection({
      status: 'disconnected',
      crmOpen: false,
      lastError: error.message || 'Falha ao validar token Meta',
    })
    return res.status(500).json({
      error:
        error.message ||
        'Falha na Cloud API. Confira META_ACCESS_TOKEN e META_PHONE_NUMBER_ID (docs/CRM-WHATSAPP-CLOUD.md).',
    })
  }
}

async function statusMeta(_req, res) {
  const current = readBridgeState().connection
  if (!current.crmOpen) {
    return res.json({
      ...current,
      status: current.qrBase64 ? 'connecting' : 'disconnected',
      mode: 'meta',
      sessionReady: false,
      needsConfirm: false,
      webhookUrl: `${PUBLIC_URL}/api/webhook/meta`,
    })
  }
  try {
    const profile = await fetchMetaPhoneProfile()
    const next = patchConnection({
      status: 'connected',
      crmOpen: true,
      accountName: profile.verifiedName || current.accountName,
      accountPhone: profile.displayPhone || current.accountPhone,
      lastError: null,
    })
    return res.json({
      ...next.connection,
      mode: 'meta',
      sessionReady: true,
      needsConfirm: false,
      webhookUrl: `${PUBLIC_URL}/api/webhook/meta`,
    })
  } catch (error) {
    return res.json({
      ...current,
      mode: 'meta',
      lastError: error.message,
      webhookUrl: `${PUBLIC_URL}/api/webhook/meta`,
    })
  }
}

/** ——— Evolution (legado / opcional) ——— */

app.post('/api/whatsapp/connect', async (req, res) => {
  if (activeProvider() === 'meta') return connectMeta(req, res)
  try {
    if (!evolutionConfigured()) {
      return res.status(400).json({
        error:
          'Configure WhatsApp Cloud API (Meta) no crm-bridge/.env — veja docs/CRM-WHATSAPP-CLOUD.md',
      })
    }

    const previousQr = readBridgeState().connection?.qrBase64 || null
    patchConnection({ status: 'connecting', lastError: null, crmOpen: false, awaitingQrScan: false })
    await ensureInstance(`${PUBLIC_URL}/api/webhook/evolution`)
    const state = await fetchConnectionState()

    if (state.state === 'open') {
      const next = patchConnection({
        status: 'connecting',
        crmOpen: false,
        awaitingQrScan: false,
        evolutionState: 'open',
        qrBase64: null,
        pairingCode: null,
        lastError: null,
        accountName: 'Sessão WhatsApp já ativa na Evolution',
      })
      return res.json({
        ...next.connection,
        mode: 'evolution',
        sessionReady: true,
        needsConfirm: true,
      })
    }

    const qr = await fetchQr()
    const qrBase64 = qr.base64 || previousQr
    const next = patchConnection({
      status: 'connecting',
      crmOpen: false,
      awaitingQrScan: true,
      evolutionState: state.state,
      qrBase64,
      pairingCode: qr.pairingCode || null,
      lastError: qrBase64 ? null : 'QR ainda não disponível — clique em Novo QR',
    })
    return res.json({
      ...next.connection,
      mode: 'evolution',
      sessionReady: false,
      needsConfirm: false,
    })
  } catch (error) {
    patchConnection({
      status: 'disconnected',
      crmOpen: false,
      awaitingQrScan: false,
      lastError: error.message || 'Falha ao conectar Evolution',
    })
    return res.status(500).json({ error: error.message || 'Falha ao conectar' })
  }
})

app.post('/api/whatsapp/confirm-session', async (_req, res) => {
  try {
    if (activeProvider() === 'meta') {
      return connectMeta(_req, res)
    }
    if (!evolutionConfigured()) {
      return res.status(400).json({ error: 'Nenhum canal WhatsApp configurado' })
    }
    const state = await fetchConnectionState()
    if (state.state !== 'open') {
      return res.status(400).json({
        error: 'Não há sessão ativa. Escaneie o QR primeiro.',
        evolutionState: state.state,
      })
    }
    const next = patchConnection({
      status: 'connected',
      crmOpen: true,
      awaitingQrScan: false,
      evolutionState: 'open',
      connectedAt: Date.now(),
      qrBase64: null,
      pairingCode: null,
      accountName: 'WhatsApp conectado',
      lastError: null,
    })
    createBackup('CRM aberto na sessão Evolution existente')
    return res.json({ ...next.connection, mode: 'evolution', sessionReady: true })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Falha ao confirmar sessão' })
  }
})

app.get('/api/whatsapp/status', async (req, res) => {
  if (activeProvider() === 'meta') return statusMeta(req, res)
  try {
    if (!evolutionConfigured()) {
      return res.json({ ...readBridgeState().connection, mode: 'mock' })
    }
    const current = readBridgeState().connection
    const state = await fetchConnectionState()

    if (state.state === 'open') {
      if (current.awaitingQrScan || current.crmOpen) {
        const next = patchConnection({
          status: 'connected',
          crmOpen: true,
          awaitingQrScan: false,
          evolutionState: 'open',
          connectedAt: current.connectedAt || Date.now(),
          qrBase64: null,
          pairingCode: null,
          accountName: 'WhatsApp conectado',
          lastError: null,
        })
        return res.json({
          ...next.connection,
          mode: 'evolution',
          evolutionState: state.state,
          sessionReady: true,
          needsConfirm: false,
        })
      }
      const next = patchConnection({
        status: 'connecting',
        evolutionState: 'open',
        qrBase64: null,
        crmOpen: false,
        awaitingQrScan: false,
      })
      return res.json({
        ...next.connection,
        mode: 'evolution',
        evolutionState: state.state,
        sessionReady: true,
        needsConfirm: true,
      })
    }

    if (state.state === 'connecting') {
      let qrBase64 = current.qrBase64
      if (!qrBase64) {
        try {
          const qr = await fetchQr()
          qrBase64 = qr.base64
        } catch {
          // ignore
        }
      }
      const next = patchConnection({
        status: 'connecting',
        crmOpen: false,
        awaitingQrScan: true,
        evolutionState: 'connecting',
        qrBase64: qrBase64 || current.qrBase64,
      })
      return res.json({
        ...next.connection,
        mode: 'evolution',
        evolutionState: state.state,
        sessionReady: false,
        needsConfirm: false,
      })
    }

    const next = patchConnection({
      status: current.qrBase64 ? 'connecting' : 'disconnected',
      crmOpen: false,
      awaitingQrScan: Boolean(current.qrBase64),
      evolutionState: state.state,
    })
    return res.json({
      ...next.connection,
      mode: 'evolution',
      evolutionState: state.state,
      sessionReady: false,
      needsConfirm: false,
    })
  } catch (error) {
    return res.json({
      ...readBridgeState().connection,
      mode: 'evolution',
      lastError: error.message,
    })
  }
})

app.post('/api/whatsapp/qr/refresh', async (_req, res) => {
  if (activeProvider() === 'meta') {
    return res.status(400).json({
      error: 'No modo Cloud API (Meta) não existe QR. Use Conectar WhatsApp oficial.',
    })
  }
  try {
    if (!evolutionConfigured()) {
      return res.status(400).json({ error: 'Evolution não configurada' })
    }
    const previousQr = readBridgeState().connection?.qrBase64 || null
    patchConnection({
      status: 'connecting',
      lastError: null,
      pairingCode: null,
      crmOpen: false,
      awaitingQrScan: true,
    })

    const qr = await refreshQrFast(`${PUBLIC_URL}/api/webhook/evolution`, previousQr)
    if (!qr.base64) {
      const next = patchConnection({
        status: 'connecting',
        qrBase64: previousQr,
        awaitingQrScan: true,
        lastError: 'Não foi possível gerar um QR novo. Tente novamente.',
      })
      return res.status(502).json({ error: next.connection.lastError, ...next.connection })
    }

    const next = patchConnection({
      status: 'connecting',
      crmOpen: false,
      awaitingQrScan: true,
      qrBase64: qr.base64,
      pairingCode: qr.pairingCode || null,
      lastError: null,
      qrUpdatedAt: Date.now(),
    })
    res.json({
      ...next.connection,
      changed: qr.base64 !== previousQr,
      strategy: qr.strategy || null,
    })
  } catch (error) {
    const previousQr = readBridgeState().connection?.qrBase64 || null
    patchConnection({
      qrBase64: previousQr,
      awaitingQrScan: true,
      lastError: error.message || 'Falha ao renovar QR',
    })
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/whatsapp/pairing', async (req, res) => {
  if (activeProvider() === 'meta') {
    return res.status(400).json({ error: 'Pairing code não se aplica à Cloud API (Meta).' })
  }
  try {
    if (!evolutionConfigured()) {
      return res.status(400).json({
        error: 'Configure META_* (recomendado) ou EVOLUTION_* no crm-bridge/.env',
      })
    }
    const phone = req.body?.number || req.body?.phone || ''
    const previousQr = readBridgeState().connection?.qrBase64 || null
    patchConnection({ status: 'connecting', lastError: null, pairingCode: null })
    await ensureInstance(`${PUBLIC_URL}/api/webhook/evolution`)
    const result = await fetchPairingCode(phone)
    if (!result.pairingCode) {
      const next = patchConnection({
        status: 'connecting',
        qrBase64: result.base64 || previousQr,
        pairingCode: null,
        accountPhone: result.number,
        lastError: 'Código indisponível. Use o QR ao lado ou tente de novo.',
      })
      return res.status(502).json({ error: next.connection.lastError, ...next.connection })
    }
    const next = patchConnection({
      status: 'connecting',
      pairingCode: result.pairingCode,
      qrBase64: result.base64 || previousQr,
      accountPhone: result.number,
      lastError: null,
    })
    return res.json({ ...next.connection, mode: 'evolution' })
  } catch (error) {
    patchConnection({
      lastError: error.message || 'Falha ao gerar pairing code',
    })
    return res.status(500).json({ error: error.message || 'Falha ao gerar pairing code' })
  }
})

app.post('/api/whatsapp/disconnect', async (_req, res) => {
  if (activeProvider() === 'evolution') {
    try {
      await logoutInstance()
    } catch {
      // ignore
    }
  }
  const next = patchConnection({
    status: 'disconnected',
    crmOpen: false,
    awaitingQrScan: false,
    evolutionState: null,
    connectedAt: null,
    accountName: '',
    accountPhone: '',
    qrBase64: null,
    pairingCode: null,
    lastError: null,
  })
  res.json({ ...next.connection, mode: activeProvider() })
})

app.post('/api/whatsapp/sync', async (_req, res) => {
  try {
    const current = readBridgeState().connection
    if (!current.crmOpen) {
      return res.status(400).json({
        error: 'Abra o CRM primeiro (Conectar WhatsApp).',
      })
    }

    if (activeProvider() === 'meta') {
      const fresh = readBridgeState()
      return res.json({
        ...fresh,
        importedChats: 0,
        importedMessages: 0,
        tip: 'Cloud API não puxa histórico. Mensagens novas chegam sozinhas pelo webhook da Meta.',
      })
    }

    if (!evolutionConfigured()) {
      return res.status(400).json({ error: 'Nenhum canal WhatsApp configurado' })
    }
    const state = await fetchConnectionState()
    if (state.state !== 'open') {
      return res.status(400).json({
        error: 'WhatsApp ainda não está conectado na Evolution. Escaneie o QR primeiro.',
      })
    }

    const sinceMs = (current.connectedAt || Date.now()) - 60_000
    const result = await syncRecentConversations({
      maxChats: 30,
      maxMessages: 20,
      sinceMs,
      includeContacts: false,
    })
    const conversations = result.imported || []
    const stats = result.stats || {}
    importConversations(conversations)
    patchConnection({
      status: 'connected',
      lastSyncAt: Date.now(),
      lastError: null,
      accountName: 'WhatsApp conectado',
    })
    if (conversations.length) {
      createBackup(`Sync novas msgs (${conversations.length} conversas)`)
    }
    const fresh = readBridgeState()

    let tip = null
    if (!conversations.length) {
      tip =
        'Conectado. Sem mensagens novas ainda — quando alguém falar no WhatsApp, o lead aparece aqui.'
    }

    return res.json({
      ...fresh,
      importedChats: stats.importedChats ?? conversations.length,
      importedMessages: stats.importedMessages ?? 0,
      chatsFound: stats.chatsFound ?? 0,
      contactsFound: stats.contactsFound ?? 0,
      tip,
    })
  } catch (error) {
    patchConnection({ lastError: error.message || 'Falha ao sincronizar conversas' })
    return res.status(500).json({ error: error.message || 'Falha ao sincronizar conversas' })
  }
})

/** Simula mensagem (teste local sem Meta/Evolution). */
app.post('/api/whatsapp/simulate', (req, res) => {
  const phone = String(req.body?.phone || '5548999999999').replace(/\D/g, '')
  const text = String(req.body?.text || '').trim()
  const pushName = String(req.body?.pushName || 'Cliente teste')
  if (!text) return res.status(400).json({ error: 'Informe text' })
  if (!readBridgeState().connection.crmOpen) {
    patchConnection({
      status: 'connected',
      crmOpen: true,
      connectedAt: Date.now(),
      accountName: 'Modo teste',
      accountPhone: phone,
    })
  }
  upsertIncomingMessage({
    phone,
    pushName,
    text,
    fromMe: false,
    at: Date.now(),
  })
  res.json(readBridgeState())
})

app.patch('/api/leads/:id/label', (req, res) => {
  const state = setLeadLabel(req.params.id, req.body?.labelId || 'novo')
  res.json(state)
})

app.post('/api/backups', (req, res) => {
  const state = createBackup(req.body?.note || 'Backup manual')
  res.json(state)
})

app.put('/api/score-rules', (req, res) => {
  const state = readBridgeState()
  state.scoreRules = Array.isArray(req.body?.scoreRules) ? req.body.scoreRules : state.scoreRules
  writeBridgeState(state)
  res.json(state)
})

app.post('/api/webhook/evolution', (req, res) => {
  try {
    const body = req.body || {}
    const event = String(body.event || body.type || '').toUpperCase()
    const data = body.data || body

    if (event.includes('QRCODE')) {
      const base64 = data?.qrcode?.base64 || data?.base64 || null
      if (base64) {
        patchConnection({
          status: 'connecting',
          qrBase64: String(base64).startsWith('data:')
            ? base64
            : `data:image/png;base64,${base64}`,
        })
      }
    }

    if (event.includes('CONNECTION_UPDATE')) {
      const state = String(data?.state || data?.status || '').toLowerCase()
      if (state === 'open') {
        const current = readBridgeState().connection
        if (current.crmOpen || current.awaitingQrScan) {
          const connectedAt = current.connectedAt || Date.now()
          patchConnection({
            status: 'connected',
            crmOpen: true,
            awaitingQrScan: false,
            connectedAt,
            qrBase64: null,
            evolutionState: 'open',
            accountName: 'WhatsApp conectado',
          })
          createBackup('Backup automático CONNECTION_UPDATE')
          const sinceMs = connectedAt - 60_000
          void syncRecentConversations({
            maxChats: 30,
            maxMessages: 20,
            sinceMs,
            includeContacts: false,
          })
            .then((result) => {
              const conversations = result.imported || []
              if (!conversations.length) return
              importConversations(conversations)
              patchConnection({ lastSyncAt: Date.now() })
              createBackup(`Sync novas msgs (${conversations.length})`)
            })
            .catch(() => {})
        } else {
          patchConnection({
            status: 'connecting',
            crmOpen: false,
            awaitingQrScan: false,
            evolutionState: 'open',
            qrBase64: null,
            accountName: 'Sessão WhatsApp pronta — confirme no CRM',
          })
        }
      } else if (state === 'close') {
        patchConnection({
          status: 'disconnected',
          crmOpen: false,
          awaitingQrScan: false,
          evolutionState: 'close',
          qrBase64: null,
        })
      } else if (state === 'connecting') {
        patchConnection({
          status: 'connecting',
          evolutionState: 'connecting',
          crmOpen: false,
        })
      }
    }

    if (event.includes('MESSAGES_UPSERT') || event.includes('MESSAGES.UPSERT')) {
      const current = readBridgeState().connection
      if (!current.crmOpen) {
        return res.json({ ok: true, skipped: 'crm_closed' })
      }
      const payload = data?.key ? data : data?.messages?.[0] || data?.message || data
      const list = Array.isArray(data?.messages) ? data.messages : [payload]
      for (const item of list) {
        if (!item) continue
        const remoteJid = item?.key?.remoteJid || item?.remoteJid || ''
        if (!remoteJid || remoteJid.endsWith('@g.us')) continue
        const phone = String(remoteJid).split('@')[0]
        const fromMe = Boolean(item?.key?.fromMe)
        const text =
          item?.message?.conversation ||
          item?.message?.extendedTextMessage?.text ||
          item?.message?.imageMessage?.caption ||
          item?.body ||
          item?.text ||
          ''
        if (!text) continue
        upsertIncomingMessage({
          phone,
          pushName: item?.pushName || item?.notifyName || '',
          text,
          fromMe,
          id: item?.key?.id || undefined,
          at: item?.messageTimestamp
            ? Number(item.messageTimestamp) * (String(item.messageTimestamp).length < 13 ? 1000 : 1)
            : Date.now(),
        })
      }
    }

    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  const provider = activeProvider()
  console.log(`[crm-bridge] http://localhost:${PORT}`)
  console.log(`[crm-bridge] Provedor ativo: ${provider}`)
  if (provider === 'meta') {
    console.log(`[crm-bridge] Webhook Meta: ${PUBLIC_URL}/api/webhook/meta`)
  } else if (provider === 'evolution') {
    console.log(`[crm-bridge] Webhook Evolution: ${PUBLIC_URL}/api/webhook/evolution`)
  } else {
    console.log('[crm-bridge] Nenhum canal: configure META_* (recomendado) — docs/CRM-WHATSAPP-CLOUD.md')
  }
})
