import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  MessageCircle,
  QrCode,
  RefreshCcw,
  Settings2,
  Sparkles,
  Unplug,
  Wifi,
} from 'lucide-react'
import { useCrm } from '../hooks/useCrm'
import {
  bridgeConnect,
  bridgeConfirmSession,
  bridgeCreateBackup,
  bridgeDisconnect,
  bridgeGetState,
  bridgeHealth,
  bridgeRefreshQr,
  bridgeSetLeadLabel,
  bridgeSimulateMessage,
  bridgeStatus,
  bridgeSyncConversations,
  crmBridgeEnabled,
  type BridgeProvider,
} from '../lib/crmApi'
import {
  addCrmDemoMessage,
  completeCrmConnection,
  createCrmBackup,
  disconnectCrm,
  ensureCrmSession,
  hydrateCrmFromBridge,
  reanalyzeCrmLead,
  refreshCrmQr,
  setCrmLeadLabel,
  startCrmConnecting,
  syncCrmNow,
  updateCrmScoreRules,
  type CrmLabelId,
  type CrmLead,
  type CrmScoreRule,
} from '../lib/crmStore'
import './Crm.css'

function formatWhen(ts: number | null) {
  if (!ts) return '—'
  const date = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function scoreTone(score: number) {
  if (score >= 70) return 'is-hot'
  if (score >= 40) return 'is-warm'
  return 'is-cool'
}

export function Crm() {
  const state = useCrm()
  const live = crmBridgeEnabled()
  const [tab, setTab] = useState<'todos' | CrmLabelId>('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'board' | 'scoring' | 'backups'>('board')
  const [draftRules, setDraftRules] = useState<CrmScoreRule[]>(state.scoreRules)
  const [demoText, setDemoText] = useState('')
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [bridgeError, setBridgeError] = useState<string | null>(null)
  const [provider, setProvider] = useState<BridgeProvider>('mock')
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [qrBootstrapped, setQrBootstrapped] = useState(false)
  const [qrRenderKey, setQrRenderKey] = useState(0)
  const [sessionReady, setSessionReady] = useState(false)
  const qrFetchRef = useRef(false)
  const didSyncRef = useRef(false)
  const liveBootRef = useRef(false)
  const isMeta = provider === 'meta'
  const isEvolution = provider === 'evolution'

  const pullOfficialQr = async (forceNew: boolean) => {
    if (qrFetchRef.current) return null
    qrFetchRef.current = true
    const previousQr = state.qrBase64
    try {
      if (forceNew) {
        setBusy(true)
        setBridgeError(null)
      }

      const request = forceNew ? bridgeRefreshQr() : bridgeConnect()
      const timeout = new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error('Demorou demais para gerar o QR. Tente de novo.')), 18000)
      })
      const connection = (await Promise.race([request, timeout])) as Awaited<
        ReturnType<typeof bridgeRefreshQr>
      > & { sessionReady?: boolean; needsConfirm?: boolean }
      if (connection.mode === 'meta' || connection.mode === 'evolution') {
        setProvider(connection.mode)
      }
      const snapshot = await bridgeGetState()
      hydrateCrmFromBridge({
        ...snapshot,
        connection: { ...snapshot.connection, ...connection, crmOpen: false },
      })
      setSessionReady(Boolean(connection.sessionReady || connection.needsConfirm))

      const nextQr = (connection.qrBase64 as string | null | undefined) || null
      if (nextQr) {
        if (!previousQr || nextQr !== previousQr) {
          setQrRenderKey((key) => key + 1)
        }
        setBridgeError(null)
      } else if (connection.sessionReady || connection.needsConfirm) {
        setBridgeError(null)
      } else if (connection.lastError) {
        setBridgeError(String(connection.lastError))
      } else if (!connection.sessionReady) {
        setBridgeError('QR não veio. Clique em Novo QR de novo.')
      }
      return connection
    } catch (error) {
      try {
        hydrateCrmFromBridge(await bridgeGetState())
      } catch {
        // ignore
      }
      throw error
    } finally {
      qrFetchRef.current = false
      setBusy(false)
    }
  }

  useEffect(() => {
    if (live) return
    ensureCrmSession()
  }, [live])

  // Descobre provedor (Meta > Evolution)
  useEffect(() => {
    if (!live) {
      setProvider('mock')
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const health = await bridgeHealth()
        if (cancelled) return
        setProvider((health.provider as BridgeProvider) || 'mock')
        setWebhookUrl(health.webhookMeta || health.publicUrl || null)
      } catch {
        if (!cancelled) setBridgeError('Bridge offline — inicie o crm-bridge (npm start)')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [live])

  // Modo live: ao abrir a página, não entra conectado sozinho
  useEffect(() => {
    if (!live || liveBootRef.current) return
    liveBootRef.current = true
    disconnectCrm()
    setSessionReady(false)
  }, [live])

  useEffect(() => {
    setDraftRules(state.scoreRules)
  }, [state.scoreRules])

  // Mock auto-complete only
  useEffect(() => {
    if (live) return
    if (state.status !== 'connecting') return
    const timer = window.setTimeout(() => {
      completeCrmConnection()
      createCrmBackup('Backup automático pós-conexão')
    }, 2200)
    return () => window.clearTimeout(timer)
  }, [live, state.status])

  // Evolution: QR oficial na abertura
  useEffect(() => {
    if (!live || !isEvolution || qrBootstrapped) return
    if (state.status === 'connected') {
      setQrBootstrapped(true)
      return
    }
    let cancelled = false
    setQrBootstrapped(true)
    startCrmConnecting()
    // Só mostra "carregando" se ainda não há QR na tela
    if (!state.qrBase64) setBusy(true)
    void (async () => {
      try {
        await pullOfficialQr(false)
      } catch (error) {
        if (!cancelled) {
          setBridgeError(error instanceof Error ? error.message : 'Falha ao carregar QR')
        }
      } finally {
        if (!cancelled) setBusy(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, isEvolution, qrBootstrapped, state.status])

  // Evolution: status + QR automático a cada 45s
  useEffect(() => {
    if (!live || !isEvolution) return
    if (state.status === 'connected') return
    let cancelled = false

    const pullStatus = async () => {
      try {
        const status = await bridgeStatus()
        if (cancelled) return
        // Só pede confirmação em sessão antiga (sem QR lido nesta tela)
        setSessionReady(Boolean(status.needsConfirm))

        const snapshot = await bridgeGetState()
        if (cancelled) return

        // Confia no bridge: após QR → connected; sessão antiga → connecting + needsConfirm
        hydrateCrmFromBridge({
          ...snapshot,
          connection: {
            ...snapshot.connection,
            ...status,
            crmOpen: Boolean(status.crmOpen),
            status: status.needsConfirm
              ? 'connecting'
              : status.status === 'connected'
                ? 'connected'
                : status.status || snapshot.connection?.status || 'connecting',
          },
        })
      } catch (error) {
        if (!cancelled) {
          setBridgeError(error instanceof Error ? error.message : 'Bridge offline')
        }
      }
    }

    const refreshQrSoft = async () => {
      if (cancelled || busy || qrFetchRef.current || !state.qrBase64) return
      try {
        await pullOfficialQr(true)
      } catch {
        // ignore soft refresh errors
      }
    }

    void pullStatus()
    const statusTimer = window.setInterval(pullStatus, 2500)
    const qrTimer = window.setInterval(refreshQrSoft, 45000)
    return () => {
      cancelled = true
      window.clearInterval(statusTimer)
      window.clearInterval(qrTimer)
    }
  }, [live, isEvolution, state.status])

  // Meta: atualiza leads enquanto conectado (webhook é o canal principal)
  useEffect(() => {
    if (!live || !isMeta) return
    if (state.status !== 'connected') return
    let cancelled = false
    const pull = async () => {
      try {
        const snapshot = await bridgeGetState()
        if (!cancelled) hydrateCrmFromBridge(snapshot)
      } catch {
        // ignore
      }
    }
    void pull()
    const timer = window.setInterval(pull, 4000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [live, isMeta, state.status])

  // Evolution: busca só mensagens novas a cada 20s
  useEffect(() => {
    if (!live || !isEvolution) return
    if (state.status !== 'connected') {
      didSyncRef.current = false
      return
    }

    const runSync = async (silent: boolean) => {
      try {
        const synced = await bridgeSyncConversations()
        hydrateCrmFromBridge(synced)
        if (!silent && synced.importedChats) setBridgeError(null)
        // Vazio não é erro — só aguardando mensagens novas
      } catch (error) {
        if (!silent) {
          setBridgeError(
            error instanceof Error
              ? error.message
              : 'Conectou. Se novas mensagens não aparecerem, clique em Atualizar.',
          )
        }
      }
    }

    if (!didSyncRef.current) {
      didSyncRef.current = true
      void runSync(true)
    }

    const timer = window.setInterval(() => {
      void runSync(true)
    }, 20000)

    return () => window.clearInterval(timer)
  }, [live, isEvolution, state.status])

  const counts = useMemo(() => {
    const map: Record<string, number> = { todos: state.leads.length }
    for (const label of state.labels) map[label.id] = 0
    for (const lead of state.leads) map[lead.labelId] = (map[lead.labelId] ?? 0) + 1
    return map
  }, [state.leads, state.labels])

  const filtered = useMemo(() => {
    const list =
      tab === 'todos' ? state.leads : state.leads.filter((lead) => lead.labelId === tab)
    return list.slice().sort((a, b) => b.updatedAt - a.updatedAt)
  }, [state.leads, tab])

  const selected =
    filtered.find((lead) => lead.id === selectedId) ??
    state.leads.find((lead) => lead.id === selectedId) ??
    filtered[0] ??
    null

  useEffect(() => {
    if (!selected) {
      setSelectedId(null)
      return
    }
    if (selected.id !== selectedId) setSelectedId(selected.id)
  }, [selected, selectedId])

  const onStartConnect = async () => {
    setBridgeError(null)
    if (!live) {
      startCrmConnecting()
      return
    }
    setBusy(true)
    startCrmConnecting()
    try {
      if (isMeta || !isEvolution) {
        const connection = await bridgeConnect()
        const snapshot = await bridgeGetState()
        hydrateCrmFromBridge({
          ...snapshot,
          connection: { ...snapshot.connection, ...connection, crmOpen: true, status: 'connected' },
        })
        if (connection.webhookUrl) setWebhookUrl(connection.webhookUrl)
        setSessionReady(false)
        setBridgeError(null)
        return
      }
      await pullOfficialQr(false)
    } catch (error) {
      setBridgeError(error instanceof Error ? error.message : 'Falha ao conectar')
      disconnectCrm()
    } finally {
      setBusy(false)
    }
  }

  const onConfirmSession = async () => {
    if (!live) return
    setBridgeError(null)
    setBusy(true)
    try {
      const connection = await bridgeConfirmSession()
      const snapshot = await bridgeGetState()
      hydrateCrmFromBridge({
        ...snapshot,
        connection: { ...snapshot.connection, ...connection, crmOpen: true, status: 'connected' },
      })
      setSessionReady(false)
    } catch (error) {
      setBridgeError(error instanceof Error ? error.message : 'Falha ao abrir sessão')
    } finally {
      setBusy(false)
    }
  }

  const onRefreshQr = async () => {
    if (!live || isMeta) {
      if (!live) refreshCrmQr()
      return
    }
    // Bloqueado enquanto gera; só libera novo clique com QR na tela (ou para tentar de novo após erro)
    if (busy || qrFetchRef.current) return
    if (!state.qrBase64 && !(bridgeError || state.lastError)) return
    setBridgeError(null)
    startCrmConnecting()
    try {
      await pullOfficialQr(true)
    } catch (error) {
      setBridgeError(error instanceof Error ? error.message : 'Falha ao renovar QR')
    }
  }

  const onDisconnect = async () => {
    if (live) {
      try {
        await bridgeDisconnect()
      } catch {
        // ignore
      }
    }
    disconnectCrm()
    setSessionReady(false)
    if (live && isEvolution) {
      startCrmConnecting()
      try {
        await pullOfficialQr(true)
      } catch {
        // QR pode falhar; usuário clica Novo QR
      }
    }
  }

  const onSimulate = async () => {
    if (!live) return
    setBusy(true)
    try {
      const snapshot = await bridgeSimulateMessage({
        phone: '5548999887766',
        pushName: 'Cliente Teste',
        text: 'Oi! Quero terno azul para casamento no dia 20/10',
      })
      hydrateCrmFromBridge(snapshot)
      setBridgeError(null)
    } catch (error) {
      setBridgeError(error instanceof Error ? error.message : 'Falha ao simular')
    } finally {
      setBusy(false)
    }
  }

  const onSync = async () => {
    if (!live) {
      syncCrmNow()
      return
    }
    setBridgeError(null)
    setSyncing(true)
    try {
      if (isMeta) {
        hydrateCrmFromBridge(await bridgeGetState())
        return
      }
      await bridgeStatus()
      const synced = await bridgeSyncConversations()
      hydrateCrmFromBridge(synced)
      if (!synced.importedChats) {
        setBridgeError(
          synced.tip ||
            'Sem mensagens novas ainda. Peça para alguém te mandar um WhatsApp e aguarde ~20s.',
        )
      }
    } catch (error) {
      setBridgeError(error instanceof Error ? error.message : 'Falha ao buscar mensagens novas')
    } finally {
      setSyncing(false)
    }
  }

  const onChangeLabel = async (leadId: string, labelId: CrmLabelId) => {
    setCrmLeadLabel(leadId, labelId)
    if (live) {
      try {
        hydrateCrmFromBridge(await bridgeSetLeadLabel(leadId, labelId))
      } catch {
        // keep local
      }
    }
  }

  const onBackup = async () => {
    if (!live) {
      createCrmBackup('Backup manual do CRM')
      return
    }
    hydrateCrmFromBridge(await bridgeCreateBackup('Backup manual do CRM'))
  }

  if (state.status !== 'connected') {
    return (
      <div className="crm">
        <ConnectPanel
          status={state.status === 'connecting' || busy ? 'connecting' : 'disconnected'}
          busy={busy}
          mode={
            !live ? 'mock' : isEvolution && !isMeta ? 'evolution' : 'meta'
          }
          qrToken={state.qrToken}
          qrBase64={state.qrBase64}
          qrRenderKey={qrRenderKey}
          sessionReady={sessionReady}
          webhookUrl={webhookUrl}
          error={bridgeError || state.lastError}
          onRefreshQr={() => void onRefreshQr()}
          onStart={() => void onStartConnect()}
          onConfirmSession={() => void onConfirmSession()}
          onDisconnectSession={() => void onDisconnect()}
          onSimulate={() => void onSimulate()}
        />
      </div>
    )
  }

  return (
    <div className="crm">
      <section className="crm__shell">
        <header className="crm__top">
          <div className="crm__account">
            <span className="crm__online">
              <Wifi size={14} strokeWidth={2.25} />
              {live ? (isMeta ? 'WhatsApp Cloud API' : 'WhatsApp real') : 'Demo conectada'}
            </span>
            <div>
              <strong>{state.accountName || 'WhatsApp'}</strong>
              <p>
                {state.accountPhone ||
                  (live ? (isMeta ? 'Número Business Meta' : 'Sessão Evolution') : 'Modo simulado')}
              </p>
            </div>
            <span className="crm__sync">Última sync: {formatWhen(state.lastSyncAt)}</span>
          </div>

          <div className="crm__top-actions">
            <button
              type="button"
              className={`crm__chip${view === 'board' ? ' is-active' : ''}`}
              onClick={() => setView('board')}
            >
              Pipeline
            </button>
            <button
              type="button"
              className={`crm__chip${view === 'scoring' ? ' is-active' : ''}`}
              onClick={() => setView('scoring')}
            >
              <Settings2 size={14} strokeWidth={2.25} />
              Pontuação IA
            </button>
            <button
              type="button"
              className={`crm__chip${view === 'backups' ? ' is-active' : ''}`}
              onClick={() => setView('backups')}
            >
              Backups
            </button>
            <button
              type="button"
              className="crm__ghost"
              onClick={() => void onSync()}
              disabled={syncing}
            >
              <RefreshCcw size={14} strokeWidth={2.25} className={syncing ? 'is-spin' : undefined} />
              {syncing ? 'Buscando…' : 'Atualizar'}
            </button>
            {live ? (
              <button type="button" className="crm__ghost" onClick={() => void onSimulate()} disabled={busy}>
                Msg teste
              </button>
            ) : null}
            <button type="button" className="crm__danger" onClick={() => void onDisconnect()}>
              <Unplug size={14} strokeWidth={2.25} />
              Desconectar
            </button>
          </div>
        </header>

        {bridgeError ? <p className="crm__banner-error">{bridgeError}</p> : null}

        {view === 'scoring' ? (
          <ScorePanel
            rules={draftRules}
            onChange={setDraftRules}
            onSave={() => updateCrmScoreRules(draftRules)}
          />
        ) : null}

        {view === 'backups' ? (
          <BackupsPanel backups={state.backups} onCreate={() => void onBackup()} />
        ) : null}

        {view === 'board' ? (
          <>
            <nav className="crm__tabs" aria-label="Etiquetas WhatsApp">
              <button
                type="button"
                className={`crm__tab${tab === 'todos' ? ' is-active' : ''}`}
                onClick={() => setTab('todos')}
              >
                Todos
                <span>{counts.todos ?? 0}</span>
              </button>
              {state.labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  className={`crm__tab${tab === label.id ? ' is-active' : ''}`}
                  style={{ ['--tab-color' as string]: label.color }}
                  onClick={() => setTab(label.id)}
                >
                  {label.name}
                  <span>{counts[label.id] ?? 0}</span>
                </button>
              ))}
            </nav>

            <div className="crm__workspace">
              <aside className="crm__list">
                {filtered.length === 0 ? (
                  <p className="crm__empty">
                    {live
                      ? isMeta
                        ? 'Aguardando mensagens novas no WhatsApp Business…'
                        : 'Nenhum lead ainda. Quando alguém mandar mensagem no WhatsApp, aparece aqui.'
                      : 'Nenhum lead nesta etiqueta.'}
                  </p>
                ) : (
                  filtered.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      className={`crm__lead${selected?.id === lead.id ? ' is-active' : ''}`}
                      onClick={() => setSelectedId(lead.id)}
                    >
                      <div className="crm__lead-top">
                        <strong>{lead.name}</strong>
                        <span className={`crm__score ${scoreTone(lead.score)}`}>{lead.score}</span>
                      </div>
                      <p>{lead.phone}</p>
                      <div className="crm__lead-meta">
                        <span>{lead.eventType || 'Evento ?'}</span>
                        <span>{lead.suitInterest || 'Traje ?'}</span>
                      </div>
                    </button>
                  ))
                )}
              </aside>

              <div className="crm__detail">
                {selected ? (
                  <LeadDetail
                    lead={selected}
                    labels={state.labels}
                    demoText={demoText}
                    live={live}
                    onDemoText={setDemoText}
                    onLabel={(labelId) => void onChangeLabel(selected.id, labelId)}
                    onReanalyze={() => reanalyzeCrmLead(selected.id)}
                    onSendDemo={() => {
                      const text = demoText.trim()
                      if (!text) return
                      addCrmDemoMessage(selected.id, text, 'client')
                      setDemoText('')
                    }}
                  />
                ) : (
                  <p className="crm__empty">Selecione um lead para ver a conversa e a análise da IA.</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}

function ConnectPanel({
  status,
  busy,
  mode,
  qrToken,
  qrBase64,
  qrRenderKey,
  sessionReady,
  webhookUrl,
  error,
  onRefreshQr,
  onStart,
  onConfirmSession,
  onDisconnectSession,
  onSimulate,
}: {
  status: 'disconnected' | 'connecting'
  busy: boolean
  mode: 'mock' | 'evolution' | 'meta'
  qrToken: string
  qrBase64: string | null
  qrRenderKey: number
  sessionReady: boolean
  webhookUrl: string | null
  error: string | null
  onRefreshQr: () => void
  onStart: () => void
  onConfirmSession: () => void
  onDisconnectSession: () => void
  onSimulate: () => void
}) {
  const showFakeQr = mode === 'mock' && !qrBase64
  const showOfficialQr = Boolean(qrBase64)

  if (mode === 'meta') {
    return (
      <section className="crm__connect">
        <div className="crm__connect-copy">
          <span className="crm__badge">
            <MessageCircle size={14} strokeWidth={2.25} />
            WhatsApp Cloud API
          </span>
          <h2>Conecte pelo WhatsApp oficial (Meta)</h2>
          <p>
            Sem QR de celular. As mensagens novas do número Business entram no pipeline pelo sistema
            da própria Meta.
          </p>
          <ul>
            <li>Canal oficial — mais estável que Evolution/QR</li>
            <li>Só mensagens novas (sem histórico antigo)</li>
            <li>IA extrai evento, data, traje e score</li>
          </ul>
          {error ? <p className="crm__banner-error">{error}</p> : null}
          <p className="crm__note">
            Guia: <code>docs/CRM-WHATSAPP-CLOUD.md</code>
            {webhookUrl ? (
              <>
                <br />
                Webhook: <code>{webhookUrl}</code>
              </>
            ) : null}
          </p>
          <div className="crm__pairing-row" style={{ marginTop: '1rem' }}>
            <button type="button" className="crm__primary" onClick={onStart} disabled={busy}>
              {busy ? 'Validando token…' : 'Conectar WhatsApp oficial'}
            </button>
            <button type="button" className="crm__ghost" onClick={onSimulate} disabled={busy}>
              Simular mensagem
            </button>
          </div>
        </div>
        <div className="crm__qr-card">
          <div className="crm__qr">
            <div className="crm__qr-loading">
              <CheckCircle2 size={28} strokeWidth={2.25} />
              <span>Meta Cloud API</span>
            </div>
          </div>
          <p className="crm__qr-token">Sem QR · número Business</p>
        </div>
      </section>
    )
  }

  return (
    <section className="crm__connect">
      <div className="crm__connect-copy">
        <span className="crm__badge">
          <MessageCircle size={14} strokeWidth={2.25} />
          WhatsApp CRM
        </span>
        <h2>
          {mode === 'evolution'
            ? 'Conecte seu WhatsApp com Evolution (legado)'
            : 'Conecte o WhatsApp para montar o pipeline'}
        </h2>
        <p>
          {mode === 'evolution'
            ? sessionReady
              ? 'Já existe uma sessão WhatsApp ativa na Evolution. Confirme abaixo para abrir o pipeline.'
              : 'Escaneie o QR à direita (legado). O caminho recomendado agora é a Cloud API da Meta.'
            : 'Modo demo. Para WhatsApp real, configure a Cloud API — docs/CRM-WHATSAPP-CLOUD.md.'}
        </p>
        <ul>
          <li>Abas por etiqueta: Pago, Sem resposta, Agendamento…</li>
          <li>IA lê a conversa e extrai evento, data, traje, nome e score</li>
          <li>Mensagens novas criam/atualizam leads automaticamente</li>
        </ul>
        {error ? <p className="crm__banner-error">{error}</p> : null}
        {mode === 'mock' ? (
          <p className="crm__note">
            Sem <code>VITE_CRM_BRIDGE_URL</code> o CRM roda em demo. Preferido:{' '}
            <code>docs/CRM-WHATSAPP-CLOUD.md</code>.
          </p>
        ) : sessionReady ? (
          <div className="crm__pairing">
            <p className="crm__note">
              Sessão detectada na Evolution. Clique em <strong>Abrir CRM com esta sessão</strong> ou
              desconecte para gerar um QR novo.
            </p>
            <div className="crm__pairing-row">
              <button
                type="button"
                className="crm__primary"
                onClick={onConfirmSession}
                disabled={busy}
              >
                Abrir CRM com esta sessão
              </button>
              <button
                type="button"
                className="crm__ghost"
                onClick={onDisconnectSession}
                disabled={busy}
              >
                Desconectar e gerar QR
              </button>
            </div>
          </div>
        ) : (
          <p className="crm__note">Escaneie o QR. Ou migre para Meta Cloud API (mais estável).</p>
        )}
      </div>

      <div className="crm__qr-card">
        <div className={`crm__qr${busy ? ' is-scanning' : ''}`}>
          {sessionReady && mode === 'evolution' ? (
            <div className="crm__qr-loading">
              <CheckCircle2 size={28} strokeWidth={2.25} />
              <span>Sessão já ativa</span>
            </div>
          ) : showOfficialQr ? (
            <>
              <img
                key={`${qrRenderKey}-${qrBase64!.slice(-24)}`}
                src={qrBase64!}
                alt="QR Code WhatsApp"
                className="crm__qr-image"
              />
              {busy ? (
                <div className="crm__qr-overlay">
                  <RefreshCcw size={22} strokeWidth={2.25} className="is-spin" />
                  Atualizando QR…
                </div>
              ) : null}
            </>
          ) : showFakeQr ? (
            <QrPattern token={qrToken} />
          ) : (
            <div className="crm__qr-loading">
              <RefreshCcw size={22} strokeWidth={2.25} className="is-spin" />
              <span>Carregando QR…</span>
            </div>
          )}
        </div>
        <p className="crm__qr-token">
          {mode === 'evolution' ? 'QR Evolution (legado)' : 'Demo'} · {qrToken.slice(-8).toUpperCase()}
        </p>
        <div className="crm__qr-actions crm__qr-actions--single">
          {mode === 'evolution' ? (
            sessionReady ? (
              <button
                type="button"
                className="crm__primary"
                onClick={onConfirmSession}
                disabled={busy}
              >
                Abrir CRM com esta sessão
              </button>
            ) : (
              <button
                type="button"
                className="crm__primary"
                onClick={onRefreshQr}
                disabled={busy || (!showOfficialQr && !error)}
              >
                <QrCode size={15} strokeWidth={2.25} />
                {busy ? 'Aguarde o QR…' : showOfficialQr ? 'Novo QR' : 'Tentar de novo'}
              </button>
            )
          ) : (
            <button
              type="button"
              className="crm__primary"
              onClick={onStart}
              disabled={status === 'connecting'}
            >
              {status === 'connecting' ? 'Aguardando…' : 'Simular leitura do QR'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function QrPattern({ token }: { token: string }) {
  const cells = useMemo(() => {
    let seed = 0
    for (let i = 0; i < token.length; i += 1) seed = (seed + token.charCodeAt(i) * (i + 1)) % 997
    return Array.from({ length: 13 * 13 }, (_, index) => {
      seed = (seed * 37 + index * 17) % 100
      return seed > 48
    })
  }, [token])

  return (
    <div className="crm__qr-grid">
      {cells.map((on, index) => (
        <span key={index} className={on ? 'is-on' : undefined} />
      ))}
    </div>
  )
}

function LeadDetail({
  lead,
  labels,
  demoText,
  live,
  onDemoText,
  onLabel,
  onReanalyze,
  onSendDemo,
}: {
  lead: CrmLead
  labels: { id: CrmLabelId; name: string; color: string }[]
  demoText: string
  live?: boolean
  onDemoText: (value: string) => void
  onLabel: (labelId: CrmLabelId) => void
  onReanalyze: () => void
  onSendDemo: () => void
}) {
  return (
    <div className="crm__detail-inner">
      <header className="crm__detail-head">
        <div>
          <h3>{lead.name}</h3>
          <p>{lead.phone}</p>
        </div>
        <span className={`crm__score is-lg ${scoreTone(lead.score)}`}>Score {lead.score}</span>
      </header>

      <div className="crm__ai">
        <div className="crm__ai-title">
          <Sparkles size={15} strokeWidth={2.25} />
          Análise da IA
          <button type="button" className="crm__link" onClick={onReanalyze}>
            Reanalisar
          </button>
        </div>
        <p>{lead.aiSummary || 'Aguardando mais mensagens do cliente…'}</p>
        <div className="crm__facts">
          <Fact label="Evento" value={lead.eventType || '—'} />
          <Fact label="Data" value={lead.eventDate || '—'} />
          <Fact label="Traje" value={lead.suitInterest || '—'} />
        </div>
        {lead.scoreHits.length > 0 ? (
          <div className="crm__hits">
            {lead.scoreHits.map((hit) => (
              <span key={hit.ruleId}>
                {hit.label} +{hit.points}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <label className="crm__label-field">
        Etiqueta WhatsApp
        <select value={lead.labelId} onChange={(event) => onLabel(event.target.value as CrmLabelId)}>
          {labels.map((label) => (
            <option key={label.id} value={label.id}>
              {label.name}
            </option>
          ))}
        </select>
      </label>

      <div className="crm__thread">
        {lead.messages.map((message) => (
          <div
            key={message.id}
            className={`crm__bubble${message.from === 'store' ? ' is-store' : ' is-client'}`}
          >
            <p>{message.text}</p>
            <time>{formatWhen(message.at)}</time>
          </div>
        ))}
      </div>

      {live ? (
        <p className="crm__empty" style={{ margin: '0.5rem 0 0' }}>
          Mensagens reais chegam pelo WhatsApp conectado. Use a etiqueta acima para mover o lead de aba.
        </p>
      ) : (
        <div className="crm__composer">
          <input
            value={demoText}
            onChange={(event) => onDemoText(event.target.value)}
            placeholder='Simular msg do cliente… ex: "quero um terno cinza para 10/10"'
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSendDemo()
            }}
          />
          <button type="button" className="crm__primary" onClick={onSendDemo}>
            Enviar e analisar
          </button>
        </div>
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="crm__fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ScorePanel({
  rules,
  onChange,
  onSave,
}: {
  rules: CrmScoreRule[]
  onChange: (rules: CrmScoreRule[]) => void
  onSave: () => void
}) {
  return (
    <div className="crm__panel">
      <div className="crm__panel-head">
        <div>
          <h3>Pontuação configurável</h3>
          <p>Defina palavras-chave da conversa e quanto cada uma soma no potencial do lead.</p>
        </div>
        <button type="button" className="crm__primary" onClick={onSave}>
          <CheckCircle2 size={15} strokeWidth={2.25} />
          Salvar regras
        </button>
      </div>
      <div className="crm__rules">
        {rules.map((rule, index) => (
          <div key={rule.id} className="crm__rule">
            <label className="crm__check">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(event) => {
                  const next = rules.slice()
                  next[index] = { ...rule, enabled: event.target.checked }
                  onChange(next)
                }}
              />
              Ativa
            </label>
            <input
              value={rule.keyword}
              onChange={(event) => {
                const next = rules.slice()
                next[index] = { ...rule, keyword: event.target.value }
                onChange(next)
              }}
              placeholder="palavra-chave"
            />
            <input
              type="number"
              value={rule.points}
              onChange={(event) => {
                const next = rules.slice()
                next[index] = { ...rule, points: Number(event.target.value) || 0 }
                onChange(next)
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function BackupsPanel({
  backups,
  onCreate,
}: {
  backups: { id: string; createdAt: number; leadCount: number; note: string }[]
  onCreate: () => void
}) {
  return (
    <div className="crm__panel">
      <div className="crm__panel-head">
        <div>
          <h3>Backups do CRM</h3>
          <p>Snapshots locais dos leads e da sessão (protótipo em localStorage).</p>
        </div>
        <button type="button" className="crm__primary" onClick={onCreate}>
          Gerar backup agora
        </button>
      </div>
      {backups.length === 0 ? (
        <p className="crm__empty">Nenhum backup ainda.</p>
      ) : (
        <ul className="crm__backups">
          {backups.map((backup) => (
            <li key={backup.id}>
              <strong>{formatWhen(backup.createdAt)}</strong>
              <span>
                {backup.leadCount} leads · {backup.note}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
