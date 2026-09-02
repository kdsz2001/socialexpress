import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import {
  createBackup,
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

    patchConnection({ status: 'connecting', lastError: null, qrBase64: null })
    await ensureInstance(`${PUBLIC_URL}/api/webhook/evolution`)
    const qr = await fetchQr()
    const state = await fetchConnectionState()

    if (state.state === 'open') {
      const next = patchConnection({
        status: 'connected',
        connectedAt: Date.now(),
        qrBase64: null,
        accountName: 'WhatsApp conectado',
        accountPhone: '',
      })
      createBackup('Backup automático pós-conexão')
      return res.json({ ...next.connection, mode: 'evolution' })
    }

    const next = patchConnection({
      status: 'connecting',
      qrBase64: qr.base64,
      pairingCode: qr.pairingCode || null,
      lastError: qr.base64 ? null : 'QR ainda não disponível — tente de novo em alguns segundos',
    })
    return res.json({ ...next.connection, mode: 'evolution' })
  } catch (error) {
    patchConnection({
      status: 'disconnected',
      lastError: error.message || 'Falha ao conectar Evolution',
    })
    return res.status(500).json({ error: error.message || 'Falha ao conectar' })
  }
})

app.get('/api/whatsapp/status', async (_req, res) => {
  try {
    if (!evolutionConfigured()) {
      return res.json({ ...readBridgeState().connection, mode: 'mock' })
    }
    const state = await fetchConnectionState()
    if (state.state === 'open') {
      const next = patchConnection({
        status: 'connected',
        connectedAt: readBridgeState().connection.connectedAt || Date.now(),
        qrBase64: null,
      })
      return res.json({ ...next.connection, mode: 'evolution', evolutionState: state.state })
    }
    if (state.state === 'connecting') {
      const next = patchConnection({ status: 'connecting' })
      return res.json({ ...next.connection, mode: 'evolution', evolutionState: state.state })
    }
    const next = patchConnection({ status: 'disconnected' })
    return res.json({ ...next.connection, mode: 'evolution', evolutionState: state.state })
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
    await ensureInstance(`${PUBLIC_URL}/api/webhook/evolution`)
    const qr = await fetchQr()
    const next = patchConnection({
      status: 'connecting',
      qrBase64: qr.base64,
      pairingCode: qr.pairingCode || null,
      lastError: qr.base64 ? null : 'QR indisponível',
    })
    res.json(next.connection)
  } catch (error) {
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
    patchConnection({ status: 'connecting', lastError: null, qrBase64: null, pairingCode: null })
    await ensureInstance(`${PUBLIC_URL}/api/webhook/evolution`)
    const result = await fetchPairingCode(phone)
    if (!result.pairingCode) {
      const next = patchConnection({
        status: 'connecting',
        qrBase64: result.base64,
        pairingCode: null,
        accountPhone: result.number,
        lastError:
          'Código de pareamento indisponível. Clique em Novo QR ou tente de novo em alguns segundos.',
      })
      return res.status(502).json({ error: next.connection.lastError, ...next.connection })
    }
    const next = patchConnection({
      status: 'connecting',
      pairingCode: result.pairingCode,
      qrBase64: result.base64,
      accountPhone: result.number,
      lastError: null,
    })
    return res.json({ ...next.connection, mode: 'evolution' })
  } catch (error) {
    patchConnection({
      status: 'disconnected',
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
    connectedAt: null,
    accountName: '',
    accountPhone: '',
    qrBase64: null,
    pairingCode: null,
  })
  res.json(next.connection)
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
        patchConnection({
          status: 'connected',
          connectedAt: Date.now(),
          qrBase64: null,
          accountName: 'WhatsApp conectado',
        })
        createBackup('Backup automático CONNECTION_UPDATE')
      } else if (state === 'close') {
        patchConnection({ status: 'disconnected', qrBase64: null })
      } else if (state === 'connecting') {
        patchConnection({ status: 'connecting' })
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
