import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Search, SquarePen, Trash2, X } from 'lucide-react'
import { useSuppliers } from '../hooks/useSuppliers'
import {
  addSupplier,
  deleteSupplier,
  updateSupplier,
  type Supplier,
  type SupplierType,
} from '../lib/suppliersStore'
import './Suppliers.css'

const TYPES: SupplierType[] = ['Produto', 'Serviço', 'Frete', 'Outro']

const TYPE_FILTERS: { id: 'todos' | SupplierType; label: string }[] = [
  { id: 'todos', label: 'Todos tipos' },
  ...TYPES.map((type) => ({ id: type, label: type })),
]

export function Suppliers() {
  const suppliers = useSuppliers()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'todos' | SupplierType>('todos')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<SupplierType>('Produto')
  const [touched, setTouched] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return suppliers.filter((item) => {
      if (typeFilter !== 'todos' && item.type !== typeFilter) return false
      if (!q) return true
      return (
        item.name.toLocaleLowerCase('pt-BR').includes(q) ||
        item.phone.toLocaleLowerCase('pt-BR').includes(q) ||
        item.type.toLocaleLowerCase('pt-BR').includes(q)
      )
    })
  }, [suppliers, query, typeFilter])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setPhone('')
    setType('Produto')
    setTouched(false)
    setModalOpen(true)
  }

  const openEdit = (item: Supplier) => {
    setEditing(item)
    setName(item.name)
    setPhone(item.phone)
    setType(item.type)
    setTouched(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setTouched(false)
  }

  const missingName = !name.trim()

  const saveSupplier = () => {
    setTouched(true)
    if (missingName) return
    const payload = { name, phone, type }
    if (editing) updateSupplier(editing.id, payload)
    else addSupplier(payload)
    closeModal()
  }

  return (
    <div className="suppliers">
      <section className="suppliers__card">
        <div className="suppliers__toolbar">
          <label className="suppliers__search">
            <Search size={16} strokeWidth={2} className="suppliers__search-icon" />
            <input
              type="search"
              className="suppliers__search-input"
              placeholder="Busca rápida..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <label className="suppliers__select-wrap">
            <select
              className="suppliers__select"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as 'todos' | SupplierType)
              }
              aria-label="Filtro por tipo"
            >
              {TYPE_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} strokeWidth={2} className="suppliers__select-icon" />
          </label>

          <button type="button" className="suppliers__add" onClick={openCreate}>
            <Plus size={16} strokeWidth={2.5} />
            Novo fornecedor
          </button>
        </div>

        <div className="suppliers__table-wrap">
          <table className="suppliers__table">
            <thead>
              <tr>
                <th className="suppliers__col-name">Fornecedor</th>
                <th className="suppliers__col-phone">Telefone</th>
                <th className="suppliers__col-type">Tipo</th>
                <th className="suppliers__col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="suppliers__empty" colSpan={4}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="suppliers__name">{item.name}</span>
                    </td>
                    <td>{item.phone || ''}</td>
                    <td>{item.type}</td>
                    <td className="suppliers__actions-cell">
                      <button
                        type="button"
                        className="suppliers__icon-btn"
                        aria-label={`Editar fornecedor ${item.name}`}
                        onClick={() => openEdit(item)}
                      >
                        <SquarePen size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="suppliers__icon-btn is-danger"
                        aria-label={`Excluir fornecedor ${item.name}`}
                        onClick={() => deleteSupplier(item.id)}
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen ? (
        <div className="suppliers-modal" role="presentation" onMouseDown={closeModal}>
          <div
            className="suppliers-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="suppliers-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="suppliers-modal__header">
              <h2 id="suppliers-modal-title">
                {editing ? 'Editar fornecedor' : 'Novo fornecedor'}
              </h2>
              <button
                type="button"
                className="suppliers-modal__close"
                aria-label="Fechar"
                onClick={closeModal}
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            </header>

            <div className="suppliers-modal__body">
              <label className="suppliers-modal__field">
                <span>
                  Fornecedor <span className="suppliers-modal__req">*</span>
                </span>
                <input
                  type="text"
                  className={`suppliers-modal__input${touched && missingName ? ' is-invalid' : ''}`}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Distribuidora Silva"
                  autoFocus
                />
              </label>

              <label className="suppliers-modal__field">
                <span>Telefone</span>
                <input
                  type="text"
                  className="suppliers-modal__input"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ex.: (47) 99999-9999"
                />
              </label>

              <label className="suppliers-modal__field">
                <span>Tipo</span>
                <select
                  className="suppliers-modal__input"
                  value={type}
                  onChange={(event) => setType(event.target.value as SupplierType)}
                >
                  {TYPES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <footer className="suppliers-modal__footer">
              <button type="button" className="suppliers-modal__cancel" onClick={closeModal}>
                Cancelar
              </button>
              <button type="button" className="suppliers-modal__save" onClick={saveSupplier}>
                {editing ? 'Salvar' : 'Cadastrar'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}
