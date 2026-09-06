import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  PieChart,
  RefreshCcw,
  Settings2,
  Sparkles,
  Tags,
  XCircle,
} from 'lucide-react'
import { useCrm } from '../hooks/useCrm'
import {
  bootEasyCrm,
  createCrmBackup,
  formatMoneyBr,
  getCrmValueStats,
  ingestChatPaste,
  loadDemoLeads,
  reanalyzeCrmLead,
  setCrmLeadLabel,
  setCrmLeadOutcome,
  setCrmLeadSuit,
  setCrmStoreWhatsapp,
  updateCrmScoreRules,
  updateCrmSuits,
  type CrmLabelId,
  type CrmLead,
  type CrmOutcome,
  type CrmScoreRule,
  type CrmSuitItem,
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

function outcomeLabel(outcome: CrmOutcome) {
  if (outcome === 'won') return 'Ganho'
  if (outcome === 'lost') return 'Perdido'
  return 'Aberto'
}

type CrmView = 'board' | 'paste' | 'catalog' | 'values' | 'link' | 'scoring' | 'backups'

export function Crm() {
  const state = useCrm()
  const [tab, setTab] = useState<'todos' | CrmLabelId>('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<CrmView>('board')
  const [draftRules, setDraftRules] = useState<CrmScoreRule[]>(state.scoreRules)
  const [draftSuits, setDraftSuits] = useState<CrmSuitItem[]>(state.suits)
  const [toast, setToast] = useState<string | null>(null)

  const [pasteText, setPasteText] = useState('')
  const [pasteIntoSelected, setPasteIntoSelected] = useState(false)
  const [storePhoneDraft, setStorePhoneDraft] = useState(state.storeWhatsapp)

  useEffect(() => {
    bootEasyCrm()
  }, [])

  useEffect(() => {
    setDraftRules(state.scoreRules)
  }, [state.scoreRules])

  useEffect(() => {
    setDraftSuits(state.suits)
  }, [state.suits])

  useEffect(() => {
    setStorePhoneDraft(state.storeWhatsapp)
  }, [state.storeWhatsapp])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const stats = useMemo(() => getCrmValueStats(state), [state])

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

  const captureUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/captura` : '/captura'

  const onPasteChat = () => {
    if (!pasteText.trim()) {
      setToast('Cole a conversa do atendimento.')
      return
    }
    const intoSelected = pasteIntoSelected && selected
    const { leadId } = ingestChatPaste({
      paste: pasteText,
      leadId: intoSelected ? selected.id : null,
    })
    setPasteText('')
    setPasteIntoSelected(false)
    setView('board')
    setToast(
      intoSelected
        ? 'Conversa atualizada — valor potencial recalculado'
        : 'Contato registrado',
    )
    if (leadId) setSelectedId(leadId)
  }

  return (
    <div className="crm">
      <section className="crm__shell">
        <header className="crm__top">
          <div className="crm__account">
            <div>
              <strong>Pipeline comercial</strong>
              <p>
                {state.leads.length} contato{state.leads.length === 1 ? '' : 's'} · potencial{' '}
                {formatMoneyBr(stats.totals.all)}
              </p>
            </div>
            <span className="crm__sync">
              Ganhos {formatMoneyBr(stats.totals.won)} · Perdidos {formatMoneyBr(stats.totals.lost)}
            </span>
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
              className={`crm__chip${view === 'paste' ? ' is-active' : ''}`}
              onClick={() => setView('paste')}
            >
              <ClipboardPaste size={14} strokeWidth={2.25} />
              Registrar conversa
            </button>
            <button
              type="button"
              className={`crm__chip${view === 'catalog' ? ' is-active' : ''}`}
              onClick={() => setView('catalog')}
            >
              <Tags size={14} strokeWidth={2.25} />
              Trajes e valores
            </button>
            <button
              type="button"
              className={`crm__chip${view === 'values' ? ' is-active' : ''}`}
              onClick={() => setView('values')}
            >
              <PieChart size={14} strokeWidth={2.25} />
              Análise de valores
            </button>
            <button
              type="button"
              className={`crm__chip${view === 'link' ? ' is-active' : ''}`}
              onClick={() => setView('link')}
            >
              Formulário
            </button>
            <button
              type="button"
              className={`crm__chip${view === 'scoring' ? ' is-active' : ''}`}
              onClick={() => setView('scoring')}
            >
              <Settings2 size={14} strokeWidth={2.25} />
              Pontuação
            </button>
            <button
              type="button"
              className={`crm__chip${view === 'backups' ? ' is-active' : ''}`}
              onClick={() => setView('backups')}
            >
              Backups
            </button>
          </div>
        </header>

        {toast ? <p className="crm__banner-ok">{toast}</p> : null}

        {view === 'paste' ? (
          <div className="crm__panel">
            <div className="crm__panel-head">
              <div>
                <h3>Registrar conversa</h3>
                <p>
                  Cole o histórico do atendimento. O sistema identifica nome, evento, traje do
                  catálogo e o <strong>valor potencial</strong>.
                </p>
              </div>
            </div>
            <div className="crm__form-grid">
              <label className="crm__form-span">
                Histórico da conversa
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={12}
                  placeholder={`Exemplo:\nOi, meu nome é João\nQuero o Azul Marinho para casamento dia 10/10\nTelefone (47) 99999-1122`}
                />
              </label>
              {selected ? (
                <label className="crm__check crm__form-span">
                  <input
                    type="checkbox"
                    checked={pasteIntoSelected}
                    onChange={(e) => setPasteIntoSelected(e.target.checked)}
                  />
                  Atualizar o contato selecionado ({selected.name}) em vez de criar outro
                </label>
              ) : null}
            </div>
            <div className="crm__form-actions">
              <button type="button" className="crm__primary" onClick={onPasteChat}>
                <ClipboardPaste size={15} strokeWidth={2.25} />
                Registrar contato
              </button>
              <button type="button" className="crm__ghost" onClick={() => setView('board')}>
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        {view === 'catalog' ? (
          <CatalogPanel
            suits={draftSuits}
            onChange={setDraftSuits}
            onSave={() => {
              updateCrmSuits(draftSuits)
              setToast('Catálogo salvo — contatos reanalisados')
            }}
          />
        ) : null}

        {view === 'values' ? <ValuesPanel stats={stats} /> : null}

        {view === 'link' ? (
          <div className="crm__panel">
            <div className="crm__panel-head">
              <div>
                <h3>Formulário de captura</h3>
                <p>Link para divulgação ou tablet da loja. O cliente preenche e o contato entra no CRM.</p>
              </div>
            </div>
            <div className="crm__form-grid">
              <label className="crm__form-span">
                Telefone da loja
                <input
                  value={storePhoneDraft}
                  onChange={(e) => setStorePhoneDraft(e.target.value)}
                  placeholder="47999990000"
                />
              </label>
              <label className="crm__form-span">
                Link
                <input readOnly value={captureUrl} onFocus={(e) => e.target.select()} />
              </label>
            </div>
            <div className="crm__form-actions">
              <button
                type="button"
                className="crm__primary"
                onClick={() => {
                  setCrmStoreWhatsapp(storePhoneDraft)
                  setToast('Telefone da loja salvo')
                }}
              >
                Salvar número
              </button>
              <a className="crm__ghost crm__ghost-link" href={captureUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={14} strokeWidth={2.25} />
                Abrir formulário
              </a>
            </div>
          </div>
        ) : null}

        {view === 'scoring' ? (
          <ScorePanel
            rules={draftRules}
            onChange={setDraftRules}
            onSave={() => {
              updateCrmScoreRules(draftRules)
              setToast('Regras salvas')
            }}
          />
        ) : null}

        {view === 'backups' ? (
          <BackupsPanel
            backups={state.backups}
            onCreate={() => {
              createCrmBackup('Backup manual do CRM')
              setToast('Backup gerado')
            }}
            onLoadDemo={() => {
              loadDemoLeads()
              setToast('Dados de exemplo carregados')
              setView('board')
            }}
          />
        ) : null}

        {view === 'board' ? (
          <>
            <nav className="crm__tabs" aria-label="Etiquetas do CRM">
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
                  <div className="crm__empty-box">
                    <p className="crm__empty">Nenhum contato cadastrado.</p>
                    <button type="button" className="crm__primary" onClick={() => setView('paste')}>
                      Registrar conversa
                    </button>
                    <button
                      type="button"
                      className="crm__ghost"
                      onClick={() => {
                        loadDemoLeads()
                        setToast('Dados de exemplo carregados')
                      }}
                    >
                      Carregar exemplos
                    </button>
                  </div>
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
                        <span>{lead.suitInterest || 'Traje ?'}</span>
                        <span>{formatMoneyBr(lead.potentialValue || 0)}</span>
                      </div>
                      <span className={`crm__outcome-pill is-${lead.outcome || 'open'}`}>
                        {outcomeLabel(lead.outcome || 'open')}
                      </span>
                    </button>
                  ))
                )}
              </aside>

              <div className="crm__detail">
                {selected ? (
                  <LeadDetail
                    lead={selected}
                    labels={state.labels}
                    suits={state.suits}
                    onLabel={(labelId) => setCrmLeadLabel(selected.id, labelId)}
                    onSuit={(suitId) => setCrmLeadSuit(selected.id, suitId)}
                    onOutcome={(outcome) => {
                      setCrmLeadOutcome(selected.id, outcome)
                      setToast(
                        outcome === 'won'
                          ? 'Classificado como ganho'
                          : outcome === 'lost'
                            ? 'Classificado como perdido'
                            : 'Retornado para em aberto',
                      )
                    }}
                    onReanalyze={() => {
                      reanalyzeCrmLead(selected.id)
                      setToast('Análise atualizada com o catálogo')
                    }}
                    onPasteHere={() => {
                      setPasteIntoSelected(true)
                      setView('paste')
                    }}
                  />
                ) : (
                  <p className="crm__empty">Registre uma conversa para adicionar o primeiro contato.</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}

function LeadDetail({
  lead,
  labels,
  suits,
  onLabel,
  onSuit,
  onOutcome,
  onReanalyze,
  onPasteHere,
}: {
  lead: CrmLead
  labels: { id: CrmLabelId; name: string; color: string }[]
  suits: CrmSuitItem[]
  onLabel: (labelId: CrmLabelId) => void
  onSuit: (suitId: string | null) => void
  onOutcome: (outcome: CrmOutcome) => void
  onReanalyze: () => void
  onPasteHere: () => void
}) {
  return (
    <div className="crm__detail-inner">
      <header className="crm__detail-head">
        <div>
          <h3>{lead.name}</h3>
          <p>{lead.phone}</p>
        </div>
        <div className="crm__value-stack">
          <span className="crm__money">{formatMoneyBr(lead.potentialValue || 0)}</span>
          <span className={`crm__score is-lg ${scoreTone(lead.score)}`}>Score {lead.score}</span>
        </div>
      </header>

      <div className="crm__outcome-row">
        <button
          type="button"
          className={`crm__outcome-btn is-won${lead.outcome === 'won' ? ' is-active' : ''}`}
          onClick={() => onOutcome('won')}
        >
          <CheckCircle2 size={15} strokeWidth={2.25} />
          Ganhamos
        </button>
        <button
          type="button"
          className={`crm__outcome-btn is-lost${lead.outcome === 'lost' ? ' is-active' : ''}`}
          onClick={() => onOutcome('lost')}
        >
          <XCircle size={15} strokeWidth={2.25} />
          Perdemos
        </button>
        <button
          type="button"
          className={`crm__outcome-btn is-open${lead.outcome === 'open' ? ' is-active' : ''}`}
          onClick={() => onOutcome('open')}
        >
          Em aberto
        </button>
      </div>

      <div className="crm__ai">
        <div className="crm__ai-title">
          <Sparkles size={15} strokeWidth={2.25} />
          Análise da IA
          <button type="button" className="crm__link" onClick={onReanalyze}>
            Reanalisar
          </button>
        </div>
        <p>{lead.aiSummary || 'Aguardando conversa…'}</p>
        <div className="crm__facts">
          <Fact label="Evento" value={lead.eventType || '—'} />
          <Fact label="Data" value={lead.eventDate || '—'} />
          <Fact label="Valor potencial" value={formatMoneyBr(lead.potentialValue || 0)} />
        </div>
      </div>

      <div className="crm__detail-fields">
        <label className="crm__label-field">
          Traje do catálogo
          <select
            value={lead.suitId || ''}
            onChange={(event) => onSuit(event.target.value || null)}
          >
            <option value="">Sem traje / não identificado</option>
            {suits
              .filter((suit) => suit.enabled)
              .map((suit) => (
                <option key={suit.id} value={suit.id}>
                  {suit.name} — {formatMoneyBr(suit.price)}
                </option>
              ))}
          </select>
        </label>

        <label className="crm__label-field">
          Etiqueta
          <select
            value={lead.labelId}
            onChange={(event) => onLabel(event.target.value as CrmLabelId)}
          >
            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="crm__thread">
        {lead.messages.length === 0 ? (
          <p className="crm__empty">Sem mensagens registradas. Acrescente o histórico da conversa.</p>
        ) : (
          lead.messages.map((message) => (
            <div
              key={message.id}
              className={`crm__bubble${message.from === 'store' ? ' is-store' : ' is-client'}`}
            >
              <p>{message.text}</p>
              <time>{formatWhen(message.at)}</time>
            </div>
          ))
        )}
      </div>

      <button type="button" className="crm__primary crm__ghost-block" onClick={onPasteHere}>
        <ClipboardPaste size={14} strokeWidth={2.25} />
        Acrescentar conversa a este contato
      </button>
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

function CatalogPanel({
  suits,
  onChange,
  onSave,
}: {
  suits: CrmSuitItem[]
  onChange: (suits: CrmSuitItem[]) => void
  onSave: () => void
}) {
  return (
    <div className="crm__panel">
      <div className="crm__panel-head">
        <div>
          <h3>Catálogo de trajes e valores</h3>
          <p>
            Quando a conversa mencionar o nome do traje, o contato recebe esse valor potencial
            automaticamente.
          </p>
        </div>
        <button type="button" className="crm__primary" onClick={onSave}>
          <CheckCircle2 size={15} strokeWidth={2.25} />
          Salvar catálogo
        </button>
      </div>

      <div className="crm__catalog">
        {suits.map((suit, index) => (
          <div key={suit.id} className="crm__catalog-row">
            <label className="crm__check">
              <input
                type="checkbox"
                checked={suit.enabled}
                onChange={(event) => {
                  const next = suits.slice()
                  next[index] = { ...suit, enabled: event.target.checked }
                  onChange(next)
                }}
              />
            </label>
            <input
              value={suit.name}
              onChange={(event) => {
                const next = suits.slice()
                next[index] = { ...suit, name: event.target.value }
                onChange(next)
              }}
              placeholder="Nome do traje"
            />
            <input
              type="number"
              value={suit.price}
              onChange={(event) => {
                const next = suits.slice()
                next[index] = { ...suit, price: Number(event.target.value) || 0 }
                onChange(next)
              }}
              placeholder="Valor"
            />
            <button
              type="button"
              className="crm__ghost"
              onClick={() => onChange(suits.filter((item) => item.id !== suit.id))}
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="crm__form-actions">
        <button
          type="button"
          className="crm__ghost"
          onClick={() =>
            onChange([
              ...suits,
              {
                id: crypto.randomUUID(),
                name: 'Novo traje',
                price: 0,
                enabled: true,
              },
            ])
          }
        >
          Adicionar traje
        </button>
      </div>
    </div>
  )
}

function ValuesPanel({
  stats,
}: {
  stats: ReturnType<typeof getCrmValueStats>
}) {
  return (
    <div className="crm__panel">
      <div className="crm__panel-head">
        <div>
          <h3>Análise de valores</h3>
          <p>
            Visão do valor potencial por resultado (ganho / perdido / aberto) e por traje do
            catálogo.
          </p>
        </div>
      </div>

      <div className="crm__stats-grid">
        <div className="crm__stat-card">
          <strong>{formatMoneyBr(stats.totals.won)}</strong>
          <span>Ganhos</span>
        </div>
        <div className="crm__stat-card">
          <strong>{formatMoneyBr(stats.totals.lost)}</strong>
          <span>Perdidos</span>
        </div>
        <div className="crm__stat-card">
          <strong>{formatMoneyBr(stats.totals.open)}</strong>
          <span>Em aberto</span>
        </div>
        <div className="crm__stat-card">
          <strong>{formatMoneyBr(stats.totals.all)}</strong>
          <span>Potencial total</span>
        </div>
      </div>

      <div className="crm__pies">
        <PieBlock title="Por resultado" slices={stats.outcomeSlices.map((s) => ({
          name: s.label,
          value: s.value,
          color: s.color,
        }))} />
        <PieBlock title="Por traje" slices={stats.suitSlices} />
      </div>

      {stats.bySuit.length === 0 ? (
        <p className="crm__empty">Registre conversas com trajes do catálogo para gerar a análise.</p>
      ) : (
        <ul className="crm__suit-table">
          {stats.bySuit.map((row) => (
            <li key={row.name}>
              <strong>{row.name}</strong>
              <span>Aberto {formatMoneyBr(row.open)}</span>
              <span>Ganho {formatMoneyBr(row.won)}</span>
              <span>Perdido {formatMoneyBr(row.lost)}</span>
              <em>{formatMoneyBr(row.total)}</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PieBlock({
  title,
  slices,
}: {
  title: string
  slices: Array<{ name: string; value: number; color: string }>
}) {
  const total = slices.reduce((sum, item) => sum + item.value, 0)
  const gradient = buildConicGradient(slices, total)

  return (
    <div className="crm__pie-block">
      <h4>{title}</h4>
      <div
        className="crm__pie"
        style={{ background: total > 0 ? gradient : '#e4e6ef' }}
        aria-hidden
      />
      <ul className="crm__pie-legend">
        {slices.length === 0 ? (
          <li>Sem dados</li>
        ) : (
          slices.map((slice) => (
            <li key={slice.name}>
              <i style={{ background: slice.color }} />
              <span>{slice.name}</span>
              <strong>{formatMoneyBr(slice.value)}</strong>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

function buildConicGradient(
  slices: Array<{ value: number; color: string }>,
  total: number,
) {
  if (!total) return '#e4e6ef'
  let cursor = 0
  const parts: string[] = []
  for (const slice of slices) {
    const start = (cursor / total) * 360
    cursor += slice.value
    const end = (cursor / total) * 360
    parts.push(`${slice.color} ${start}deg ${end}deg`)
  }
  return `conic-gradient(${parts.join(', ')})`
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
          <h3>Pontuação da conversa</h3>
          <p>Palavras-chave que reforçam o score comercial do contato.</p>
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
  onLoadDemo,
}: {
  backups: { id: string; createdAt: number; leadCount: number; note: string }[]
  onCreate: () => void
  onLoadDemo: () => void
}) {
  return (
    <div className="crm__panel">
      <div className="crm__panel-head">
        <div>
          <h3>Backups</h3>
          <p>Cópias de segurança dos contatos neste navegador.</p>
        </div>
        <div className="crm__form-actions" style={{ margin: 0 }}>
          <button type="button" className="crm__primary" onClick={onCreate}>
            Gerar backup
          </button>
          <button type="button" className="crm__ghost" onClick={onLoadDemo}>
            <RefreshCcw size={14} strokeWidth={2.25} />
            Carregar exemplos
          </button>
        </div>
      </div>
      {backups.length === 0 ? (
        <p className="crm__empty">Nenhum backup ainda.</p>
      ) : (
        <ul className="crm__backups">
          {backups.map((backup) => (
            <li key={backup.id}>
              <strong>{formatWhen(backup.createdAt)}</strong>
              <span>
                {backup.leadCount} contatos · {backup.note}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
