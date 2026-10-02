import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  Copy,
  MessageCircle,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getClients, updateClient, type Client } from '../lib/clientsStore'
import { listEmployees } from '../lib/employeesStore'
import { moneyBrToNumber } from '../lib/moneyMask'
import {
  addOrder,
  addOrderOrigin,
  cancelOrder,
  formatBrl,
  getOrder,
  listOrderOrigins,
  orderMoney,
  patchOrder,
  subscribeOrders,
  type Order,
  type OrderLine,
  type OrderLineStatus,
  type OrderOperation,
} from '../lib/ordersStore'
import { listProducts, type Product } from '../lib/productsStore'
import { getUserProfile } from '../lib/userProfileStore'
import './Orders.css'

type Step = 'novo' | 'datas' | 'itens' | 'detail'
const LINE_STATUSES: OrderLineStatus[] = [
  'Aguardando prova',
  'Aguardando retirada',
  'Retirado',
  'Devolvido',
]
const PAY_METHODS = ['BOLETO', 'CRÉDITO', 'DÉBITO', 'PIX', 'CHEQUE', 'DEPÓSITO', 'DINHEIRO']

function useLiveOrder(id: string | undefined) {
  const [order, setOrder] = useState<Order | null>(() => (id ? getOrder(id) : null))
  useEffect(() => {
    if (!id) {
      setOrder(null)
      return
    }
    setOrder(getOrder(id))
    return subscribeOrders(() => setOrder(getOrder(id)))
  }, [id])
  return order
}

function clientLabel(client: Client) {
  return [client.nome, client.sobrenomes].filter(Boolean).join(' ').trim()
}

function clientPhone(client: Client) {
  return client.phones.find((phone) => phone.primary)?.number || client.phones[0]?.number || ''
}

function productPrice(product: Product, operation: OrderOperation) {
  const raw = operation === 'Venda' ? product.salePrice || product.rental : product.rental || product.salePrice
  return moneyBrToNumber(raw)
}

function formatBrDate(value: string) {
  const [y, m, d] = value.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function shortMonth(value: string) {
  if (!value) return 'sem data'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'sem data'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

function createdLabel(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function OrderFlow() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const path = useLocation().pathname
  const step: Step = path.endsWith('/novo')
    ? 'novo'
    : path.endsWith('/datas')
      ? 'datas'
      : path.endsWith('/itens')
        ? 'itens'
        : 'detail'
  const order = useLiveOrder(step === 'novo' ? undefined : orderId)

  if (step !== 'novo' && orderId && !order) {
    return (
      <div className="orders">
        <section className="orders__card orders__card--placeholder">
          <h2>Pedido não encontrado</h2>
          <button type="button" className="orders__add" onClick={() => navigate('/pedidos')}>
            Todos pedidos
          </button>
        </section>
      </div>
    )
  }

  if (step === 'novo') return <NewOrderStep />
  if (!order) return null
  if (step === 'datas') return <DatesStep order={order} />
  if (step === 'itens') return <ItemsStep order={order} />
  return <DetailStep order={order} />
}

function NewOrderStep() {
  const navigate = useNavigate()
  const clients = getClients()
  const employees = listEmployees().filter((item) => item.active !== false)
  const profile = getUserProfile()
  const attendantOptions = useMemo(() => {
    const names = employees.map((item) => item.name)
    const me = (profile.chamado || profile.nome || '').trim()
    if (me && !names.includes(me)) names.unshift(me)
    return names
  }, [employees, profile.chamado, profile.nome])

  const [kind, setKind] = useState<'Pedido' | 'Orçamento'>('Pedido')
  const [operation, setOperation] = useState<OrderOperation>('Aluguel')
  const [query, setQuery] = useState('')
  const [clientOpen, setClientOpen] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [origins, setOrigins] = useState(listOrderOrigins)
  const [origin, setOrigin] = useState('')
  const [originQuery, setOriginQuery] = useState('')
  const [originOpen, setOriginOpen] = useState(false)
  const [originModal, setOriginModal] = useState('')
  const [attendant, setAttendant] = useState(attendantOptions[0] || '')
  const [eventDate, setEventDate] = useState('')
  const [draft, setDraft] = useState<Client | null>(null)
  const [touched, setTouched] = useState(false)
  const [toast, setToast] = useState('')

  const matches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    if (!q) return clients.slice(0, 8)
    return clients
      .filter((item) => {
        const blob = `${clientLabel(item)} ${item.cpfCnpj}`.toLocaleLowerCase('pt-BR')
        return blob.includes(q)
      })
      .slice(0, 8)
  }, [clients, query])

  const chooseClient = (item: Client) => {
    setClient(item)
    setDraft({ ...item, phones: item.phones.map((phone) => ({ ...phone })) })
    setQuery(clientLabel(item))
    setClientOpen(false)
  }

  const errors = {
    client: !client,
    attendant: !attendant,
    eventDate: !eventDate,
    sobrenomes: Boolean(draft && !draft.sobrenomes.trim()),
    documento: Boolean(draft && !draft.cpfCnpj.trim()),
    numero: Boolean(draft && !draft.numero.trim()),
    telefone: Boolean(draft && !clientPhone(draft).trim()),
  }
  const blocked = Object.values(errors).some(Boolean)

  const advance = () => {
    setTouched(true)
    if (!client || !draft || blocked) return
    updateClient(client.id, {
      cpfCnpj: draft.cpfCnpj,
      rg: draft.rg,
      gender: draft.gender,
      nome: draft.nome,
      sobrenomes: draft.sobrenomes,
      chamado: draft.chamado,
      birthDate: draft.birthDate,
      email: draft.email,
      phones: draft.phones.length ? draft.phones : [{ number: '', primary: true, whatsapp: true }],
      facebook: draft.facebook,
      instagram: draft.instagram,
      cep: draft.cep,
      logradouro: draft.logradouro,
      numero: draft.numero,
      complemento: draft.complemento,
      estado: draft.estado,
      cidade: draft.cidade,
      bairro: draft.bairro,
      notifyEmail: draft.notifyEmail,
      measures: draft.measures || [],
      observacoes: draft.observacoes,
      active: draft.active,
    })
    const created = addOrder({
      clientId: client.id,
      clientName: clientLabel(draft),
      phone: clientPhone(draft),
      eventDate,
      total: 'R$ 0,00',
      status: kind === 'Orçamento' ? 'Orçamento' : 'Confirmado',
      operation,
      kind,
      origin,
      attendant,
    })
    navigate(`/pedidos/${created.id}/datas`)
  }

  return (
    <div className="orders">
      {toast ? <p className="order-toast">{toast}</p> : null}
      <section className="orders__card order-form">
        <header className="order-form__head">
          <h2>Novo pedido</h2>
        </header>

        <div className="order-form__grid">
          <Field label="Status" required>
            <div className="order-radios">
              {(['Pedido', 'Orçamento'] as const).map((item) => (
                <label key={item} className="order-radios__item">
                  <input type="radio" checked={kind === item} onChange={() => setKind(item)} />
                  <span />
                  {item}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Operação" required>
            <div className="order-radios">
              {(['Aluguel', 'Venda'] as const).map((item) => (
                <label key={item} className="order-radios__item">
                  <input type="radio" checked={operation === item} onChange={() => setOperation(item)} />
                  <span />
                  {item}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Cliente" required invalid={touched && errors.client} error={touched && errors.client ? 'Selecione um cliente.' : ''}>
            <div className="order-combo">
              <input
                value={query}
                placeholder="Busque por nome ou documento"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setClient(null)
                  setDraft(null)
                  setClientOpen(true)
                }}
                onFocus={() => setClientOpen(true)}
              />
              {clientOpen ? (
                <div className="order-combo__menu">
                  {matches.map((item) => (
                    <button key={item.id} type="button" onClick={() => chooseClient(item)}>
                      <strong>{clientLabel(item)}</strong>
                      <small>{item.cpfCnpj}</small>
                    </button>
                  ))}
                  <button type="button" className="order-combo__create" onClick={() => navigate('/clientes/cadastrar')}>
                    Não está na lista. Clique aqui para um novo cadastro.
                  </button>
                </div>
              ) : null}
            </div>
          </Field>

          <Field label="Origem">
            <div className="order-combo">
              <input
                value={originOpen ? originQuery : origin}
                placeholder="Selecione"
                onFocus={() => {
                  setOriginOpen(true)
                  setOriginQuery('')
                }}
                onChange={(event) => {
                  setOriginQuery(event.target.value)
                  setOriginOpen(true)
                }}
              />
              {originOpen ? (
                <div className="order-combo__menu">
                  {origins
                    .filter((item) => item.toLocaleLowerCase('pt-BR').includes(originQuery.trim().toLocaleLowerCase('pt-BR')))
                    .map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setOrigin(item)
                          setOriginOpen(false)
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  {originQuery.trim() ? (
                    <button type="button" className="order-combo__create" onClick={() => setOriginModal(originQuery.trim())}>
                      Cadastrar nova opção: {originQuery.trim()}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Field>

          <Field label="Atendente" required invalid={touched && errors.attendant} error={touched && errors.attendant ? '"Atendente" não pode ficar em branco.' : ''}>
            <select value={attendant} onChange={(event) => setAttendant(event.target.value)}>
              <option value="">Selecione um(a) atendente</option>
              {attendantOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Data do evento" required invalid={touched && errors.eventDate} error={touched && errors.eventDate ? '"Data do evento" não pode ficar em branco.' : ''}>
            <input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
          </Field>
        </div>

        {draft ? (
          <ClientBlock
            draft={draft}
            setDraft={setDraft}
            touched={touched}
            errors={errors}
            onCepMiss={() => {
              setToast('Não foi possível encontrar o CEP')
              window.setTimeout(() => setToast(''), 2400)
            }}
          />
        ) : null}

        <div className="order-form__footer">
          <button type="button" className="orders__add" onClick={advance}>
            <Check size={16} strokeWidth={2.5} />
            Avançar
          </button>
        </div>
      </section>

      {originModal ? (
        <Modal title="Cadastrar origem" onClose={() => setOriginModal('')}>
          <p className="order-modal__lead">Você está prestes a cadastrar uma nova opção de origem.</p>
          <strong className="order-modal__emph">{originModal}</strong>
          <div className="order-modal__actions">
            <button type="button" className="order-btn order-btn--ghost" onClick={() => setOriginModal('')}>
              <X size={14} /> Cancelar
            </button>
            <button
              type="button"
              className="order-btn order-btn--primary"
              onClick={() => {
                addOrderOrigin(originModal)
                setOrigins(listOrderOrigins())
                setOrigin(originModal)
                setOriginOpen(false)
                setOriginModal('')
              }}
            >
              <Check size={14} /> Cadastrar
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function ClientBlock({
  draft,
  setDraft,
  touched,
  errors,
  onCepMiss,
}: {
  draft: Client
  setDraft: (client: Client) => void
  touched: boolean
  errors: { sobrenomes: boolean; documento: boolean; numero: boolean; telefone: boolean }
  onCepMiss: () => void
}) {
  const set = (patch: Partial<Client>) => setDraft({ ...draft, ...patch })
  const phone = clientPhone(draft)

  const lookupCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = (await response.json()) as { erro?: boolean; logradouro?: string; localidade?: string; uf?: string; bairro?: string }
      if (data.erro) {
        onCepMiss()
        return
      }
      set({
        cep,
        logradouro: data.logradouro || draft.logradouro,
        cidade: data.localidade || draft.cidade,
        estado: data.uf || draft.estado,
        bairro: data.bairro || draft.bairro,
      })
    } catch {
      onCepMiss()
    }
  }

  return (
    <div className="order-client">
      <h3>Informações do cliente:</h3>
      <div className="order-form__grid">
        <Field label="CPF ou CNPJ" required invalid={touched && errors.documento} error={touched && errors.documento ? '"Documento" não pode ficar em branco.' : ''}>
          <input value={draft.cpfCnpj} onChange={(event) => set({ cpfCnpj: event.target.value })} />
        </Field>
        <Field label="RG">
          <input value={draft.rg} onChange={(event) => set({ rg: event.target.value })} />
        </Field>
        <Field label="Identificação de gênero" required>
          <div className="order-radios">
            {([
              ['feminino', 'Feminino'],
              ['masculino', 'Masculino'],
              ['outros', 'Outros'],
            ] as const).map(([id, label]) => (
              <label key={id} className="order-radios__item">
                <input type="radio" checked={draft.gender === id} onChange={() => set({ gender: id })} />
                <span />
                {label}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Nome">
          <input value={draft.nome} onChange={(event) => set({ nome: event.target.value })} />
        </Field>
        <Field label="Sobrenomes" required invalid={touched && errors.sobrenomes} error={touched && errors.sobrenomes ? '"Sobrenomes" não pode ficar em branco.' : ''}>
          <input value={draft.sobrenomes} onChange={(event) => set({ sobrenomes: event.target.value })} />
        </Field>
        <Field label="Como quer ser chamado">
          <input value={draft.chamado} onChange={(event) => set({ chamado: event.target.value })} />
        </Field>
        <Field label="Email">
          <input value={draft.email} onChange={(event) => set({ email: event.target.value })} />
        </Field>
        <Field label="Facebook">
          <input value={draft.facebook} onChange={(event) => set({ facebook: event.target.value })} />
        </Field>
        <Field label="Instagram">
          <input value={draft.instagram} onChange={(event) => set({ instagram: event.target.value })} />
        </Field>
        <Field label="Data de nascimento">
          <input type="date" value={draft.birthDate} onChange={(event) => set({ birthDate: event.target.value })} />
        </Field>
        <Field label="Telefone" required invalid={touched && errors.telefone} error={touched && errors.telefone ? '"Telefone" não pode ficar em branco.' : ''}>
          <input
            value={phone}
            placeholder="(00) 00000-0000"
            onChange={(event) => {
              const phones = draft.phones.length ? [...draft.phones] : [{ number: '', primary: true, whatsapp: true }]
              phones[0] = { ...phones[0], number: event.target.value }
              set({ phones })
            }}
          />
          <label className="order-check">
            <input
              type="checkbox"
              checked={draft.phones[0]?.primary !== false}
              onChange={(event) => {
                const phones = draft.phones.length ? [...draft.phones] : [{ number: phone, primary: true, whatsapp: true }]
                phones[0] = { ...phones[0], primary: event.target.checked }
                set({ phones })
              }}
            />
            Telefone principal
          </label>
          <label className="order-check">
            <input
              type="checkbox"
              checked={Boolean(draft.phones[0]?.whatsapp)}
              onChange={(event) => {
                const phones = draft.phones.length ? [...draft.phones] : [{ number: phone, primary: true, whatsapp: true }]
                phones[0] = { ...phones[0], whatsapp: event.target.checked }
                set({ phones })
              }}
            />
            Tem WhatsApp
          </label>
        </Field>
      </div>

      <h3>Endereço:</h3>
      <div className="order-form__grid">
        <Field label="CEP">
          <input
            value={draft.cep}
            onChange={(event) => set({ cep: event.target.value })}
            onBlur={(event) => void lookupCep(event.target.value)}
          />
        </Field>
        <Field label="Logradouro" required>
          <input value={draft.logradouro} onChange={(event) => set({ logradouro: event.target.value })} />
        </Field>
        <Field label="Número" required invalid={touched && errors.numero} error={touched && errors.numero ? '"Número" não pode ficar em branco.' : ''}>
          <input value={draft.numero} onChange={(event) => set({ numero: event.target.value })} />
        </Field>
        <Field label="Complemento">
          <input value={draft.complemento} onChange={(event) => set({ complemento: event.target.value })} />
        </Field>
        <Field label="Estado" required>
          <input value={draft.estado} onChange={(event) => set({ estado: event.target.value })} />
        </Field>
        <Field label="Cidade" required>
          <input value={draft.cidade} onChange={(event) => set({ cidade: event.target.value })} />
        </Field>
        <Field label="Bairro" required>
          <input value={draft.bairro} onChange={(event) => set({ bairro: event.target.value })} />
        </Field>
      </div>

      <h3>Notificações:</h3>
      <label className="order-switch">
        <input type="checkbox" checked={draft.notifyEmail} onChange={(event) => set({ notifyEmail: event.target.checked })} />
        <span />
        Email
      </label>

      <h3>Informações extras:</h3>
      <div className="order-measures">
        <span>Medidas do cliente</span>
        <button
          type="button"
          className="order-link"
          onClick={() => set({ measures: [...(draft.measures || []), { type: '', value: '' }] })}
        >
          + Adicionar outra medida
        </button>
        {(draft.measures || []).map((measure, index) => (
          <div key={`${measure.type}-${index}`} className="order-measure">
            <input
              placeholder="Qual medida"
              value={measure.type}
              onChange={(event) => {
                const measures = [...draft.measures]
                measures[index] = { ...measure, type: event.target.value }
                set({ measures })
              }}
            />
            <input
              value={measure.value}
              onChange={(event) => {
                const measures = [...draft.measures]
                measures[index] = { ...measure, value: event.target.value }
                set({ measures })
              }}
            />
            <button
              type="button"
              className="orders__icon-btn is-danger"
              aria-label="Remover medida"
              onClick={() => set({ measures: (draft.measures || []).filter((_, item) => item !== index) })}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <Field label="Observações">
        <textarea rows={3} value={draft.observacoes} onChange={(event) => set({ observacoes: event.target.value })} />
      </Field>
    </div>
  )
}

function DatesStep({ order }: { order: Order }) {
  const navigate = useNavigate()
  const [eventDate, setEventDate] = useState(order.eventDate)
  const [fittingDate, setFittingDate] = useState(order.fittingDate)
  const [pickupDate, setPickupDate] = useState(order.pickupDate)
  const [returnDate, setReturnDate] = useState(order.returnDate)
  const [fittingTime, setFittingTime] = useState(order.fittingTime)
  const [pickupTime, setPickupTime] = useState(order.pickupTime)
  const [returnTime, setReturnTime] = useState(order.returnTime)
  const [agenda, setAgenda] = useState<'fitting' | 'pickup' | 'return' | null>(null)
  const [eventModal, setEventModal] = useState(false)
  const [eventName, setEventName] = useState('')
  const [touched, setTouched] = useState(false)
  const missing = !eventDate || !fittingDate || !pickupDate || !returnDate

  const saveDates = () =>
    patchOrder(order.id, { eventDate, fittingDate, pickupDate, returnDate, fittingTime, pickupTime, returnTime })

  return (
    <div className="orders">
      <section className="orders__card order-form">
        <header className="order-form__head">
          <div>
            <h2>Pedido {order.number}</h2>
            <p>
              {order.operation} do {order.clientName.split(' ')[0]}
            </p>
          </div>
          <button
            type="button"
            className="order-btn order-btn--danger-line"
            onClick={() => {
              cancelOrder(order.id)
              navigate('/pedidos')
            }}
          >
            Anular pedido
          </button>
        </header>
        <h3>Datas do pedido:</h3>
        <div className="order-form__grid">
          <Field label="Data do evento" required invalid={touched && !eventDate}>
            <input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
          </Field>
          <div className="order-form__side">
            <button type="button" className="order-link" onClick={() => setEventModal(true)}>
              + vincular um evento
            </button>
          </div>
          <Field label="Data da prova" required invalid={touched && !fittingDate}>
            <input type="date" value={fittingDate} onChange={(event) => setFittingDate(event.target.value)} />
          </Field>
          <div className="order-form__side">
            <button type="button" className="order-link" onClick={() => setAgenda(agenda === 'fitting' ? null : 'fitting')}>
              + marcar prova na agenda
            </button>
          </div>
          {agenda === 'fitting' ? (
            <AgendaBox
              title="Informações da prova na agenda:"
              time={fittingTime}
              setTime={setFittingTime}
              label="Título na agenda"
              defaultTitle={`Prova • ${order.clientName}`}
              onClose={() => setAgenda(null)}
            />
          ) : null}
          <Field label="Data de retirada" required invalid={touched && !pickupDate}>
            <input type="date" value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} />
          </Field>
          <div className="order-form__side">
            <button type="button" className="order-link" onClick={() => setAgenda(agenda === 'pickup' ? null : 'pickup')}>
              + marcar retirada na agenda
            </button>
          </div>
          {agenda === 'pickup' ? (
            <AgendaBox
              title="Informações da retirada na agenda:"
              time={pickupTime}
              setTime={setPickupTime}
              label="Título na agenda"
              defaultTitle={`Retirada • ${order.clientName}`}
              onClose={() => setAgenda(null)}
            />
          ) : null}
          <Field label="Data de devolução" required invalid={touched && !returnDate}>
            <input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} />
          </Field>
          <div className="order-form__side">
            <button type="button" className="order-link" onClick={() => setAgenda(agenda === 'return' ? null : 'return')}>
              + marcar devolução na agenda
            </button>
          </div>
          {agenda === 'return' ? (
            <AgendaBox
              title="Informações da devolução na agenda:"
              time={returnTime}
              setTime={setReturnTime}
              label="Título na agenda"
              defaultTitle={`Devolução • ${order.clientName}`}
              onClose={() => setAgenda(null)}
            />
          ) : null}
        </div>
        <div className="order-form__footer">
          <button
            type="button"
            className="orders__add"
            onClick={() => {
              setTouched(true)
              if (missing) return
              saveDates()
              navigate(`/pedidos/${order.id}/itens`)
            }}
          >
            <Check size={16} strokeWidth={2.5} />
            Avançar
          </button>
        </div>
      </section>
      {eventModal ? (
        <Modal title="Vincular evento" onClose={() => setEventModal(false)}>
          <Field label="Data">
            <input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
          </Field>
          <Field label="Nome do evento">
            <input value={eventName} onChange={(event) => setEventName(event.target.value)} />
          </Field>
          <div className="order-modal__actions">
            <button type="button" className="order-btn order-btn--ghost" onClick={() => setEventModal(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="order-btn order-btn--primary"
              onClick={() => {
                if (eventName.trim()) patchOrder(order.id, { notes: eventName.trim(), eventDate })
                setEventModal(false)
              }}
            >
              <Check size={14} /> Vincular
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function AgendaBox({
  title,
  time,
  setTime,
  label,
  defaultTitle,
  onClose,
}: {
  title: string
  time: string
  setTime: (value: string) => void
  label: string
  defaultTitle: string
  onClose: () => void
}) {
  return (
    <div className="order-agenda">
      <div className="order-agenda__head">
        <h4>{title}</h4>
        <button type="button" className="order-btn order-btn--danger-line" onClick={onClose}>
          não marcar na agenda
        </button>
      </div>
      <Field label="Horário" required>
        <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
      </Field>
      <Field label={label} required>
        <input defaultValue={defaultTitle} />
      </Field>
      <Field label="Observações na agenda">
        <textarea rows={2} />
      </Field>
      <Field label="Responsáveis">
        <input defaultValue={getUserProfile().chamado || getUserProfile().nome} readOnly />
      </Field>
    </div>
  )
}

function ItemsStep({ order }: { order: Order }) {
  const navigate = useNavigate()
  const products = listProducts().filter((item) => item.status === 'ativo' && !item.sold)
  const [type, setType] = useState('Todos tipos')
  const [term, setTerm] = useState('')
  const [applied, setApplied] = useState({ type: 'Todos tipos', term: '' })
  const [toast, setToast] = useState('')
  const types = useMemo(() => ['Todos tipos', ...Array.from(new Set(products.map((item) => item.type).filter(Boolean)))], [products])
  const visible = products.filter((item) => {
    if (applied.type !== 'Todos tipos' && item.type !== applied.type) return false
    const q = applied.term.trim().toLocaleLowerCase('pt-BR')
    if (!q) return true
    return `${item.fullCode} ${item.name} ${item.color} ${item.size}`.toLocaleLowerCase('pt-BR').includes(q)
  })
  const selectedIds = new Set(order.lines.map((line) => line.productId))

  const toggle = (product: Product) => {
    const exists = order.lines.find((line) => line.productId === product.id)
    if (exists) {
      patchOrder(order.id, { lines: order.lines.filter((line) => line.productId !== product.id) })
      setToast('Produto removido do pedido.')
      window.setTimeout(() => setToast(''), 1800)
      return
    }
    const line: OrderLine = {
      id: crypto.randomUUID(),
      productId: product.id,
      code: product.fullCode || '—',
      name: product.name,
      size: product.size,
      price: productPrice(product, order.operation),
      status: 'Aguardando prova',
    }
    patchOrder(order.id, { lines: [...order.lines, line] })
  }

  const money = orderMoney(order)

  return (
    <div className="orders">
      {toast ? <p className="order-toast">{toast}</p> : null}
      <section className={`orders__card order-items${order.lines.length ? ' has-cart' : ''}`}>
        <header className="order-form__head">
          <h2>Itens do pedido {order.number}</h2>
          <button type="button" className="order-btn order-btn--ghost" onClick={() => navigate(`/pedidos/${order.id}/datas`)}>
            <ArrowLeft size={14} /> Voltar
          </button>
        </header>
        <div className="order-items__search">
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {types.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <label className="orders__search">
            <Search size={16} />
            <input value={term} placeholder="Buscar produto" onChange={(event) => setTerm(event.target.value)} />
          </label>
          <button type="button" className="order-link" onClick={() => { setType('Todos tipos'); setTerm(''); setApplied({ type: 'Todos tipos', term: '' }) }}>
            Limpar
          </button>
          <button type="button" className="orders__add" onClick={() => setApplied({ type, term })}>
            Buscar
          </button>
        </div>
        <div className="order-items__layout">
          <div className="order-items__grid">
            {visible.length === 0 ? (
              <p className="orders__empty">Nenhum produto encontrado com os critérios selecionados.</p>
            ) : (
              visible.map((product) => {
                const added = selectedIds.has(product.id)
                const price = productPrice(product, order.operation)
                return (
                  <article key={product.id} className="order-card">
                    <div className="order-card__photo" style={{ background: swatch(product.color) }} />
                    <div className="order-card__body">
                      <strong>{product.fullCode || '—'}</strong>
                      <span>{product.name}</span>
                      <small>Tamanho: {product.size || '—'}</small>
                      <small>Preço: {formatBrl(price)}</small>
                    </div>
                    <button type="button" className={added ? 'order-card__remove' : 'order-card__add'} onClick={() => toggle(product)}>
                      {added ? 'X REMOVER' : '+ ADICIONAR'}
                    </button>
                  </article>
                )
              })
            )}
          </div>
          {order.lines.length ? (
            <aside className="order-cart">
              <h3>Produtos do pedido</h3>
              <ul>
                {order.lines.map((line) => (
                  <li key={line.id}>
                    <div>
                      <strong>
                        {line.code} — {line.name}
                      </strong>
                      <span>{formatBrl(line.price)}</span>
                    </div>
                    <button type="button" aria-label="Remover" onClick={() => toggle({ id: line.productId } as Product)}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <p>
                Total <strong>{formatBrl(money.total)}</strong>
              </p>
              <button type="button" className="orders__add" onClick={() => navigate(`/pedidos/${order.id}`)}>
                <Check size={16} /> Confirmar produtos e avançar
              </button>
            </aside>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function swatch(color: string) {
  const name = color.toLocaleLowerCase('pt-BR')
  if (name.includes('azul')) return '#1b3a6b'
  if (name.includes('preto')) return '#1e1e2d'
  if (name.includes('cinza')) return '#7e8299'
  if (name.includes('branco') || name.includes('off')) return '#f3f0e8'
  return '#d7dde8'
}

function DetailStep({ order }: { order: Order }) {
  const navigate = useNavigate()
  const cancelled = order.status === 'Cancelado' || order.status === 'Anulado'
  const money = orderMoney(order)
  const [notes, setNotes] = useState(order.notes)
  const [suitNotes, setSuitNotes] = useState(order.suitNotes)
  const [toast, setToast] = useState('')
  const [includeOpen, setIncludeOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [carneOpen, setCarneOpen] = useState(false)
  const [contractOpen, setContractOpen] = useState(false)
  const [menuLine, setMenuLine] = useState<string | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [removeLine, setRemoveLine] = useState<OrderLine | null>(null)
  const [priceLine, setPriceLine] = useState<OrderLine | null>(null)
  const [copied, setCopied] = useState(false)

  const flash = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  const setLines = (lines: OrderLine[]) => patchOrder(order.id, { lines })

  return (
    <div className="orders order-detail">
      {toast ? <p className="order-toast">{toast}</p> : null}
      <div className="order-detail__main">
        <header className="order-detail__title">
          <div>
            <h2>Pedido de {order.operation.toLocaleLowerCase('pt-BR')}</h2>
            <p>Pedido criado em {createdLabel(order.createdAt)}.</p>
          </div>
          <button type="button" className="order-btn order-btn--ghost" aria-label="Alertas" onClick={() => flash('Nenhum alerta pendente.')}>
            <Bell size={16} />
          </button>
        </header>
        <ol className="order-timeline">
          <li>
            <strong>Prova</strong>
            <span>{shortMonth(order.fittingDate)}</span>
          </li>
          <li>
            <strong>Retirada</strong>
            <span>{shortMonth(order.pickupDate)}</span>
          </li>
          <li className="is-event">
            <strong>Evento</strong>
            <span>{shortMonth(order.eventDate)}</span>
          </li>
          <li>
            <strong>Devolução</strong>
            <span>{shortMonth(order.returnDate)}</span>
          </li>
        </ol>

        <section className="order-panel">
          <header>
            <h3>Produtos do pedido</h3>
            {cancelled ? null : (
              <button type="button" className="orders__add" onClick={() => setIncludeOpen(true)}>
                Incluir produto
              </button>
            )}
          </header>
          {order.lines.length === 0 ? (
            <p className="orders__empty">Nenhum produto neste pedido.</p>
          ) : (
            <table className="orders__table order-lines">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Valor</th>
                  <th>
                    {cancelled ? null : (
                      <select
                        aria-label="Status em massa"
                        defaultValue=""
                        onChange={(event) => {
                          const status = event.target.value as OrderLineStatus
                          if (!status) return
                          setLines(order.lines.map((line) => ({ ...line, status })))
                        }}
                      >
                        <option value="">Status em massa</option>
                        {LINE_STATUSES.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    )}
                  </th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <div className="order-line">
                        <span className="order-line__swatch" />
                        <span>
                          {line.code} — {line.name}
                          {line.size ? ` · ${line.size}` : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      {formatBrl(line.price)}
                      {cancelled ? null : (
                        <button type="button" className="order-link" onClick={() => setPriceLine(line)}>
                          $
                        </button>
                      )}
                    </td>
                    <td>
                      {cancelled ? (
                        line.status
                      ) : (
                        <select
                          value={line.status}
                          onChange={(event) =>
                            setLines(order.lines.map((item) => (item.id === line.id ? { ...item, status: event.target.value as OrderLineStatus } : item)))
                          }
                        >
                          {LINE_STATUSES.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {cancelled ? null : (
                        <button type="button" className="orders__icon-btn" aria-label="Ações do produto" onClick={() => setMenuLine(menuLine === line.id ? null : line.id)}>
                          <ChevronDown size={14} />
                        </button>
                      )}
                      {menuLine === line.id ? (
                        <div className="order-menu">
                          <button type="button" onClick={() => { setRemoveLine(line); setMenuLine(null) }}>
                            Remover do pedido
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="order-panel">
          <header>
            <h3>Pagamentos</h3>
            {cancelled ? null : (
              <button type="button" className="orders__add" onClick={() => setPayOpen(true)}>
                Novo pagamento
              </button>
            )}
          </header>
          {order.payments.length === 0 ? <p>Nenhum pagamento realizado ainda...</p> : (
            <ul className="order-paylist">
              {order.payments.map((payment) => (
                <li key={payment.id}>
                  <span>{payment.method}</span>
                  <span>{formatBrDate(payment.date)}</span>
                  <strong>{formatBrl(payment.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="order-panel">
          <header>
            <h3>Carnês</h3>
            {cancelled ? null : (
              <button type="button" className="orders__add" onClick={() => setCarneOpen(true)}>
                Gerar carnê
              </button>
            )}
          </header>
          {order.installments.length === 0 ? <p>Nenhum carnê gerado para este pedido.</p> : (
            <ul className="order-paylist">
              {order.installments.map((item) => (
                <li key={item.id}>
                  <span>Parcela {item.number}</span>
                  <span>{formatBrDate(item.dueDate)}</span>
                  <strong>{formatBrl(item.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="order-panel">
          <h3>Observações</h3>
          <Field label="Observações do pedido">
            <textarea rows={3} value={notes} disabled={cancelled} onChange={(event) => setNotes(event.target.value)} />
          </Field>
          <Field label="Observações do traje">
            <textarea rows={3} value={suitNotes} disabled={cancelled} onChange={(event) => setSuitNotes(event.target.value)} />
          </Field>
          {cancelled ? null : (
            <button
              type="button"
              className="orders__add"
              onClick={() => {
                patchOrder(order.id, { notes, suitNotes })
                flash('Observações salvas')
              }}
            >
              Salvar observações
            </button>
          )}
        </section>
      </div>

      <aside className={`order-summary${cancelled ? ' is-cancelled' : ''}`}>
        <div className="order-summary__hero">
          <div>
            <strong>{order.number}</strong>
            <span>Pedido de {order.operation}</span>
            <button
              type="button"
              className="order-summary__client"
              onClick={() => {
                void navigator.clipboard?.writeText(order.clientName)
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1200)
              }}
            >
              {order.clientName} <Copy size={12} />
            </button>
            {copied ? <small>Copiado</small> : null}
            {order.phone ? (
              <span className="orders__phone">
                <MessageCircle size={12} /> {order.phone}
              </span>
            ) : null}
            <span>Atendido por {order.attendant || '—'}</span>
          </div>
          {cancelled ? (
            <button type="button" className="order-link" onClick={() => navigate('/historicos')}>
              Histórico do pedido
            </button>
          ) : (
            <button type="button" className="order-btn order-btn--ghost" onClick={() => setActionsOpen((open) => !open)}>
              Ações do pedido
            </button>
          )}
          {actionsOpen ? (
            <div className="order-menu order-menu--summary">
              <button type="button" onClick={() => { setContractOpen(true); setActionsOpen(false) }}>
                Imprimir contrato
              </button>
              <button type="button" onClick={() => { navigate('/historicos'); setActionsOpen(false) }}>
                Histórico do pedido
              </button>
            </div>
          ) : null}
        </div>
        <dl>
          <div>
            <dt>Total</dt>
            <dd>{formatBrl(money.total)}</dd>
          </div>
          {cancelled ? (
            <div>
              <dt>Pagamentos</dt>
              <dd>{money.paid > 0 ? formatBrl(money.paid) : 'Nenhum pagamento realizado'}</dd>
            </div>
          ) : (
            <div className="is-balance">
              <dt>Saldo aberto</dt>
              <dd>{formatBrl(money.balance)}</dd>
            </div>
          )}
        </dl>
        {cancelled ? (
          <button type="button" className="order-btn order-btn--ghost" onClick={() => setContractOpen(true)}>
            <Printer size={14} /> Imprimir contrato
          </button>
        ) : (
          <div className="order-summary__actions">
            <button type="button" className="order-btn order-btn--pay" onClick={() => setPayOpen(true)}>
              $ Novo pagamento
            </button>
            <button type="button" className="order-btn order-btn--ghost" onClick={() => setDiscountOpen(true)}>
              % Conceder desconto
            </button>
            <button type="button" className="order-btn order-btn--ghost" onClick={() => setContractOpen(true)}>
              <Printer size={14} /> Imprimir contrato
            </button>
            <button type="button" className="order-btn order-btn--danger" onClick={() => setCancelOpen(true)}>
              Cancelar pedido
            </button>
          </div>
        )}
      </aside>

      {includeOpen ? (
        <ProductPicker
          order={order}
          onClose={() => setIncludeOpen(false)}
          onAdd={(product) => {
            if (order.lines.some((line) => line.productId === product.id)) return
            const line: OrderLine = {
              id: crypto.randomUUID(),
              productId: product.id,
              code: product.fullCode || '—',
              name: product.name,
              size: product.size,
              price: productPrice(product, order.operation),
              status: 'Aguardando prova',
            }
            setLines([...order.lines, line])
          }}
        />
      ) : null}

      {payOpen ? (
        <PaymentModal
          balance={money.balance}
          onClose={() => setPayOpen(false)}
          onSave={(payment) => {
            patchOrder(order.id, { payments: [...order.payments, payment] })
            setPayOpen(false)
            flash('Pagamento registrado')
          }}
        />
      ) : null}

      {discountOpen ? (
        <DiscountModal
          current={order.discount}
          max={money.subtotal}
          onClose={() => setDiscountOpen(false)}
          onSave={(discount) => {
            patchOrder(order.id, { discount })
            setDiscountOpen(false)
          }}
        />
      ) : null}

      {carneOpen ? (
        <CarneModal
          balance={money.balance}
          onClose={() => setCarneOpen(false)}
          onSave={(count) => {
            const amount = Math.round((money.balance / count) * 100) / 100
            const base = order.eventDate ? new Date(`${order.eventDate}T12:00:00`) : new Date()
            const installments = Array.from({ length: count }, (_, index) => {
              const due = new Date(base)
              due.setMonth(due.getMonth() + index)
              const iso = due.toISOString().slice(0, 10)
              return { id: crypto.randomUUID(), number: index + 1, dueDate: iso, amount }
            })
            patchOrder(order.id, { installments })
            setCarneOpen(false)
          }}
        />
      ) : null}

      {cancelOpen ? (
        <Modal title="Cancelar pedido?" onClose={() => (canceling ? undefined : setCancelOpen(false))}>
          <p className="order-modal__lead">Você está prestes a cancelar este pedido. Observe que esta ação não poderá ser revertida.</p>
          <div className="order-modal__actions">
            {canceling ? null : (
              <button type="button" className="order-btn order-btn--ghost" onClick={() => setCancelOpen(false)}>
                Não cancelar
              </button>
            )}
            <button
              type="button"
              className="order-btn order-btn--danger"
              onClick={() => {
                setCanceling(true)
                window.setTimeout(() => {
                  cancelOrder(order.id)
                  setCancelOpen(false)
                  setCanceling(false)
                }, 500)
              }}
            >
              {canceling ? 'Cancelando. Aguarde...' : 'Cancelar pedido'}
            </button>
          </div>
        </Modal>
      ) : null}

      {removeLine ? (
        <Modal title="Remover produto?" onClose={() => setRemoveLine(null)}>
          <p className="order-modal__lead">
            Remover {removeLine.name} deste pedido?
          </p>
          <div className="order-modal__actions">
            <button type="button" className="order-btn order-btn--ghost" onClick={() => setRemoveLine(null)}>
              Não
            </button>
            <button
              type="button"
              className="order-btn order-btn--danger"
              onClick={() => {
                setLines(order.lines.filter((line) => line.id !== removeLine.id))
                setRemoveLine(null)
                flash('Produto removido do pedido.')
              }}
            >
              Sim, remover
            </button>
          </div>
        </Modal>
      ) : null}

      {priceLine ? (
        <PriceModal
          line={priceLine}
          onClose={() => setPriceLine(null)}
          onSave={(price) => {
            setLines(order.lines.map((line) => (line.id === priceLine.id ? { ...line, price } : line)))
            setPriceLine(null)
          }}
        />
      ) : null}

      {contractOpen ? (
        <Modal title="Contrato" onClose={() => setContractOpen(false)}>
          <div className="order-contract">
            <p>
              Pedido {order.number} · {order.operation}
            </p>
            <p>Cliente: {order.clientName}</p>
            <p>Evento: {formatBrDate(order.eventDate) || '—'}</p>
            <ul>
              {order.lines.map((line) => (
                <li key={line.id}>
                  {line.code} {line.name} — {formatBrl(line.price)}
                </li>
              ))}
            </ul>
            <strong>Total {formatBrl(money.total)}</strong>
          </div>
          <div className="order-modal__actions">
            <button type="button" className="order-btn order-btn--primary" onClick={() => window.print()}>
              <Printer size={14} /> Imprimir
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function ProductPicker({
  order,
  onClose,
  onAdd,
}: {
  order: Order
  onClose: () => void
  onAdd: (product: Product) => void
}) {
  const products = listProducts().filter((item) => item.status === 'ativo' && !item.sold)
  const [term, setTerm] = useState('')
  const [type, setType] = useState('')
  const visible = products.filter((item) => {
    if (type && item.type !== type) return false
    const q = term.trim().toLocaleLowerCase('pt-BR')
    if (!q) return true
    return `${item.name} ${item.fullCode} ${item.color} ${item.size}`.toLocaleLowerCase('pt-BR').includes(q)
  })
  const types = Array.from(new Set(products.map((item) => item.type).filter(Boolean)))
  return (
    <Modal title="Incluir produto" wide onClose={onClose}>
      <div className="order-picker">
        <aside>
          <Field label="Tipos">
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="">Todos</option>
              {types.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Termo">
            <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Nome ou código" />
          </Field>
        </aside>
        <div>
          {visible.length === 0 ? (
            <p className="order-alert">Nenhum produto encontrado com os critérios selecionados.</p>
          ) : (
            visible.map((product) => {
              const added = order.lines.some((line) => line.productId === product.id)
              return (
                <div key={product.id} className="order-picker__row">
                  <span>
                    {product.fullCode} — {product.name}
                  </span>
                  <span>{formatBrl(productPrice(product, order.operation))}</span>
                  <button type="button" className="order-btn order-btn--primary" disabled={added} onClick={() => onAdd(product)}>
                    {added ? 'Adicionado' : 'Adicionar'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}

function PaymentModal({
  balance,
  onClose,
  onSave,
}: {
  balance: number
  onClose: () => void
  onSave: (payment: { id: string; method: string; amount: number; date: string }) => void
}) {
  const [method, setMethod] = useState('PIX')
  const [amount, setAmount] = useState(balance > 0 ? balance.toFixed(2).replace('.', ',') : '')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')
  return (
    <Modal title="Novo pagamento" onClose={onClose}>
      <p className="order-modal__lead">Método de pagamento</p>
      <div className="order-methods">
        {PAY_METHODS.map((item) => (
          <button key={item} type="button" className={method === item ? 'is-on' : ''} onClick={() => setMethod(item)}>
            {item}
          </button>
        ))}
      </div>
      <Field label="Data efetiva">
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </Field>
      <Field label="Valor" required error={error}>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} />
      </Field>
      <div className="order-modal__actions">
        <button type="button" className="order-btn order-btn--ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="order-btn order-btn--primary"
          onClick={() => {
            const value = moneyBrToNumber(amount)
            if (!value) {
              setError('Informe o valor.')
              return
            }
            onSave({ id: crypto.randomUUID(), method, amount: value, date })
          }}
        >
          Salvar
        </button>
      </div>
    </Modal>
  )
}

function DiscountModal({
  current,
  max,
  onClose,
  onSave,
}: {
  current: number
  max: number
  onClose: () => void
  onSave: (value: number) => void
}) {
  const [amount, setAmount] = useState(current ? current.toFixed(2).replace('.', ',') : '')
  return (
    <Modal title="Conceder desconto" onClose={onClose}>
      <Field label="Valor" required>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" />
      </Field>
      <div className="order-modal__actions">
        {current > 0 ? (
          <button type="button" className="order-btn order-btn--danger" onClick={() => onSave(0)}>
            Remover desconto
          </button>
        ) : null}
        <button type="button" className="order-btn order-btn--ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="order-btn order-btn--primary"
          onClick={() => onSave(Math.min(max, moneyBrToNumber(amount)))}
        >
          Salvar
        </button>
      </div>
    </Modal>
  )
}

function CarneModal({
  balance,
  onClose,
  onSave,
}: {
  balance: number
  onClose: () => void
  onSave: (count: number) => void
}) {
  const [count, setCount] = useState('2')
  return (
    <Modal title="Gerar carnê" onClose={onClose}>
      <p className="order-modal__lead">Saldo aberto {formatBrl(balance)}. Em quantas parcelas?</p>
      <Field label="Parcelas">
        <input value={count} onChange={(event) => setCount(event.target.value.replace(/\D/g, '').slice(0, 2))} />
      </Field>
      <div className="order-modal__actions">
        <button type="button" className="order-btn order-btn--ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="order-btn order-btn--primary"
          onClick={() => {
            const value = Number(count)
            if (value >= 1 && balance > 0) onSave(value)
          }}
        >
          Gerar
        </button>
      </div>
    </Modal>
  )
}

function PriceModal({
  line,
  onClose,
  onSave,
}: {
  line: OrderLine
  onClose: () => void
  onSave: (price: number) => void
}) {
  const [mode, setMode] = useState<'Desconto' | 'Acréscimo'>('Desconto')
  const [amount, setAmount] = useState('')
  return (
    <Modal title="Negociações do produto" onClose={onClose}>
      <p>
        {line.code} — {line.name}
      </p>
      <div className="order-radios">
        {(['Desconto', 'Acréscimo'] as const).map((item) => (
          <label key={item} className="order-radios__item">
            <input type="radio" checked={mode === item} onChange={() => setMode(item)} />
            <span />
            {item}
          </label>
        ))}
      </div>
      <Field label="Valor" required>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} />
      </Field>
      <div className="order-modal__actions">
        <button type="button" className="order-btn order-btn--ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="order-btn order-btn--primary"
          onClick={() => {
            const value = moneyBrToNumber(amount)
            const next = mode === 'Desconto' ? Math.max(0, line.price - value) : line.price + value
            onSave(next)
          }}
        >
          Aplicar
        </button>
      </div>
    </Modal>
  )
}

function Field({
  label,
  required,
  invalid,
  error,
  children,
}: {
  label: string
  required?: boolean
  invalid?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <label className={`order-field${invalid ? ' is-invalid' : ''}`}>
      <span>
        {label}
        {required ? <i>*</i> : null}
      </span>
      {children}
      {error ? <small>{error}</small> : null}
    </label>
  )
}

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className="orders-modal" role="presentation" onMouseDown={onClose}>
      <div
        className={`orders-modal__dialog${wide ? ' is-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="orders-modal__header">
          <h2>{title}</h2>
          <button type="button" className="orders-modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        <div className="orders-modal__body">{children}</div>
      </div>
    </div>
  )
}
