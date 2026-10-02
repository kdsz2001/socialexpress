import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './NamePromptModal.css'

type NamePromptModalProps = {
  open: boolean
  title: string
  label: string
  initial: string
  multiline?: boolean
  required?: boolean
  confirmLabel?: string
  onCancel: () => void
  onConfirm: (value: string) => void
}

export function NamePromptModal({
  open,
  title,
  label,
  initial,
  multiline = false,
  required = true,
  confirmLabel = 'Salvar',
  onCancel,
  onConfirm,
}: NamePromptModalProps) {
  const titleId = useId()
  const onCancelRef = useRef(onCancel)
  const [value, setValue] = useState(initial)
  const [invalid, setInvalid] = useState(false)
  onCancelRef.current = onCancel

  useEffect(() => {
    if (!open) return
    setValue(initial)
    setInvalid(false)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancelRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, initial])

  if (!open) return null

  const submit = () => {
    const next = multiline ? value : value.trim()
    if (required && !next.trim()) {
      setInvalid(true)
      return
    }
    onConfirm(multiline ? next : next.trim())
  }

  return createPortal(
    <div className="cfg-prompt" role="presentation">
      <button type="button" className="cfg-prompt__overlay" aria-label="Fechar" onClick={onCancel} />
      <div className="cfg-prompt__dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="cfg-prompt__title">
          {title}
        </h2>
        <label className="cfg-prompt__label" htmlFor="cfg-prompt-field">
          {label}
        </label>
        {multiline ? (
          <textarea
            id="cfg-prompt-field"
            className={`cfg-prompt__input cfg-prompt__input--area${invalid ? ' is-invalid' : ''}`}
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setInvalid(false)
            }}
          />
        ) : (
          <input
            id="cfg-prompt-field"
            className={`cfg-prompt__input${invalid ? ' is-invalid' : ''}`}
            value={value}
            autoFocus
            onChange={(event) => {
              setValue(event.target.value)
              setInvalid(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            }}
          />
        )}
        {invalid ? <p className="cfg-prompt__error">Este campo não pode ficar em branco.</p> : null}
        <div className="cfg-prompt__actions">
          <button type="button" className="cfg-prompt__cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="cfg-prompt__save" onClick={submit}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
