import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  Plus,
  RefreshCcw,
  Settings2,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import { useCrm } from '../hooks/useCrm'
import {
  addCrmDemoMessage,
  bootEasyCrm,
  createCrmBackup,
  createQuickLead,
  ingestChatPaste,
  loadDemoLeads,
  reanalyzeCrmLead,
  setCrmLeadLabel,
  setCrmStoreWhatsapp,
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
  const [tab, setTab] = useState<'todos' | CrmLabelId>('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'board' | 'paste' | 'new' | 'scoring' | 'backups' | 'link'>('board')
  const [draftRules, setDraftRules] = useState<CrmScoreRule[]>(state.scoreRules)
  const [demoText, setDemoText] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  // Novo lead
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newNotes, setNewNotes] = useState('')

  // Colar conversa
  const [pasteText, setPasteText] = useState('')
  const [pasteName, setPasteName] = useState('')
  const [pastePhone, setPastePhone] = useState('')
  const [pasteIntoSelected, setPasteIntoSelected] = useState(false)

  // Link captura
  const [storePhoneDraft, setStorePhoneDraft] = useState(state.storeWhatsapp)

  useEffect(() => {
    bootEasyCrm()
  }, [])

  useEffect(() => {
    setDraftRules(state.scoreRules)
  }, [state.scoreRules])

  useEffect(() => {
    setStorePhoneDraft(state.storeWhatsapp)
  }, [state.storeWhatsapp])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

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

  const onCreateLead = () => {
    if (!newName.trim() && !newPhone.trim() && !newNotes.trim()) {
      setToast('Preencha nome, telefone ou uma observação.')
      return
    }
    const { leadId } = createQuickLead({
      name: newName,
      phone: newPhone,
      notes: newNotes,
    })
    setNewName('')
    setNewPhone('')
    setNewNotes('')
    setView('board')
    setToast('Lead criado')
    if (leadId) setSelectedId(leadId)
  }

  const onPasteChat = () => {
    if (!pasteText.trim()) {
      setToast('Cole a conversa do WhatsApp.')
      return
    }
    const intoSelected = pasteIntoSelected && selected
    const { leadId } = ingestChatPaste({
      paste: pasteText,
      leadId: intoSelected ? selected.id : null,
      name: pasteName,
      phone: pastePhone,
    })
    setPasteText('')
    setPasteName('')
    setPastePhone('')
    setPasteIntoSelected(false)
    setView('board')
    setToast(intoSelected ? 'Conversa adicionada ao lead' : 'Lead criado pela conversa')
    if (leadId) setSelectedId(leadId)
  }

  return (
    <div className="crm">
      <section className="crm__shell">
        <header className="crm__top">
          <div className="crm__account">
            <span className="crm__online">
              <Sparkles size={14} strokeWidth={2.25} />
              CRM automático
            </span>
            <div>
              <strong>{state.accountName || 'Social Express CRM'}</strong>
              <p>
                {state.leads.length} lead{state.leads.length === 1 ? '' : 's'} · cole conversa ou
                formulário
              </p>
            </div>
            <span className="crm__sync">Atualizado: {formatWhen(state.lastSyncAt)}</span>
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
              Colar conversa
            </button>
            <button
              type="button"
              className={`crm__chip${view === 'new' ? ' is-active' : ''}`}
              onClick={() => setView('new')}
            >
              <UserPlus size={14} strokeWidth={2.25} />
              Novo lead
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

        {view === 'new' ? (
          <div className="crm__panel">
            <div className="crm__panel-head">
              <div>
                <h3>Novo lead rápido</h3>
                <p>Cadastro em segundos. A IA completa se você colocar uma observação.</p>
              </div>
            </div>
            <div className="crm__form-grid">
              <label>
                Nome
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Rodrigo Alves"
                />
              </label>
              <label>
                WhatsApp
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(47) 99999-0000"
                />
              </label>
              <label className="crm__form-span">
                Observação / trecho da conversa
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={4}
                  placeholder='Ex: "Quero terno azul para casamento dia 15/11"'
                />
              </label>
            </div>
            <div className="crm__form-actions">
              <button type="button" className="crm__primary" onClick={onCreateLead}>
                <Plus size={15} strokeWidth={2.25} />
                Criar lead
              </button>
              <button type="button" className="crm__ghost" onClick={() => setView('board')}>
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        {view === 'paste' ? (
          <div className="crm__panel">
            <div className="crm__panel-head">
              <div>
                <h3>Colar conversa do WhatsApp</h3>
                <p>
                  Copie as mensagens no celular e cole aqui. A IA extrai nome, evento, data, traje e
                  score.
                </p>
              </div>
            </div>
            <div className="crm__form-grid">
              <label>
                Nome (opcional)
                <input
                  value={pasteName}
                  onChange={(e) => setPasteName(e.target.value)}
                  placeholder="Se souber o nome"
                />
              </label>
              <label>
                Telefone (opcional)
                <input
                  value={pastePhone}
                  onChange={(e) => setPastePhone(e.target.value)}
                  placeholder="Se aparecer no texto, a IA tenta achar"
                />
              </label>
              <label className="crm__form-span">
                Conversa
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={10}
                  placeholder={`Exemplo:\nOi, meu nome é Camila Souza\nÉ formatura dia 20 de dezembro\nEstou pensando em off white`}
                />
              </label>
              {selected ? (
                <label className="crm__check crm__form-span">
                  <input
                    type="checkbox"
                    checked={pasteIntoSelected}
                    onChange={(e) => setPasteIntoSelected(e.target.checked)}
                  />
                  Adicionar na conversa do lead selecionado ({selected.name})
                </label>
              ) : null}
            </div>
            <div className="crm__form-actions">
              <button type="button" className="crm__primary" onClick={onPasteChat}>
                <ClipboardPaste size={15} strokeWidth={2.25} />
                Analisar e salvar
              </button>
              <button type="button" className="crm__ghost" onClick={() => setView('board')}>
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        {view === 'link' ? (
          <div className="crm__panel">
            <div className="crm__panel-head">
              <div>
                <h3>Formulário público</h3>
                <p>
                  Link para bio do Instagram ou tablet da loja. O cliente preenche e o lead nasce no
                  CRM (ou manda WhatsApp pronto).
                </p>
              </div>
            </div>
            <div className="crm__form-grid">
              <label className="crm__form-span">
                WhatsApp da loja (para o botão “Enviar no WhatsApp”)
                <input
                  value={storePhoneDraft}
                  onChange={(e) => setStorePhoneDraft(e.target.value)}
                  placeholder="47999990000"
                />
              </label>
              <label className="crm__form-span">
                Link do formulário
                <input readOnly value={captureUrl} onFocus={(e) => e.target.select()} />
              </label>
            </div>
            <div className="crm__form-actions">
              <button
                type="button"
                className="crm__primary"
                onClick={() => {
                  setCrmStoreWhatsapp(storePhoneDraft)
                  setToast('WhatsApp da loja salvo')
                }}
              >
                Salvar número da loja
              </button>
              <a className="crm__ghost crm__ghost-link" href={captureUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={14} strokeWidth={2.25} />
                Abrir formulário
              </a>
              <button
                type="button"
                className="crm__ghost"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(captureUrl)
                    setToast('Link copiado')
                  } catch {
                    setToast('Copie o link manualmente')
                  }
                }}
              >
                Copiar link
              </button>
            </div>
            <p className="crm__note">
              Dica: no computador da loja, o formulário grava o lead direto no CRM. No celular do
              cliente, use “Enviar no WhatsApp” — depois é só colar a conversa aqui.
            </p>
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
              setToast('Leads de exemplo carregados')
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
                    <p className="crm__empty">Nenhum lead ainda.</p>
                    <button type="button" className="crm__primary" onClick={() => setView('paste')}>
                      Colar conversa
                    </button>
                    <button type="button" className="crm__ghost" onClick={() => setView('new')}>
                      Novo lead
                    </button>
                    <button
                      type="button"
                      className="crm__ghost"
                      onClick={() => {
                        loadDemoLeads()
                        setToast('Exemplos carregados')
                      }}
                    >
                      Ver exemplos
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
                    onDemoText={setDemoText}
                    onLabel={(labelId) => setCrmLeadLabel(selected.id, labelId)}
                    onReanalyze={() => {
                      reanalyzeCrmLead(selected.id)
                      setToast('Lead reanalisado')
                    }}
                    onSendDemo={() => {
                      const text = demoText.trim()
                      if (!text) return
                      addCrmDemoMessage(selected.id, text, 'client')
                      setDemoText('')
                    }}
                    onPasteHere={() => {
                      setPasteIntoSelected(true)
                      setView('paste')
                    }}
                  />
                ) : (
                  <p className="crm__empty">Selecione um lead ou cole uma conversa para começar.</p>
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
  demoText,
  onDemoText,
  onLabel,
  onReanalyze,
  onSendDemo,
  onPasteHere,
}: {
  lead: CrmLead
  labels: { id: CrmLabelId; name: string; color: string }[]
  demoText: string
  onDemoText: (value: string) => void
  onLabel: (labelId: CrmLabelId) => void
  onReanalyze: () => void
  onSendDemo: () => void
  onPasteHere: () => void
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
        <p>{lead.aiSummary || 'Aguardando mais mensagens…'}</p>
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
        Etiqueta
        <select value={lead.labelId} onChange={(event) => onLabel(event.target.value as CrmLabelId)}>
          {labels.map((label) => (
            <option key={label.id} value={label.id}>
              {label.name}
            </option>
          ))}
        </select>
      </label>

      <div className="crm__thread">
        {lead.messages.length === 0 ? (
          <p className="crm__empty">Sem mensagens ainda.</p>
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

      <div className="crm__composer">
        <input
          value={demoText}
          onChange={(event) => onDemoText(event.target.value)}
          placeholder='Adicionar msg… ex: "quero um terno cinza para 10/10"'
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSendDemo()
          }}
        />
        <button type="button" className="crm__primary" onClick={onSendDemo}>
          Analisar
        </button>
      </div>
      <button type="button" className="crm__ghost crm__ghost-block" onClick={onPasteHere}>
        <ClipboardPaste size={14} strokeWidth={2.25} />
        Colar mais conversa neste lead
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
          <p>Palavras-chave da conversa e quanto cada uma soma no potencial do lead.</p>
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
          <h3>Backups do CRM</h3>
          <p>Snapshots locais dos leads (neste navegador).</p>
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
                {backup.leadCount} leads · {backup.note}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
