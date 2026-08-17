import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { RegisterNeighborhoodModal } from './RegisterNeighborhoodModal'
import './NeighborhoodSelect.css'

type NeighborhoodSelectProps = {
  id?: string
  value: string
  options: string[]
  city: string
  required?: boolean
  onChange: (value: string) => void
  onRegister: (value: string) => void
}

export function NeighborhoodSelect({
  id,
  value,
  options,
  city,
  required,
  onChange,
  onRegister,
}: NeighborhoodSelectProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingName, setPendingName] = useState('')

  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const option of options) {
      const trimmed = option.trim()
      if (!trimmed) continue
      const key = trimmed.toLocaleLowerCase('pt-BR')
      if (seen.has(key)) continue
      seen.add(key)
      list.push(trimmed)
    }
    return list
  }, [options])

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    if (!q) return uniqueOptions
    return uniqueOptions.filter((option) =>
      option.toLocaleLowerCase('pt-BR').includes(q),
    )
  }, [uniqueOptions, query])

  const exactMatch = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    if (!q) return true
    return uniqueOptions.some(
      (option) => option.toLocaleLowerCase('pt-BR') === q,
    )
  }, [uniqueOptions, query])

  const showCreate = query.trim().length > 0 && !exactMatch

  useEffect(() => {
    if (!open) return

    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus()
    })

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const openMenu = () => {
    setQuery('')
    setOpen(true)
  }

  const selectOption = (option: string) => {
    onChange(option)
    setOpen(false)
    setQuery('')
  }

  const startCreate = (name: string) => {
    setPendingName(name.trim())
    setOpen(false)
    setQuery('')
    setModalOpen(true)
  }

  return (
    <>
      <div className="bairro-select" ref={rootRef}>
        <button
          type="button"
          id={id}
          className={`bairro-select__trigger${open ? ' is-open' : ''}${
            value ? '' : ' is-placeholder'
          }`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => (open ? setOpen(false) : openMenu())}
        >
          <span>{value || 'Selecione um bairro'}</span>
          <ChevronDown size={14} strokeWidth={2.25} aria-hidden="true" />
        </button>

        {/* campo oculto para required nativo do form */}
        <input type="text" tabIndex={-1} required={required} value={value} readOnly aria-hidden="true" className="bairro-select__native" />

        {open && (
          <div className="bairro-select__panel" id={listId} role="listbox">
            <div className="bairro-select__search-wrap">
              <input
                ref={searchRef}
                type="text"
                className="bairro-select__search"
                value={query}
                placeholder="Buscar..."
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    if (showCreate) {
                      startCreate(query)
                    } else if (filtered[0]) {
                      selectOption(filtered[0])
                    }
                  }
                }}
              />
            </div>

            <div className="bairro-select__options">
              <button
                type="button"
                role="option"
                className={`bairro-select__option${!value ? ' is-active' : ''}`}
                aria-selected={!value}
                onClick={() => selectOption('')}
              >
                Selecione um bairro
              </button>

              {filtered.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  className={`bairro-select__option${
                    value === option ? ' is-active' : ''
                  }`}
                  aria-selected={value === option}
                  onClick={() => selectOption(option)}
                >
                  {option}
                </button>
              ))}

              {showCreate && (
                <button
                  type="button"
                  className="bairro-select__create"
                  onClick={() => startCreate(query)}
                >
                  <strong>Cadastrar novo bairro:</strong> {query.trim()}
                </button>
              )}

              {!showCreate && filtered.length === 0 && (
                <p className="bairro-select__empty">Nenhum bairro encontrado</p>
              )}
            </div>
          </div>
        )}
      </div>

      <RegisterNeighborhoodModal
        open={modalOpen}
        city={city}
        initialName={pendingName}
        onCancel={() => setModalOpen(false)}
        onConfirm={(name) => {
          onRegister(name)
          onChange(name)
          setModalOpen(false)
        }}
      />
    </>
  )
}
