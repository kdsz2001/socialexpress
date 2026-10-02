import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ArrowUp,
  Bold,
  Check,
  CircleAlert,
  ClipboardPaste,
  Code,
  Copy,
  ExternalLink,
  Eye,
  Italic,
  Link,
  List,
  ListOrdered,
  Plus,
  Redo2,
  Scissors,
  Trash2,
  Underline,
  Undo2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SaveToast } from '../../components/ui/SaveToast'
import { useEmployees } from '../../hooks/useEmployees'
import {
  ALERT_TEMPLATES,
  DOCUMENT_VARIABLES,
  PERMISSION_GROUPS,
  createGoalDraft,
  createTerminalDraft,
  getAppConfig,
  updateAppConfig,
  type DocumentModel,
  type GoalGroup,
  type PermissionLevel,
  type TerminalConfig,
} from '../../lib/appConfigStore'
import { getShopSettings } from '../../lib/shopSettingsStore'
import { settingsPath } from './settingsNav'

const TOAST_KEY = 'social-express:settings-toast'

export function useSettingsNotice() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    const stored = sessionStorage.getItem(TOAST_KEY)
    if (!stored) return
    sessionStorage.removeItem(TOAST_KEY)
    setMessage(stored)
  }, [])
  const node = <SaveToast open={Boolean(message)} message={message} onClose={() => setMessage('')} />
  return {
    notify: setMessage,
    leaveNotice: (value: string) => sessionStorage.setItem(TOAST_KEY, value),
    node,
  }
}

export function AttentionModal({
  open,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean
  message: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onCancel])
  if (!open) return null
  return createPortal(
    <div className="cfg-attention" role="presentation">
      <button type="button" className="cfg-attention__overlay" aria-label="Fechar" onClick={onCancel} />
      <div className="cfg-attention__dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <span className="cfg-attention__icon" aria-hidden="true">
          <CircleAlert size={28} strokeWidth={2.25} />
        </span>
        <h2 id={titleId}>Atenção</h2>
        <p>{message}</p>
        <div className="cfg-attention__actions">
          <button type="button" className="cfg-attention__no" onClick={onCancel}>
            Não
          </button>
          <button type="button" className="cfg-attention__yes" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function EditorBar({
  title,
  subtitle,
  saveLabel,
  onBack,
  onSave,
  extra,
}: {
  title: string
  subtitle?: string
  saveLabel: string
  onBack: () => void
  onSave: () => void
  extra?: ReactNode
}) {
  return (
    <header className="settings-editor__bar">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="settings-editor__bar-actions">
        {extra}
        <button type="button" className="settings__back" onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={2.25} />
          Voltar
        </button>
        <button type="button" className="settings__save" onClick={onSave}>
          <Check size={16} strokeWidth={2.5} />
          {saveLabel}
        </button>
      </div>
    </header>
  )
}

function openPreview(title: string, body: string) {
  const shop = getShopSettings()
  const address = [shop.logradouro, shop.numero, shop.bairro, shop.cidade, shop.estado].filter(Boolean).join(', ')
  const phone = shop.phones.find((item) => item.number.trim())?.number || ''
  const filled = body
    .replaceAll('[razaoSocial]', shop.razaoSocial || 'Nome da loja')
    .replaceAll('[documentoLoja]', shop.cnpj || '00.000.000/0000-00')
    .replaceAll('[enderecoLoja]', address || 'Endereço da loja')
    .replaceAll('[nomeCliente]', 'Cliente exemplo')
    .replaceAll('[cpfCliente]', '000.000.000-00')
    .replaceAll('[rgCliente]', '00.000.000-0')
    .replaceAll('[enderecoCliente]', 'Rua Exemplo, 100')
    .replaceAll('[contrato]', '1')
    .replaceAll('[credito]', 'R$ 0,00')
    .replaceAll('[dataDeCadastro]', '30/09/2026')
    .replaceAll('[vendedor]', 'Vendedor exemplo')
    .replaceAll('[dataEvento]', '02/10/2026')
    .replaceAll('[dataRetirada]', '30/09/2026')
    .replaceAll('[dataDevolucao]', '02/11/2026')
    .replaceAll('[dataProva]', '02/10/2026')
    .replaceAll('[horarioProva]', '14:00')
    .replaceAll('[vencimentoPromissoria]', '02/11/2026')
    .replaceAll('{nome}', 'Cliente exemplo')
    .replaceAll('{loja}', shop.nomeFantasia || 'Loja')
    .replaceAll('{telefone}', phone || '(00) 00000-0000')
    .replaceAll('{produto}', 'Produto exemplo')
    .replaceAll('{pedido}', '1')
    .replaceAll('{data_prova}', '02/10/2026')
    .replaceAll('{data_retirada}', '30/09/2026')
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Poppins,Helvetica,sans-serif;margin:32px;color:#3f4254;font-size:13px;line-height:1.55}h1{font-size:18px;color:#181c32}</style>
    </head><body><h1>${title}</h1><div>${filled}</div></body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function openHeaderPreview(kind: 'detailed' | 'simple') {
  const shop = getShopSettings()
  const name = shop.nomeFantasia || shop.razaoSocial || 'Loja'
  const address = [shop.logradouro, shop.numero, shop.bairro, shop.cidade, shop.estado, shop.cep].filter(Boolean).join(' · ')
  const phones = shop.phones.map((item) => item.number).filter(Boolean).join(' · ')
  const detailed =
    kind === 'detailed'
      ? `<header style="display:flex;justify-content:space-between;gap:24px;border-bottom:1px solid #e4e6ef;padding-bottom:16px;margin-bottom:24px">
          <strong style="font-size:20px;color:#181c32">${name}</strong>
          <div style="text-align:right;font-size:12px;color:#7e8299">${address || 'Endereço'}<br>${phones || 'Telefone'}</div>
        </header>`
      : `<header style="border-bottom:1px solid #e4e6ef;padding-bottom:12px;margin-bottom:24px"><strong style="font-size:18px;color:#181c32">${name}</strong></header>`
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cabeçalho ${kind === 'detailed' ? 'detalhado' : 'simples'}</title>
    <style>body{font-family:Poppins,Helvetica,sans-serif;margin:40px;color:#3f4254}</style></head><body>${detailed}<p>Pré-visualização do cabeçalho usado nos documentos.</p></body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  window.open(url, '_blank', 'noopener')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function RichPaper({
  value,
  onChange,
  onPreview,
}: {
  value: string
  onChange: (value: string) => void
  onPreview: () => void
}) {
  const paperRef = useRef<HTMLDivElement>(null)
  const [source, setSource] = useState(false)
  const loaded = useRef('')

  useEffect(() => {
    if (source || !paperRef.current || loaded.current === value) return
    paperRef.current.innerHTML = value
    loaded.current = value
  }, [source, value])

  const run = (command: string, commandValue?: string) => {
    paperRef.current?.focus()
    document.execCommand(command, false, commandValue)
    const next = paperRef.current?.innerHTML || ''
    loaded.current = next
    onChange(next)
  }

  return (
    <div className="settings-rte">
      <div className="settings-rte__bar">
        <select aria-label="Tamanho da fonte" defaultValue="3" onChange={(event) => run('fontSize', event.target.value)}>
          <option value="2">10pt</option>
          <option value="3">12pt</option>
          <option value="4">14pt</option>
          <option value="5">18pt</option>
        </select>
        <button type="button" aria-label="Desfazer" onClick={() => run('undo')}><Undo2 size={15} /></button>
        <button type="button" aria-label="Refazer" onClick={() => run('redo')}><Redo2 size={15} /></button>
        <button type="button" aria-label="Recortar" onClick={() => run('cut')}><Scissors size={15} /></button>
        <button type="button" aria-label="Copiar" onClick={() => run('copy')}><Copy size={15} /></button>
        <button
          type="button"
          aria-label="Colar"
          onClick={() => {
            void navigator.clipboard.readText().then((text) => run('insertText', text)).catch(() => run('paste'))
          }}
        >
          <ClipboardPaste size={15} />
        </button>
        <button type="button" aria-label="Negrito" onClick={() => run('bold')}><Bold size={15} /></button>
        <button type="button" aria-label="Itálico" onClick={() => run('italic')}><Italic size={15} /></button>
        <button type="button" aria-label="Sublinhado" onClick={() => run('underline')}><Underline size={15} /></button>
        <button type="button" aria-label="Alinhar à esquerda" onClick={() => run('justifyLeft')}><AlignLeft size={15} /></button>
        <button type="button" aria-label="Centralizar" onClick={() => run('justifyCenter')}><AlignCenter size={15} /></button>
        <button type="button" aria-label="Alinhar à direita" onClick={() => run('justifyRight')}><AlignRight size={15} /></button>
        <button type="button" aria-label="Justificar" onClick={() => run('justifyFull')}><AlignJustify size={15} /></button>
        <button type="button" aria-label="Lista" onClick={() => run('insertUnorderedList')}><List size={15} /></button>
        <button type="button" aria-label="Lista numerada" onClick={() => run('insertOrderedList')}><ListOrdered size={15} /></button>
        <button
          type="button"
          aria-label="Link"
          onClick={() => {
            const url = window.prompt('Endereço do link')
            if (url) run('createLink', url)
          }}
        >
          <Link size={15} />
        </button>
        <button type="button" aria-label="Pré-visualizar" onClick={onPreview}><Eye size={15} /></button>
        <button type="button" aria-label="Código-fonte" onClick={() => setSource((open) => !open)}><Code size={15} /></button>
      </div>
      {source ? (
        <textarea
          className="settings-editor__paper"
          aria-label="Código do documento"
          value={value}
          onChange={(event) => {
            loaded.current = event.target.value
            onChange(event.target.value)
          }}
        />
      ) : (
        <div
          ref={paperRef}
          className="settings-editor__paper settings-rte__paper"
          role="textbox"
          aria-label="Texto do documento"
          contentEditable
          suppressContentEditableWarning
          onInput={(event) => {
            const next = (event.currentTarget as HTMLDivElement).innerHTML
            loaded.current = next
            onChange(next)
          }}
        />
      )}
    </div>
  )
}

export function DocumentEditor({
  mode,
  documentId,
}: {
  mode: 'contract' | 'system'
  documentId: string
}) {
  const navigate = useNavigate()
  const isNew = mode === 'contract' && documentId === 'new'
  const [draft, setDraft] = useState<DocumentModel | null>(null)
  const [invalid, setInvalid] = useState(false)
  const { leaveNotice, node } = useSettingsNotice()

  useEffect(() => {
    const config = getAppConfig()
    if (isNew) {
      setDraft({ id: crypto.randomUUID(), name: '', body: '' })
      return
    }
    const list = mode === 'contract' ? config.contracts : config.systemDocuments
    const found = list.find((item) => item.id === documentId)
    setDraft(found ? { ...found } : null)
  }, [documentId, isNew, mode])

  const back = () => navigate(settingsPath('documentos'))

  const save = () => {
    if (!draft || !draft.name.trim()) {
      setInvalid(true)
      return
    }
    const next = { ...draft, name: draft.name.trim() }
    updateAppConfig((current) => {
      if (mode === 'system') {
        return {
          ...current,
          systemDocuments: current.systemDocuments.map((item) => (item.id === next.id ? next : item)),
        }
      }
      const exists = current.contracts.some((item) => item.id === next.id)
      return {
        ...current,
        contracts: exists ? current.contracts.map((item) => (item.id === next.id ? next : item)) : [...current.contracts, next],
      }
    })
    leaveNotice('Modelo editado com sucesso.')
    back()
  }

  if (!draft) {
    return (
      <article className="settings-card">
        <p className="settings-table__empty">Documento não encontrado.</p>
        <button type="button" className="settings__back" onClick={back}>
          Voltar
        </button>
      </article>
    )
  }

  const promissory = draft.id === 'doc-promissoria'

  return (
    <article className="settings-card settings-editor">
      <EditorBar
        title={draft.name.trim() || (isNew ? 'Novo modelo' : 'Documento')}
        subtitle={isNew ? 'Criar novo modelo de contrato' : 'Editar modelo de contrato'}
        saveLabel="Salvar"
        onBack={back}
        onSave={save}
      />
      <div className="settings-editor__body">
        <label className="settings-editor__label" htmlFor="doc-name">
          Nome <em>*</em>
        </label>
        <input
          id="doc-name"
          className={`settings-editor__input${invalid ? ' is-invalid' : ''}`}
          value={draft.name}
          onChange={(event) => {
            setDraft({ ...draft, name: event.target.value })
            setInvalid(false)
          }}
        />
        {invalid ? <p className="settings-editor__error">&quot;Nome&quot; não pode ficar em branco.</p> : null}
        {isNew ? null : (
          <div className="settings-editor__vars">
            <strong>Este documento aceita variáveis.</strong>
            <p>
              Para utilizá-las, coloque uma das palavras listadas abaixo entre chaves [ ] e ela será substituída no
              documento. As seguintes variáveis estão disponíveis:
            </p>
            <ul>
              {DOCUMENT_VARIABLES.map((item) => (
                <li key={item.token}>
                  <code>{item.token}</code> {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}
        <RichPaper
          value={draft.body}
          onChange={(body) => setDraft({ ...draft, body })}
          onPreview={() => openPreview(draft.name || 'Documento', draft.body)}
        />
        {promissory ? (
          <section className="settings-editor__extra">
            <h3>Outras configurações do documento</h3>
            <p>Data de vencimento da promissória</p>
            <div className="settings-form__radios">
              <label className="settings__radio">
                <input
                  type="radio"
                  name="promissory-due"
                  checked={draft.dueDate !== 'event'}
                  onChange={() => setDraft({ ...draft, dueDate: 'return' })}
                />
                <span>Data de devolução</span>
              </label>
              <label className="settings__radio">
                <input
                  type="radio"
                  name="promissory-due"
                  checked={draft.dueDate === 'event'}
                  onChange={() => setDraft({ ...draft, dueDate: 'event' })}
                />
                <span>Data do evento</span>
              </label>
            </div>
            <p>Valor que a nota promissória deve ser</p>
            <div className="settings-form__radios">
              <label className="settings__radio">
                <input
                  type="radio"
                  name="promissory-value"
                  checked={draft.noteValue !== 'paid'}
                  onChange={() => setDraft({ ...draft, noteValue: 'rental' })}
                />
                <span>Valor da locação</span>
              </label>
              <label className="settings__radio">
                <input
                  type="radio"
                  name="promissory-value"
                  checked={draft.noteValue === 'paid'}
                  onChange={() => setDraft({ ...draft, noteValue: 'paid' })}
                />
                <span>Valor pago</span>
              </label>
            </div>
            <label className="settings-editor__label" htmlFor="promissory-multiply">
              Multiplicar
            </label>
            <input
              id="promissory-multiply"
              className="settings-editor__input settings-editor__input--short"
              value={draft.multiply || ''}
              onChange={(event) => setDraft({ ...draft, multiply: event.target.value.replace(/[^\d]/g, '').slice(0, 2) })}
            />
          </section>
        ) : null}
      </div>
      <footer className="settings-card__foot">
        <button type="button" className="settings-editor__preview" onClick={() => openPreview(draft.name || 'Documento', draft.body)}>
          Pré-visualizar o documento
        </button>
        <span className="settings-editor__foot-gap" />
        <button type="button" className="settings__back" onClick={back}>
          <ArrowLeft size={16} strokeWidth={2.25} />
          Voltar
        </button>
        <button type="button" className="settings__save" onClick={save}>
          <Check size={16} strokeWidth={2.5} />
          Salvar
        </button>
      </footer>
      {node}
    </article>
  )
}

const FEE_FIELDS: { key: keyof TerminalConfig; label: string; percent: boolean }[] = [
  { key: 'creditInstallment', label: 'Taxa de crédito parcelado', percent: true },
  { key: 'creditSight', label: 'Taxa de crédito à vista', percent: true },
  { key: 'debitFee', label: 'Taxa de débito', percent: true },
  { key: 'fee2to6', label: 'Taxa para 2 a 6 parcelas', percent: true },
  { key: 'fee7to12', label: 'Taxa para 7 a 12 parcelas', percent: true },
  { key: 'daysToReceive', label: 'Dias para receber', percent: false },
  { key: 'anticipationFee', label: 'Taxa de antecipação', percent: true },
]

export function TerminalEditor({ terminalId }: { terminalId: string }) {
  const navigate = useNavigate()
  const isNew = terminalId === 'new'
  const [draft, setDraft] = useState<TerminalConfig | null>(null)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (isNew) {
      setDraft(createTerminalDraft())
      return
    }
    const config = getAppConfig()
    const found = config.terminals.find((item) => item.id === terminalId)
    setDraft(found ? { ...found } : null)
  }, [isNew, terminalId])

  const back = () => navigate(settingsPath('pagamentos'))
  const save = () => {
    if (!draft || !draft.name.trim()) {
      setInvalid(true)
      return
    }
    const next = { ...draft, name: draft.name.trim() }
    updateAppConfig((current) => {
      const exists = current.terminals.some((item) => item.id === next.id)
      return {
        ...current,
        terminals: exists ? current.terminals.map((item) => (item.id === next.id ? next : item)) : [...current.terminals, next],
      }
    })
    back()
  }

  if (!draft) {
    return (
      <article className="settings-card">
        <p className="settings-table__empty">Terminal não encontrado.</p>
      </article>
    )
  }

  return (
    <article className="settings-card settings-editor">
      <EditorBar
        title={draft.name.trim() || 'Novo terminal'}
        subtitle={isNew ? 'Novo terminal de pagamento' : 'Atualizando terminal de pagamento'}
        saveLabel={isNew ? 'Salvar' : 'Atualizar'}
        onBack={back}
        onSave={save}
      />
      <div className="settings-editor__body">
        <label className="settings-editor__label" htmlFor="terminal-name">
          Nome <em>*</em>
        </label>
        <input
          id="terminal-name"
          className={`settings-editor__input${invalid ? ' is-invalid' : ''}`}
          value={draft.name}
          onChange={(event) => {
            setDraft({ ...draft, name: event.target.value })
            setInvalid(false)
          }}
        />
        <span className="settings-editor__label">Aluguel <em>*</em></span>
        <div className="settings-form__radios">
          <label className="settings__radio">
            <input type="radio" checked={draft.rental === 'with'} onChange={() => setDraft({ ...draft, rental: 'with' })} />
            <span>Com aluguel</span>
          </label>
          <label className="settings__radio">
            <input type="radio" checked={draft.rental === 'without'} onChange={() => setDraft({ ...draft, rental: 'without' })} />
            <span>Sem aluguel</span>
          </label>
        </div>
        <span className="settings-editor__label">Recebimento <em>*</em></span>
        <div className="settings-form__radios">
          <label className="settings__radio">
            <input type="radio" checked={draft.receipt === 'advance'} onChange={() => setDraft({ ...draft, receipt: 'advance' })} />
            <span>Antecipado</span>
          </label>
          <label className="settings__radio">
            <input
              type="radio"
              checked={draft.receipt === 'installment'}
              onChange={() => setDraft({ ...draft, receipt: 'installment' })}
            />
            <span>Parcelado</span>
          </label>
        </div>
        <h3 className="settings-form__heading">Taxas:</h3>
        {FEE_FIELDS.map((field) => (
          <label key={field.key} className="settings-fee-row">
            <span>{field.label}</span>
            <span className={`settings-fee${field.percent ? '' : ' is-plain'}`}>
              {field.percent ? <em>%</em> : null}
              <input
                value={String(draft[field.key] ?? '')}
                onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
              />
            </span>
          </label>
        ))}
      </div>
      {invalid ? <p className="settings-editor__error">&quot;Nome&quot; não pode ficar em branco.</p> : null}
    </article>
  )
}

export function GoalEditor({ groupId }: { groupId: string }) {
  const navigate = useNavigate()
  const employees = useEmployees()
  const isNew = groupId === 'new'
  const [draft, setDraft] = useState<GoalGroup | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(false)

  useEffect(() => {
    if (isNew) {
      setDraft(createGoalDraft())
      return
    }
    const config = getAppConfig()
    const found = config.goalGroups.find((item) => item.id === groupId)
    setDraft(found ? { ...found, bands: found.bands.map((band) => ({ ...band })) } : null)
  }, [groupId, isNew])

  const back = () => navigate(settingsPath('metas'))
  const save = () => {
    if (!draft || !draft.name.trim()) {
      setInvalid(true)
      return
    }
    const next = { ...draft, name: draft.name.trim() }
    updateAppConfig((current) => {
      const exists = current.goalGroups.some((item) => item.id === next.id)
      return {
        ...current,
        goalGroups: exists
          ? current.goalGroups.map((item) => (item.id === next.id ? next : item))
          : [...current.goalGroups, next],
      }
    })
    back()
  }

  if (!draft) {
    return (
      <article className="settings-card">
        <p className="settings-table__empty">Grupo não encontrado.</p>
      </article>
    )
  }

  const people = employees.filter((item) => item.active)

  return (
    <article className="settings-card settings-editor">
      <EditorBar
        title={isNew ? 'Novo grupo de comissionamento' : draft.name}
        subtitle={isNew ? 'Novo grupo de comissionamento' : 'Editando grupo de comissionamento'}
        saveLabel="Salvar"
        onBack={back}
        onSave={save}
      />
      <div className="settings-editor__body">
        <label className="settings-editor__label" htmlFor="goal-name">
          Nome do grupo <em>*</em>
        </label>
        <input
          id="goal-name"
          className={`settings-editor__input${invalid ? ' is-invalid' : ''}`}
          value={draft.name}
          onChange={(event) => {
            setDraft({ ...draft, name: event.target.value })
            setInvalid(false)
          }}
        />
        {invalid ? <p className="settings-editor__error">&quot;Nome&quot; não pode ficar em branco.</p> : null}
        <h3 className="settings-form__heading">Faixas da meta vinculadas ao grupo</h3>
        <div className="settings-table-wrap">
          <table className="settings-table">
            <thead>
              <tr>
                <th>Título da faixa</th>
                <th>Valor do teto da meta</th>
                <th>Comissão da faixa</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {draft.bands.map((band) => (
                <tr key={band.id}>
                  <td>
                    <input
                      className="settings-editor__input"
                      placeholder="Título"
                      aria-label="Título da faixa"
                      value={band.title}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          bands: draft.bands.map((item) => (item.id === band.id ? { ...item, title: event.target.value } : item)),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="settings-editor__input"
                      placeholder="R$ Valor do teto"
                      aria-label="Valor do teto da meta"
                      value={band.ceiling}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          bands: draft.bands.map((item) => (item.id === band.id ? { ...item, ceiling: event.target.value } : item)),
                        })
                      }
                    />
                  </td>
                  <td>
                    <span className="settings-fee">
                      <em>%</em>
                      <input
                        placeholder="Comissão"
                        aria-label="Comissão da faixa"
                        value={band.commission}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            bands: draft.bands.map((item) =>
                              item.id === band.id ? { ...item, commission: event.target.value } : item,
                            ),
                          })
                        }
                      />
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="settings-editor__remove"
                      aria-label="Remover faixa"
                      title="Remover faixa"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          bands:
                            draft.bands.length === 1
                              ? draft.bands
                              : draft.bands.filter((item) => item.id !== band.id),
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="settings-editor__add"
          onClick={() =>
            setDraft({
              ...draft,
              bands: [...draft.bands, { id: crypto.randomUUID(), title: '', ceiling: '', commission: '' }],
            })
          }
        >
          <Plus size={15} strokeWidth={2.4} />
          Adicionar outra faixa
        </button>
        <h3 className="settings-form__heading">Vincule usuários</h3>
        <div className="settings-people">
          <button type="button" className="settings-people__trigger" onClick={() => setPeopleOpen((open) => !open)}>
            {draft.userIds.length === 0 ? 'Selecione uma ou mais pessoas' : `${draft.userIds.length} selecionada(s)`}
          </button>
          {peopleOpen ? (
            <div className="settings-people__menu">
              {people.length === 0 ? <p>Nenhum funcionário ativo.</p> : null}
              {people.map((person) => (
                <label key={person.id}>
                  <input
                    type="checkbox"
                    checked={draft.userIds.includes(person.id)}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        userIds: event.target.checked
                          ? [...draft.userIds, person.id]
                          : draft.userIds.filter((id) => id !== person.id),
                      })
                    }
                  />
                  {person.name}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

const ALERT_NAMES: Record<string, string> = {
  birthday: 'Email de aniversário',
  'late-return': 'Devolução atrasada',
  return: 'Lembrete de devolução',
  proof: 'Lembrete de prova',
  pickup: 'Lembrete de retirada',
}

export function AlertEditor({ alertId }: { alertId: string }) {
  const navigate = useNavigate()
  const [body, setBody] = useState('')
  const { leaveNotice, node } = useSettingsNotice()
  const title = ALERT_NAMES[alertId] || 'Mensagem'

  useEffect(() => {
    const config = getAppConfig()
    setBody(config.alerts.messages[alertId] || ALERT_TEMPLATES[alertId] || '')
  }, [alertId])

  const back = () => navigate(settingsPath('avisos'))
  const save = () => {
    updateAppConfig((current) => ({
      ...current,
      alerts: { ...current.alerts, messages: { ...current.alerts.messages, [alertId]: body } },
    }))
    leaveNotice('Mensagem salva com sucesso.')
    back()
  }

  return (
    <article className="settings-card settings-editor">
      <EditorBar title={title} subtitle="Editando mensagem" saveLabel="Salvar" onBack={back} onSave={save} />
      <div className="settings-editor__body">
        <div className="settings-editor__vars">
          <strong>Variáveis disponíveis</strong>
          <p>Você pode usar {'{loja}'}, {'{nome}'}, {'{produto}'} e {'{telefone}'} no texto.</p>
        </div>
        <RichPaper value={body} onChange={setBody} onPreview={() => openPreview(title, body)} />
      </div>
      {node}
    </article>
  )
}

function packPermissionColumns<T extends { items: unknown[] }>(groups: T[]) {
  const columns: [T[], T[]] = [[], []]
  const heights = [0, 0]
  groups.forEach((group) => {
    const height = 123 + group.items.length * 42
    const index = heights[0] <= heights[1] ? 0 : 1
    columns[index].push(group)
    heights[index] += height + 25
  })
  return columns
}

function PermSwitch({
  checked,
  label,
  head,
  onChange,
}: {
  checked: boolean
  label: string
  head?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className={`perm-switch${head ? ' perm-switch--head' : ''}`}>
      <input type="checkbox" aria-label={label} checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span />
    </label>
  )
}

function PermScrollTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const scroller = document.querySelector('.app-content')
    if (!scroller) return
    const update = () => setVisible(scroller.scrollTop > 180)
    update()
    scroller.addEventListener('scroll', update, { passive: true })
    return () => scroller.removeEventListener('scroll', update)
  }, [])

  if (!visible) return null

  return createPortal(
    <button
      type="button"
      className="perm-scrolltop"
      aria-label="Voltar ao topo"
      onClick={() => document.querySelector('.app-content')?.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp size={18} strokeWidth={2.25} />
    </button>,
    document.body,
  )
}

export function PermissionEditor({ permissionId }: { permissionId: string }) {
  const navigate = useNavigate()
  const isNew = permissionId === 'new'
  const [draft, setDraft] = useState<PermissionLevel | null>(null)
  const [invalid, setInvalid] = useState(false)
  const cardRefs = useRef<Array<HTMLElement | null>>([])
  const [columns, setColumns] = useState(() => packPermissionColumns(PERMISSION_GROUPS))

  useLayoutEffect(() => {
    const place = () => {
      const heights = PERMISSION_GROUPS.map((_, index) => cardRefs.current[index]?.offsetHeight ?? 0)
      if (heights.some((height) => height <= 0)) return
      const next: [typeof PERMISSION_GROUPS, typeof PERMISSION_GROUPS] = [[], []]
      const totals = [0, 0]
      heights.forEach((height, index) => {
        const column = totals[0] <= totals[1] ? 0 : 1
        next[column].push(PERMISSION_GROUPS[index])
        totals[column] += height + 25
      })
      setColumns((current) => {
        const signature = (value: typeof current) => value.map((column) => column.map((group) => group.id).join(',')).join('|')
        return signature(current) === signature(next) ? current : next
      })
    }
    place()
    const observer = new ResizeObserver(place)
    cardRefs.current.forEach((node) => {
      if (node) observer.observe(node)
    })
    return () => observer.disconnect()
  }, [draft])

  useEffect(() => {
    if (isNew) {
      setDraft({ id: crypto.randomUUID(), name: '', grants: {} })
      return
    }
    const config = getAppConfig()
    const found = config.permissions.find((item) => item.id === permissionId)
    setDraft(found ? { ...found, grants: { ...found.grants } } : null)
  }, [isNew, permissionId])

  const back = () => navigate(settingsPath('permissoes'))
  const save = () => {
    if (!draft || !draft.name.trim()) {
      setInvalid(true)
      return
    }
    const next = { ...draft, name: draft.name.trim(), locked: draft.id === 'perm-admin' || draft.locked }
    updateAppConfig((current) => {
      const exists = current.permissions.some((item) => item.id === next.id)
      return {
        ...current,
        permissions: exists
          ? current.permissions.map((item) => (item.id === next.id ? next : item))
          : [...current.permissions, next],
      }
    })
    back()
  }

  if (!draft) {
    return (
      <article className="settings-card">
        <p className="settings-table__empty">Nível não encontrado.</p>
        <button type="button" className="settings__back" onClick={back}>
          Voltar
        </button>
      </article>
    )
  }

  return (
    <article className="settings-card settings-perms">
      <header className="settings-perms__head">
        <h2>{isNew ? 'Nova permissão' : draft.name || 'Permissão'}</h2>
        {isNew ? null : <p>Editando permissões</p>}
      </header>
      <div className="settings-perms__body">
        <div className="settings-perms__field">
          <label className="settings-perms__label" htmlFor="perm-name">
            Nome da permissão <em>*</em>
          </label>
          <input
            id="perm-name"
            className={`settings-perms__input${invalid ? ' is-invalid' : ''}`}
            value={draft.name}
            onChange={(event) => {
              setDraft({ ...draft, name: event.target.value })
              setInvalid(false)
            }}
          />
          {invalid ? <p className="settings-editor__error">&quot;Nome&quot; não pode ficar em branco.</p> : null}
        </div>
        <div className="settings-perms__cols">
          {columns.map((column, columnIndex) => (
            <div className="settings-perms__col" key={columnIndex}>
              {column.map((group) => {
                const ids = group.items.map((item) => item.id)
                const allOn = ids.every((id) => draft.grants[id])
                return (
                  <section
                    className="perm-card"
                    key={group.id}
                    ref={(node) => {
                      cardRefs.current[PERMISSION_GROUPS.findIndex((entry) => entry.id === group.id)] = node
                    }}
                  >
                    <header className="perm-card__head">
                      <h3>{group.label}</h3>
                      <PermSwitch
                        head
                        label={group.label}
                        checked={allOn}
                        onChange={(checked) => {
                          const grants = { ...draft.grants }
                          ids.forEach((id) => {
                            grants[id] = checked
                          })
                          setDraft({ ...draft, grants })
                        }}
                      />
                    </header>
                    <div className="perm-card__sep" />
                    <div className="perm-card__body">
                      {group.items.map((item) => (
                        <div className="perm-row" key={item.id}>
                          <span className="perm-row__label">{item.label}</span>
                          <PermSwitch
                            label={item.label}
                            checked={Boolean(draft.grants[item.id])}
                            onChange={(checked) =>
                              setDraft({ ...draft, grants: { ...draft.grants, [item.id]: checked } })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <footer className="settings-perms__foot">
        <button type="button" className="settings-perms__back" onClick={back}>
          Voltar
        </button>
        <button type="button" className="settings-perms__save" onClick={save}>
          <Check size={16} strokeWidth={2.75} />
          Salvar
        </button>
      </footer>
      <PermScrollTop />
    </article>
  )
}

export function HeaderLink({ kind }: { kind: 'detailed' | 'simple' }) {
  return (
    <button type="button" className="settings-header-link" aria-label="Pré-visualizar cabeçalho" onClick={() => openHeaderPreview(kind)}>
      <ExternalLink size={14} strokeWidth={2.25} />
    </button>
  )
}
