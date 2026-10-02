import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ClipboardList,
  DollarSign,
  MessageSquare,
  MoreHorizontal,
  Package,
  Pencil,
  Percent,
  Plus,
  Printer,
  ShoppingCart,
  Star,
  Undo2,
  User,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useOrders } from '../hooks/useOrders'
import { moneyBrToNumber, maskMoneyBr } from '../lib/moneyMask'
import {
  patchOrder,
  type Order,
  type OrderLine,
  type OrderLineStatus,
  type OrderPayment,
} from '../lib/ordersStore'
import { listProducts, type Product } from '../lib/productsStore'
import './OrderView.css'

const LINE_STATUSES: OrderLineStatus[] = [
  'Aguardando prova',
  'Aguardando retirada',
  'Retirado',
  'Devolvido',
]

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const MONTHS_SHORT = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']

const PAY_METHODS = ['Boleto', 'Crédito', 'Débito', 'Cheque', 'Depósito', 'Dinheiro', 'Pix']

function whatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return '#'
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.3-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3A9 9 0 0 1 12 21zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.4.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.6-.5h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.6 11.4 11.4 0 0 0 4.4 3.9 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3z"
      />
    </svg>
  )
}

function formatBrl(value: number) {
  const negative = value < 0
  const [intPart, decPart] = Math.abs(value).toFixed(2).split('.')
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${negative ? '-' : ''}R$ ${withDots},${decPart}`
}

function createdLabel(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `Pedido criado em ${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`
}

function shortDate(iso: string | undefined) {
  if (!iso) return 'sem data'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return 'sem data'
  return `${d} ${MONTHS_SHORT[Number(m) - 1] || ''}`
}

function lineTotal(line: OrderLine) {
  return (Number(line.value) || 0) + (Number(line.adjustment) || 0)
}

function orderTitle(order: Order) {
  if (order.kind === 'Orçamento') return 'Orçamento'
  return order.operation === 'Venda' ? 'Pedido de venda' : 'Pedido de aluguel'
}

export function OrderView() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const orders = useOrders()
  const order = orders.find((item) => item.id === orderId)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [massOpen, setMassOpen] = useState(false)
  const [lineMenu, setLineMenu] = useState<string | null>(null)
  const [includeOpen, setIncludeOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [datesOpen, setDatesOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [payMethod, setPayMethod] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState('')
  const [payError, setPayError] = useState('')
  const [payWarn, setPayWarn] = useState(false)
  const [discountValue, setDiscountValue] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [suitDraft, setSuitDraft] = useState('')
  const [notesOn, setNotesOn] = useState<'order' | 'suit' | null>(null)
  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [adjustMode, setAdjustMode] = useState<'add' | 'sub'>('add')
  const [adjustValue, setAdjustValue] = useState('')

  useEffect(() => {
    if (!order) return
    document.title = `Pedido ${order.number}`
    setNoteDraft(order.orderNotes || '')
    setSuitDraft(order.suitNotes || '')
    setDiscountValue(order.discount ? maskMoneyBr(String(Math.round(order.discount * 100))) : '')
  }, [order?.id])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const lines = order?.lines || []
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + lineTotal(line), 0), [lines])
  const discount = order?.discount || 0
  const total = Math.max(0, subtotal - discount)
  const paid = (order?.payments || []).reduce((sum, item) => sum + item.amount, 0)
  const balance = Math.max(0, total - paid)
  const cancelled = order?.status === 'Cancelado' || order?.status === 'Anulado'

  if (!order) {
    return (
      <div className="ov-missing">
        <p>Pedido não encontrado.</p>
        <button type="button" onClick={() => navigate('/pedidos')}>
          Todos pedidos
        </button>
      </div>
    )
  }

  const saveLines = (next: OrderLine[], nextTotal = total) => {
    patchOrder(order.id, { lines: next, total: formatBrl(Math.max(0, nextTotal)) })
  }

  const setAllStatus = (status: OrderLineStatus) => {
    saveLines(lines.map((line) => ({ ...line, status })))
    setMassOpen(false)
  }

  const addProduct = (product: Product) => {
    const value = moneyBrToNumber(order.operation === 'Venda' ? product.salePrice : product.rental)
    const next = [
      ...lines,
      {
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        fullCode: product.fullCode,
        value,
        size: product.size,
        status: 'Aguardando prova' as const,
        adjustment: 0,
      },
    ]
    const sum = next.reduce((acc, line) => acc + lineTotal(line), 0)
    saveLines(next, Math.max(0, sum - discount))
    setIncludeOpen(false)
    setProductQuery('')
  }

  const removeLine = (id: string | undefined) => {
    const next = lines.filter((line) => line.id !== id)
    const sum = next.reduce((acc, line) => acc + lineTotal(line), 0)
    saveLines(next, Math.max(0, sum - discount))
    setLineMenu(null)
    setToast('Produto removido do pedido.')
  }

  const savePayment = () => {
    if (!payMethod) {
      setPayError('Método de pagamento não pode ficar em branco.')
      return
    }
    if (payMethod === 'Crédito' || payMethod === 'Débito') {
      setPayWarn(true)
      return
    }
    const amount = moneyBrToNumber(payAmount)
    if (amount <= 0) return
    const payment: OrderPayment = {
      id: crypto.randomUUID(),
      method: payMethod,
      amount,
      date: payDate,
    }
    patchOrder(order.id, { payments: [...(order.payments || []), payment] })
    setPayOpen(false)
    setPayMethod('')
    setPayAmount('')
    setPayError('')
    setToast('Pagamento salvo.')
  }

  const saveDiscount = () => {
    const value = moneyBrToNumber(discountValue)
    const sum = lines.reduce((acc, line) => acc + lineTotal(line), 0)
    patchOrder(order.id, { discount: value, total: formatBrl(Math.max(0, sum - value)) })
    setDiscountOpen(false)
    setToast('Desconto geral salvo.')
  }

  const removeDiscount = () => {
    const sum = lines.reduce((acc, line) => acc + lineTotal(line), 0)
    patchOrder(order.id, { discount: 0, total: formatBrl(sum) })
    setDiscountValue('')
    setDiscountOpen(false)
    setToast('Desconto removido.')
  }

  const cancelOrder = () => {
    patchOrder(order.id, { status: 'Cancelado' })
    setCancelOpen(false)
    setToast('Pedido cancelado.')
  }

  const saveAdjust = () => {
    const amount = moneyBrToNumber(adjustValue)
    const adjustment = adjustMode === 'sub' ? -amount : amount
    const next = lines.map((line) => (line.id === adjustId ? { ...line, adjustment } : line))
    const sum = next.reduce((acc, line) => acc + lineTotal(line), 0)
    saveLines(next, Math.max(0, sum - discount))
    setAdjustId(null)
    setAdjustValue('')
    setToast('Valor do produto atualizado.')
  }

  const matches = listProducts().filter((product) => {
    const q = productQuery.trim().toLocaleLowerCase('pt-BR')
    if (!q) return product.status !== 'inativo'
    return (
      product.status !== 'inativo' &&
      (product.name.toLocaleLowerCase('pt-BR').includes(q) ||
        product.fullCode.toLocaleLowerCase('pt-BR').includes(q))
    )
  })

  return (
    <div className="ov">
      {toast ? <div className="ov-toast">{toast}</div> : null}
      <header className="ov-head">
        <div className="ov-head__titles">
          <h2>{orderTitle(order)}</h2>
          <p>{createdLabel(order.createdAt)}</p>
        </div>
        <div className="ov-head__actions">
          {!cancelled ? (
            <button
              type="button"
              className="ov-icon-btn"
              aria-label="Alertas"
              onClick={() => {
                setAlertsOpen((open) => !open)
                setActionsOpen(false)
              }}
            >
              <Bell size={16} />
            </button>
          ) : null}
          {alertsOpen ? (
            <div className="ov-popover ov-popover--alerts">
              <strong>Alertas</strong>
              <p>Alertas por e-mail</p>
              <span>{order.clientName ? 'Cliente sem e-mail cadastrado.' : 'Cliente sem e-mail cadastrado.'}</span>
              <p>Alertas por SMS</p>
              <span>Sua assinatura não prevê o envio de mensagens SMS.</span>
              <p>Alertas por WhatsApp</p>
              <span>Sua assinatura não prevê o envio de mensagens por WhatsApp.</span>
              <button type="button" onClick={() => setAlertsOpen(false)}>
                Fechar
              </button>
            </div>
          ) : null}
          {cancelled ? (
            <button type="button" className="ov-history" onClick={() => navigate('/historicos')}>
              Histórico do pedido
            </button>
          ) : (
            <div className="ov-menu-wrap">
              <button
                type="button"
                className="ov-actions"
                onClick={() => {
                  setActionsOpen((open) => !open)
                  setAlertsOpen(false)
                }}
              >
                <ClipboardList size={15} />
                Ações do pedido
              </button>
              {actionsOpen ? (
                <ul className="ov-menu">
                  <li>
                    <button type="button" onClick={() => navigate('/historicos')}>
                      Histórico do pedido
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setActionsOpen(false)}>
                      Vincular evento
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setActionsOpen(false)}>
                      Termo de retirada
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setActionsOpen(false)}>
                      Termo de devolução
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setActionsOpen(false)}>
                      Etiquetas do pedido
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setActionsOpen(false)}>
                      Nota promissória
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        patchOrder(order.id, { status: 'Adiado' })
                        setActionsOpen(false)
                        setToast('Pedido marcado como adiado.')
                      }}
                    >
                      Marcar como adiado
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          )}
        </div>
      </header>

      <div className="ov-layout">
        <div className="ov-main">
          {!cancelled ? (
            <div className="ov-times">
              <button type="button" onClick={() => setDatesOpen(true)}>
                <User size={18} />
                <span>Prova</span>
                <strong>{order.proofDate ? shortDate(order.proofDate) : 'sem data'}</strong>
              </button>
              <button type="button" onClick={() => setDatesOpen(true)}>
                <Package size={18} />
                <span>Retirada</span>
                <strong>{shortDate(order.pickupDate)}</strong>
              </button>
              <button type="button" onClick={() => setDatesOpen(true)}>
                <Star size={18} />
                <span>Evento</span>
                <strong>{shortDate(order.eventDate)}</strong>
              </button>
              <button type="button" onClick={() => setDatesOpen(true)}>
                <Undo2 size={18} />
                <span>Devolução</span>
                <strong>{shortDate(order.returnDate)}</strong>
              </button>
            </div>
          ) : null}

          <section className="ov-card">
            <header className="ov-card__head">
              <h3>
                <ShoppingCart size={16} /> Produtos do pedido
              </h3>
              {!cancelled ? (
                <button type="button" className="ov-solid" onClick={() => setIncludeOpen(true)}>
                  <Plus size={14} /> Incluir produto
                </button>
              ) : null}
            </header>
            <table className="ov-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th className="is-right">Valor</th>
                  <th>
                    Status
                    {!cancelled ? (
                      <span className="ov-mass">
                        <button type="button" onClick={() => setMassOpen((open) => !open)}>
                          Status em massa <ChevronDown size={12} />
                        </button>
                        {massOpen ? (
                          <ul>
                            {LINE_STATUSES.map((status) => (
                              <li key={status}>
                                <button type="button" onClick={() => setAllStatus(status)}>
                                  {status}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </span>
                    ) : null}
                  </th>
                  {!cancelled ? <th className="is-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={cancelled ? 3 : 4} className="ov-empty">
                      Nenhum produto neste pedido.
                    </td>
                  </tr>
                ) : (
                  lines.map((line) => (
                    <tr key={line.id || line.fullCode}>
                      <td>
                        <strong>
                          {line.fullCode ? `${line.fullCode} - ` : ''}
                          {line.name}
                        </strong>
                      </td>
                      <td className="is-right ov-value">
                        <span>{formatBrl(lineTotal(line))}</span>
                        {!cancelled ? (
                          <button
                            type="button"
                            className="ov-dollar"
                            aria-label="Ajustar valor"
                            onClick={() => {
                              setAdjustId(line.id || null)
                              setAdjustMode((line.adjustment || 0) < 0 ? 'sub' : 'add')
                              setAdjustValue(
                                line.adjustment ? maskMoneyBr(String(Math.round(Math.abs(line.adjustment) * 100))) : '',
                              )
                            }}
                          >
                            <DollarSign size={14} />
                          </button>
                        ) : null}
                      </td>
                      <td>
                        {cancelled ? (
                          line.status || 'Aguardando prova'
                        ) : (
                          <select
                            value={line.status || 'Aguardando prova'}
                            onChange={(event) => {
                              const status = event.target.value as OrderLineStatus
                              saveLines(lines.map((item) => (item.id === line.id ? { ...item, status } : item)))
                            }}
                          >
                            {LINE_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      {!cancelled ? (
                        <td className="is-right ov-line-actions">
                          <button
                            type="button"
                            aria-label="Ações do produto"
                            onClick={() => setLineMenu(lineMenu === line.id ? null : line.id || null)}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {lineMenu === line.id ? (
                            <ul>
                              <li>
                                <button type="button" onClick={() => removeLine(line.id)}>
                                  Remover do pedido
                                </button>
                              </li>
                              <li>
                                <button type="button" onClick={() => setLineMenu(null)}>
                                  Trocar produto
                                </button>
                              </li>
                              <li>
                                <button type="button" onClick={() => setLineMenu(null)}>
                                  Observações do produto
                                </button>
                              </li>
                            </ul>
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="ov-card">
            <header className="ov-card__head">
              <h3>
                <DollarSign size={16} /> Pagamentos
              </h3>
              {!cancelled ? (
                <button type="button" className="ov-solid" onClick={() => setPayOpen(true)}>
                  Novo pagamento
                </button>
              ) : null}
            </header>
            {(order.payments || []).length === 0 ? (
              <p className="ov-muted">Nenhum pagamento realizado ainda...</p>
            ) : (
              <ul className="ov-pays">
                {(order.payments || []).map((payment) => (
                  <li key={payment.id}>
                    <span>{payment.method}</span>
                    <strong>{formatBrl(payment.amount)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ov-card">
            <header className="ov-card__head">
              <h3>
                <BookOpen size={16} /> Carnês
              </h3>
              {!cancelled ? (
                <button type="button" className="ov-solid" onClick={() => setToast('Nenhum carnê gerado para este pedido.')}>
                  Gerar carnê
                </button>
              ) : null}
            </header>
            <p className="ov-muted">Nenhum carnê gerado para este pedido.</p>
          </section>

          <section className="ov-card">
            <header className="ov-card__head">
              <h3>
                <MessageSquare size={16} /> Observações
              </h3>
            </header>
            <div className="ov-notes">
              <h4>Observações do pedido</h4>
              <p className="ov-warn">Atenção: as informações inseridas aqui serão impressas no contrato.</p>
              {notesOn === 'order' && !cancelled ? (
                <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
              ) : (
                <button type="button" className="ov-note" onClick={() => !cancelled && setNotesOn('order')}>
                  {order.orderNotes || 'Nenhuma observação do pedido. Clique aqui para acrescentar.'}
                </button>
              )}
              <h4>Observações do traje</h4>
              {notesOn === 'suit' && !cancelled ? (
                <textarea value={suitDraft} onChange={(event) => setSuitDraft(event.target.value)} />
              ) : (
                <button type="button" className="ov-note" onClick={() => !cancelled && setNotesOn('suit')}>
                  {order.suitNotes || 'Nenhuma observação do traje. Clique aqui para acrescentar.'}
                </button>
              )}
              {!cancelled ? (
                <div className="ov-notes__save">
                  <button
                    type="button"
                    onClick={() => {
                      patchOrder(order.id, { orderNotes: noteDraft, suitNotes: suitDraft })
                      setNotesOn(null)
                      setToast('Observações salvas.')
                    }}
                  >
                    <Check size={15} /> Salvar observações
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="ov-side">
          <div className="ov-who">
            <strong className="ov-who__num">{order.number}</strong>
            <span className="ov-who__kind">
              {order.kind === 'Orçamento' ? 'Orçamento' : `Pedido de ${order.operation}`}
            </span>
            <span className="ov-who__name">
              {order.clientName}
              <User size={15} />
            </span>
            {order.phone ? (
              <a className="ov-who__phone" href={whatsAppHref(order.phone)} target="_blank" rel="noreferrer">
                {order.phone}
                <WhatsAppIcon />
              </a>
            ) : null}
            {order.attendant ? (
              <span className="ov-who__att">
                Atendido por {order.attendant}
                <Pencil size={13} />
              </span>
            ) : null}
          </div>
          <div className="ov-money">
            <div>
              <span>Total</span>
              <strong>{formatBrl(total)}</strong>
            </div>
            {discount > 0 ? (
              <>
                <div>
                  <span>Subtotal</span>
                  <strong>{formatBrl(subtotal)}</strong>
                </div>
                <div>
                  <span>Descontos</span>
                  <strong>- {formatBrl(discount)}</strong>
                </div>
              </>
            ) : null}
            {cancelled ? (
              <div>
                <span>Nenhum pagamento realizado</span>
                <strong>{formatBrl(total)}</strong>
              </div>
            ) : (
              <div>
                <span className="is-open">Saldo aberto</span>
                <strong className="is-due">{formatBrl(balance)}</strong>
              </div>
            )}
          </div>
          <div className="ov-side__buttons">
            {!cancelled ? (
              <button type="button" className="is-pay" onClick={() => setPayOpen(true)}>
                <DollarSign size={15} /> Novo pagamento
              </button>
            ) : null}
            {!cancelled ? (
              <button type="button" onClick={() => setDiscountOpen(true)}>
                <Percent size={15} /> {discount > 0 ? 'Atualizar desconto' : 'Conceder desconto'}
              </button>
            ) : null}
            <button type="button" onClick={() => window.print()}>
              <Printer size={15} /> Imprimir contrato
            </button>
            {!cancelled ? (
              <button type="button" className="is-cancel" onClick={() => setCancelOpen(true)}>
                <X size={15} /> Cancelar pedido
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      {includeOpen ? (
        <Modal title="Incluir produto" onClose={() => setIncludeOpen(false)}>
          <input
            className="ov-input"
            placeholder="Busque por nome ou código"
            value={productQuery}
            onChange={(event) => setProductQuery(event.target.value)}
          />
          <ul className="ov-pick">
            {matches.slice(0, 8).map((product) => (
              <li key={product.id}>
                <span>
                  <strong>
                    {product.fullCode} {product.name}
                  </strong>
                  <small>
                    {product.size ? `Tamanho ${product.size} · ` : ''}
                    {formatBrl(moneyBrToNumber(order.operation === 'Venda' ? product.salePrice : product.rental))}
                  </small>
                </span>
                <button type="button" onClick={() => addProduct(product)}>
                  Incluir ao pedido
                </button>
              </li>
            ))}
            {matches.length === 0 ? <li className="ov-muted">Nenhum produto encontrado.</li> : null}
          </ul>
        </Modal>
      ) : null}

      {payOpen ? (
        <Modal title="Novo pagamento" onClose={() => setPayOpen(false)}>
          <div className="ov-methods">
            {PAY_METHODS.map((method) => (
              <button
                key={method}
                type="button"
                className={payMethod === method ? 'is-on' : ''}
                onClick={() => {
                  setPayMethod(method)
                  setPayError('')
                  setPayWarn(method === 'Crédito' || method === 'Débito')
                }}
              >
                {method}
              </button>
            ))}
          </div>
          {payWarn ? (
            <p className="ov-oops">
              Você está tentando informar um pagamento via cartão de crédito ou débito, porém não existem terminais de
              pagamento cadastrados ainda.
            </p>
          ) : null}
          <label>
            Data efetiva
            <input className="ov-input" placeholder="dd/mm/aaaa" value={payDate} onChange={(event) => setPayDate(event.target.value)} />
          </label>
          <label>
            Valor *
            <input
              className="ov-input"
              value={payAmount}
              onChange={(event) => setPayAmount(maskMoneyBr(event.target.value))}
            />
          </label>
          {payError ? <p className="ov-error">{payError}</p> : null}
          <div className="ov-modal__foot">
            <button type="button" className="ov-ghost" onClick={() => setPayOpen(false)}>
              Cancelar
            </button>
            <button type="button" className="ov-primary" onClick={savePayment}>
              Salvar pagamento
            </button>
          </div>
        </Modal>
      ) : null}

      {discountOpen ? (
        <Modal title="Desconto geral" onClose={() => setDiscountOpen(false)}>
          <label>
            Valor *
            <input
              className="ov-input"
              value={discountValue}
              onChange={(event) => setDiscountValue(maskMoneyBr(event.target.value))}
            />
          </label>
          <div className="ov-modal__foot">
            {discount > 0 ? (
              <button type="button" className="ov-danger" onClick={removeDiscount}>
                Remover desconto
              </button>
            ) : null}
            <button type="button" className="ov-ghost" onClick={() => setDiscountOpen(false)}>
              Cancelar
            </button>
            <button type="button" className="ov-primary" onClick={saveDiscount}>
              {discount > 0 ? 'Atualizar desconto' : 'Salvar desconto'}
            </button>
          </div>
        </Modal>
      ) : null}

      {cancelOpen ? (
        <Modal title="Cancelar pedido?" onClose={() => setCancelOpen(false)}>
          <p>Você está prestes a cancelar este pedido. Observe que esta ação não poderá ser revertida.</p>
          <div className="ov-modal__foot">
            <button type="button" className="ov-ghost" onClick={() => setCancelOpen(false)}>
              Não cancelar
            </button>
            <button type="button" className="ov-danger" onClick={cancelOrder}>
              Cancelar pedido
            </button>
          </div>
        </Modal>
      ) : null}

      {adjustId ? (
        <Modal title="Ajuste de valor" onClose={() => setAdjustId(null)}>
          <div className="ov-methods">
            <button type="button" className={adjustMode === 'add' ? 'is-on' : ''} onClick={() => setAdjustMode('add')}>
              Acréscimo
            </button>
            <button type="button" className={adjustMode === 'sub' ? 'is-on' : ''} onClick={() => setAdjustMode('sub')}>
              Desconto
            </button>
          </div>
          <label>
            Valor
            <input
              className="ov-input"
              value={adjustValue}
              onChange={(event) => setAdjustValue(maskMoneyBr(event.target.value))}
            />
          </label>
          <div className="ov-modal__foot">
            <button type="button" className="ov-ghost" onClick={() => setAdjustId(null)}>
              Cancelar
            </button>
            <button type="button" className="ov-primary" onClick={saveAdjust}>
              Salvar
            </button>
          </div>
        </Modal>
      ) : null}

      {datesOpen ? (
        <DatesModal
          order={order}
          onClose={() => setDatesOpen(false)}
          onSave={(patch) => {
            patchOrder(order.id, patch)
            setDatesOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="ov-modal" role="presentation" onMouseDown={onClose}>
      <div className="ov-modal__dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <h3>{title}</h3>
          <button type="button" aria-label="Fechar" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        <div className="ov-modal__body">{children}</div>
      </div>
    </div>
  )
}

function DatesModal({
  order,
  onClose,
  onSave,
}: {
  order: Order
  onClose: () => void
  onSave: (patch: Partial<Order>) => void
}) {
  const [eventDate, setEventDate] = useState(order.eventDate)
  const [proofDate, setProofDate] = useState(order.proofDate || '')
  const [pickupDate, setPickupDate] = useState(order.pickupDate || '')
  const [returnDate, setReturnDate] = useState(order.returnDate || '')
  return (
    <Modal title="Revisão de datas" onClose={onClose}>
      <label>
        Data do evento *
        <input className="ov-input" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
      </label>
      <label>
        Data da prova
        <input className="ov-input" type="date" value={proofDate} onChange={(event) => setProofDate(event.target.value)} />
      </label>
      <label>
        Data de retirada *
        <input className="ov-input" type="date" value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} />
      </label>
      <label>
        Data de devolução *
        <input className="ov-input" type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} />
      </label>
      <div className="ov-modal__foot">
        <button type="button" className="ov-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="ov-primary"
          onClick={() => onSave({ eventDate, proofDate, pickupDate, returnDate })}
        >
          Salvar
        </button>
      </div>
    </Modal>
  )
}
