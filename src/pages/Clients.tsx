import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Search,
  Plus,
  CalendarDays,
  ArrowUp,
  SquarePen,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DATE_PRESETS,
  DateRangePicker,
  formatBr,
  rangeForPreset,
  type DatePreset,
} from '../components/clients/DateRangePicker'
import { DeleteClientModal } from '../components/clients/DeleteClientModal'
import { useClients } from '../hooks/useClients'
import {
  ageTurningOnBirthday,
  birthdayInRange,
  birthdayOccurrenceYear,
  formatBirthDateLong,
  parseBirthDate,
} from '../lib/birthdays'
import {
  buildWhatsAppUrl,
  deleteClient,
  getClientDisplayName,
  getClientPrimaryPhone,
  type Client,
} from '../lib/clientsStore'
import './Clients.css'

type PickerMode = 'menu' | 'calendar'

function WhatsAppGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.95L0 24l6.3-1.65a11.9 11.9 0 0 0 5.74 1.46h.01c6.54 0 11.88-5.34 11.88-11.9 0-3.18-1.24-6.16-3.41-8.43ZM12.05 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.28C2.15 6.45 6.56 2.04 12.05 2.04c2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.98c0 5.49-4.41 9.88-9.89 9.88Zm5.74-7.4c-.31-.16-1.86-.92-2.15-1.02-.29-.11-.5-.16-.71.16-.21.31-.82 1.02-1 1.23-.18.21-.37.23-.68.08-.31-.16-1.32-.49-2.51-1.55-.93-.83-1.55-1.85-1.73-2.16-.18-.31-.02-.48.14-.63.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.63-.52-.53-.71-.54h-.6c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63s1.13 3.05 1.29 3.26c.16.21 2.22 3.39 5.38 4.75.75.32 1.34.52 1.8.66.76.24 1.45.2 2 .12.61-.09 1.86-.76 2.12-1.5.26-.73.26-1.36.18-1.5-.08-.13-.29-.21-.6-.37Z" />
    </svg>
  )
}

export function Clients() {
  const navigate = useNavigate()
  const clients = useClients()
  const [searchParams] = useSearchParams()
  const tab =
    searchParams.get('tab') === 'aniversariantes'
      ? 'aniversariantes'
      : searchParams.get('tab') === 'whatsapp'
        ? 'whatsapp'
        : 'todos'
  const [query, setQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [dateOpen, setDateOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<PickerMode>('menu')
  const [datePreset, setDatePreset] = useState<DatePreset>('hoje')
  const initial = rangeForPreset('hoje')
  const [rangeStart, setRangeStart] = useState(initial.start)
  const [rangeEnd, setRangeEnd] = useState(initial.end)
  const dateWrapRef = useRef<HTMLDivElement>(null)
  const dateMenuId = useId()

  const dateLabel = `${formatBr(rangeStart)} até ${formatBr(rangeEnd)}`

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')

    if (tab === 'aniversariantes') {
      const matches = clients
        .map((client) => {
          const birth = parseBirthDate(client.birthDate)
          if (!birth) return null
          if (!birthdayInRange(birth, rangeStart, rangeEnd)) return null
          const occurrenceYear = birthdayOccurrenceYear(
            birth,
            rangeStart,
            rangeEnd,
          )
          return {
            client,
            birth,
            occurrenceYear,
            turningAge: ageTurningOnBirthday(birth, occurrenceYear),
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .filter(({ client }) => {
          if (!q) return true
          const name = getClientDisplayName(client).toLocaleLowerCase('pt-BR')
          const phone = client.phones.map((p) => p.number).join(' ')
          return name.includes(q) || phone.includes(q)
        })
        .sort((a, b) =>
          getClientDisplayName(a.client).localeCompare(
            getClientDisplayName(b.client),
            'pt-BR',
            { sensitivity: 'base' },
          ),
        )
      return matches
    }

    const list = !q
      ? clients
      : clients.filter((client) => {
          const name = getClientDisplayName(client).toLocaleLowerCase('pt-BR')
          const cpf = client.cpfCnpj.toLocaleLowerCase('pt-BR')
          const phone = client.phones.map((p) => p.number).join(' ')
          return name.includes(q) || cpf.includes(q) || phone.includes(q)
        })
    return list
  }, [clients, query, tab, rangeStart, rangeEnd])

  const birthdayRows =
    tab === 'aniversariantes'
      ? (filtered as {
          client: Client
          birth: NonNullable<ReturnType<typeof parseBirthDate>>
          occurrenceYear: number
          turningAge: number
        }[])
      : []
  const listClients = tab === 'aniversariantes' ? [] : (filtered as Client[])

  const resultCount =
    tab === 'aniversariantes' ? birthdayRows.length : listClients.length
  const totalPages = Math.max(1, Math.ceil(resultCount / pageSize) || 1)
  const currentPage = Math.min(page, totalPages)
  const pageStart = resultCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, resultCount)
  const pageBirthdayRows = birthdayRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )
  const pageItems = listClients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  useEffect(() => {
    setPage(1)
  }, [query, pageSize, tab, rangeStart, rangeEnd])

  useEffect(() => {
    if (!dateOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!dateWrapRef.current?.contains(event.target as Node)) {
        setDateOpen(false)
        setPickerMode('menu')
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDateOpen(false)
        setPickerMode('menu')
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [dateOpen])

  useEffect(() => {
    setDateOpen(false)
    setPickerMode('menu')
  }, [tab])

  const openDate = () => {
    setPickerMode(datePreset === 'escolher' ? 'calendar' : 'menu')
    setDateOpen((open) => !open)
  }

  const applyPreset = (preset: Exclude<DatePreset, 'escolher'>) => {
    const range = rangeForPreset(preset)
    setDatePreset(preset)
    setRangeStart(range.start)
    setRangeEnd(range.end)
    setDateOpen(false)
    setPickerMode('menu')
  }

  const onMenuSelect = (preset: DatePreset) => {
    if (preset === 'escolher') {
      setDatePreset('escolher')
      setPickerMode('calendar')
      return
    }
    applyPreset(preset)
  }

  const Pagination = ({ flip = false }: { flip?: boolean }) => (
    <div className={`clients__pager${flip ? ' is-flip' : ''}`}>
      <div className="clients__pager-left">
        <select
          className="clients__pager-size"
          value={pageSize}
          aria-label="Itens por página"
          onChange={(event) => setPageSize(Number(event.target.value))}
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="clients__pager-info">
          {resultCount === 0
            ? 'Mostrando 0 - 0 do total de 0'
            : `Mostrando ${pageStart} - ${pageEnd} do total de ${resultCount}`}
        </span>
      </div>

      <div className="clients__pager-nav">
        <button
          type="button"
          className="clients__pager-btn"
          aria-label="Primeira página"
          disabled={currentPage <= 1}
          onClick={() => setPage(1)}
        >
          <ChevronsLeft size={16} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          className="clients__pager-btn"
          aria-label="Página anterior"
          disabled={currentPage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft size={16} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          className="clients__pager-btn is-active"
          aria-current="page"
        >
          {currentPage}
        </button>
        <button
          type="button"
          className="clients__pager-btn"
          aria-label="Próxima página"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          <ChevronRight size={16} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          className="clients__pager-btn"
          aria-label="Última página"
          disabled={currentPage >= totalPages}
          onClick={() => setPage(totalPages)}
        >
          <ChevronsRight size={16} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="clients">
      <section className="clients__card">
        <div className="clients__toolbar">
          <label className="clients__search">
            <Search size={16} strokeWidth={2} className="clients__search-icon" />
            <input
              type="search"
              className="clients__search-input"
              placeholder="Busca rápida..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          {tab === 'aniversariantes' ? (
            <div className="clients__date" ref={dateWrapRef}>
              <button
                type="button"
                className={`clients__date-field${dateOpen ? ' is-open' : ''}`}
                aria-expanded={dateOpen}
                aria-controls={dateMenuId}
                onClick={openDate}
              >
                {dateLabel}
              </button>
              <button
                type="button"
                className={`clients__date-cal${dateOpen ? ' is-open' : ''}`}
                aria-label="Abrir período"
                aria-expanded={dateOpen}
                aria-controls={dateMenuId}
                onClick={openDate}
              >
                <CalendarDays size={16} strokeWidth={2} />
              </button>

              {dateOpen && pickerMode === 'menu' && (
                <div
                  className="clients__date-menu"
                  id={dateMenuId}
                  role="listbox"
                  aria-label="Período"
                >
                  {DATE_PRESETS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={datePreset === item.id}
                      className={`clients__date-option${datePreset === item.id ? ' is-active' : ''}`}
                      onClick={() => onMenuSelect(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              {dateOpen && pickerMode === 'calendar' && (
                <div className="clients__date-popover" id={dateMenuId}>
                  <DateRangePicker
                    start={rangeStart}
                    end={rangeEnd}
                    preset={datePreset}
                    onCancel={() => {
                      setDateOpen(false)
                      setPickerMode('menu')
                    }}
                    onApply={({ start, end, preset: nextPreset }) => {
                      setRangeStart(start)
                      setRangeEnd(end)
                      setDatePreset(nextPreset)
                      setDateOpen(false)
                      setPickerMode('menu')
                    }}
                  />
                </div>
              )}
            </div>
          ) : tab === 'whatsapp' ? null : (
            <button
              type="button"
              className="clients__add"
              onClick={() => navigate('/clientes/cadastrar')}
            >
              <Plus size={16} strokeWidth={2.5} />
              Cadastrar cliente
            </button>
          )}
        </div>

        {tab === 'whatsapp' ? (
          <div className="clients__empty-panel">
            <p>Envio em massa de WhatsApp em breve.</p>
          </div>
        ) : (
          <>
            {tab === 'todos' && <Pagination />}

            <div className="clients__table-wrap">
              <table className="clients__table">
                <thead>
                  {tab === 'aniversariantes' ? (
                    <tr>
                      <th>
                        <span className="clients__th-sort">
                          Cliente
                          <ArrowUp size={12} strokeWidth={2.5} />
                        </span>
                      </th>
                      <th>Data de nascimento</th>
                      <th>Telefone</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>Cliente</th>
                      <th>Telefone</th>
                      <th className="clients__th-actions">Ações</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {tab === 'aniversariantes' ? (
                    pageBirthdayRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="clients__empty">
                          Nenhum resultado encontrado
                        </td>
                      </tr>
                    ) : (
                      pageBirthdayRows.map(
                        ({ client, birth, turningAge }) => {
                          const phone = getClientPrimaryPhone(client)
                          const waUrl =
                            phone?.whatsapp && phone.number
                              ? buildWhatsAppUrl(phone.number)
                              : null

                          return (
                            <tr key={client.id} className="clients__row">
                              <td>
                                <div className="clients__person">
                                  <span className="clients__person-name">
                                    {getClientDisplayName(client)}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="clients__birthday">
                                  <span className="clients__birthday-date">
                                    {formatBirthDateLong(birth)}
                                  </span>
                                  <span className="clients__birthday-age">
                                    Completará {turningAge}{' '}
                                    {turningAge === 1 ? 'ano' : 'anos'}
                                  </span>
                                </div>
                              </td>
                              <td>
                                {phone?.number ? (
                                  waUrl ? (
                                    <a
                                      className="clients__phone is-whatsapp"
                                      href={waUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Abrir conversa no WhatsApp"
                                    >
                                      <span>{phone.number}</span>
                                      <WhatsAppGlyph />
                                    </a>
                                  ) : (
                                    <span className="clients__phone">
                                      {phone.number}
                                    </span>
                                  )
                                ) : (
                                  <span className="clients__phone-empty">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        },
                      )
                    )
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="clients__empty">
                        Nenhum resultado encontrado
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((client) => {
                      const phone = getClientPrimaryPhone(client)
                      const waUrl =
                        phone?.whatsapp && phone.number
                          ? buildWhatsAppUrl(phone.number)
                          : null

                      return (
                        <tr key={client.id} className="clients__row">
                          <td>
                            <div className="clients__person">
                              <span className="clients__person-name">
                                {getClientDisplayName(client)}
                              </span>
                              {client.active === false ? (
                                <span className="clients__person-inactive">
                                  Cliente desativado
                                </span>
                              ) : client.cpfCnpj ? (
                                <span className="clients__person-doc">
                                  {client.cpfCnpj}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            {phone?.number ? (
                              waUrl ? (
                                <a
                                  className="clients__phone is-whatsapp"
                                  href={waUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Abrir conversa no WhatsApp"
                                >
                                  <span>{phone.number}</span>
                                  <WhatsAppGlyph />
                                </a>
                              ) : (
                                <span className="clients__phone">
                                  {phone.number}
                                </span>
                              )
                            ) : (
                              <span className="clients__phone-empty">—</span>
                            )}
                          </td>
                          <td className="clients__actions-cell">
                            <div className="clients__actions">
                              <button
                                type="button"
                                className="clients__action clients__action--view"
                                aria-label="Visualizar cliente"
                                onClick={() => navigate(`/clientes/${client.id}`)}
                              >
                                <SquarePen size={16} strokeWidth={2} />
                                <span
                                  className="clients__action-tip"
                                  role="tooltip"
                                >
                                  Visualizar cliente
                                </span>
                              </button>
                              <button
                                type="button"
                                className="clients__action clients__action--delete"
                                aria-label="Excluir"
                                onClick={() => setClientToDelete(client)}
                              >
                                <Trash2 size={16} strokeWidth={2} />
                                <span
                                  className="clients__action-tip"
                                  role="tooltip"
                                >
                                  Excluir
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {tab === 'todos' && <Pagination />}
            {tab === 'aniversariantes' && <Pagination flip />}
          </>
        )}
      </section>

      <DeleteClientModal
        open={clientToDelete !== null}
        clientName={
          clientToDelete ? getClientDisplayName(clientToDelete) : ''
        }
        onCancel={() => setClientToDelete(null)}
        onConfirm={() => {
          if (clientToDelete) deleteClient(clientToDelete.id)
          setClientToDelete(null)
        }}
      />
    </div>
  )
}
