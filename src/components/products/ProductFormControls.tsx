import { useRef, type ReactNode } from 'react'
import { Camera, SquarePen, X } from 'lucide-react'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export function ProductPhotoField({
  photoDataUrl,
  onChange,
}: {
  photoDataUrl: string
  onChange: (next: { dataUrl: string; name: string }) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const pickFile = () => inputRef.current?.click()

  const onFile = (file: File | null) => {
    if (!file) return
    const lower = file.name.toLowerCase()
    const okType =
      file.type === 'image/jpeg' || lower.endsWith('.jpg') || lower.endsWith('.jpeg')
    if (!okType) return
    if (file.size > MAX_PHOTO_BYTES) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!dataUrl) return
      onChange({ dataUrl, name: file.name })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="product-photo">
      <div className="product-photo__frame">
        {photoDataUrl ? (
          <img src={photoDataUrl} alt="Foto do produto" />
        ) : (
          <Camera size={28} strokeWidth={1.75} className="product-photo__placeholder" />
        )}
      </div>
      <button
        type="button"
        className="product-photo__btn product-photo__btn--edit"
        aria-label="Alterar foto"
        onClick={pickFile}
      >
        <SquarePen size={13} strokeWidth={2} />
      </button>
      {photoDataUrl ? (
        <button
          type="button"
          className="product-photo__btn product-photo__btn--remove"
          aria-label="Remover foto"
          onClick={() => onChange({ dataUrl: '', name: '' })}
        >
          <X size={13} strokeWidth={2.25} />
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,image/jpeg"
        className="product-photo__input"
        onChange={(event) => {
          onFile(event.target.files?.[0] ?? null)
          event.target.value = ''
        }}
      />
      <p className="product-create__help">
        Somente arquivos até 5MB e no formato JPG ou JPEG são aceitos.
      </p>
    </div>
  )
}

export function ProductSwitch({
  on,
  onLabel,
  offLabel,
  onToggle,
  ariaLabel,
}: {
  on: boolean
  onLabel: string
  offLabel: string
  onToggle: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      className={`product-switch${on ? ' is-on' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={onToggle}
    >
      <span className="product-switch__side product-switch__side--on">{onLabel}</span>
      <span className="product-switch__side product-switch__side--off">{offLabel}</span>
    </button>
  )
}

export function ProductFormField({
  label,
  required,
  invalid,
  children,
}: {
  label: string
  required?: boolean
  invalid?: boolean
  children: ReactNode
}) {
  return (
    <div className={`product-create__row${invalid ? ' is-invalid' : ''}`}>
      <div className="product-create__label">
        {label}
        {required ? <em>*</em> : null}
      </div>
      <div className="product-create__control">{children}</div>
    </div>
  )
}
