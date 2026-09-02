import { useEffect, useMemo, useState } from 'react'
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
  bridgeCreateBackup,
  bridgeDisconnect,
  bridgeGetState,
  bridgePairing,
  bridgeRefreshQr,
  bridgeSetLeadLabel,
  bridgeStatus,
  crmBridgeEnabled,
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
  const [bridgeError, setBridgeError] = useState<string | null>(null)
  const [phoneInput, setPhoneInput] = useState('')

  useEffect(() => {
    if (live) return
    ensureCrmSession()
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

  // Evolution: poll bridge
  useEffect(() => {
    if (!live) return
    let cancelled = false

    const pull = async () => {
      try {
        const snapshot = await bridgeGetState()
        if (cancelled) return
        hydrateCrmFromBridge(snapshot)
        setBridgeError(null)
        if (snapshot.connection?.status === 'connecting') {
          await bridgeStatus()
          const again = await bridgeGetState()
          if (!cancelled) hydrateCrmFromBridge(again)
        }
      } catch (error) {
        if (!cancelled) {
          setBridgeError(error instanceof Error ? error.message : 'Bridge offline')
        }
      }
    }

    void pull()
    const timer = window.setInterval(pull, 2500)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [live])

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
      const connection = await bridgeConnect()
      const snapshot = await bridgeGetState()
      hydrateCrmFromBridge({ ...snapshot, connection: { ...snapshot.connection, ...connection } })
    } catch (error) {
      setBridgeError(error instanceof Error ? error.message : 'Falha ao conectar')
      disconnectCrm()
    } finally {
      setBusy(false)
    }
  }

  const onRefreshQr = async () => {
    if (!live) {
      refreshCrmQr()
      return
    }
    setBusy(true)
    try {
      await bridgeRefreshQr()
      hydrateCrmFromBridge(await bridgeGetState())
    } catch (error) {
      setBridgeError(error instanceof Error ? error.message : 'Falha ao renovar QR')
    } finally {
      setBusy(false)
    }
  }

  const onPairing = async () => {
    if (!live) return
    setBridgeError(null)
    setBusy(true)
    startCrmConnecting()
    try {
      const connection = await bridgePairing(phoneInput)
      const snapshot = await bridgeGetState()
      hydrateCrmFromBridge({
        ...snapshot,
        connection: { ...snapshot.connection, ...connection },
      })
    } catch (error) {
      setBridgeError(error instanceof Error ? error.message : 'Falha ao gerar código')
    } finally {
      setBusy(false)
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
  }

  const onSync = async () => {
    if (!live) {
      syncCrmNow()
      return
    }
    try {
      await bridgeStatus()
      hydrateCrmFromBridge(await bridgeGetState())
    } catch (error) {
      setBridgeError(error instanceof Error ? error.message : 'Falha ao sincronizar')
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
          mode={live ? 'evolution' : 'mock'}
          qrToken={state.qrToken}
          qrBase64={state.qrBase64}
          pairingCode={state.pairingCode}
          phoneInput={phoneInput}
          onPhoneChange={setPhoneInput}
          error={bridgeError || state.lastError}
          onRefreshQr={() => void onRefreshQr()}
          onStart={() => void onStartConnect()}
          onPairing={() => void onPairing()}
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
              {live ? 'WhatsApp real' : 'Demo conectada'}
            </span>
            <div>
              <strong>{state.accountName || 'WhatsApp'}</strong>
              <p>{state.accountPhone || (live ? 'Sessão Evolution' : 'Modo simulado')}</p>
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
            <button type="button" className="crm__ghost" onClick={() => void onSync()}>
              <RefreshCcw size={14} strokeWidth={2.25} />
              Sincronizar
            </button>
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
                      ? 'Nenhum lead ainda. Quando alguém mandar mensagem no WhatsApp, aparece aqui.'
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
  mode,
  qrToken,
  qrBase64,
  pairingCode,
  phoneInput,
  onPhoneChange,
  error,
  onRefreshQr,
  onStart,
  onPairing,
}: {
  status: 'disconnected' | 'connecting'
  mode: 'mock' | 'evolution'
  qrToken: string
  qrBase64: string | null
  pairingCode: string | null
  phoneInput: string
  onPhoneChange: (value: string) => void
  error: string | null
  onRefreshQr: () => void
  onStart: () => void
  onPairing: () => void
}) {
  return (
    <section className="crm__connect">
      <div className="crm__connect-copy">
        <span className="crm__badge">
          <MessageCircle size={14} strokeWidth={2.25} />
          WhatsApp CRM
        </span>
        <h2>
          {mode === 'evolution'
            ? 'Conecte seu WhatsApp com Evolution (Railway)'
            : 'Conecte o WhatsApp para montar o pipeline'}
        </h2>
        <p>
          {mode === 'evolution'
            ? 'Use o QR ou o código de pareamento. Depois de conectar 1x, a sessão fica no servidor e o CRM recebe as mensagens via webhook.'
            : 'Modo demo (simulado). Para WhatsApp real, configure o bridge — veja docs/CRM-EVOLUTION-RAILWAY.md.'}
        </p>
        <ul>
          <li>Abas por etiqueta: Pago, Sem resposta, Agendamento…</li>
          <li>IA lê a conversa e extrai evento, data, traje, nome e score</li>
          <li>Mensagens novas criam/atualizam leads automaticamente</li>
        </ul>
        {error ? <p className="crm__banner-error">{error}</p> : null}
        {mode === 'mock' ? (
          <p className="crm__note">
            Sem <code>VITE_CRM_BRIDGE_URL</code> o CRM roda em demo. Siga o guia Railway + Evolution para o QR
            real.
          </p>
        ) : (
          <div className="crm__pairing">
            <p className="crm__note">
              Se o QR falhar no celular, use o código: WhatsApp → Aparelhos conectados → Conectar um
              aparelho → <strong>Conectar com número de telefone</strong>.
            </p>
            <label className="crm__pairing-label" htmlFor="crm-pairing-phone">
              Seu WhatsApp (com DDD)
            </label>
            <div className="crm__pairing-row">
              <input
                id="crm-pairing-phone"
                className="crm__pairing-input"
                inputMode="tel"
                placeholder="11999999999"
                value={phoneInput}
                onChange={(event) => onPhoneChange(event.target.value)}
                disabled={status === 'connecting'}
              />
              <button
                type="button"
                className="crm__ghost"
                onClick={onPairing}
                disabled={status === 'connecting' || !phoneInput.trim()}
              >
                Gerar código
              </button>
            </div>
            {pairingCode ? (
              <div className="crm__pairing-code" aria-live="polite">
                <span>Código</span>
                <strong>{pairingCode}</strong>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="crm__qr-card">
        <div className={`crm__qr${status === 'connecting' ? ' is-scanning' : ''}`} aria-hidden="true">
          {qrBase64 ? (
            <img src={qrBase64} alt="QR Code WhatsApp" className="crm__qr-image" />
          ) : pairingCode ? (
            <div className="crm__qr-pairing-only">
              <strong>{pairingCode}</strong>
              <span>Digite no celular</span>
            </div>
          ) : (
            <QrPattern token={qrToken} />
          )}
          {status === 'connecting' && !qrBase64 && !pairingCode ? (
            <div className="crm__qr-overlay">
              <RefreshCcw size={22} strokeWidth={2.25} className="is-spin" />
              Gerando…
            </div>
          ) : null}
        </div>
        <p className="crm__qr-token">
          {mode === 'evolution' ? 'Evolution' : 'Demo'} · {qrToken.slice(-8).toUpperCase()}
        </p>
        <div className="crm__qr-actions">
          <button
            type="button"
            className="crm__ghost"
            onClick={onRefreshQr}
            disabled={status === 'connecting'}
          >
            <QrCode size={15} strokeWidth={2.25} />
            Novo QR
          </button>
          <button
            type="button"
            className="crm__primary"
            onClick={onStart}
            disabled={status === 'connecting'}
          >
            {status === 'connecting'
              ? 'Aguardando…'
              : mode === 'evolution'
                ? 'Conectar com QR'
                : 'Simular leitura do QR'}
          </button>
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
