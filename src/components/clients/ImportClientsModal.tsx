import { useEffect, useId, useRef, useState } from 'react'
import { Check, FileSpreadsheet, X } from 'lucide-react'
import './ImportClientsModal.css'

type ImportClientsModalProps = {
  open: boolean
  onClose: () => void
}

export function ImportClientsModal({ open, onClose }: ImportClientsModalProps) {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setFileName(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="import-modal" role="presentation">
      <button
        type="button"
        className="import-modal__overlay"
        aria-label="Fechar importação"
        onClick={onClose}
      />

      <div
        className="import-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="import-modal__header">
          <h2 id={titleId} className="import-modal__title">
            Importação de Clientes
          </h2>
          <button
            type="button"
            className="import-modal__close"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="import-modal__body">
          <section className="import-modal__step">
            <h3 className="import-modal__step-title">Passo 1</h3>
            <p className="import-modal__step-text">
              Faça o download da planilha de modelo para informar os dados dos
              clientes a serem importados.
            </p>
            <button type="button" className="import-modal__download">
              <FileSpreadsheet size={16} strokeWidth={2} />
              Baixar planilha modelo
            </button>
          </section>

          <section className="import-modal__step">
            <h3 className="import-modal__step-title">Passo 2</h3>
            <p className="import-modal__step-text">
              Anexe a planilha com as informações dos seus clientes.
            </p>

            <label className="import-modal__file">
              <span className="import-modal__file-name">
                {fileName ?? 'Clique para escolher'}
              </span>
              <span className="import-modal__file-browse">Browse</span>
              <input
                ref={inputRef}
                type="file"
                className="import-modal__file-input"
                accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  setFileName(file ? file.name : null)
                }}
              />
            </label>
          </section>
        </div>

        <footer className="import-modal__footer">
          <button type="button" className="import-modal__cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="import-modal__submit">
            <Check size={16} strokeWidth={2.5} />
            Importar clientes
          </button>
        </footer>
      </div>
    </div>
  )
}
