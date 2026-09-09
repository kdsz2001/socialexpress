import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  MessageCircle,
  PieChart,
  Plus,
  Search,
  Tags,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { useCrm } from '../hooks/useCrm'
import {
  bootEasyCrm,
  buildLeadWhatsappLink,
  createQuickLead,
  formatMoneyBr,
  getCrmFollowupDue,
  getCrmValueStats,
  markLeadFollowupSent,
  renderFollowupMessage,
  resetLeadFollowup,
  setCrmLeadOutcome,
  setLeadFollowupEnabled,
  updateCrmFollowupConfig,
  updateCrmLeadBasics,
  updateCrmSuits,
  type CrmFollowupStep,
  type CrmLead,
  type CrmOutcome,
  type CrmSuitItem,
} from '../lib/crmStore'
import { phoneMatchesQuery } from '../lib/whatsappPhone'
import './Crm.css'

function outcomeLabel(outcome: CrmOutcome) {
  if (outcome === 'won') return 'Ganho'
  if (outcome === 'lost') return 'Perdido'
  return 'Em aberto'
}

type CrmView = 'board' | 'novo' | 'catalog' | 'values' | 'followup'

export function Crm() {
  const state = useCrm()
  const [tab, setTab] = useState<'todos' | 'open' | 'won' | 'lost'>('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<CrmView>('board')
  const [draftSuits, setDraftSuits] = useState<CrmSuitItem[]>(state.suits)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [suitId, setSuitId] = useState('')

  useEffect(() => {
    bootEasyCrm()
  }, [])

  useEffect(() => {
    setDraftSuits(state.suits)
  }, [state.suits])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const stats = useMemo(() => getCrmValueStats(state), [state])
  const followupDue = useMemo(() => getCrmFollowupDue(state), [state])

  const selectedSuit = useMemo(
    () => state.suits.find((suit) => suit.id === suitId && suit.enabled) || null,
    [state.suits, suitId],
  )
  const estimatedValue = selectedSuit ? Number(selectedSuit.price) || 0 : 0

  const filtered = useMemo(() => {
    let list = state.leads.slice()
    if (tab === 'open') list = list.filter((lead) => (lead.outcome || 'open') === 'open')
    if (tab === 'won') list = list.filter((lead) => lead.outcome === 'won')
    if (tab === 'lost') list = list.filter((lead) => lead.outcome === 'lost')

    const q = query.trim().toLocaleLowerCase('pt-BR')
    if (q) {
      list = list.filter((lead) => {
        const nameHit = lead.name.toLocaleLowerCase('pt-BR').includes(q)
        const phoneHit = phoneMatchesQuery(lead.phone, query)
        return nameHit || phoneHit
      })
    }

    return list.sort((a, b) => b.updatedAt - a.updatedAt)
  }, [state.leads, tab, query])

  const counts = useMemo(
    () => ({
      todos: state.leads.length,
      open: state.leads.filter((lead) => (lead.outcome || 'open') === 'open').length,
      won: state.leads.filter((lead) => lead.outcome === 'won').length,
      lost: state.leads.filter((lead) => lead.outcome === 'lost').length,
    }),
    [state.leads],
  )

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

  const onSaveContact = () => {
    if (!name.trim() || !phone.trim()) {
      setToast('Informe nome e número.')
      return
    }
    const { leadId } = createQuickLead({
      name: name.trim(),
      phone: phone.trim(),
      eventDate: eventDate.trim(),
      suitId: suitId || null,
      potentialValue: estimatedValue,
    })
    setName('')
    setPhone('')
    setEventDate('')
    setSuitId('')
    setView('board')
    setQuery('')
    setToast('Contato adicionado')
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
              Contatos
            </button>
            <button
              type="button"
              className={`crm__chip${view === 'values' ? ' is-active' : ''}`}
              onClick={() => setView('values')}
            >
              <PieChart size={14} strokeWidth={2.25} />
              Análise
            </button>
            <button
              type="button"
              className={`crm__chip${view === 'followup' ? ' is-active' : ''}`}
              onClick={() => setView('followup')}
            >
              <MessageCircle size={14} strokeWidth={2.25} />
              Sequências
              {followupDue.length > 0 ? <span className="crm__chip-badge">{followupDue.length}</span> : null}
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
              className={`crm__chip${view === 'novo' ? ' is-active' : ''}`}
              onClick={() => setView('novo')}
            >
              <UserPlus size={14} strokeWidth={2.25} />
              Novo contato
            </button>
          </div>
        </header>

        {toast ? <p className="crm__banner-ok">{toast}</p> : null}

        {view === 'novo' ? (
          <div className="crm__panel">
            <div className="crm__panel-head">
              <div>
                <h3>Novo contato</h3>
                <p>Nome, número, dia do evento e traje. O valor estimado atualiza na hora.</p>
              </div>
            </div>

            <div className="crm__form-grid crm__form-grid--contact">
              <label>
                Nome
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do cliente"
                  autoFocus
                />
              </label>
              <label>
                Número
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(47) 99999-0000"
                />
              </label>
              <label>
                Dia do evento
                <input
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  placeholder="15/11/2026"
                />
              </label>
              <label>
                Traje
                <select value={suitId} onChange={(e) => setSuitId(e.target.value)}>
                  <option value="">Selecione o traje…</option>
                  {state.suits
                    .filter((suit) => suit.enabled)
                    .map((suit) => (
                      <option key={suit.id} value={suit.id}>
                        {suit.name} — {formatMoneyBr(suit.price)}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <div className="crm__estimate">
              <span>Valor estimado</span>
              <strong>{formatMoneyBr(estimatedValue)}</strong>
            </div>

            <div className="crm__form-actions">
              <button type="button" className="crm__primary" onClick={onSaveContact}>
                <Plus size={15} strokeWidth={2.25} />
                Salvar contato
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
              setToast('Catálogo salvo')
            }}
          />
        ) : null}

        {view === 'values' ? (
          <ValuesPanel
            stats={stats}
            leads={state.leads}
            onOpenLead={(leadId) => {
              setSelectedId(leadId)
              setView('board')
            }}
          />
        ) : null}

        {view === 'followup' ? (
          <FollowupPanel
            enabled={state.followup.enabled}
            steps={state.followup.steps}
            due={followupDue}
            onToggleEnabled={(enabled) => {
              updateCrmFollowupConfig({ enabled })
              setToast(enabled ? 'Sequência ativada' : 'Sequência pausada')
            }}
            onSaveSteps={(steps) => {
              updateCrmFollowupConfig({ steps })
              setToast('Sequência salva')
            }}
            onSend={(leadId, step, message) => {
              const lead = state.leads.find((item) => item.id === leadId)
              if (!lead) return
              const link = buildLeadWhatsappLink(lead.phone, message)
              if (!link) {
                setToast('Telefone inválido para WhatsApp')
                return
              }
              window.open(link, '_blank', 'noopener,noreferrer')
              markLeadFollowupSent(leadId, step.order)
              setToast(`Chamada ${step.order} aberta no WhatsApp`)
            }}
            onOpenLead={(leadId) => {
              setSelectedId(leadId)
              setView('board')
            }}
          />
        ) : null}

        {view === 'board' ? (
          <>
            <div className="crm__toolbar">
              <label className="crm__search">
                <Search size={16} strokeWidth={2.25} aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nome ou telefone…"
                  aria-label="Buscar contato por nome ou telefone"
                />
              </label>
            </div>

            <nav className="crm__tabs" aria-label="Filtro de resultado">
              {(
                [
                  ['todos', 'Todos', counts.todos],
                  ['open', 'Em aberto', counts.open],
                  ['won', 'Ganhos', counts.won],
                  ['lost', 'Perdidos', counts.lost],
                ] as const
              ).map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  className={`crm__tab${tab === id ? ' is-active' : ''}`}
                  onClick={() => setTab(id)}
                >
                  {label}
                  <span>{count}</span>
                </button>
              ))}
            </nav>

            <div className="crm__workspace">
              <aside className="crm__list">
                {filtered.length === 0 ? (
                  <div className="crm__empty-box">
                    <p className="crm__empty">
                      {query.trim()
                        ? 'Nenhum contato encontrado para essa busca.'
                        : 'Nenhum contato neste filtro.'}
                    </p>
                    <button type="button" className="crm__primary" onClick={() => setView('novo')}>
                      Novo contato
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
                        <span className="crm__lead-value">
                          {formatMoneyBr(lead.potentialValue || 0)}
                        </span>
                      </div>
                      <p>{lead.phone}</p>
                      <div className="crm__lead-meta">
                        <span>{lead.eventDate || 'Sem data'}</span>
                        <span>{lead.suitInterest || 'Sem traje'}</span>
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
                  <ContactDetail
                    lead={selected}
                    suits={state.suits}
                    onSuit={(nextSuitId) => {
                      updateCrmLeadBasics(selected.id, { suitId: nextSuitId })
                      setToast('Valor potencial atualizado')
                    }}
                    onEventDate={(nextDate) => {
                      updateCrmLeadBasics(selected.id, { eventDate: nextDate })
                    }}
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
                    onToggleFollowup={(enabled) => {
                      setLeadFollowupEnabled(selected.id, enabled)
                      setToast(enabled ? 'Sequência ligada neste lead' : 'Sequência pausada neste lead')
                    }}
                    onResetFollowup={() => {
                      resetLeadFollowup(selected.id)
                      setToast('Sequência reiniciada')
                    }}
                  />
                ) : (
                  <p className="crm__empty">Selecione um contato ou cadastre um novo.</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}

function ContactDetail({
  lead,
  suits,
  onSuit,
  onEventDate,
  onOutcome,
  onToggleFollowup,
  onResetFollowup,
}: {
  lead: CrmLead
  suits: CrmSuitItem[]
  onSuit: (suitId: string | null) => void
  onEventDate: (eventDate: string) => void
  onOutcome: (outcome: CrmOutcome) => void
  onToggleFollowup: (enabled: boolean) => void
  onResetFollowup: () => void
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
          <span className="crm__value-caption">Valor potencial</span>
        </div>
      </header>

      <div className="crm__outcome-row">
        <button
          type="button"
          className={`crm__outcome-btn is-won${lead.outcome === 'won' ? ' is-active' : ''}`}
          onClick={() => onOutcome('won')}
        >
          <CheckCircle2 size={15} strokeWidth={2.25} />
          Ganho
        </button>
        <button
          type="button"
          className={`crm__outcome-btn is-lost${lead.outcome === 'lost' ? ' is-active' : ''}`}
          onClick={() => onOutcome('lost')}
        >
          <XCircle size={15} strokeWidth={2.25} />
          Perdido
        </button>
        <button
          type="button"
          className={`crm__outcome-btn is-open${lead.outcome === 'open' ? ' is-active' : ''}`}
          onClick={() => onOutcome('open')}
        >
          Em aberto
        </button>
      </div>

      <div className="crm__detail-fields">
        <label className="crm__label-field">
          Dia do evento
          <input
            value={lead.eventDate || ''}
            onChange={(event) => onEventDate(event.target.value)}
            placeholder="15/11/2026"
          />
        </label>
        <label className="crm__label-field">
          Traje (valor estimado)
          <select
            value={lead.suitId || ''}
            onChange={(event) => onSuit(event.target.value || null)}
          >
            <option value="">Sem traje</option>
            {suits
              .filter((suit) => suit.enabled)
              .map((suit) => (
                <option key={suit.id} value={suit.id}>
                  {suit.name} — {formatMoneyBr(suit.price)}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="crm__facts crm__facts--simple">
        <Fact label="Status" value={outcomeLabel(lead.outcome || 'open')} />
        <Fact label="Traje" value={lead.suitInterest || '—'} />
        <Fact label="Potencial" value={formatMoneyBr(lead.potentialValue || 0)} />
      </div>

      <div className="crm__followup-card">
        <div className="crm__followup-card-head">
          <div>
            <strong>Sequência de chamadas</strong>
            <p>
              {(lead.outcome || 'open') !== 'open'
                ? 'Pausada automaticamente (ganho/perdido).'
                : lead.followupEnabled
                  ? `Próxima: chamada ${Math.min(3, (lead.followupLastStep || 0) + 1)} · já enviadas: ${lead.followupLastStep || 0}/3`
                  : 'Pausada neste lead.'}
            </p>
          </div>
          <label className="crm__switch">
            <input
              type="checkbox"
              checked={Boolean(lead.followupEnabled) && (lead.outcome || 'open') === 'open'}
              disabled={(lead.outcome || 'open') !== 'open'}
              onChange={(event) => onToggleFollowup(event.target.checked)}
            />
            <span>Ativa</span>
          </label>
        </div>
        <button type="button" className="crm__ghost" onClick={onResetFollowup}>
          Reiniciar sequência
        </button>
      </div>
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
          <h3>Trajes e valores</h3>
          <p>Defina o catálogo. Ao escolher o traje no contato, o valor potencial atualiza.</p>
        </div>
        <button type="button" className="crm__primary" onClick={onSave}>
          <CheckCircle2 size={15} strokeWidth={2.25} />
          Salvar
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
              { id: crypto.randomUUID(), name: 'Novo traje', price: 0, enabled: true },
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
  leads,
  onOpenLead,
}: {
  stats: ReturnType<typeof getCrmValueStats>
  leads: CrmLead[]
  onOpenLead: (leadId: string) => void
}) {
  const outcomeSlices = stats.outcomeSlices.map((slice) => ({
    name: slice.label,
    value: slice.value,
    color: slice.color,
  }))

  const history = useMemo(
    () =>
      leads
        .slice()
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [leads],
  )

  return (
    <div className="crm__panel">
      <div className="crm__panel-head">
        <div>
          <h3>Análise de valores</h3>
          <p>Atualiza em tempo real quando você cadastra ou classifica um contato.</p>
        </div>
      </div>

      <div className="crm__stats-grid">
        <div className="crm__stat-card is-won">
          <strong>{formatMoneyBr(stats.totals.won)}</strong>
          <span>Ganhos</span>
        </div>
        <div className="crm__stat-card is-lost">
          <strong>{formatMoneyBr(stats.totals.lost)}</strong>
          <span>Perdidos</span>
        </div>
        <div className="crm__stat-card is-open">
          <strong>{formatMoneyBr(stats.totals.open)}</strong>
          <span>Em aberto</span>
        </div>
        <div className="crm__stat-card">
          <strong>{formatMoneyBr(stats.totals.all)}</strong>
          <span>Potencial total</span>
        </div>
      </div>

      <div className="crm__pies">
        <DonutBlock
          title="Resultado comercial"
          subtitle="Quanto do potencial já foi ganho, perdido ou segue aberto"
          slices={outcomeSlices}
          centerLabel="Total"
          centerValue={formatMoneyBr(stats.totals.all)}
        />
        <DonutBlock
          title="Por traje"
          subtitle="Distribuição do potencial conforme o catálogo"
          slices={stats.suitSlices}
          centerLabel="Trajes"
          centerValue={String(stats.suitSlices.length)}
        />
      </div>

      {stats.bySuit.length === 0 ? (
        <p className="crm__empty">Cadastre contatos com traje para montar a análise.</p>
      ) : (
        <ul className="crm__suit-table">
          <li className="crm__suit-table-head">
            <strong>Traje</strong>
            <span>Em aberto</span>
            <span>Ganho</span>
            <span>Perdido</span>
            <em>Total</em>
          </li>
          {stats.bySuit.map((row) => (
            <li key={row.name}>
              <strong>{row.name}</strong>
              <span>{formatMoneyBr(row.open)}</span>
              <span>{formatMoneyBr(row.won)}</span>
              <span>{formatMoneyBr(row.lost)}</span>
              <em>{formatMoneyBr(row.total)}</em>
            </li>
          ))}
        </ul>
      )}

      <div className="crm__history">
        <div className="crm__history-head">
          <div>
            <h4>Histórico de contatos</h4>
            <p>Nome, classificação e valor. Clique para abrir o detalhe.</p>
          </div>
          <span>{history.length} registro{history.length === 1 ? '' : 's'}</span>
        </div>

        {history.length === 0 ? (
          <p className="crm__empty">Nenhum contato cadastrado ainda.</p>
        ) : (
          <ul className="crm__history-list">
            <li className="crm__history-list-head">
              <strong>Cliente</strong>
              <span>Classificação</span>
              <em>Valor</em>
            </li>
            {history.map((lead) => (
              <li key={lead.id}>
                <button
                  type="button"
                  className="crm__history-row"
                  onClick={() => onOpenLead(lead.id)}
                >
                  <div className="crm__history-client">
                    <strong>{lead.name}</strong>
                    <span>{lead.phone}</span>
                  </div>
                  <span className={`crm__outcome-pill is-${lead.outcome || 'open'}`}>
                    {outcomeLabel(lead.outcome || 'open')}
                  </span>
                  <em>{formatMoneyBr(lead.potentialValue || 0)}</em>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function FollowupPanel({
  enabled,
  steps,
  due,
  onToggleEnabled,
  onSaveSteps,
  onSend,
  onOpenLead,
}: {
  enabled: boolean
  steps: CrmFollowupStep[]
  due: ReturnType<typeof getCrmFollowupDue>
  onToggleEnabled: (enabled: boolean) => void
  onSaveSteps: (steps: CrmFollowupStep[]) => void
  onSend: (leadId: string, step: CrmFollowupStep, message: string) => void
  onOpenLead: (leadId: string) => void
}) {
  const [draft, setDraft] = useState(() => steps.map((step) => ({ ...step })))

  useEffect(() => {
    setDraft(steps.map((step) => ({ ...step })))
  }, [steps])

  const patchStep = (order: number, patch: Partial<CrmFollowupStep>) => {
    setDraft((current) =>
      current.map((step) => (step.order === order ? { ...step, ...patch } : step)),
    )
  }

  return (
    <div className="crm__panel">
      <div className="crm__panel-head">
        <div>
          <h3>Sequência de chamadas</h3>
          <p>
            Configure até 3 mensagens automáticas de rechamada. Quando o lead parar de responder,
            abra o WhatsApp com o texto pronto e marque como enviada.
          </p>
        </div>
        <label className="crm__switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggleEnabled(event.target.checked)}
          />
          <span>{enabled ? 'Ativa' : 'Pausada'}</span>
        </label>
      </div>

      <div className="crm__followup-steps">
        {draft.map((step) => (
          <div key={step.id} className="crm__followup-step">
            <div className="crm__followup-step-top">
              <strong>Chamada {step.order}</strong>
              <label className="crm__switch crm__switch--small">
                <input
                  type="checkbox"
                  checked={step.enabled}
                  onChange={(event) => patchStep(step.order, { enabled: event.target.checked })}
                />
                <span>Usar</span>
              </label>
            </div>
            <label className="crm__label-field">
              Dias após a etapa anterior (ou cadastro)
              <input
                type="number"
                min={1}
                max={90}
                value={step.delayDays}
                onChange={(event) =>
                  patchStep(step.order, {
                    delayDays: Math.max(1, Number(event.target.value) || 1),
                  })
                }
              />
            </label>
            <label className="crm__label-field">
              Mensagem (use {'{NOME}'} para o nome do cliente)
              <textarea
                rows={4}
                value={step.message}
                onChange={(event) => patchStep(step.order, { message: event.target.value })}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="crm__form-actions">
        <button type="button" className="crm__primary" onClick={() => onSaveSteps(draft)}>
          Salvar sequência
        </button>
      </div>

      <div className="crm__history">
        <div className="crm__history-head">
          <div>
            <h4>Fila para enviar agora</h4>
            <p>Leads em aberto cuja próxima chamada já venceu o prazo.</p>
          </div>
          <span>{due.length} pendente{due.length === 1 ? '' : 's'}</span>
        </div>

        {!enabled ? (
          <p className="crm__empty">Ative a sequência para liberar a fila.</p>
        ) : due.length === 0 ? (
          <p className="crm__empty">Nenhuma chamada vencida no momento.</p>
        ) : (
          <ul className="crm__due-list">
            {due.map((item) => {
              const message = renderFollowupMessage(item.step.message, item.lead.name)
              return (
                <li key={`${item.lead.id}-${item.step.order}`} className="crm__due-item">
                  <button
                    type="button"
                    className="crm__due-main"
                    onClick={() => onOpenLead(item.lead.id)}
                  >
                    <strong>{item.lead.name}</strong>
                    <span>
                      Chamada {item.step.order} · há {item.step.delayDays} dia
                      {item.step.delayDays === 1 ? '' : 's'}
                      {item.daysOverdue > 0 ? ` · atrasada ${item.daysOverdue}d` : ''}
                    </span>
                    <p>{message}</p>
                  </button>
                  <button
                    type="button"
                    className="crm__primary"
                    onClick={() => onSend(item.lead.id, item.step, message)}
                  >
                    Enviar no WhatsApp
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function DonutBlock({
  title,
  subtitle,
  slices,
  centerLabel,
  centerValue,
}: {
  title: string
  subtitle: string
  slices: Array<{ name: string; value: number; color: string }>
  centerLabel: string
  centerValue: string
}) {
  const total = slices.reduce((sum, item) => sum + item.value, 0)
  const gradient = buildConicGradient(slices, total)

  return (
    <div className="crm__pie-block crm__pie-block--pro">
      <div className="crm__pie-copy">
        <h4>{title}</h4>
        <p>{subtitle}</p>
      </div>
      <div className="crm__donut-wrap">
        <div
          className="crm__donut"
          style={{ background: total > 0 ? gradient : '#eef1f6' }}
          aria-hidden
        >
          <div className="crm__donut-hole">
            <span>{centerLabel}</span>
            <strong>{centerValue}</strong>
          </div>
        </div>
      </div>
      <ul className="crm__pie-legend crm__pie-legend--pro">
        {slices.length === 0 ? (
          <li>Sem dados ainda</li>
        ) : (
          slices.map((slice) => {
            const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0
            return (
              <li key={slice.name}>
                <i style={{ background: slice.color }} />
                <div>
                  <span>{slice.name}</span>
                  <em>{pct}%</em>
                </div>
                <strong>{formatMoneyBr(slice.value)}</strong>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}

function buildConicGradient(
  slices: Array<{ value: number; color: string }>,
  total: number,
) {
  if (!total) return '#eef1f6'
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

