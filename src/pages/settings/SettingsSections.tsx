import { useEffect, useState, type ReactNode } from 'react'
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

const BEFORE_OPTIONS = ['1 dia antes', '2 dias antes', '3 dias antes', '5 dias antes', '7 dias antes']
const AFTER_OPTIONS = ['1 dia depois', '2 dias depois', '3 dias depois', '5 dias depois', '7 dias depois']

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
    <article className="settings-card">
      <header className="settings-card__head">
        <h2 className="settings-card__title">Configurações de operações</h2>
        <button type="button" className="settings__save" onClick={save}>
          <Check size={16} strokeWidth={2.5} />
          Salvar alterações
        </button>
      </header>

      <div className="settings-form">
        <div className="settings-form__row">
          <span className="settings-form__label">Bloquear o produto antes de sua prova</span>
          <div className="settings-form__days">
            <input
              className="settings-form__number"
              type="number"
              min={0}
              aria-label="Dias antes da prova"
              value={draft.blockBeforeProofDays}
              onChange={(event) => patch('blockBeforeProofDays', Number(event.target.value))}
            />
            <span>dias</span>
          </div>
        </div>
        <div className="settings-form__row">
          <span className="settings-form__label">Manter produto bloqueado depois da sua devolução</span>
          <div className="settings-form__days">
            <input
              className="settings-form__number"
              type="number"
              min={0}
              aria-label="Dias depois da devolução"
              value={draft.blockAfterReturnDays}
              onChange={(event) => patch('blockAfterReturnDays', Number(event.target.value))}
            />
            <span>dias</span>
          </div>
        </div>

        <ToggleRow
          label='Mostrar campo de código personalizado no cadastro de produto'
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

        <h3 className="settings-form__heading">Preenchimento de pedidos e orçamentos:</h3>
        <div className="settings-form__row settings-form__row--top">
          <span className="settings-form__label">Tornar &quot;Origem&quot; obrigatória ao criar pedido</span>
          <div>
            <Switch
              label='Tornar "Origem" obrigatória ao criar pedido'
              checked={draft.originRequired}
              onChange={(value) => patch('originRequired', value)}
            />
            <p className="settings-form__hint">
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

        <h3 className="settings-form__heading">Cancelamento de pedidos:</h3>
        <div className="settings-form__row settings-form__row--top">
          <span className="settings-form__label">
            Quando ocorre o cancelamento do pedido a comissão deve ser paga sobre
          </span>
          <div className="settings-form__radios">
            <label className="settings__radio">
              <input
                type="radio"
                name="commission-base"
                checked={draft.commissionBase === 'total'}
                onChange={() => patch('commissionBase', 'total')}
              />
              <span>Valor total do pedido</span>
            </label>
            <label className="settings__radio">
              <input
                type="radio"
                name="commission-base"
                checked={draft.commissionBase === 'paid'}
                onChange={() => patch('commissionBase', 'paid')}
              />
              <span>Valor pago</span>
            </label>
          </div>
        </div>
        <ToggleRow
          label="Incluir valor da multa para calcular a comissão"
          checked={draft.includeFineInCommission}
          onChange={(value) => patch('includeFineInCommission', value)}
        />
      </div>

      <footer className="settings-card__foot">
        <button type="button" className="settings__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={2.25} />
          Voltar
        </button>
        <button type="button" className="settings__save" onClick={save}>
          <Check size={16} strokeWidth={2.5} />
          Salvar
        </button>
      </footer>
    </article>
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
    <div className="settings-form__row">
      <span className="settings-form__label">{label}</span>
      <Switch label={label} checked={checked} onChange={onChange} />
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
    <div className="settings-form__row settings-form__row--top">
      <label className="settings-form__label" htmlFor={`op-${label}`}>
        {label}
      </label>
      <textarea
        id={`op-${label}`}
        className="settings-form__area"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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
    <>
      <article className="settings-card">
        <div className="settings-note-wrap">
          <div className="settings-note">
            <span className="settings-note__icon" aria-hidden="true">
              <HelpCircle size={18} strokeWidth={2} />
            </span>
            <p>
              Com esta opção ativa, o sistema irá calcular as comissões de acordo com as faixas
              estabelecidas por grupos. Você poderá então definir o grupo de comissionamento de cada
              usuário do sistema.
            </p>
          </div>
          <div className="settings-form__row">
            <span className="settings-form__label">Usar configuração de faixas de metas</span>
            <Switch
              label="Usar configuração de faixas de metas"
              checked={config.goalsEnabled}
              onChange={(value) => {
                updateAppConfig((current) => ({ ...current, goalsEnabled: value }))
                notify(value ? 'Metas ativadas.' : 'Metas desativadas.')
              }}
            />
          </div>
        </div>
      </article>

      <article className="settings-card">
        <header className="settings-card__head">
          <h2 className="settings-card__title">Faixas cadastradas</h2>
          <button type="button" className="settings__save" onClick={() => navigate(settingsPath('metas', 'goal:new'))}>
            <Plus size={16} strokeWidth={2.5} />
            Cadastrar
          </button>
        </header>
        <DataTable columns={['Grupo', 'Ações']}>
          {config.goalGroups.length === 0 ? (
            <tr>
              <td className="settings-table__empty" colSpan={2}>
                Nenhum resultado foi encontrado.
              </td>
            </tr>
          ) : (
            config.goalGroups.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <RowActions>
                  <IconAction kind="edit" tip="Editar" onClick={() => navigate(settingsPath('metas', `goal:${item.id}`))} />
                  <IconAction kind="delete" tip="Excluir" onClick={() => setRemoveId(item.id)} />
                </RowActions>
              </tr>
            ))
          )}
        </DataTable>
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
    </>
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
    description: 'Enviado automaticamente no dia do aniversário de clientes',
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
    <article className="settings-card">
      <header className="settings-card__head">
        <h2 className="settings-card__title">E-mails</h2>
      </header>
      <DataTable columns={['Nome', 'Ações']}>
        {ALERT_ROWS.map((row) => {
          const current = row.field ? config.alerts[row.field] : ''
          const options = row.options
            ? current && !row.options.includes(current)
              ? [current, ...row.options]
              : row.options
            : []
          return (
            <tr key={row.id}>
              <td>
                <div className="settings-mail__name">{row.name}</div>
                <div className="settings-mail__desc">{row.description}</div>
              </td>
              <td className="settings-table__actions">
                <div className="settings-mail__tools">
                  {row.field ? (
                    <select
                      className="settings__delay"
                      aria-label={row.name}
                      value={current}
                      onChange={(event) => {
                        const field = row.field
                        if (!field) return
                        updateAppConfig((currentConfig) => ({
                          ...currentConfig,
                          alerts: { ...currentConfig.alerts, [field]: event.target.value },
                        }))
                      }}
                    >
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="settings-check"
                      type="checkbox"
                      aria-label={row.name}
                      checked={config.alerts[row.enabled]}
                      onChange={(event) =>
                        updateAppConfig((currentConfig) => ({
                          ...currentConfig,
                          alerts: { ...currentConfig.alerts, [row.enabled]: event.target.checked },
                        }))
                      }
                    />
                  )}
                  <IconAction kind="edit" tip="Editar" onClick={() => navigate(settingsPath('avisos', `alert:${row.id}`))} />
                  {row.field ? (
                    <Switch
                      label={row.name}
                      checked={config.alerts[row.enabled]}
                      onChange={(value) =>
                        updateAppConfig((currentConfig) => ({
                          ...currentConfig,
                          alerts: { ...currentConfig.alerts, [row.enabled]: value },
                        }))
                      }
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          )
        })}
      </DataTable>
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
                {item.locked ? null : (
                  <>
                    <IconAction
                      kind="edit"
                      tip="Editar"
                      onClick={() => navigate(settingsPath('permissoes', `permission:${item.id}`))}
                    />
                    <IconAction kind="delete" tip="Excluir" onClick={() => setRemoveId(item.id)} />
                  </>
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
            permissions: current.permissions.filter((row) => row.id !== removeId),
          }))
          setRemoveId(null)
          notify('Permissão excluída com sucesso.')
        }}
      />
      {node}
    </>
  )
}
