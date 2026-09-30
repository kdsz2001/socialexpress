import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useClients } from '../hooks/useClients'
import { useEmployees } from '../hooks/useEmployees'
import {
  getClientDisplayName,
  updateClient,
  type Client,
  type ClientGender,
  type ClientMeasure,
  type ClientPhone,
} from '../lib/clientsStore'
import { moneyBrToNumber } from '../lib/moneyMask'
import { addOrder, type OrderKind, type OrderOperation } from '../lib/ordersStore'
import { listProducts } from '../lib/productsStore'
import { getUserDisplayName } from '../lib/userProfileStore'
import './OrderCreate.css'

const ORIGINS = [
  'Cliente antigo',
  'Facebook',
  'Google',
  'Indicação',
  'Instagram',
  'Outro',
  'Rádio',
  'Site',
]

const WEEKDAYS = ['D', '2ª', '3ª', '4ª', '5ª', '6ª', 'S']
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

type Draft = {
  cpfCnpj: string
  rg: string
  gender: ClientGender
  nome: string
  sobrenomes: string
  chamado: string
  email: string
  facebook: string
  instagram: string
  birthDate: string
  phones: ClientPhone[]
  cep: string
  logradouro: string
  numero: string
  complemento: string
  estado: string
  cidade: string
  bairro: string
  notifyEmail: boolean
  measures: ClientMeasure[]
  observacoes: string
}

type ProductLine = {
  id: string
  name: string
  productId: string
  fullCode: string
  value: number
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatBr(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function formatBrl(value: number) {
  const negative = value < 0
  const [intPart, decPart] = Math.abs(value).toFixed(2).split('.')
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${negative ? '-' : ''}R$ ${withDots},${decPart}`
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function monthCells(view: Date) {
  const start = new Date(view.getFullYear(), view.getMonth(), 1)
  const gridStart = new Date(start)
  gridStart.setDate(1 - start.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })
}

function draftFromClient(client: Client): Draft {
  return {
    cpfCnpj: client.cpfCnpj,
    rg: client.rg,
    gender: client.gender,
    nome: client.nome,
    sobrenomes: client.sobrenomes,
    chamado: client.chamado,
    email: client.email,
    facebook: client.facebook,
    instagram: client.instagram,
    birthDate: client.birthDate,
    phones: client.phones.length
      ? client.phones.map((phone) => ({ ...phone }))
      : [{ number: '', primary: true, whatsapp: false }],
    cep: client.cep,
    logradouro: client.logradouro,
    numero: client.numero,
    complemento: client.complemento,
    estado: client.estado,
    cidade: client.cidade,
    bairro: client.bairro,
    notifyEmail: client.notifyEmail,
    measures: client.measures.map((item) => ({ ...item })),
    observacoes: client.observacoes,
  }
}

function emptyDraft(): Draft {
  return draftFromClient({
    id: '',
    cpfCnpj: '',
    rg: '',
    gender: '',
    nome: '',
    sobrenomes: '',
    chamado: '',
    birthDate: '',
    email: '',
    phones: [{ number: '', primary: true, whatsapp: false }],
    facebook: '',
    instagram: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    estado: '',
    cidade: '',
    bairro: '',
    notifyEmail: false,
    measures: [],
    observacoes: '',
    active: true,
    createdAt: '',
  })
}

export function OrderCreate() {
  const navigate = useNavigate()
  const clients = useClients()
  const employees = useEmployees()
  const userName = getUserDisplayName()

  const [step, setStep] = useState<1 | 2>(1)
  const [kind, setKind] = useState<OrderKind>('Pedido')
  const [operation, setOperation] = useState<OrderOperation>('Aluguel')
  const [clientId, setClientId] = useState('')
  const [clientQuery, setClientQuery] = useState('')
  const [clientOpen, setClientOpen] = useState(false)
  const [origin, setOrigin] = useState('')
  const [attendant, setAttendant] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => new Date())
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [touched, setTouched] = useState(false)
  const [productQuery, setProductQuery] = useState('')
  const [looseOpen, setLooseOpen] = useState(false)
  const [looseName, setLooseName] = useState('')
  const [lines, setLines] = useState<ProductLine[]>([])

  const clientBoxRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)

  const attendants = useMemo(() => {
    const names = employees.filter((item) => item.active).map((item) => item.name.trim()).filter(Boolean)
    if (userName && !names.some((name) => name.toLocaleLowerCase('pt-BR') === userName.toLocaleLowerCase('pt-BR'))) {
      names.unshift(userName)
    }
    return names
  }, [employees, userName])

  const clientMatches = useMemo(() => {
    const q = clientQuery.trim().toLocaleLowerCase('pt-BR')
    const list = clients.filter((client) => client.active !== false)
    if (!q) return list.slice(0, 8)
    return list
      .filter((client) => {
        const name = getClientDisplayName(client).toLocaleLowerCase('pt-BR')
        return name.includes(q) || client.cpfCnpj.toLocaleLowerCase('pt-BR').includes(q)
      })
      .slice(0, 8)
  }, [clients, clientQuery])

  const productMatches = useMemo(() => {
    const q = productQuery.trim().toLocaleLowerCase('pt-BR')
    if (!q) return []
    return listProducts()
      .filter((product) => {
        return (
          product.name.toLocaleLowerCase('pt-BR').includes(q) ||
          product.fullCode.toLocaleLowerCase('pt-BR').includes(q) ||
          product.storeCode.toLocaleLowerCase('pt-BR').includes(q)
        )
      })
      .slice(0, 8)
  }, [productQuery])

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      const node = event.target as Node
      if (!clientBoxRef.current?.contains(node)) setClientOpen(false)
      if (!dateRef.current?.contains(node)) setCalendarOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  const missingClient = !clientId
  const missingAttendant = !attendant
  const missingDate = !eventDate

  const selectClient = (client: Client) => {
    setClientId(client.id)
    setClientQuery(getClientDisplayName(client))
    setDraft(draftFromClient(client))
    setClientOpen(false)
  }

  const clearClient = () => {
    setClientId('')
    setClientQuery('')
    setDraft(emptyDraft())
  }

  const patchDraft = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }))

  const goNext = () => {
    setTouched(true)
    if (missingClient || missingAttendant || missingDate) return
    setStep(2)
  }

  const addLine = (line: { name: string; productId?: string; fullCode?: string; value?: number }) => {
    const trimmed = line.name.trim()
    if (!trimmed) return
    setLines((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: trimmed,
        productId: line.productId?.trim() || '',
        fullCode: line.fullCode?.trim() || '',
        value: Number.isFinite(line.value) ? Number(line.value) : 0,
      },
    ])
  }

  const save = () => {
    if (!clientId || !eventDate) return
    const client = clients.find((item) => item.id === clientId)
    const phone = draft.phones.find((item) => item.primary)?.number || draft.phones[0]?.number || ''
    const name = [draft.nome, draft.sobrenomes].filter(Boolean).join(' ').trim() || clientQuery
    if (client) {
      updateClient(client.id, {
        cpfCnpj: draft.cpfCnpj,
        rg: draft.rg,
        gender: draft.gender,
        nome: draft.nome,
        sobrenomes: draft.sobrenomes,
        chamado: draft.chamado,
        email: draft.email,
        facebook: draft.facebook,
        instagram: draft.instagram,
        birthDate: draft.birthDate,
        phones: draft.phones,
        cep: draft.cep,
        logradouro: draft.logradouro,
        numero: draft.numero,
        complemento: draft.complemento,
        estado: draft.estado,
        cidade: draft.cidade,
        bairro: draft.bairro,
        notifyEmail: draft.notifyEmail,
        measures: draft.measures,
        observacoes: draft.observacoes,
      })
    }
    const totalValue = lines.reduce((sum, line) => sum + (Number.isFinite(line.value) ? line.value : 0), 0)
    addOrder({
      clientName: name,
      phone,
      eventDate,
      total: lines.length > 0 ? formatBrl(totalValue) : '',
      status: 'Aberto',
      operation,
      kind,
      origin,
      attendant,
      lines: lines.map((line) => ({
        productId: line.productId,
        name: line.name,
        fullCode: line.fullCode,
        value: line.value,
      })),
    })
    navigate('/pedidos')
  }

  const cells = monthCells(viewMonth)
  const selectedDate = eventDate ? new Date(`${eventDate}T12:00:00`) : null

  return (
    <div className="order-new">
      <section className="order-new__card">
        {step === 2 ? (
          <div className="order-new__steps" aria-label="Etapas do pedido">
            <button type="button" className="order-new__step is-done" onClick={() => setStep(1)}>
              <span className="order-new__step-mark">
                <Check size={14} strokeWidth={2.5} />
              </span>
              Dados do cliente
            </button>
            <span className="order-new__step-line" />
            <span className="order-new__step is-current">
              <span className="order-new__step-mark">2</span>
              Produtos
            </span>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="order-new__body">
            <div className="order-new__row order-new__row--center">
              <span className="order-new__label">
                Status <span className="order-new__req">*</span>
              </span>
              <div className="order-new__radios">
                {(['Pedido', 'Orçamento'] as const).map((item) => (
                  <label key={item} className="order-new__radio">
                    <input
                      type="radio"
                      name="order-kind"
                      checked={kind === item}
                      onChange={() => setKind(item)}
                    />
                    <span />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="order-new__row order-new__row--center">
              <span className="order-new__label">
                Operação <span className="order-new__req">*</span>
              </span>
              <div className="order-new__radios">
                {(['Aluguel', 'Venda'] as const).map((item) => (
                  <label key={item} className="order-new__radio">
                    <input
                      type="radio"
                      name="order-operation"
                      checked={operation === item}
                      onChange={() => setOperation(item)}
                    />
                    <span />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="order-new__row">
              <span className="order-new__label">
                Cliente <span className="order-new__req">*</span>
              </span>
              <div className="order-new__field" ref={clientBoxRef}>
                <div className={`order-new__combo${touched && missingClient ? ' is-invalid' : ''}`}>
                  <input
                    type="text"
                    value={clientQuery}
                    placeholder="Busque por nome ou documento"
                    autoComplete="off"
                    onFocus={() => setClientOpen(true)}
                    onChange={(event) => {
                      setClientQuery(event.target.value)
                      setClientId('')
                      setClientOpen(true)
                    }}
                  />
                  {clientId ? (
                    <button type="button" className="order-new__clear" aria-label="Limpar cliente" onClick={clearClient}>
                      <X size={14} strokeWidth={2.25} />
                    </button>
                  ) : null}
                  <ChevronDown size={16} strokeWidth={2} className="order-new__combo-icon" />
                </div>
                {clientOpen ? (
                  <div className="order-new__menu" role="listbox">
                    {clientMatches.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        className="order-new__option"
                        onClick={() => selectClient(client)}
                      >
                        <strong>{getClientDisplayName(client)}</strong>
                        {client.cpfCnpj ? <span>{client.cpfCnpj}</span> : null}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="order-new__option order-new__option--new"
                      onClick={() => navigate('/clientes/cadastrar')}
                    >
                      Não está na lista. Clique aqui para um novo cadastro.
                    </button>
                  </div>
                ) : null}
                {touched && missingClient ? (
                  <p className="order-new__error">&quot;Cliente&quot; não pode ficar em branco.</p>
                ) : null}
              </div>
            </div>

            <div className="order-new__row">
              <span className="order-new__label">Origem</span>
              <div className="order-new__field">
                <select className="order-new__control" value={origin} onChange={(event) => setOrigin(event.target.value)}>
                  <option value="">Selecione</option>
                  {ORIGINS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="order-new__row">
              <span className="order-new__label">
                Atendente <span className="order-new__req">*</span>
              </span>
              <div className="order-new__field">
                <select
                  className={`order-new__control${touched && missingAttendant ? ' is-invalid' : ''}`}
                  value={attendant}
                  onChange={(event) => setAttendant(event.target.value)}
                >
                  <option value="">Selecione um(a) atendente</option>
                  {attendants.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {touched && missingAttendant ? (
                  <p className="order-new__error">&quot;Vendedor(a)&quot; não pode ficar em branco.</p>
                ) : null}
              </div>
            </div>

            <div className="order-new__row">
              <span className="order-new__label">
                Data do evento <span className="order-new__req">*</span>
              </span>
              <div className="order-new__field" ref={dateRef}>
                <div className={`order-new__date${touched && missingDate ? ' is-invalid' : ''}`}>
                  <input
                    type="text"
                    readOnly
                    value={formatBr(eventDate)}
                    placeholder=""
                    aria-label="Data do evento"
                    onClick={() => setCalendarOpen(true)}
                  />
                  {touched && missingDate ? <CircleAlert size={16} className="order-new__date-alert" /> : null}
                  <button
                    type="button"
                    className="order-new__date-btn"
                    aria-label="Abrir calendário"
                    onClick={() => setCalendarOpen((open) => !open)}
                  >
                    <CalendarDays size={16} strokeWidth={2} />
                  </button>
                </div>
                {calendarOpen ? (
                  <div className="order-new__cal" role="dialog" aria-label="Escolher data">
                    <div className="order-new__cal-head">
                      <button
                        type="button"
                        aria-label="Mês anterior"
                        onClick={() => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <strong>
                        {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                      </strong>
                      <button
                        type="button"
                        aria-label="Próximo mês"
                        onClick={() => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="order-new__cal-week">
                      {WEEKDAYS.map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                    <div className="order-new__cal-grid">
                      {cells.map((day) => {
                        const inMonth = day.getMonth() === viewMonth.getMonth()
                        const isSelected = selectedDate ? sameDay(day, selectedDate) : false
                        return (
                          <button
                            key={toIso(day)}
                            type="button"
                            className={`order-new__cal-day${inMonth ? '' : ' is-outside'}${isSelected ? ' is-selected' : ''}`}
                            onClick={() => {
                              setEventDate(toIso(day))
                              setCalendarOpen(false)
                            }}
                          >
                            {day.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
                {touched && missingDate ? <p className="order-new__error">Informe a data do evento.</p> : null}
              </div>
            </div>

            {clientId ? <ClientDetails draft={draft} onChange={patchDraft} /> : null}
          </div>
        ) : (
          <div className="order-new__body">
            <div className="order-new__products">
              <div className="order-new__product-search">
                <input
                  type="search"
                  value={productQuery}
                  placeholder="Busque por nome ou código"
                  onChange={(event) => setProductQuery(event.target.value)}
                />
                {productMatches.length > 0 ? (
                  <div className="order-new__menu">
                    {productMatches.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="order-new__option"
                        onClick={() => {
                          addLine({
                            name: product.name,
                            productId: product.id,
                            fullCode: product.fullCode,
                            value: moneyBrToNumber(product.rental),
                          })
                          setProductQuery('')
                        }}
                      >
                        <strong>{product.name}</strong>
                        {product.fullCode ? <span>{product.fullCode}</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="button" className="order-new__loose" onClick={() => setLooseOpen(true)}>
                <Plus size={15} strokeWidth={2.4} />
                Adicionar produto avulso
              </button>
            </div>
            {looseOpen ? (
              <div className="order-new__loose-row">
                <input
                  type="text"
                  value={looseName}
                  placeholder="Nome do produto"
                  onChange={(event) => setLooseName(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    addLine({ name: looseName })
                    setLooseName('')
                    setLooseOpen(false)
                  }}
                >
                  Adicionar
                </button>
              </div>
            ) : null}
            {lines.length > 0 ? (
              <ul className="order-new__lines">
                {lines.map((line) => (
                  <li key={line.id}>
                    <span>{line.name}</span>
                    <button type="button" aria-label={`Remover ${line.name}`} onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}>
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        <footer className="order-new__footer">
          {step === 2 ? (
            <button type="button" className="order-new__back" onClick={() => setStep(1)}>
              Voltar
            </button>
          ) : (
            <span />
          )}
          {step === 1 ? (
            <button type="button" className="order-new__next" onClick={goNext}>
              <Check size={16} strokeWidth={2.5} />
              Avançar
            </button>
          ) : (
            <button type="button" className="order-new__next" onClick={save}>
              <Check size={16} strokeWidth={2.5} />
              Salvar pedido
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}

function ClientDetails({
  draft,
  onChange,
}: {
  draft: Draft
  onChange: (patch: Partial<Draft>) => void
}) {
  const setPhone = (index: number, patch: Partial<ClientPhone>) => {
    const phones = draft.phones.map((phone, phoneIndex) => (phoneIndex === index ? { ...phone, ...patch } : phone))
    onChange({ phones })
  }

  return (
    <>
      <h3 className="order-new__section">Informações do cliente:</h3>
      <Field label="CPF ou CNPJ" required>
        <input className="order-new__control" value={draft.cpfCnpj} onChange={(event) => onChange({ cpfCnpj: event.target.value })} />
      </Field>
      <Field label="RG">
        <input className="order-new__control" value={draft.rg} onChange={(event) => onChange({ rg: event.target.value })} />
      </Field>
      <div className="order-new__row order-new__row--center">
        <span className="order-new__label">
          Identificação de gênero <span className="order-new__req">*</span>
        </span>
        <div className="order-new__radios">
          {(
            [
              ['feminino', 'Feminino'],
              ['masculino', 'Masculino'],
              ['outros', 'Outros'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="order-new__radio">
              <input
                type="radio"
                name="order-gender"
                checked={draft.gender === value}
                onChange={() => onChange({ gender: value })}
              />
              <span />
              {label}
            </label>
          ))}
        </div>
      </div>
      <Field label="Nome">
        <input className="order-new__control" value={draft.nome} onChange={(event) => onChange({ nome: event.target.value })} />
      </Field>
      <Field label="Sobrenomes" required>
        <input className="order-new__control" value={draft.sobrenomes} onChange={(event) => onChange({ sobrenomes: event.target.value })} />
      </Field>
      <Field label="Como quer ser chamado">
        <input className="order-new__control" value={draft.chamado} onChange={(event) => onChange({ chamado: event.target.value })} />
      </Field>
      <Field label="Email">
        <input className="order-new__control" value={draft.email} onChange={(event) => onChange({ email: event.target.value })} />
      </Field>
      <Field label="Facebook">
        <input className="order-new__control" value={draft.facebook} onChange={(event) => onChange({ facebook: event.target.value })} />
      </Field>
      <Field label="Instagram">
        <input className="order-new__control" value={draft.instagram} onChange={(event) => onChange({ instagram: event.target.value })} />
      </Field>
      <Field label="Data de nascimento">
        <input
          className="order-new__control"
          value={draft.birthDate}
          placeholder="dd/mm/aaaa"
          onChange={(event) => onChange({ birthDate: event.target.value })}
        />
      </Field>
      {draft.phones.map((phone, index) => (
        <Field key={index} label={index === 0 ? 'Telefone' : 'Outro telefone'} required={index === 0}>
          <input
            className="order-new__control"
            value={phone.number}
            onChange={(event) => setPhone(index, { number: event.target.value })}
          />
          <label className="order-new__check phone-flag">
            <input
              type="checkbox"
              checked={phone.primary}
              onChange={(event) => setPhone(index, { primary: event.target.checked })}
            />
            Telefone principal
          </label>
          <label className="order-new__check phone-flag">
            <input
              type="checkbox"
              checked={phone.whatsapp}
              onChange={(event) => setPhone(index, { whatsapp: event.target.checked })}
            />
            Tem WhatsApp
          </label>
        </Field>
      ))}
      <div className="order-new__row">
        <span />
        <button
          type="button"
          className="order-new__add"
          onClick={() => onChange({ phones: [...draft.phones, { number: '', primary: false, whatsapp: false }] })}
        >
          <Plus size={14} /> Adicionar outro telefone
        </button>
      </div>

      <h3 className="order-new__section">Endereço:</h3>
      <Field label="CEP">
        <input className="order-new__control" value={draft.cep} onChange={(event) => onChange({ cep: event.target.value })} />
      </Field>
      <Field label="Logradouro" required>
        <input className="order-new__control" value={draft.logradouro} onChange={(event) => onChange({ logradouro: event.target.value })} />
      </Field>
      <Field label="Número" required>
        <input className="order-new__control" value={draft.numero} onChange={(event) => onChange({ numero: event.target.value })} />
      </Field>
      <Field label="Complemento">
        <input className="order-new__control" value={draft.complemento} onChange={(event) => onChange({ complemento: event.target.value })} />
      </Field>
      <Field label="Estado" required>
        <input className="order-new__control" value={draft.estado} onChange={(event) => onChange({ estado: event.target.value })} />
      </Field>
      <Field label="Cidade" required>
        <input className="order-new__control" value={draft.cidade} onChange={(event) => onChange({ cidade: event.target.value })} />
      </Field>
      <Field label="Bairro" required>
        <input className="order-new__control" value={draft.bairro} onChange={(event) => onChange({ bairro: event.target.value })} />
      </Field>

      <h3 className="order-new__section">Notificações:</h3>
      <div className="order-new__row order-new__row--center">
        <span className="order-new__label">Email</span>
        <label className="order-new__check">
          <input
            type="checkbox"
            checked={draft.notifyEmail}
            onChange={(event) => onChange({ notifyEmail: event.target.checked })}
          />
          Email
        </label>
      </div>

      <h3 className="order-new__section">Informações extras:</h3>
      <Field label="Medidas do cliente">
        {draft.measures.map((measure, index) => (
          <div key={index} className="order-new__measure">
            <input
              className="order-new__control"
              value={measure.type}
              placeholder="Medida"
              onChange={(event) => {
                const measures = draft.measures.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, type: event.target.value } : item,
                )
                onChange({ measures })
              }}
            />
            <input
              className="order-new__control"
              value={measure.value}
              placeholder="Valor"
              onChange={(event) => {
                const measures = draft.measures.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, value: event.target.value } : item,
                )
                onChange({ measures })
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="order-new__add"
          onClick={() => onChange({ measures: [...draft.measures, { type: '', value: '' }] })}
        >
          <Plus size={14} /> Adicionar outra medida
        </button>
      </Field>
      <Field label="Observações">
        <textarea
          className="order-new__control order-new__area"
          value={draft.observacoes}
          onChange={(event) => onChange({ observacoes: event.target.value })}
        />
      </Field>
    </>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="order-new__row">
      <span className="order-new__label">
        {label}
        {required ? <span className="order-new__req"> *</span> : null}
      </span>
      <div className="order-new__field">{children}</div>
    </div>
  )
}
