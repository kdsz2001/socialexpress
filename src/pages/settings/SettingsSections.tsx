import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Check, DollarSign, HelpCircle, Plus } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconAction, IconActions } from '../../components/ui/IconAction'
import { useAppConfig } from '../../hooks/useAppConfig'
import {
  PAYMENT_METHODS,
  updateAppConfig,
  type OperationsConfig,
} from '../../lib/appConfigStore'
import {
  AlertEditor,
  AttentionModal,
  DocumentEditor,
  GoalEditor,
  HeaderLink,
  PermissionEditor,
  TerminalEditor,
  useSettingsNotice,
} from './SettingsFlow'
import { settingsPath } from './settingsNav'

const BEFORE_OPTIONS = ['1 dia antes', '2 dias antes', '3 dias antes', '4 dias antes', '5 dias antes']
const AFTER_OPTIONS = ['1 dia depois', '2 dias depois', '3 dias depois', '4 dias depois', '5 dias depois']
const ALERT_OFF = 'Desativado'

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (value: boolean) => void
}) {
  return (
    <label className="settings__switch">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="settings__switch-ui" aria-hidden="true" />
    </label>
  )
}

function DataTable({
  columns,
  children,
}: {
  columns: [string, string]
  children: ReactNode
}) {
  return (
    <div className="settings-table-wrap">
      <table className="settings-table">
        <thead>
          <tr>
            <th>{columns[0]}</th>
            <th className="settings-table__actions">{columns[1]}</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function RowActions({ children }: { children: ReactNode }) {
  return (
    <td className="settings-table__actions">
      <IconActions>{children}</IconActions>
    </td>
  )
}

export function DocumentsSection() {
  const config = useAppConfig()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const edit = params.get('edit') || ''
  const [removeId, setRemoveId] = useState<string | null>(null)
  const { notify, node } = useSettingsNotice()

  if (edit.startsWith('contract:')) {
    return <DocumentEditor mode="contract" documentId={edit.slice('contract:'.length)} />
  }
  if (edit.startsWith('system:')) {
    return <DocumentEditor mode="system" documentId={edit.slice('system:'.length)} />
  }

  const removing = config.contracts.find((item) => item.id === removeId)

  return (
    <>
      <article className="settings-card">
        <header className="settings-card__head">
          <h2 className="settings-card__title">Cabeçalho de documentos</h2>
        </header>
        <div className="settings-header-choice">
          <p>
            Atualmente é possível escolher entre dois modelos de cabeçalho. Após sua escolha, todos contratos,
            termos e recibos serão impressos com o modelo escolhido.
          </p>
          <div className="settings-header-choice__radios">
            <label className="settings__radio">
              <input
                type="radio"
                name="doc-header"
                checked={config.documentHeader !== 'simple'}
                onChange={() => updateAppConfig((current) => ({ ...current, documentHeader: 'detailed' }))}
              />
              <span>Detalhado</span>
            </label>
            <HeaderLink kind="detailed" />
            <label className="settings__radio">
              <input
                type="radio"
                name="doc-header"
                checked={config.documentHeader === 'simple'}
                onChange={() => updateAppConfig((current) => ({ ...current, documentHeader: 'simple' }))}
              />
              <span>Simples</span>
            </label>
            <HeaderLink kind="simple" />
          </div>
        </div>
      </article>

      <article className="settings-card">
        <header className="settings-card__head">
          <h2 className="settings-card__title">Contratos</h2>
          <button type="button" className="settings__save" onClick={() => navigate(settingsPath('documentos', 'contract:new'))}>
            <Plus size={16} strokeWidth={2.5} />
            Novo modelo
          </button>
        </header>
        <DataTable columns={['Modelo', 'Ações']}>
          {config.contracts.length === 0 ? (
            <tr>
              <td className="settings-table__empty" colSpan={2}>
                Nenhum resultado foi encontrado.
              </td>
            </tr>
          ) : (
            config.contracts.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <RowActions>
                  <IconAction kind="edit" tip="Editar" onClick={() => navigate(settingsPath('documentos', `contract:${item.id}`))} />
                  <IconAction kind="delete" tip="Excluir" onClick={() => setRemoveId(item.id)} />
                </RowActions>
              </tr>
            ))
          )}
        </DataTable>
      </article>

      <article className="settings-card">
        <header className="settings-card__head">
          <h2 className="settings-card__title">Outros documentos do sistema</h2>
        </header>
        <DataTable columns={['Documento', 'Ações']}>
          {config.systemDocuments.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <RowActions>
                <IconAction kind="edit" tip="Editar" onClick={() => navigate(settingsPath('documentos', `system:${item.id}`))} />
              </RowActions>
            </tr>
          ))}
        </DataTable>
      </article>

      <AttentionModal
        open={removing !== undefined}
        message="Você tem certeza que deseja excluir este modelo de contrato?"
        confirmLabel="Excluir"
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          updateAppConfig((current) => ({
            ...current,
            contracts: current.contracts.filter((row) => row.id !== removeId),
          }))
          setRemoveId(null)
          notify('Modelo excluído com sucesso.')
        }}
      />
      {node}
    </>
  )
}

export function OperationsSection() {
  const saved = useAppConfig()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<OperationsConfig>(saved.operations)

  useEffect(() => {
    setDraft(saved.operations)
  }, [saved])

  const patch = <K extends keyof OperationsConfig>(key: K, value: OperationsConfig[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const save = () => {
    updateAppConfig((current) => ({ ...current, operations: draft }))
  }

  return (
    <article className="settings-card settings-ops">
      <header className="settings-card__head">
        <h2 className="settings-card__title">Configurações de operações</h2>
        <button type="button" className="settings-ops__save" onClick={save}>
          <Check size={16} strokeWidth={2.5} />
          Salvar alterações
        </button>
      </header>

      <div className="settings-ops__body">
        <div className="settings-ops__block">
          <DaysRow
            label="Bloquear o produto antes de sua prova"
            value={draft.blockBeforeProofDays}
            onChange={(value) => patch('blockBeforeProofDays', value)}
          />
          <DaysRow
            label="Manter produto bloqueado depois da sua devolução"
            value={draft.blockAfterReturnDays}
            onChange={(value) => patch('blockAfterReturnDays', value)}
          />
          <ToggleRow
            label="Mostrar campo de código personalizado no cadastro de produto"
            checked={draft.showCustomCode}
            onChange={(value) => patch('showCustomCode', value)}
          />
          <ToggleRow
            label="Permitir venda de produtos"
            checked={draft.allowProductSale}
            onChange={(value) => patch('allowProductSale', value)}
          />
          <ToggleRow
            label="Permitir cadastro de produtos em consignado"
            checked={draft.allowConsignment}
            onChange={(value) => patch('allowConsignment', value)}
          />
          <ToggleRow
            label="Permitir consulta QR de forma pública"
            checked={draft.allowPublicQr}
            onChange={(value) => patch('allowPublicQr', value)}
          />
          <ToggleRow
            label="Marcar automaticamente as provas no calendário"
            checked={draft.autoMarkProofs}
            onChange={(value) => patch('autoMarkProofs', value)}
          />
          <ToggleRow
            label="Usar controle de estoque"
            checked={draft.useStockControl}
            onChange={(value) => patch('useStockControl', value)}
          />
        </div>

        <div className="settings-ops__block">
          <h3 className="settings-ops__heading">Preenchimento de pedidos e orçamentos:</h3>
          <div className="settings-ops__row">
            <span className="settings-ops__label">Tornar &quot;Origem&quot; obrigatória ao criar pedido</span>
            <div className="settings-ops__field">
              <OpsSwitch
                label='Tornar "Origem" obrigatória ao criar pedido'
                checked={draft.originRequired}
                onChange={(value) => patch('originRequired', value)}
              />
              <p className="settings-ops__hint">
                Afeta somente a criação de pedidos (não bloqueia edição de pedidos antigos).
              </p>
            </div>
          </div>
          <NoteRow
            label="Observação do traje:"
            value={draft.outfitNotes}
            onChange={(value) => patch('outfitNotes', value)}
          />
          <NoteRow
            label="Observações do pedido:"
            value={draft.orderNotes}
            onChange={(value) => patch('orderNotes', value)}
          />
          <NoteRow
            label="Observações do orçamento:"
            value={draft.quoteNotes}
            onChange={(value) => patch('quoteNotes', value)}
          />
        </div>

        <div className="settings-ops__block settings-ops__block--last">
          <h3 className="settings-ops__heading">Cancelamento de pedidos:</h3>
          <div className="settings-ops__row">
            <span className="settings-ops__label">
              Quando ocorre o cancelamento do pedido a comissão deve ser paga sobre
            </span>
            <div className="settings-ops__field">
              <div className="settings-ops__radios">
                <label className="settings-ops__radio">
                  <input
                    type="radio"
                    name="commission-base"
                    checked={draft.commissionBase === 'total'}
                    onChange={() => patch('commissionBase', 'total')}
                  />
                  <span />
                  Valor total do pedido
                </label>
                <label className="settings-ops__radio">
                  <input
                    type="radio"
                    name="commission-base"
                    checked={draft.commissionBase === 'paid'}
                    onChange={() => patch('commissionBase', 'paid')}
                  />
                  <span />
                  Valor pago
                </label>
              </div>
            </div>
          </div>
          <ToggleRow
            label="Incluir valor da multa para calcular a comissão"
            checked={draft.includeFineInCommission}
            onChange={(value) => patch('includeFineInCommission', value)}
          />
        </div>
      </div>

      <footer className="settings-ops__foot">
        <button type="button" className="settings-ops__back" onClick={() => navigate(-1)}>
          Voltar
        </button>
        <button type="button" className="settings-ops__save" onClick={save}>
          <Check size={16} strokeWidth={2.5} />
          Salvar
        </button>
      </footer>
    </article>
  )
}

function OpsSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (value: boolean) => void
}) {
  return (
    <label className="settings-ops__switch">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span aria-hidden="true" />
    </label>
  )
}

function DaysRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="settings-ops__row">
      <span className="settings-ops__label">{label}</span>
      <div className="settings-ops__field settings-ops__field--days">
        <div className="settings-ops__days">
          <input
            type="text"
            inputMode="numeric"
            aria-label={label}
            value={Number.isFinite(value) ? String(value) : ''}
            onChange={(event) => {
              const raw = event.target.value.replace(/[^\d]/g, '')
              onChange(raw === '' ? 0 : Number(raw))
            }}
          />
          <span>dias</span>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="settings-ops__row">
      <span className="settings-ops__label">{label}</span>
      <div className="settings-ops__field">
        <OpsSwitch label={label} checked={checked} onChange={onChange} />
      </div>
    </div>
  )
}

function NoteRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="settings-ops__row">
      <label className="settings-ops__label" htmlFor={`op-${label}`}>
        {label}
      </label>
      <div className="settings-ops__field">
        <textarea
          id={`op-${label}`}
          className="settings-ops__area"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  )
}

export function PaymentsSection() {
  const config = useAppConfig()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const edit = params.get('edit') || ''
  const [methods, setMethods] = useState(config.paymentMethods)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const { notify, node } = useSettingsNotice()

  useEffect(() => {
    setMethods(config.paymentMethods)
  }, [config])

  if (edit.startsWith('terminal:')) {
    return <TerminalEditor terminalId={edit.slice('terminal:'.length)} />
  }

  const removing = config.terminals.find((item) => item.id === removeId)

  return (
    <>
      <article className="settings-card">
        <header className="settings-card__head">
          <h2 className="settings-card__title">Métodos de pagamento</h2>
        </header>
        <DataTable columns={['Método', 'Status']}>
          {PAYMENT_METHODS.map((method) => (
            <tr key={method.id}>
              <td>{method.label}</td>
              <td className="settings-table__actions">
                <Switch
                  label={method.label}
                  checked={Boolean(methods[method.id])}
                  onChange={(value) => setMethods((current) => ({ ...current, [method.id]: value }))}
                />
              </td>
            </tr>
          ))}
        </DataTable>
        <footer className="settings-card__foot">
          <button
            type="button"
            className="settings__outline"
            onClick={() => {
              updateAppConfig((current) => ({ ...current, paymentMethods: methods }))
              notify('Opções atualizadas.')
            }}
          >
            Atualizar opções
          </button>
        </footer>
      </article>

      <article className="settings-card">
        <header className="settings-card__head">
          <h2 className="settings-card__title">
            <DollarSign size={18} strokeWidth={2.25} />
            Terminais de pagamento
          </h2>
          <button type="button" className="settings__save" onClick={() => navigate(settingsPath('pagamentos', 'terminal:new'))}>
            <Plus size={16} strokeWidth={2.5} />
            Novo terminal
          </button>
        </header>
        <DataTable columns={['Máquina', 'Ações']}>
          {config.terminals.length === 0 ? (
            <tr>
              <td className="settings-table__empty" colSpan={2}>
                Nenhum resultado foi encontrado.
              </td>
            </tr>
          ) : (
            config.terminals.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <RowActions>
                  <IconAction kind="edit" tip="Editar" onClick={() => navigate(settingsPath('pagamentos', `terminal:${item.id}`))} />
                  <IconAction kind="delete" tip="Excluir" onClick={() => setRemoveId(item.id)} />
                </RowActions>
              </tr>
            ))
          )}
        </DataTable>
      </article>

      <AttentionModal
        open={removing !== undefined}
        message="Você tem certeza que deseja excluir este terminal de pagamento?"
        confirmLabel="Excluir"
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          updateAppConfig((current) => ({
            ...current,
            terminals: current.terminals.filter((row) => row.id !== removeId),
          }))
          setRemoveId(null)
          notify('Terminal excluído com sucesso.')
        }}
      />
      {node}
    </>
  )
}

export function GoalsSection() {
  const config = useAppConfig()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const edit = params.get('edit') || ''
  const [removeId, setRemoveId] = useState<string | null>(null)
  const { notify, node } = useSettingsNotice()

  if (edit.startsWith('goal:')) {
    return <GoalEditor groupId={edit.slice('goal:'.length)} />
  }

  const removing = config.goalGroups.find((item) => item.id === removeId)

  return (
    <div className="settings-metas">
      <article className="settings-card settings-metas__card">
        <header className="settings-card__head">
          <h2 className="settings-card__title">Configurações de metas</h2>
        </header>
        <div className="settings-metas__body">
          <div className="settings-metas__alert">
            <HelpCircle size={31} strokeWidth={1.75} aria-hidden="true" />
            <p>
              Com esta opção ativa, o sistema irá calcular as comissões de acordo com as faixas
              estabelecidas por grupos. Você poderá então definir o grupo de comissionamento de cada
              usuário do sistema.
            </p>
          </div>
          <div className="settings-ops__row">
            <span className="settings-ops__label">Usar configuração de faixas de metas</span>
            <div className="settings-ops__field">
              <OpsSwitch
                label="Usar configuração de faixas de metas"
                checked={config.goalsEnabled}
                onChange={(value) => {
                  updateAppConfig((current) => ({ ...current, goalsEnabled: value }))
                  notify(value ? 'Metas ativadas.' : 'Metas desativadas.')
                }}
              />
            </div>
          </div>
        </div>
      </article>

      <article className="settings-card settings-metas__card">
        <header className="settings-card__head">
          <h2 className="settings-card__title">Faixas cadastradas</h2>
          <button type="button" className="settings-metas__add" onClick={() => navigate(settingsPath('metas', 'goal:new'))}>
            <Plus size={16} strokeWidth={2.5} />
            Cadastrar
          </button>
        </header>
        <div className="settings-metas__body">
          <table className="settings-metas__table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {config.goalGroups.length === 0 ? (
                <tr>
                  <td className="settings-metas__empty" colSpan={2}>
                    Nenhum resultado foi encontrado.
                  </td>
                </tr>
              ) : (
                config.goalGroups.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="settings-metas__actions">
                      <IconAction kind="edit" tip="Editar" onClick={() => navigate(settingsPath('metas', `goal:${item.id}`))} />
                      <IconAction kind="delete" tip="Excluir" onClick={() => setRemoveId(item.id)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <AttentionModal
        open={removing !== undefined}
        message="Você tem certeza que deseja excluir este grupo de comissionamento?"
        confirmLabel="Excluir"
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          updateAppConfig((current) => ({
            ...current,
            goalGroups: current.goalGroups.filter((row) => row.id !== removeId),
          }))
          setRemoveId(null)
          notify('Grupo excluído com sucesso.')
        }}
      />
      {node}
    </div>
  )
}

function MailSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (value: boolean) => void
}) {
  return (
    <label className="settings-mail__switch">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span aria-hidden="true" />
    </label>
  )
}

function MailDelay({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (!rect) return
      setBox({ top: rect.bottom + 1, left: rect.left, width: rect.width })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={`settings-mail__delay${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="settings-mail__delay-btn"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value}</span>
        <svg viewBox="0 0 8 8" aria-hidden="true">
          <path d="M1.15 2.55 4 5.4 6.85 2.55" />
        </svg>
      </button>
      {open && box
        ? createPortal(
            <ul
              ref={menuRef}
              className="settings-mail__menu"
              role="listbox"
              aria-label={label}
              style={{ top: box.top, left: box.left, width: box.width }}
            >
              {options.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option === value}
                    className={option === value ? 'is-selected' : ''}
                    onClick={() => {
                      onChange(option)
                      setOpen(false)
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  )
}

const ALERT_ROWS: {
  id: string
  name: string
  description: string
  enabled: 'birthdayEnabled' | 'lateEnabled' | 'returnEnabled' | 'proofEnabled' | 'pickupEnabled'
  field?: 'lateReturn' | 'returnReminder' | 'proofReminder' | 'pickupReminder'
  options?: string[]
}[] = [
  {
    id: 'birthday',
    name: 'Email de aniversário',
    description: 'Enviado automaticamente no dia do aniversário de clientes.',
    enabled: 'birthdayEnabled',
  },
  {
    id: 'late-return',
    name: 'Devolução atrasada',
    description: 'Mensagem enviada para clientes com pedidos que não foram devolvidos na data combinada.',
    enabled: 'lateEnabled',
    field: 'lateReturn',
    options: AFTER_OPTIONS,
  },
  {
    id: 'return',
    name: 'Lembrete de devolução',
    description: 'Mensagem automática para lembrar clientes da devolução do seu pedido.',
    enabled: 'returnEnabled',
    field: 'returnReminder',
    options: BEFORE_OPTIONS,
  },
  {
    id: 'proof',
    name: 'Lembrete de prova',
    description: 'Mensagem automática para lembrar clientes da prova do seu pedido.',
    enabled: 'proofEnabled',
    field: 'proofReminder',
    options: BEFORE_OPTIONS,
  },
  {
    id: 'pickup',
    name: 'Lembrete de retirada',
    description: 'Mensagem automática para lembrar clientes da retirada do seu pedido.',
    enabled: 'pickupEnabled',
    field: 'pickupReminder',
    options: BEFORE_OPTIONS,
  },
]

export function AlertsSection() {
  const config = useAppConfig()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const edit = params.get('edit') || ''

  if (edit.startsWith('alert:')) {
    return <AlertEditor alertId={edit.slice('alert:'.length)} />
  }

  return (
    <article className="settings-card settings-mails">
      <header className="settings-card__head">
        <h2 className="settings-card__title">E-mails</h2>
      </header>
      <div className="settings-table-wrap">
        <table className="settings-table settings-mails__table">
          <thead>
            <tr>
              <th>Nome</th>
              <th className="settings-mails__control" />
              <th className="settings-mails__edit">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ALERT_ROWS.map((row) => {
              const enabled = config.alerts[row.enabled]
              const stored = row.field ? config.alerts[row.field] : ''
              const options = row.options ? [ALERT_OFF, ...row.options] : []
              if (stored && !options.includes(stored)) options.push(stored)
              const shown = row.field ? (enabled ? stored : ALERT_OFF) : ''
              return (
                <tr key={row.id}>
                  <td>
                    <div className="settings-mail__name">{row.name}</div>
                    <div className="settings-mail__desc">{row.description}</div>
                  </td>
                  <td className="settings-mails__control">
                    {row.field ? (
                      <MailDelay
                        label={row.name}
                        value={shown}
                        options={options}
                        onChange={(option) => {
                          const field = row.field
                          if (!field) return
                          updateAppConfig((currentConfig) => ({
                            ...currentConfig,
                            alerts: {
                              ...currentConfig.alerts,
                              [row.enabled]: option !== ALERT_OFF,
                              ...(option === ALERT_OFF ? {} : { [field]: option }),
                            },
                          }))
                        }}
                      />
                    ) : (
                      <MailSwitch
                        label={row.name}
                        checked={enabled}
                        onChange={(value) =>
                          updateAppConfig((currentConfig) => ({
                            ...currentConfig,
                            alerts: { ...currentConfig.alerts, [row.enabled]: value },
                          }))
                        }
                      />
                    )}
                  </td>
                  <td className="settings-mails__edit">
                    <IconAction
                      className="settings-mail__edit"
                      kind="edit"
                      tip="Editar"
                      onClick={() => navigate(settingsPath('avisos', `alert:${row.id}`))}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </article>
  )
}

export function InvoiceSection() {
  const navigate = useNavigate()
  return (
    <article className="settings-card">
      <header className="settings-card__head">
        <h2 className="settings-card__title">Configurações para emissão de notas fiscais</h2>
      </header>
      <div className="settings-invoice">
        <p className="settings-invoice__alert">
          A sua assinatura não contempla a emissão de notas fiscais. Entre em contato conosco para
          contratar esse complemento e começar a emitir notas fiscais para sua loja.
        </p>
      </div>
      <footer className="settings-card__foot">
        <button type="button" className="settings__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={2.25} />
          Voltar
        </button>
        <button type="button" className="settings__save">
          <Check size={16} strokeWidth={2.5} />
          Atualizar
        </button>
      </footer>
    </article>
  )
}

export function PermissionsSection() {
  const config = useAppConfig()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const edit = params.get('edit') || ''
  const [removeId, setRemoveId] = useState<string | null>(null)
  const { notify, node } = useSettingsNotice()

  if (edit.startsWith('permission:')) {
    return <PermissionEditor permissionId={edit.slice('permission:'.length)} />
  }

  const removing = config.permissions.find((item) => item.id === removeId)

  return (
    <>
      <article className="settings-card">
        <header className="settings-card__head">
          <h2 className="settings-card__title">Níveis cadastrados</h2>
          <button type="button" className="settings__save" onClick={() => navigate(settingsPath('permissoes', 'permission:new'))}>
            <Plus size={16} strokeWidth={2.5} />
            Novo nível
          </button>
        </header>
        <DataTable columns={['Modelo', 'Ações']}>
          {config.permissions.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <RowActions>
                <IconAction
                  kind="edit"
                  tip="Editar"
                  onClick={() => navigate(settingsPath('permissoes', `permission:${item.id}`))}
                />
                {item.locked ? null : (
                  <IconAction kind="delete" tip="Excluir" onClick={() => setRemoveId(item.id)} />
                )}
              </RowActions>
            </tr>
          ))}
        </DataTable>
      </article>
      <AttentionModal
        open={removing !== undefined}
        message="Você tem certeza que deseja excluir este nível de permissão?"
        confirmLabel="Sim, Excluir"
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          updateAppConfig((current) => ({
            ...current,
            permissions: current.permissions.filter((row) => row.locked || row.id !== removeId),
          }))
          setRemoveId(null)
          notify('Permissão excluída com sucesso.')
        }}
      />
      {node}
    </>
  )
}
