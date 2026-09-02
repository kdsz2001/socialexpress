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

const app = express()
const PORT = Number(process.env.PORT || 3333)
const PUBLIC_URL = (process.env.PUBLIC_BRIDGE_URL || `http://localhost:${PORT}`).replace(/\/$/, '')

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    evolutionConfigured: evolutionConfigured(),
    instance: getInstanceName(),
    publicUrl: PUBLIC_URL,
  })
})

app.get('/api/crm/state', (_req, res) => {
  res.json(readBridgeState())
})

app.post('/api/whatsapp/connect', async (_req, res) => {
  try {
    if (!evolutionConfigured()) {
      return res.status(400).json({
        error:
          'Configure EVOLUTION_BASE_URL e EVOLUTION_API_KEY no crm-bridge/.env (veja docs/CRM-EVOLUTION-RAILWAY.md)',
      })
    }

    const previousQr = readBridgeState().connection?.qrBase64 || null
    patchConnection({ status: 'connecting', lastError: null, crmOpen: false })
    await ensureInstance(`${PUBLIC_URL}/api/webhook/evolution`)
    const state = await fetchConnectionState()

    // Sessão já existe na Evolution: NÃO abre o CRM sozinho
    if (state.state === 'open') {
      const next = patchConnection({
        status: 'connecting',
        crmOpen: false,
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
      lastError: error.message || 'Falha ao conectar Evolution',
    })
    return res.status(500).json({ error: error.message || 'Falha ao conectar' })
  }
})

app.post('/api/whatsapp/confirm-session', async (_req, res) => {
  try {
    if (!evolutionConfigured()) {
      return res.status(400).json({ error: 'Evolution não configurada' })
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

app.get('/api/whatsapp/status', async (_req, res) => {
  try {
    if (!evolutionConfigured()) {
      return res.json({ ...readBridgeState().connection, mode: 'mock' })
    }
    const current = readBridgeState().connection
    const state = await fetchConnectionState()

    if (state.state === 'open') {
      // Só marca connected se o usuário já abriu o CRM nesta sessão
      if (current.crmOpen) {
        const next = patchConnection({
          status: 'connected',
          evolutionState: 'open',
          connectedAt: current.connectedAt || Date.now(),
          qrBase64: null,
          pairingCode: null,
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
  try {
    if (!evolutionConfigured()) {
      return res.status(400).json({ error: 'Evolution não configurada' })
    }
    const previousQr = readBridgeState().connection?.qrBase64 || null
    // Mantém o QR antigo na tela até o novo chegar (evita ficar preso em "Gerando...")
    patchConnection({
      status: 'connecting',
      lastError: null,
      pairingCode: null,
    })

    const qr = await refreshQrFast(`${PUBLIC_URL}/api/webhook/evolution`, previousQr)
    if (!qr.base64) {
      const next = patchConnection({
        status: 'connecting',
        qrBase64: previousQr,
        lastError: 'Não foi possível gerar um QR novo. Tente novamente.',
      })
      return res.status(502).json({ error: next.connection.lastError, ...next.connection })
    }

    const next = patchConnection({
      status: 'connecting',
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
      lastError: error.message || 'Falha ao renovar QR',
    })
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/whatsapp/pairing', async (req, res) => {
  try {
    if (!evolutionConfigured()) {
      return res.status(400).json({
        error: 'Configure EVOLUTION_BASE_URL e EVOLUTION_API_KEY no crm-bridge/.env',
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
  try {
    if (evolutionConfigured()) await logoutInstance()
  } catch {
    // ignore logout errors
  }
  const next = patchConnection({
    status: 'disconnected',
    crmOpen: false,
    evolutionState: null,
    connectedAt: null,
    accountName: '',
    accountPhone: '',
    qrBase64: null,
    pairingCode: null,
  })
  res.json(next.connection)
})

app.post('/api/whatsapp/sync', async (_req, res) => {
  try {
    if (!evolutionConfigured()) {
      return res.status(400).json({ error: 'Evolution não configurada' })
    }
    const current = readBridgeState().connection
    if (!current.crmOpen) {
      return res.status(400).json({
        error: 'Abra a sessão no CRM primeiro (confirme a sessão ou escaneie o QR).',
      })
    }
    const state = await fetchConnectionState()
    if (state.state !== 'open') {
      return res.status(400).json({
        error: 'WhatsApp ainda não está conectado na Evolution. Escaneie o QR primeiro.',
      })
    }

    const result = await syncRecentConversations({ maxChats: 50, maxMessages: 25 })
    const conversations = result.imported || []
    const stats = result.stats || {}
    importConversations(conversations)
    patchConnection({
      status: 'connected',
      lastSyncAt: Date.now(),
      lastError: null,
      accountName: 'WhatsApp conectado',
    })
    createBackup(`Sync WhatsApp (${conversations.length} conversas)`)
    const fresh = readBridgeState()

    let tip = null
    if (!conversations.length) {
      tip =
        'Nenhuma conversa veio da Evolution. No celular: Aparelhos conectados → Evolution API → Histórico de conversas. Se estiver "Pausado" ou "Sincronizando", deixe o WhatsApp aberto no Wi‑Fi até terminar e clique Sincronizar de novo. Mensagens novas também passam a aparecer depois disso.'
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
        // Webhook NÃO abre o CRM sozinho — só marca que a sessão Evolution está pronta
        if (current.crmOpen) {
          patchConnection({
            status: 'connected',
            connectedAt: current.connectedAt || Date.now(),
            qrBase64: null,
            evolutionState: 'open',
            accountName: 'WhatsApp conectado',
          })
          createBackup('Backup automático CONNECTION_UPDATE')
          void syncRecentConversations({ maxChats: 50, maxMessages: 25 })
            .then((result) => {
              const conversations = result.imported || []
              importConversations(conversations)
              patchConnection({ lastSyncAt: Date.now() })
              createBackup(`Sync automático (${conversations.length} conversas)`)
            })
            .catch(() => {})
        } else {
          patchConnection({
            status: 'connecting',
            crmOpen: false,
            evolutionState: 'open',
            qrBase64: null,
            accountName: 'Sessão WhatsApp pronta — confirme no CRM',
          })
        }
      } else if (state === 'close') {
        patchConnection({
          status: 'disconnected',
          crmOpen: false,
          evolutionState: 'close',
          qrBase64: null,
        })
      } else if (state === 'connecting') {
        patchConnection({ status: 'connecting', evolutionState: 'connecting', crmOpen: false })
      }
    }

    if (event.includes('MESSAGES_UPSERT') || event.includes('MESSAGES.UPSERT')) {
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
  console.log(`[crm-bridge] http://localhost:${PORT}`)
  console.log(`[crm-bridge] Evolution configurada: ${evolutionConfigured() ? 'sim' : 'não'}`)
  console.log(`[crm-bridge] Webhook esperado em: ${PUBLIC_URL}/api/webhook/evolution`)
})
