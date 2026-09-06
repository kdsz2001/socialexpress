import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  PieChart,
  Plus,
  Tags,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { useCrm } from '../hooks/useCrm'
import {
  bootEasyCrm,
  createQuickLead,
  formatMoneyBr,
  getCrmValueStats,
  setCrmLeadOutcome,
  updateCrmLeadBasics,
  updateCrmSuits,
  type CrmLead,
  type CrmOutcome,
  type CrmSuitItem,
} from '../lib/crmStore'
import './Crm.css'

function outcomeLabel(outcome: CrmOutcome) {
  if (outcome === 'won') return 'Ganho'
  if (outcome === 'lost') return 'Perdido'
  return 'Em aberto'
}

type CrmView = 'board' | 'novo' | 'catalog' | 'values'

export function Crm() {
  const state = useCrm()
  const [tab, setTab] = useState<'todos' | 'open' | 'won' | 'lost'>('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<CrmView>('board')
  const [draftSuits, setDraftSuits] = useState<CrmSuitItem[]>(state.suits)
  const [toast, setToast] = useState<string | null>(null)

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
    return list.sort((a, b) => b.updatedAt - a.updatedAt)
  }, [state.leads, tab])

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
    setToast('Contato adicionado — potencial atualizado')
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
              className={`crm__chip${view === 'novo' ? ' is-active' : ''}`}
              onClick={() => setView('novo')}
            >
              <UserPlus size={14} strokeWidth={2.25} />
              Novo contato
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
              Análise
            </button>
          </div>
        </header>

        {toast ? <p className="crm__banner-ok">{toast}</p> : null}

        {view === 'novo' ? (
          <div className="crm__panel">
            <div className="crm__panel-head">
              <div>
                <h3>Novo contato</h3>
                <p>
                  Preencha os dados. O valor estimado vem do traje e atualiza o potencial na hora.
                </p>
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
              setToast('Catálogo salvo — valores atualizados')
            }}
          />
        ) : null}

        {view === 'values' ? <ValuesPanel stats={stats} /> : null}

        {view === 'board' ? (
          <>
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
                    <p className="crm__empty">Nenhum contato neste filtro.</p>
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
                          ? 'Classificado como ganho — análise atualizada'
                          : outcome === 'lost'
                            ? 'Classificado como perdido — análise atualizada'
                            : 'Retornado para em aberto',
                      )
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
}: {
  lead: CrmLead
  suits: CrmSuitItem[]
  onSuit: (suitId: string | null) => void
  onEventDate: (eventDate: string) => void
  onOutcome: (outcome: CrmOutcome) => void
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

function ValuesPanel({ stats }: { stats: ReturnType<typeof getCrmValueStats> }) {
  const outcomeSlices = stats.outcomeSlices.map((slice) => ({
    name: slice.label,
    value: slice.value,
    color: slice.color,
  }))

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

