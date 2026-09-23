import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import './CreatableSelect.css'

type CreatableSelectProps = {
  value: string
  options: string[]
  placeholder: string
  createLabel: string
  invalid?: boolean
  /** When false, only calls onCreate (e.g. open a modal) without selecting the raw name. Default true. */
  selectOnCreate?: boolean
  /** Increment to open the list from outside the field. */
  openToken?: number
  onChange: (value: string) => void
  onCreate: (name: string) => void
}

export function CreatableSelect({
  value,
  options,
  placeholder,
  createLabel,
  invalid,
  selectOnCreate = true,
  openToken = 0,
  onChange,
  onCreate,
}: CreatableSelectProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    if (!q) return options
    return options.filter((item) => item.toLocaleLowerCase('pt-BR').includes(q))
  }, [options, query])

  const canCreate = useMemo(() => {
    const q = query.trim()
    if (!q) return false
    return !options.some((item) => item.toLocaleLowerCase('pt-BR') === q.toLocaleLowerCase('pt-BR'))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      window.setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    if (!openToken) return
    setOpen(true)
  }, [openToken])

  const clearValue = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
    event.preventDefault()
    event.stopPropagation()
    onChange('')
    setOpen(true)
  }

  return (
    <div
      className={`cselect${open ? ' is-open' : ''}${invalid ? ' is-invalid' : ''}${value ? ' has-value' : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="cselect__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? 'cselect__value' : 'cselect__placeholder'}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} strokeWidth={2} className="cselect__chevron" />
      </button>
      {value ? (
        <button
          type="button"
          className="cselect__clear"
          aria-label="Remover opção"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={clearValue}
        >
          <X size={14} strokeWidth={2} />
        </button>
      ) : null}

      {open ? (
        <div className="cselect__dropdown" id={id} role="listbox">
          <div className="cselect__search-wrap">
            <input
              ref={searchRef}
              type="text"
              className="cselect__search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canCreate) {
                  event.preventDefault()
                  const name = query.trim()
                  onCreate(name)
                  if (selectOnCreate) onChange(name)
                  setOpen(false)
                }
              }}
            />
          </div>
          <ul className="cselect__list">
            {filtered.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className={`cselect__option${item === value ? ' is-active' : ''}`}
                  onClick={() => {
                    onChange(item)
                    setOpen(false)
                  }}
                >
                  {item}
                </button>
              </li>
            ))}
            {canCreate ? (
              <li>
                <button
                  type="button"
                  className="cselect__option cselect__option--create"
                  onClick={() => {
                    const name = query.trim()
                    onCreate(name)
                    if (selectOnCreate) onChange(name)
                    setOpen(false)
                  }}
                >
                  <strong>{createLabel}:</strong> {query.trim()}
                </button>
              </li>
            ) : null}
            {!canCreate && filtered.length === 0 ? (
              <li className="cselect__empty">Nenhum resultado</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
