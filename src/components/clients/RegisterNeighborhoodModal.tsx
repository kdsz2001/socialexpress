import { useEffect, useId, useRef, useState } from 'react'
import { Check, Info, X } from 'lucide-react'
import './RegisterNeighborhoodModal.css'

type RegisterNeighborhoodModalProps = {
  open: boolean
  city: string
  initialName: string
  onCancel: () => void
  onConfirm: (name: string) => void
}

export function RegisterNeighborhoodModal({
  open,
  city,
  initialName,
  onCancel,
  onConfirm,
}: RegisterNeighborhoodModalProps) {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(initialName)

  useEffect(() => {
    if (!open) return
    setName(initialName)
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, initialName, onCancel])

  if (!open) return null

  const trimmed = name.trim()
  const cityLabel = city.trim() || 'sua cidade'

  return (
    <div className="bairro-modal" role="presentation">
      <button
        type="button"
        className="bairro-modal__overlay"
        aria-label="Fechar"
        onClick={onCancel}
      />

      <div
        className="bairro-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="bairro-modal__icon" aria-hidden="true">
          <Info size={28} strokeWidth={1.75} />
        </div>

        <h2 id={titleId} className="bairro-modal__title">
          Cadastrar bairro
        </h2>

        <p className="bairro-modal__text">
          Você está prestes a cadastrar o bairro{' '}
          <strong>{trimmed || '…'}</strong> em {cityLabel}... você quer
          continuar?
        </p>

        <input
          ref={inputRef}
          className="bairro-modal__input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && trimmed) {
              event.preventDefault()
              onConfirm(trimmed)
            }
          }}
        />

        <div className="bairro-modal__actions">
          <button
            type="button"
            className="bairro-modal__btn bairro-modal__btn--cancel"
            onClick={onCancel}
          >
            <X size={16} strokeWidth={2.25} />
            Não, cancelar
          </button>
          <button
            type="button"
            className="bairro-modal__btn bairro-modal__btn--confirm"
            disabled={!trimmed}
            onClick={() => onConfirm(trimmed)}
          >
            <Check size={16} strokeWidth={2.5} />
            Sim, cadastrar
          </button>
        </div>
      </div>
    </div>
  )
}
