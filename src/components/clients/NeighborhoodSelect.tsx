import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { BAIRRO_OUTRO, withBairroOutroOption } from '../../lib/brazilAddress'
import { RegisterNeighborhoodModal } from './RegisterNeighborhoodModal'
import './NeighborhoodSelect.css'

type NeighborhoodSelectProps = {
  id?: string
  value: string
  options: string[]
  city: string
  required?: boolean
  invalid?: boolean
  onChange: (value: string) => void
  onRegister: (value: string) => void
  onBlur?: () => void
}

type PanelPos = {
  left: number
  width: number
  top: number | 'auto'
  bottom: number | 'auto'
  maxHeight: number
  placement: 'top' | 'bottom'
}

function measurePanelPos(trigger: HTMLElement): PanelPos {
  const rect = trigger.getBoundingClientRect()
  const gap = 4
  const preferredHeight = 280
  const spaceBelow = window.innerHeight - rect.bottom - 12
  const spaceAbove = rect.top - 12
  const openUp = spaceBelow < Math.min(preferredHeight, 220) && spaceAbove > spaceBelow
  const available = Math.max(180, openUp ? spaceAbove : spaceBelow)

  if (openUp) {
    return {
      left: rect.left,
      width: rect.width,
      top: 'auto',
      bottom: window.innerHeight - rect.top + gap,
      maxHeight: Math.min(preferredHeight, available),
      placement: 'top',
    }
  }

  return {
    left: rect.left,
    width: rect.width,
    top: rect.bottom + gap,
    bottom: 'auto',
    maxHeight: Math.min(preferredHeight, available),
    placement: 'bottom',
  }
}

export function NeighborhoodSelect({
  id,
  value,
  options,
  city,
  required,
  invalid,
  onChange,
  onRegister,
  onBlur,
}: NeighborhoodSelectProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const onBlurRef = useRef(onBlur)
  onBlurRef.current = onBlur

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingName, setPendingName] = useState('')
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null)

  const uniqueOptions = useMemo(() => withBairroOutroOption(options), [options])

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    const base = uniqueOptions.filter(
      (option) => option.toLocaleLowerCase('pt-BR') !== BAIRRO_OUTRO,
    )
    const matched = !q
      ? base
      : base.filter((option) => option.toLocaleLowerCase('pt-BR').includes(q))
    return [...matched, BAIRRO_OUTRO]
  }, [uniqueOptions, query])

  const exactMatch = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    if (!q) return true
    return uniqueOptions.some(
      (option) => option.toLocaleLowerCase('pt-BR') === q,
    )
  }, [uniqueOptions, query])

  const showCreate = query.trim().length > 0 && !exactMatch

  const updatePanelPosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    setPanelPos(measurePanelPos(trigger))
  }

  const closeMenu = (notifyBlur = true) => {
    setOpen(false)
    setQuery('')
    setPanelPos(null)
    if (notifyBlur) onBlurRef.current?.()
  }

  const openMenu = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    setQuery('')
    setPanelPos(measurePanelPos(trigger))
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPosition()
  }, [open, filtered.length])

  useEffect(() => {
    if (!open) return

    const focusFrame = window.requestAnimationFrame(() => {
      searchRef.current?.focus()
    })

    // Evita fechar no mesmo clique que abriu o menu
    let attached = false
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      closeMenu(true)
    }

    const attachTimer = window.setTimeout(() => {
      document.addEventListener('mousedown', onPointerDown)
      attached = true
    }, 0)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu(true)
    }

    const onReposition = () => updatePanelPosition()

    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.clearTimeout(attachTimer)
      if (attached) document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open])

  const selectOption = (option: string) => {
    onChange(option)
    closeMenu(false)
  }

  const startCreate = (name: string) => {
    setPendingName(name.trim())
    closeMenu(false)
    setModalOpen(true)
  }

  const panel =
    open && panelPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            className={`bairro-select__panel bairro-select__panel--portal is-${panelPos.placement}`}
            id={listId}
            role="listbox"
            style={{
              left: panelPos.left,
              width: panelPos.width,
              top: panelPos.top,
              bottom: panelPos.bottom,
              maxHeight: panelPos.maxHeight,
            }}
          >
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
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div className="bairro-select" ref={rootRef}>
        <button
          ref={triggerRef}
          type="button"
          id={id}
          className={`bairro-select__trigger${open ? ' is-open' : ''}${
            value ? '' : ' is-placeholder'
          }${invalid ? ' is-invalid' : ''}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={invalid || undefined}
          onClick={() => {
            if (open) closeMenu(true)
            else openMenu()
          }}
        >
          <span>{value || 'Selecione um bairro'}</span>
          <ChevronDown size={14} strokeWidth={2.25} aria-hidden="true" />
        </button>

        <input
          type="text"
          tabIndex={-1}
          required={required}
          value={value}
          readOnly
          aria-hidden="true"
          className="bairro-select__native"
        />
      </div>

      {panel}

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
